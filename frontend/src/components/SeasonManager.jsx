import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Circle,
  Archive,
  RotateCcw,
  Search,
  Link as LinkIcon,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function SeasonManager({
  onSelectContest,
  onOpenCreateContestForSeason,
  onOpenCreateSeason,
  currentUser,
  onOpenAuthModal
}) {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [seasonDetail, setSeasonDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('pool'); // 'pool' | 'rounds'
  const [poolFilter, setPoolFilter] = useState('all'); // 'all' | 'remaining' | 'used'
  const [poolDiffFilter, setPoolDiffFilter] = useState('all'); // 'all' | 'Easy' | 'Medium' | 'Hard'
  const [seasonFilter, setSeasonFilter] = useState('active'); // 'active' | 'archived' | 'all'
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Add Problems Modal State
  const [isAddProblemsOpen, setIsAddProblemsOpen] = useState(false);
  const [addTab, setAddTab] = useState('search'); // 'search' | 'url'
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addFilterDiff, setAddFilterDiff] = useState('');
  const [addSearchResults, setAddSearchResults] = useState([]);
  const [isSearchingAdd, setIsSearchingAdd] = useState(false);
  const [addUrlInput, setAddUrlInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addFeedback, setAddFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSeasons();
  }, [currentUser]);

  useEffect(() => {
    if (selectedSeasonId) {
      loadSeasonDetail(selectedSeasonId);
    } else {
      setSeasonDetail(null);
    }
  }, [selectedSeasonId]);

  // Live debounced search for adding problems
  useEffect(() => {
    if (!isAddProblemsOpen || addTab !== 'search') return;
    const timer = setTimeout(async () => {
      setIsSearchingAdd(true);
      try {
        const results = await api.searchProblems({
          query: addSearchQuery.trim(),
          difficulty: addFilterDiff,
          limit: 30
        });
        setAddSearchResults(results || []);
      } catch (e) {
        console.error('Failed to search problems for season:', e);
      } finally {
        setIsSearchingAdd(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [addSearchQuery, addFilterDiff, isAddProblemsOpen, addTab]);

  const loadSeasons = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSeasons();
      setSeasons(data);
    } catch (err) {
      console.error('Failed to load seasons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSeasonDetail = async (id) => {
    setIsLoading(true);
    try {
      const data = await api.getSeason(id);
      setSeasonDetail(data.season);
    } catch (err) {
      console.error('Failed to load season detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleArchive = async (seasonId, currentArchived) => {
    const actionName = currentArchived ? 'restore' : 'archive';
    if (!window.confirm(`Are you sure you want to ${actionName} this season?`)) return;

    setIsActionLoading(true);
    try {
      if (currentArchived) {
        await api.unarchiveSeason(seasonId);
      } else {
        await api.archiveSeason(seasonId);
      }
      await loadSeasons();
      if (selectedSeasonId) {
        await loadSeasonDetail(selectedSeasonId);
      }
    } catch (err) {
      alert(`Failed to ${actionName} season: ` + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAddSingleProblem = async (problem) => {
    if (!seasonDetail?.id || !problem) return;
    setIsAdding(true);
    setAddFeedback({ type: '', text: '' });
    try {
      const res = await api.addProblemsToSeason(seasonDetail.id, {
        problems: [problem]
      });
      setAddFeedback({ type: 'success', text: res.message || 'Problem added successfully!' });
      await loadSeasonDetail(seasonDetail.id);
    } catch (err) {
      setAddFeedback({ type: 'error', text: err.message || 'Failed to add problem' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddUrlImport = async () => {
    if (!seasonDetail?.id || !addUrlInput.trim()) return;
    setIsAdding(true);
    setAddFeedback({ type: '', text: '' });
    try {
      const res = await api.addProblemsToSeason(seasonDetail.id, {
        input: addUrlInput.trim()
      });
      setAddFeedback({ type: 'success', text: res.message || 'Problems imported successfully!' });
      setAddUrlInput('');
      await loadSeasonDetail(seasonDetail.id);
    } catch (err) {
      setAddFeedback({ type: 'error', text: err.message || 'Failed to import problems' });
    } finally {
      setIsAdding(false);
    }
  };

  // Filtered seasons list
  const filteredSeasons = seasons.filter(s => {
    if (seasonFilter === 'active') return !s.isArchived;
    if (seasonFilter === 'archived') return !!s.isArchived;
    return true;
  });

  // View: Season Detail
  if (selectedSeasonId && seasonDetail) {
    const total = seasonDetail.totalPoolCount || 0;
    const used = seasonDetail.usedProblemCount || 0;
    const remaining = seasonDetail.remainingProblemCount || 0;
    const coveragePercent = total > 0 ? Math.round((used / total) * 100) : 0;
    const usedMap = seasonDetail.usedProblems || {};
    const isArchived = !!seasonDetail.isArchived;

    // Difficulty breakdown for entire season pool
    const poolEasy = (seasonDetail.pool || []).filter(p => p.difficulty === 'Easy').length;
    const poolMedium = (seasonDetail.pool || []).filter(p => p.difficulty === 'Medium').length;
    const poolHard = (seasonDetail.pool || []).filter(p => p.difficulty === 'Hard').length;

    const filteredPool = (seasonDetail.pool || []).filter(p => {
      const isUsed = !!usedMap[p.titleSlug?.toLowerCase()];
      if (poolFilter === 'remaining' && isUsed) return false;
      if (poolFilter === 'used' && !isUsed) return false;
      if (poolDiffFilter !== 'all' && p.difficulty !== poolDiffFilter) return false;
      return true;
    });

    const existingSlugsSet = new Set((seasonDetail.pool || []).map(p => (p.titleSlug || '').toLowerCase().trim()));

    return (
      <div>
        {/* Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <button onClick={() => setSelectedSeasonId(null)} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> All Seasons
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {!isArchived && (
              <button
                onClick={() => {
                  setIsAddProblemsOpen(true);
                  setAddFeedback({ type: '', text: '' });
                }}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} /> Add Problems to Season
              </button>
            )}

            <button
              onClick={() => handleToggleArchive(seasonDetail.id, isArchived)}
              disabled={isActionLoading}
              className="btn btn-secondary btn-sm"
              style={{
                borderColor: isArchived ? 'var(--color-easy)' : 'var(--border-color)',
                color: isArchived ? 'var(--color-easy)' : 'var(--text-muted)'
              }}
            >
              {isArchived ? (
                <>
                  <RotateCcw size={15} /> Restore Season
                </>
              ) : (
                <>
                  <Archive size={15} /> Archive Season
                </>
              )}
            </button>

            {!isArchived && (
              <button
                onClick={() => onOpenCreateContestForSeason(seasonDetail.id)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} /> Launch Next Round
              </button>
            )}
          </div>
        </div>

        {/* Season Hero Banner */}
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', position: 'relative' }}>
          {isArchived && (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Archive size={12} /> ARCHIVED
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-blue">Season League</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Created {new Date((seasonDetail.createdAt || 0) * 1000).toLocaleDateString()}
                </span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                {seasonDetail.title}
              </h1>
              {seasonDetail.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '750px', marginBottom: '14px' }}>
                  {seasonDetail.description}
                </p>
              )}

              {/* Difficulty Breakdown Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>Pool Composition:</span>
                <span className="badge badge-easy" style={{ fontWeight: '700' }}>
                  🟢 Easy: {poolEasy}
                </span>
                <span className="badge badge-medium" style={{ fontWeight: '700' }}>
                  🟡 Medium: {poolMedium}
                </span>
                <span className="badge badge-hard" style={{ fontWeight: '700' }}>
                  🔴 Hard: {poolHard}
                </span>
                <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-main)', fontWeight: '700' }}>
                  🎯 Total: {total} Problems
                </span>
              </div>

              {/* Dynamic Curriculum Progress Bar */}
              <div style={{ maxWidth: '650px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                    Curriculum Progress: {used} / {total} Problems Covered ({coveragePercent}%)
                  </span>
                  <span style={{ color: 'var(--color-easy)', fontWeight: '600' }}>
                    {remaining} Unseen Problems Remaining
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${coveragePercent}%` }} />
                </div>
              </div>
            </div>

            {/* Launch Round CTA Box */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 24px',
              textAlign: 'center',
              minWidth: '240px'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Next Up
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '12px' }}>
                Round #{(seasonDetail.contestIds?.length || 0) + 1}
              </div>
              <button
                onClick={() => onOpenCreateContestForSeason(seasonDetail.id)}
                disabled={remaining === 0 || isArchived}
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
              >
                <Plus size={14} />
                {isArchived ? 'Season Archived' : remaining > 0 ? `Draw Unused (${remaining} Left)` : 'Season Complete!'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            onClick={() => setActiveTab('pool')}
            className={`tab-btn ${activeTab === 'pool' ? 'active' : ''}`}
          >
            <ShieldCheck size={16} /> Problem Pool Matrix ({seasonDetail.pool?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('rounds')}
            className={`tab-btn ${activeTab === 'rounds' ? 'active' : ''}`}
          >
            <Calendar size={16} /> Rounds Held ({seasonDetail.contestIds?.length || 0})
          </button>
        </div>

        {/* Tab 1: Problem Pool Matrix */}
        {activeTab === 'pool' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            {/* Filter controls with exact difficulty counts */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setPoolFilter('all')}
                  className={`btn btn-sm ${poolFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  All ({total})
                </button>
                <button
                  onClick={() => setPoolFilter('remaining')}
                  className={`btn btn-sm ${poolFilter === 'remaining' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
                >
                  Remaining Unseen ({remaining})
                </button>
                <button
                  onClick={() => setPoolFilter('used')}
                  className={`btn btn-sm ${poolFilter === 'used' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Covered in Rounds ({used})
                </button>
              </div>

              {/* Difficulty Breakdown Filter Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setPoolDiffFilter('all')}
                  className={`btn btn-sm ${poolDiffFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  All Diff ({total})
                </button>
                <button
                  onClick={() => setPoolDiffFilter('Easy')}
                  className={`btn btn-sm ${poolDiffFilter === 'Easy' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--color-easy)', borderColor: poolDiffFilter === 'Easy' ? undefined : 'rgba(16, 185, 129, 0.3)' }}
                >
                  🟢 Easy ({poolEasy})
                </button>
                <button
                  onClick={() => setPoolDiffFilter('Medium')}
                  className={`btn btn-sm ${poolDiffFilter === 'Medium' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--color-medium)', borderColor: poolDiffFilter === 'Medium' ? undefined : 'rgba(245, 158, 11, 0.3)' }}
                >
                  🟡 Medium ({poolMedium})
                </button>
                <button
                  onClick={() => setPoolDiffFilter('Hard')}
                  className={`btn btn-sm ${poolDiffFilter === 'Hard' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--color-hard)', borderColor: poolDiffFilter === 'Hard' ? undefined : 'rgba(239, 68, 68, 0.3)' }}
                >
                  🔴 Hard ({poolHard})
                </button>
              </div>
            </div>

            {/* Desktop Problem Pool Table */}
            <div className="table-container desktop-problem-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>#</th>
                    <th>Problem Name</th>
                    <th>Difficulty</th>
                    <th>Topic Tags</th>
                    <th style={{ textAlign: 'right' }}>Season Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPool.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                        No problems match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPool.map((p, idx) => {
                      const usage = usedMap[p.titleSlug?.toLowerCase()];
                      const isUsed = !!usage;

                      return (
                        <tr key={p.titleSlug || idx}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                            #{p.frontendId || idx + 1}
                          </td>
                          <td>
                            <a
                              href={`https://leetcode.com/problems/${p.titleSlug}/`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--text-main)', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <span>{p.title}</span>
                              <ExternalLink size={12} color="var(--text-dim)" />
                            </a>
                          </td>
                          <td>
                            <span className={`badge badge-${p.difficulty?.toLowerCase() || 'medium'}`}>
                              {p.difficulty || 'Medium'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {(p.topicTags || []).slice(0, 3).join(', ') || 'Algorithm'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isUsed ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: 'var(--color-easy)',
                                fontSize: '0.75rem',
                                fontWeight: '700'
                              }}>
                                <CheckCircle2 size={13} />
                                Covered in Round #{usage.round}
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-dim)',
                                fontSize: '0.75rem'
                              }}>
                                <Circle size={10} />
                                Unused / Ready for Draw
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Problem Cards */}
            <div className="mobile-problem-cards">
              {filteredPool.map((p, idx) => {
                const usage = usedMap[p.titleSlug?.toLowerCase()];
                const isUsed = !!usage;

                return (
                  <div key={`m_${p.titleSlug || idx}`} className="mobile-problem-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        #{p.frontendId || idx + 1}
                      </span>
                      <span className={`badge badge-${p.difficulty?.toLowerCase() || 'medium'}`}>
                        {p.difficulty || 'Medium'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px' }}>
                      <a
                        href={`https://leetcode.com/problems/${p.titleSlug}/`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span>{p.title}</span>
                        <ExternalLink size={13} color="var(--accent-primary)" />
                      </a>
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      <span>{(p.topicTags || []).slice(0, 2).join(', ') || 'Algorithm'}</span>
                      {isUsed ? (
                        <span style={{ color: 'var(--color-easy)', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> Round #{usage.round}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Ready for Draw</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Rounds */}
        {activeTab === 'rounds' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {seasonDetail.contestIds?.length === 0 ? (
              <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                No rounds conducted yet. Click <strong>Launch Next Round</strong> to start Round #1!
              </div>
            ) : (
              seasonDetail.contestIds?.map((cId, idx) => (
                <div key={cId} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-blue">Round #{idx + 1}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px' }}>
                      {seasonDetail.title} — Round #{idx + 1}
                    </h3>
                  </div>
                  <button
                    onClick={() => onSelectContest(cId)}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                  >
                    View Contest Room <ChevronRight size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Add Problems to Season Modal */}
        {isAddProblemsOpen && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '620px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Add Problems to {seasonDetail.title}</h3>
                </div>
                <button type="button" onClick={() => setIsAddProblemsOpen(false)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                Expand your season's problem pool by picking from the catalog or pasting problem links. Duplicate problems already in the season pool are automatically skipped.
              </p>

              {/* Feedback Banner */}
              {addFeedback.text && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: addFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${addFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  color: addFeedback.type === 'success' ? 'var(--color-easy)' : '#f87171'
                }}>
                  {addFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{addFeedback.text}</span>
                </div>
              )}

              {/* Mode Tabs */}
              <div className="tabs" style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setAddTab('search')}
                  className={`tab-btn ${addTab === 'search' ? 'active' : ''}`}
                >
                  🔍 Search & Pick
                </button>
                <button
                  type="button"
                  onClick={() => setAddTab('url')}
                  className={`tab-btn ${addTab === 'url' ? 'active' : ''}`}
                >
                  🔗 Paste URLs / Problem List
                </button>
              </div>

              {/* Tab 1: Search & Pick */}
              {addTab === 'search' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input
                      type="text"
                      placeholder="Search problem by name, ID (#322), or slug..."
                      value={addSearchQuery}
                      onChange={(e) => setAddSearchQuery(e.target.value)}
                      className="form-input"
                    />
                    <select
                      value={addFilterDiff}
                      onChange={(e) => setAddFilterDiff(e.target.value)}
                      className="form-select"
                      style={{ width: '110px' }}
                    >
                      <option value="">All Diff</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {isSearchingAdd ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>Searching catalog...</div>
                    ) : addSearchResults.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                        No problems found. Type a keyword or difficulty above.
                      </div>
                    ) : (
                      addSearchResults.map((p) => {
                        const inPool = existingSlugsSet.has((p.titleSlug || '').toLowerCase().trim());
                        return (
                          <div
                            key={p.titleSlug}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              background: 'var(--bg-input)',
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
                              {inPool ? (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-easy)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Check size={12} /> In Pool
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddSingleProblem(p)}
                                  disabled={isAdding}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '0.75rem', minHeight: '28px' }}
                                >
                                  <Plus size={11} /> Add to Pool
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

              {/* Tab 2: Paste URLs / List Link */}
              {addTab === 'url' && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.825rem' }}>
                    Paste LeetCode Public Problem List URL, problem URLs, or slugs:
                  </label>
                  <textarea
                    value={addUrlInput}
                    onChange={(e) => setAddUrlInput(e.target.value)}
                    placeholder="https://leetcode.com/problem-list/top-interview-150/&#10;https://leetcode.com/problems/two-sum/&#10;coin-change"
                    className="form-textarea"
                    rows={4}
                    style={{ marginBottom: '14px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleAddUrlImport}
                      disabled={isAdding || !addUrlInput.trim()}
                      className="btn btn-primary btn-sm"
                    >
                      <LinkIcon size={14} />
                      {isAdding ? 'Resolving & Adding...' : 'Import & Add to Pool'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAddProblemsOpen(false)} className="btn btn-secondary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // View: All Seasons List
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Season Problem Bundles & Leagues
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
            Organize multi-round tournaments covering complete problem bundles without repeating questions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Season Filter (Active vs Archived) */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSeasonFilter('active')}
              className={`btn btn-sm ${seasonFilter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Active
            </button>
            <button
              onClick={() => setSeasonFilter('archived')}
              className={`btn btn-sm ${seasonFilter === 'archived' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Archived
            </button>
            <button
              onClick={() => setSeasonFilter('all')}
              className={`btn btn-sm ${seasonFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All
            </button>
          </div>

          <button onClick={onOpenCreateSeason} className="btn btn-primary">
            <Plus size={16} /> Create Season
          </button>
        </div>
      </div>

      {/* User Auth Info Banner */}
      {!currentUser && (
        <div style={{
          background: 'var(--accent-primary-light)',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
            <strong>💡 Private Problem Curricula:</strong> Sign in or create an account to isolate and organize your personal season problem bundles!
          </div>
          <button onClick={onOpenAuthModal} className="btn btn-primary btn-sm">
            Sign In / Register
          </button>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>Loading seasons...</div>
      ) : filteredSeasons.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            background: 'var(--accent-primary-light)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Layers size={30} color="var(--accent-primary)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '8px' }}>
            {seasonFilter === 'archived' ? 'No Archived Seasons' : 'No Seasons Found'}
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 20px' }}>
            {seasonFilter === 'archived'
              ? 'Archived seasons will appear here when you archive completed leagues.'
              : 'Create a season with a custom problem bundle or list link to automatically partition problems into sequential, non-repeating rounds!'}
          </p>
          {seasonFilter !== 'archived' && (
            <button onClick={onOpenCreateSeason} className="btn btn-primary">
              <Plus size={16} /> Create First Season
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredSeasons.map(s => {
            const coverage = s.totalPoolCount > 0 ? Math.round((s.usedProblemCount / s.totalPoolCount) * 100) : 0;
            return (
              <div
                key={s.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: s.isArchived ? 0.75 : 1
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className="badge badge-blue">Season League</span>
                    {s.isArchived && (
                      <span className="badge badge-hard" style={{ fontSize: '0.7rem' }}>
                        Archived
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>
                    {s.title}
                  </h3>

                  {s.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '14px', lineHeight: '1.4' }}>
                      {s.description}
                    </p>
                  )}

                  {/* Pool & Difficulty Stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                      📦 {s.totalPoolCount || (s.pool || []).length} Problems
                    </span>
                    <span style={{ color: 'var(--text-dim)' }}>•</span>
                    <span style={{ color: 'var(--color-easy)', fontWeight: '600' }}>
                      {s.remainingProblemCount} Unseen
                    </span>
                    <span style={{ color: 'var(--text-dim)' }}>•</span>
                    <span style={{ color: '#60a5fa', fontWeight: '600' }}>
                      {s.contestIds?.length || 0} Rounds
                    </span>
                  </div>

                  {/* Progress Track */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      <span>Coverage</span>
                      <span>{coverage}%</span>
                    </div>
                    <div className="progress-bar-track" style={{ height: '6px' }}>
                      <div className="progress-bar-fill" style={{ width: `${coverage}%` }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => setSelectedSeasonId(s.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    View Pool & Rounds <ChevronRight size={14} />
                  </button>

                  {!s.isArchived && (
                    <button
                      onClick={() => onOpenCreateContestForSeason(s.id)}
                      disabled={s.remainingProblemCount === 0}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus size={14} /> Next Round
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
