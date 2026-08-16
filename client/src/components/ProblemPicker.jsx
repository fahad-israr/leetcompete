import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Link as LinkIcon, Plus, Trash2, ArrowUp, ArrowDown, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function ProblemPicker({ selectedProblems, setSelectedProblems, seasonId }) {
  const [pickerTab, setPickerTab] = useState('random'); // 'random' | 'search' | 'url'
  
  // Random Generator State
  const [countEasy, setCountEasy] = useState(1);
  const [countMedium, setCountMedium] = useState(2);
  const [countHard, setCountHard] = useState(1);
  const [randomTopic, setRandomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [poolStats, setPoolStats] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // URL Importer State
  const [urlInput, setUrlInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Initial load of search results
  useEffect(() => {
    loadSearch();
  }, [filterDifficulty, filterTopic, seasonId]);

  const loadSearch = async () => {
    setIsSearching(true);
    try {
      const results = await api.searchProblems({
        query: searchQuery,
        difficulty: filterDifficulty,
        topic: filterTopic,
        seasonId: seasonId || undefined,
        limit: 40
      });
      setSearchResults(results);
    } catch (err) {
      console.error('Failed to search problems:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadSearch();
  };

  // Generate Random
  const handleGenerateRandom = async () => {
    setIsGenerating(true);
    try {
      const result = await api.generateRandomProblems({
        countEasy,
        countMedium,
        countHard,
        topic: randomTopic,
        seasonId: seasonId || undefined
      });
      setSelectedProblems(result.problems);
      setPoolStats(result.poolStats);
    } catch (err) {
      console.error('Random generator error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Import URL
  const handleImportUrl = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsImporting(true);
    setImportError('');

    try {
      // Support comma or newline separated URLs
      const inputs = urlInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      const added = [];

      for (const item of inputs) {
        const prob = await api.resolveProblem(item, seasonId || undefined);
        if (prob) {
          if (seasonId && prob.usedInSeason) {
            setImportError(`"${prob.title}" was already used in this season! Cannot duplicate in the same season.`);
            continue;
          }
          if (!selectedProblems.some(p => p.titleSlug === prob.titleSlug)) {
            added.push({
              ...prob,
              points: (selectedProblems.length + added.length + 1) * 100
            });
          }
        }
      }

      if (added.length > 0) {
        setSelectedProblems([...selectedProblems, ...added]);
        setUrlInput('');
      } else if (!importError) {
        setImportError('No new valid problem found. Check the URL/slug.');
      }
    } catch (err) {
      setImportError(err.message || 'Failed to resolve problem');
    } finally {
      setIsImporting(false);
    }
  };

  // Problem management
  const addProblem = (prob) => {
    if (selectedProblems.some(p => p.titleSlug === prob.titleSlug)) return;
    setSelectedProblems([
      ...selectedProblems,
      {
        ...prob,
        points: (selectedProblems.length + 1) * 100
      }
    ]);
  };

  const removeProblem = (titleSlug) => {
    setSelectedProblems(selectedProblems.filter(p => p.titleSlug !== titleSlug));
  };

  const moveProblem = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedProblems.length) return;
    const next = [...selectedProblems];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    // Re-assign points
    next.forEach((p, idx) => {
      p.points = (idx + 1) * 100;
    });
    setSelectedProblems(next);
  };

  const updatePoints = (titleSlug, points) => {
    setSelectedProblems(selectedProblems.map(p => {
      if (p.titleSlug === titleSlug) {
        return { ...p, points: Number(points) || 100 };
      }
      return p;
    }));
  };

  const TOPIC_OPTIONS = [
    'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Two Pointers',
    'Binary Search', 'Tree', 'Depth-First Search', 'Breadth-First Search', 'Stack',
    'Sliding Window', 'Graph', 'Backtracking', 'Greedy', 'Linked List'
  ];

  return (
    <div>
      {/* Season Deduplication Notice if Season selected */}
      {seasonId && (
        <div style={{
          background: 'rgba(168, 85, 247, 0.12)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldAlert size={20} color="var(--accent-purple)" />
          <span style={{ fontSize: '0.875rem', color: '#e9d5ff' }}>
            <strong>Season Deduplication Engine Active:</strong> Problems previously solved in this season will automatically be filtered out so rounds stay 100% fresh!
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setPickerTab('random')}
          className={`tab-btn ${pickerTab === 'random' ? 'active' : ''}`}
        >
          <Sparkles size={16} />
          Smart Random Generator
        </button>
        <button
          type="button"
          onClick={() => setPickerTab('search')}
          className={`tab-btn ${pickerTab === 'search' ? 'active' : ''}`}
        >
          <Search size={16} />
          Catalog Search & Filter
        </button>
        <button
          type="button"
          onClick={() => setPickerTab('url')}
          className={`tab-btn ${pickerTab === 'url' ? 'active' : ''}`}
        >
          <LinkIcon size={16} />
          Paste LeetCode URLs
        </button>
      </div>

      {/* Tab 1: Smart Random Generator */}
      {pickerTab === 'random' && (
        <div style={{ background: 'var(--bg-input)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label" style={{ color: 'var(--color-easy)' }}>Easy Count</label>
              <input
                type="number"
                min="0"
                max="5"
                value={countEasy}
                onChange={(e) => setCountEasy(Math.max(0, parseInt(e.target.value) || 0))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label" style={{ color: 'var(--color-medium)' }}>Medium Count</label>
              <input
                type="number"
                min="0"
                max="6"
                value={countMedium}
                onChange={(e) => setCountMedium(Math.max(0, parseInt(e.target.value) || 0))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label" style={{ color: 'var(--color-hard)' }}>Hard Count</label>
              <input
                type="number"
                min="0"
                max="4"
                value={countHard}
                onChange={(e) => setCountHard(Math.max(0, parseInt(e.target.value) || 0))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Focus Topic (Optional)</label>
              <select
                value={randomTopic}
                onChange={(e) => setRandomTopic(e.target.value)}
                className="form-select"
              >
                <option value="">Any Topic (Mixed)</option>
                {TOPIC_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Total: {countEasy + countMedium + countHard} problems
              {poolStats && ` (Filtered from ${poolStats.totalAvailableInPool} fresh pool candidates)`}
            </span>
            <button
              type="button"
              onClick={handleGenerateRandom}
              disabled={isGenerating || (countEasy + countMedium + countHard === 0)}
              className="btn btn-primary btn-sm"
            >
              <Sparkles size={14} />
              {isGenerating ? 'Rolling Set...' : 'Roll Non-Repeating Set'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Catalog Search & Filter */}
      {pickerTab === 'search' && (
        <div style={{ background: 'var(--bg-input)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Search by problem name, ID (#322), or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
            />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="form-select"
              style={{ width: '130px' }}
            >
              <option value="">All Diff</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="form-select"
              style={{ width: '150px' }}
            >
              <option value="">All Topics</option>
              {TOPIC_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-secondary btn-sm">
              <Search size={14} />
            </button>
          </form>

          {/* Search Results List */}
          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isSearching ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>Searching catalog...</div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>No problems found.</div>
            ) : (
              searchResults.map((p) => {
                const isSelected = selectedProblems.some(sp => sp.titleSlug === p.titleSlug);
                const isUsedInSeason = seasonId && p.usedInSeason;

                return (
                  <div
                    key={p.titleSlug}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      opacity: isUsedInSeason ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-dim)', minWidth: '40px' }}>
                        #{p.frontendId}
                      </span>
                      <span style={{ fontWeight: '500', fontSize: '0.925rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title}
                      </span>
                      <span className={`badge badge-${p.difficulty.toLowerCase()}`}>
                        {p.difficulty}
                      </span>
                      {isUsedInSeason && (
                        <span className="badge badge-used" title="Already solved in earlier round of this season">
                          Used in Season
                        </span>
                      )}
                    </div>

                    <div>
                      {isSelected ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--color-easy)', fontWeight: '600' }}>
                          <CheckCircle2 size={14} /> Added
                        </span>
                      ) : isUsedInSeason ? (
                        <button type="button" disabled className="btn btn-secondary btn-sm" style={{ opacity: 0.5 }}>
                          Used
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addProblem(p)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Plus size={13} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Paste LeetCode URLs */}
      {pickerTab === 'url' && (
        <div style={{ background: 'var(--bg-input)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <form onSubmit={handleImportUrl}>
            <label className="form-label">
              Paste LeetCode Problem URLs or Slugs (one per line or comma-separated)
            </label>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="e.g. https://leetcode.com/problems/trapping-rain-water/&#10;https://leetcode.com/problems/coin-change/"
              className="form-textarea"
              rows={3}
              style={{ marginBottom: '10px' }}
            />
            {importError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontSize: '0.85rem', marginBottom: '10px' }}>
                <AlertCircle size={14} />
                {importError}
              </div>
            )}
            <button
              type="submit"
              disabled={isImporting || !urlInput.trim()}
              className="btn btn-primary btn-sm"
            >
              <LinkIcon size={14} />
              {isImporting ? 'Resolving via GraphQL...' : 'Import & Add Problems'}
            </button>
          </form>
        </div>
      )}

      {/* Selected Problems List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Selected Contest Problems ({selectedProblems.length})
          </h4>
          {selectedProblems.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedProblems([])}
              className="btn btn-danger btn-sm"
              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
            >
              Clear All
            </button>
          )}
        </div>

        {selectedProblems.length === 0 ? (
          <div style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '30px',
            textAlign: 'center',
            color: 'var(--text-dim)'
          }}>
            No problems selected yet. Use the Smart Random Generator or search catalog above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedProblems.map((prob, idx) => (
              <div
                key={prob.titleSlug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    background: 'var(--accent-purple)',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {idx + 1}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        {prob.title}
                      </span>
                      <span className={`badge badge-${prob.difficulty.toLowerCase()}`}>
                        {prob.difficulty}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      leetcode.com/problems/{prob.titleSlug}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Points:</span>
                    <input
                      type="number"
                      value={prob.points || (idx + 1) * 100}
                      onChange={(e) => updatePoints(prob.titleSlug, e.target.value)}
                      style={{
                        width: '60px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        color: '#fff',
                        padding: '4px 6px',
                        fontSize: '0.85rem',
                        textAlign: 'center'
                      }}
                    />
                  </div>

                  {/* Reorder Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveProblem(idx, -1)}
                      style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-muted)', cursor: idx === 0 ? 'default' : 'pointer' }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedProblems.length - 1}
                      onClick={() => moveProblem(idx, 1)}
                      style={{ background: 'none', border: 'none', color: idx === selectedProblems.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)', cursor: idx === selectedProblems.length - 1 ? 'default' : 'pointer' }}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProblem(prob.titleSlug)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                    title="Remove problem"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
