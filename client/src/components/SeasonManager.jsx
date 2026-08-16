import React, { useState, useEffect } from 'react';
import { Layers, Trophy, Plus, ShieldCheck, ChevronRight, ArrowLeft, ExternalLink, Calendar, Users, Award, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function SeasonManager({ onSelectContest, onOpenCreateContestForSeason, onOpenCreateSeason }) {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [seasonDetail, setSeasonDetail] = useState(null);
  const [standings, setStandings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('standings'); // 'standings' | 'contests' | 'problems'

  useEffect(() => {
    loadSeasons();
  }, []);

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
      setStandings(data.standings);
    } catch (err) {
      console.error('Failed to load season detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSeason = async (id) => {
    if (!window.confirm('Are you sure you want to delete this season? Associated contests will become standalone.')) return;
    try {
      await api.deleteSeason(id);
      setSelectedSeasonId(null);
      loadSeasons();
    } catch (err) {
      alert(err.message || 'Failed to delete season');
    }
  };

  // View: Season Detail
  if (selectedSeasonId && seasonDetail) {
    return (
      <div>
        {/* Top Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={() => setSelectedSeasonId(null)}
            className="btn btn-secondary btn-sm"
          >
            <ArrowLeft size={16} /> Back to All Seasons
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => onOpenCreateContestForSeason(seasonDetail.id)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} /> Host Next Round
            </button>
            <button
              onClick={() => handleDeleteSeason(seasonDetail.id)}
              className="btn btn-danger btn-sm"
              title="Delete Season"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Season Header Banner */}
        <div className="glass-panel" style={{ padding: '28px', marginBottom: '28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className="badge badge-purple">Season League</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Created {new Date(seasonDetail.createdAt * 1000).toLocaleDateString()}
                </span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                {seasonDetail.title}
              </h1>
              {seasonDetail.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '800px' }}>
                  {seasonDetail.description}
                </p>
              )}
            </div>

            {/* Stats Chips */}
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 20px',
                textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-purple)' }}>
                  {seasonDetail.contests?.length || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rounds Held
                </div>
              </div>

              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 20px',
                textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-easy)' }}>
                  {seasonDetail.usedProblemCount || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Unique Problems
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deduplication Guarantee Banner */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShieldCheck size={22} color="var(--color-easy)" />
          <span style={{ fontSize: '0.9rem', color: '#a7f3d0' }}>
            <strong>Zero Problem Repetition:</strong> All {seasonDetail.usedProblemCount || 0} problems used in this season are locked in the registry and will never repeat in future rounds of this league.
          </span>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            onClick={() => setActiveTab('standings')}
            className={`tab-btn ${activeTab === 'standings' ? 'active' : ''}`}
          >
            <Trophy size={16} /> Cumulative Standings ({standings.length})
          </button>
          <button
            onClick={() => setActiveTab('contests')}
            className={`tab-btn ${activeTab === 'contests' ? 'active' : ''}`}
          >
            <Calendar size={16} /> Season Rounds ({seasonDetail.contests?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={`tab-btn ${activeTab === 'problems' ? 'active' : ''}`}
          >
            <ShieldCheck size={16} /> Season Problem Bank ({seasonDetail.usedSlugs?.length || 0})
          </button>
        </div>

        {/* Tab 1: Cumulative Standings */}
        {activeTab === 'standings' && (
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            {standings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                No participants or solved submissions in this season yet. Start Round #1 to populate standings!
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                      <th>Contestant</th>
                      <th style={{ textAlign: 'center' }}>Rounds Played</th>
                      <th style={{ textAlign: 'center' }}>Total Solved</th>
                      <th style={{ textAlign: 'center' }}>Total Penalty</th>
                      <th style={{ textAlign: 'right' }}>Season Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((entry, idx) => (
                      <tr key={entry.username}>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '700',
                            fontSize: '1rem',
                            color: idx === 0 ? '#facc15' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#f97316' : 'var(--text-dim)'
                          }}>
                            {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--accent-purple-light)',
                              border: '1px solid rgba(168, 85, 247, 0.4)',
                              color: 'var(--accent-purple)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '0.85rem'
                            }}>
                              {entry.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600' }}>{entry.displayName}</div>
                              <a
                                href={`https://leetcode.com/${entry.username}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textDecoration: 'none' }}
                              >
                                @{entry.username} ↗
                              </a>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                          {entry.contestsPlayed}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--color-easy)', fontWeight: '700' }}>
                          {entry.totalSolved}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {entry.totalPenalty}m
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-purple)' }}>
                          {entry.seasonPoints} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Season Rounds */}
        {activeTab === 'contests' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {seasonDetail.contests?.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                No rounds held in this season yet.
              </div>
            ) : (
              seasonDetail.contests?.map((c, index) => (
                <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-purple">Round #{c.seasonRound || index + 1}</span>
                      <span className={`badge badge-${c.status === 'IN_PROGRESS' ? 'easy' : c.status === 'FINISHED' ? 'hard' : 'medium'}`}>
                        {c.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px' }}>{c.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
                      Duration: {c.durationMinutes}m • Code: <strong style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{c.code}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectContest(c.code)}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                  >
                    Enter Contest Room <ChevronRight size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Season Problem Bank */}
        {activeTab === 'problems' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px' }}>
              Used Problem Registry ({seasonDetail.usedSlugs?.length || 0} Problems)
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              These problems were selected in past rounds of this season and are permanently marked so they will never appear in any future round of this league.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {seasonDetail.usedSlugs?.map(slug => (
                <a
                  key={slug}
                  href={`https://leetcode.com/problems/${slug}/`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    textDecoration: 'none'
                  }}
                >
                  <span>{slug}</span>
                  <ExternalLink size={12} color="var(--accent-cyan)" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // View: All Seasons List
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Contest Seasons & Leagues
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
            Host tournament series with non-repeating problem deduplication and season-long leaderboards.
          </p>
        </div>

        <button onClick={onOpenCreateSeason} className="btn btn-primary">
          <Plus size={16} /> Create Season
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>Loading seasons...</div>
      ) : seasons.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            background: 'var(--accent-purple-light)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Layers size={30} color="var(--accent-purple)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '8px' }}>No Seasons Created Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 20px' }}>
            Create your first season to organize recurring contest rounds with non-repeating LeetCode problems and cumulative standings.
          </p>
          <button onClick={onOpenCreateSeason} className="btn btn-primary">
            <Plus size={16} /> Create First Season
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {seasons.map(s => (
            <div
              key={s.id}
              className="card"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setSelectedSeasonId(s.id)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="badge badge-purple">Season</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {new Date(s.createdAt * 1000).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
                  {s.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1, background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Rounds</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '1.1rem' }}>{s.contestCount || 0}</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Problems Used</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-easy)' }}>{s.usedProblemCount || 0}</div>
                  </div>
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span>View Standings & Rounds</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
