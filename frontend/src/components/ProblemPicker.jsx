import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Link as LinkIcon, Plus, Trash2, ArrowUp, ArrowDown, ShieldCheck, CheckCircle2, RotateCw } from 'lucide-react';
import { api } from '../services/api';

export default function ProblemPicker({
  selectedProblems,
  setSelectedProblems,
  seasonId,
  seasonRemainingCount,
  countEasy,
  setCountEasy,
  countMedium,
  setCountMedium,
  countHard,
  setCountHard
}) {
  const [pickerTab, setPickerTab] = useState('random'); // 'random' | 'search' | 'url'
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

  // Initial Auto-Draw on Mount if no problems selected
  useEffect(() => {
    if (selectedProblems.length === 0) {
      handleGenerateRound();
    }
  }, [seasonId]);

  useEffect(() => {
    if (pickerTab === 'search') {
      loadSearch();
    }
  }, [filterDifficulty, pickerTab]);

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

  // Generate / Auto-Draw Round (Default: 1 Easy, 2 Medium, 1 Hard)
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
        if (res.problems && res.problems.length > 0) {
          setSelectedProblems(res.problems);
        }
      } else {
        // Standalone catalog draw
        const res = await api.searchProblems({ limit: 120 });
        const easy = res.filter(p => p.difficulty === 'Easy').sort(() => 0.5 - Math.random()).slice(0, countEasy);
        const med = res.filter(p => p.difficulty === 'Medium').sort(() => 0.5 - Math.random()).slice(0, countMedium);
        const hard = res.filter(p => p.difficulty === 'Hard').sort(() => 0.5 - Math.random()).slice(0, countHard);
        const combined = [...easy, ...med, ...hard].map((p, idx) => ({ ...p, points: (idx + 1) * 100 }));
        setSelectedProblems(combined);
      }
    } catch (err) {
      console.error('Failed to generate problem set:', err);
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
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => setPickerTab('random')}
          className={`btn btn-sm ${pickerTab === 'random' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          <Sparkles size={14} /> Auto-Draw ({countEasy}E, {countMedium}M, {countHard}H)
        </button>
        <button
          type="button"
          onClick={() => setPickerTab('search')}
          className={`btn btn-sm ${pickerTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          <Search size={14} /> Search Catalog
        </button>
        <button
          type="button"
          onClick={() => setPickerTab('url')}
          className={`btn btn-sm ${pickerTab === 'url' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
        >
          <LinkIcon size={14} /> Paste URLs
        </button>
      </div>

      {/* Tab 1: Auto-Draw (Default) */}
      {pickerTab === 'random' && (
        <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '18px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ color: 'var(--color-easy)', fontWeight: '700', fontSize: '0.8rem' }}>
                Easy Count *
              </label>
              <input
                type="number"
                min="0"
                max="8"
                value={countEasy}
                onChange={(e) => setCountEasy(Math.max(0, parseInt(e.target.value) || 0))}
                className="form-input"
                style={{ textAlign: 'center', fontWeight: '700' }}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ color: 'var(--color-medium)', fontWeight: '700', fontSize: '0.8rem' }}>
                Medium Count *
              </label>
              <input
                type="number"
                min="0"
                max="8"
                value={countMedium}
                onChange={(e) => setCountMedium(Math.max(0, parseInt(e.target.value) || 0))}
                className="form-input"
                style={{ textAlign: 'center', fontWeight: '700' }}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ color: 'var(--color-hard)', fontWeight: '700', fontSize: '0.8rem' }}>
                Hard Count *
              </label>
              <input
                type="number"
                min="0"
                max="8"
                value={countHard}
                onChange={(e) => setCountHard(Math.max(0, parseInt(e.target.value) || 0))}
                className="form-input"
                style={{ textAlign: 'center', fontWeight: '700' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              🎯 Total: <strong>{countEasy + countMedium + countHard}</strong> questions per match
            </span>
            <button
              type="button"
              onClick={handleGenerateRound}
              disabled={isGenerating || (countEasy + countMedium + countHard === 0)}
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'var(--accent-primary)', color: 'var(--text-main)' }}
            >
              <RotateCw size={14} className={isGenerating ? 'spin-animation' : ''} />
              {isGenerating ? 'Drawing...' : '🎲 Re-Roll Problem Draw'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Catalog Search */}
      {pickerTab === 'search' && (
        <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '18px', border: '1px solid var(--border-color)' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
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
              style={{ width: '110px' }}
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

          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                    padding: '8px 12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      #{p.frontendId}
                    </span>
                    <span style={{ fontWeight: '500', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </span>
                    <span className={`badge badge-${p.difficulty.toLowerCase()}`}>
                      {p.difficulty}
                    </span>
                  </div>

                  <div>
                    {isSelected ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-easy)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={12} /> Added
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addProblem(p)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.75rem', minHeight: '28px' }}
                      >
                        <Plus size={11} /> Add
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
        <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '18px', border: '1px solid var(--border-color)' }}>
          <form onSubmit={handleImportUrl}>
            <label className="form-label">
              Paste LeetCode URLs or Problem Slugs (one per line or comma-separated)
            </label>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://leetcode.com/problems/two-sum/&#10;https://leetcode.com/problems/coin-change/"
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
              {isImporting ? 'Resolving...' : 'Import & Add'}
            </button>
          </form>
        </div>
      )}

      {/* Selected Problems Tray */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Selected Questions ({selectedProblems.length})
          </h4>
          {selectedProblems.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedProblems([])}
              className="btn btn-danger btn-sm"
              style={{ padding: '2px 8px', fontSize: '0.75rem', minHeight: '24px' }}
            >
              Clear All
            </button>
          )}
        </div>

        {selectedProblems.length === 0 ? (
          <div style={{
            background: 'var(--bg-input)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.875rem'
          }}>
            No problems selected yet. The arena will automatically draw <strong>{countEasy} Easy, {countMedium} Medium, {countHard} Hard</strong> questions upon launch!
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
                  borderRadius: 'var(--radius-md)',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <span style={{
                    background: 'var(--accent-primary-light)',
                    color: 'var(--accent-primary)',
                    fontWeight: '800',
                    fontSize: '0.75rem',
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    Q{idx + 1}
                  </span>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prob.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span className={`badge badge-${prob.difficulty.toLowerCase()}`}>
                        {prob.difficulty}
                      </span>
                      {prob.frontendId && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          #{prob.frontendId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      value={prob.points || (idx + 1) * 100}
                      onChange={(e) => updatePoints(prob.titleSlug, e.target.value)}
                      style={{
                        width: '54px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '4px',
                        color: 'var(--text-main)',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>pts</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => moveProblem(idx, -1)}
                    disabled={idx === 0}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px' }}
                  >
                    <ArrowUp size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveProblem(idx, 1)}
                    disabled={idx === selectedProblems.length - 1}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: idx === selectedProblems.length - 1 ? 'default' : 'pointer', padding: '2px' }}
                  >
                    <ArrowDown size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeProblem(prob.titleSlug)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={14} />
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
