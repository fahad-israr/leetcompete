import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Link as LinkIcon, Plus, Trash2, ArrowUp, ArrowDown, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function ProblemPicker({
  selectedProblems,
  setSelectedProblems,
  seasonId,
  seasonRemainingCount
}) {
  const [pickerTab, setPickerTab] = useState('random'); // 'random' | 'search' | 'url'
  
  // Random / Auto-Draw state
  const [countEasy, setCountEasy] = useState(1);
  const [countMedium, setCountMedium] = useState(3);
  const [countHard, setCountHard] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // URL state
  const [urlInput, setUrlInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    loadSearch();
  }, [filterDifficulty]);

  const loadSearch = async () => {
    setIsSearching(true);
    try {
      const results = await api.searchProblems({
        query: searchQuery,
        difficulty: filterDifficulty,
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

  // Generate / Auto-Draw Round
  const handleGenerateRound = async () => {
    setIsGenerating(true);
    try {
      if (seasonId) {
        // Draw from Season Remaining Pool
        const res = await api.generateSeasonRound(seasonId, {
          countEasy,
          countMedium,
          countHard,
          countTotal: countEasy + countMedium + countHard
        });
        if (res.problems) {
          setSelectedProblems(res.problems);
        }
      } else {
        // Standalone catalog draw
        const res = await api.searchProblems({ limit: 100 });
        const easy = res.filter(p => p.difficulty === 'Easy').sort(() => 0.5 - Math.random()).slice(0, countEasy);
        const med = res.filter(p => p.difficulty === 'Medium').sort(() => 0.5 - Math.random()).slice(0, countMedium);
        const hard = res.filter(p => p.difficulty === 'Hard').sort(() => 0.5 - Math.random()).slice(0, countHard);
        const combined = [...easy, ...med, ...hard].map((p, idx) => ({ ...p, points: (idx + 1) * 100 }));
        setSelectedProblems(combined);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate problem set');
    } finally {
      setIsGenerating(false);
    }
  };

  // Import URLs
  const handleImportUrl = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsImporting(true);
    setImportError('');

    try {
      const inputs = urlInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      const added = [];

      for (const item of inputs) {
        const prob = await api.resolveProblem(item);
        if (prob && !selectedProblems.some(p => p.titleSlug === prob.titleSlug)) {
          added.push({
            ...prob,
            points: (selectedProblems.length + added.length + 1) * 100
          });
        }
      }

      if (added.length > 0) {
        setSelectedProblems([...selectedProblems, ...added]);
        setUrlInput('');
      } else {
        setImportError('No valid problem found. Check URLs or slugs.');
      }
    } catch (err) {
      setImportError(err.message || 'Failed to resolve problem');
    } finally {
      setIsImporting(false);
    }
  };

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
    const target = index + direction;
    if (target < 0 || target >= selectedProblems.length) return;
    const next = [...selectedProblems];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    next.forEach((p, idx) => { p.points = (idx + 1) * 100; });
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

  return (
    <div>
      {/* Season Deduplication Notice */}
      {seasonId && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldCheck size={20} color="var(--color-easy)" />
          <span style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>
            <strong>Season Pool Partitioning Active:</strong> Problems selected will be drawn strictly from the remaining unused pool of this season.
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
          {seasonId ? 'Auto-Draw from Season Pool' : 'Random Problem Generator'}
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
          Bulk Paste LeetCode URLs
        </button>
      </div>

      {/* Tab 1: Auto-Draw */}
      {pickerTab === 'random' && (
        <div style={{ background: 'var(--bg-input)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label" style={{ color: 'var(--color-easy)' }}>Easy Count</label>
              <input
                type="number"
                min="0"
                max="6"
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
                max="8"
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
                max="6"
                value={countHard}
                onChange={(e) => setCountHard(Math.max(0, parseInt(e.target.value) || 0))}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Total: {countEasy + countMedium + countHard} problems per contest
            </span>
            <button
              type="button"
              onClick={handleGenerateRound}
              disabled={isGenerating || (countEasy + countMedium + countHard === 0)}
              className="btn btn-primary btn-sm"
            >
              <Sparkles size={14} />
              {isGenerating ? 'Drawing Problems...' : seasonId ? 'Draw Unused Season Problems' : 'Roll Problem Set'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Catalog Search */}
      {pickerTab === 'search' && (
        <div style={{ background: 'var(--bg-input)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="Search by name, ID (#322), or slug..."
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
            <button type="submit" className="btn btn-secondary btn-sm">
              <Search size={14} />
            </button>
          </form>

          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isSearching ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>Searching...</div>
            ) : searchResults.map((p) => {
              const isSelected = selectedProblems.some(sp => sp.titleSlug === p.titleSlug);
              return (
                <div
                  key={p.titleSlug}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                      #{p.frontendId}
                    </span>
                    <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                      {p.title}
                    </span>
                    <span className={`badge badge-${p.difficulty.toLowerCase()}`}>
                      {p.difficulty}
                    </span>
                  </div>

                  <div>
                    {isSelected ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-easy)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> Added
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addProblem(p)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Paste URLs */}
      {pickerTab === 'url' && (
        <div style={{ background: 'var(--bg-input)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <form onSubmit={handleImportUrl}>
            <label className="form-label">
              Paste LeetCode URLs or Problem Slugs (one per line or comma-separated)
            </label>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://leetcode.com/problems/trapping-rain-water/&#10;https://leetcode.com/problems/coin-change/"
              className="form-textarea"
              rows={3}
              style={{ marginBottom: '10px' }}
            />
            {importError && (
              <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '10px' }}>
                {importError}
              </div>
            )}
            <button type="submit" disabled={isImporting || !urlInput.trim()} className="btn btn-primary btn-sm">
              <LinkIcon size={14} />
              {isImporting ? 'Resolving problems...' : 'Import & Add'}
            </button>
          </form>
        </div>
      )}

      {/* Selected Problems Tray */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Contest Problems ({selectedProblems.length})
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
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.9rem'
          }}>
            No problems selected yet. Use the Auto-Draw or search above.
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
                  padding: '10px 14px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    background: 'var(--accent-purple)',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {idx + 1}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.925rem' }}>
                        {prob.title}
                      </span>
                      <span className={`badge badge-${prob.difficulty.toLowerCase()}`}>
                        {prob.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pts:</span>
                    <input
                      type="number"
                      value={prob.points || (idx + 1) * 100}
                      onChange={(e) => updatePoints(prob.titleSlug, e.target.value)}
                      style={{
                        width: '55px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        color: '#fff',
                        padding: '3px 5px',
                        fontSize: '0.8rem',
                        textAlign: 'center'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveProblem(idx, -1)}
                      style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-dim)' : 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === selectedProblems.length - 1}
                      onClick={() => moveProblem(idx, 1)}
                      style={{ background: 'none', border: 'none', color: idx === selectedProblems.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProblem(prob.titleSlug)}
                    style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={15} />
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
