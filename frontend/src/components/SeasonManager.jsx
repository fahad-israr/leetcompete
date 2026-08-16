import React, { useState, useEffect } from 'react';
import { Layers, Plus, ShieldCheck, ChevronRight, ArrowLeft, ExternalLink, Calendar, CheckCircle2, Circle, Archive, RotateCcw } from 'lucide-react';
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

    const filteredPool = (seasonDetail.pool || []).filter(p => {
      const isUsed = !!usedMap[p.titleSlug?.toLowerCase()];
      if (poolFilter === 'remaining' && isUsed) return false;
      if (poolFilter === 'used' && !isUsed) return false;
      if (poolDiffFilter !== 'all' && p.difficulty !== poolDiffFilter) return false;
      return true;
    });

    return (
      <div>
        {/* Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={() => setSelectedSeasonId(null)} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} /> All Seasons
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '750px', marginBottom: '18px' }}>
                  {seasonDetail.description}
                </p>
              )}

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
            {/* Filter controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
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
                  Remaining ({remaining})
                </button>
                <button
                  onClick={() => setPoolFilter('used')}
                  className={`btn btn-sm ${poolFilter === 'used' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Covered in Rounds ({used})
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {['all', 'Easy', 'Medium', 'Hard'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setPoolDiffFilter(diff)}
                    className={`btn btn-sm ${poolDiffFilter === diff ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    {diff}
                  </button>
                ))}
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
                  {filteredPool.map((p, idx) => {
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
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Problem Cards (Shown on mobile viewports <= 768px) */}
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
                  cursor: 'pointer',
                  opacity: s.isArchived ? 0.7 : 1
                }}
                onClick={() => setSelectedSeasonId(s.id)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-blue">Season League</span>
                      {s.isArchived && (
                        <span className="badge badge-hard" style={{ fontSize: '0.7rem' }}>
                          <Archive size={11} /> Archived
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date((s.createdAt || 0) * 1000).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
                    {s.description || 'Zero-repetition problem curriculum.'}
                  </p>

                  {/* Mini progress */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      <span>{s.usedProblemCount || 0} / {s.totalPoolCount || 0} Problems</span>
                      <span>{coverage}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${coverage}%` }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'space-between' }}>
                    <span>View Curriculum & Rounds</span>
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleArchive(s.id, s.isArchived);
                    }}
                    className="btn btn-secondary btn-sm"
                    title={s.isArchived ? 'Restore Season' : 'Archive Season'}
                    style={{ padding: '6px 10px' }}
                  >
                    {s.isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
