import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Plus, Compass, Sparkles, Users, Clock, ArrowRight, ShieldCheck, Layers, Lock, Globe, Code2 } from 'lucide-react';
import { api } from '../services/api';

export default function Home({
  onSelectContest,
  onOpenCreateContest,
  onOpenCreateSeason,
  onNavigateSeasons
}) {
  const [contests, setContests] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'public' | 'private'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [contestList, seasonList] = await Promise.all([
        api.getContests(),
        api.getSeasons()
      ]);
      setContests(contestList);
      setSeasons(seasonList);
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onSelectContest(joinCode.trim().toUpperCase());
  };

  const filteredContests = contests.filter(c => {
    if (filterType === 'public' && c.isPrivate) return false;
    if (filterType === 'private' && !c.isPrivate) return false;
    return true;
  });

  return (
    <div>
      {/* Hero Section */}
      <div className="glass-panel hero-container" style={{
        padding: '40px 32px',
        marginBottom: '30px',
        background: 'var(--hero-bg)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-8%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, var(--border-glow) 0%, rgba(245, 158, 11, 0.02) 50%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '800px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--accent-primary-light)', border: '1px solid var(--border-glow)', padding: '5px 12px', borderRadius: '30px', marginBottom: '14px' }}>
            <Sparkles size={14} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.775rem', fontWeight: '700', color: 'var(--accent-primary)', letterSpacing: '0.04em' }}>
              MULTIPLAYER LEETCODE ARENA & ZERO-REPETITION LEAGUES
            </span>
          </div>

          <h1 className="hero-title" style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            marginBottom: '14px',
            color: 'var(--text-main)'
          }}>
            Compete, Practice, and Master Problem Bundles Together
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '24px' }}>
            Host public or private LeetCode contests, organize multi-round seasons from custom problem lists or URLs with zero question repetition, and verify solutions in real-time.
          </p>

          {/* Quick Join Bar + Actions */}
          <div className="quick-join-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 auto', minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Lobby Code (e.g. 55OH7)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.95rem',
                  letterSpacing: '0.08em',
                  flex: 1,
                  outline: 'none',
                  minHeight: '42px'
                }}
              />
              <button type="submit" disabled={!joinCode.trim()} className="btn btn-primary" style={{ padding: '10px 16px' }}>
                Join <ArrowRight size={15} />
              </button>
            </form>

            <button onClick={onOpenCreateContest} className="btn btn-secondary">
              <Plus size={16} /> Host Contest
            </button>

            <button onClick={onOpenCreateSeason} className="btn btn-secondary" style={{ borderColor: 'rgba(245, 158, 11, 0.35)' }}>
              <Layers size={16} color="#fbbf24" /> New Season
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card">
          <div style={{
            background: 'var(--accent-primary-light)',
            width: '38px',
            height: '38px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Code2 size={20} color="var(--accent-primary)" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '5px' }}>
            Custom Problem Bundles
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Import problem lists from LeetCode links or bulk URLs of any size. Rounds automatically partition problems with zero duplicates across the season.
          </p>
        </div>

        <div className="card">
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            width: '38px',
            height: '38px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Globe size={20} color="var(--color-easy)" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '5px' }}>
            Public & Private Contests
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Host open matches for the community or password-protected private contests for classes, study groups, and friends.
          </p>
        </div>

        <div className="card">
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            width: '38px',
            height: '38px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Flame size={20} color="var(--accent-primary)" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '5px' }}>
            Live Submission Verifier
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Solve on LeetCode and click Submit. AWS Lambda checks the accepted timestamp in real-time and broadcasts rankings.
          </p>
        </div>
      </div>

      {/* 2-Column: Active Lobbies & Seasons */}
      <div className="two-column-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '20px' }}>
        
        {/* Contests Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="var(--accent-primary)" />
              Active Lobbies
            </h2>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setFilterType('all')}
                className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 9px', fontSize: '0.75rem', minHeight: '28px' }}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('public')}
                className={`btn btn-sm ${filterType === 'public' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 9px', fontSize: '0.75rem', minHeight: '28px' }}
              >
                Public
              </button>
              <button
                onClick={() => setFilterType('private')}
                className={`btn btn-sm ${filterType === 'private' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 9px', fontSize: '0.75rem', minHeight: '28px' }}
              >
                Private
              </button>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Loading contests...</div>
          ) : filteredContests.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-dim)' }}>
              No contests found. Click <strong>Host Contest</strong> to create a lobby!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredContests.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    gap: '12px'
                  }}
                  onClick={() => onSelectContest(c.code)}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.85rem', color: '#fbbf24' }}>
                        {c.code}
                      </span>
                      <span className={`badge badge-${c.status === 'IN_PROGRESS' ? 'easy' : c.status === 'FINISHED' ? 'hard' : 'medium'}`}>
                        {c.status}
                      </span>
                      {c.isPrivate ? (
                        <span className="badge badge-lock">
                          <Lock size={10} /> Private
                        </span>
                      ) : (
                        <span className="badge badge-gold">
                          Public
                        </span>
                      )}
                      {c.seasonTitle && (
                        <span className="badge badge-orange" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.seasonTitle}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '0.975rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.775rem', color: 'var(--text-dim)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={12} /> {c.durationMinutes}m
                      </span>
                      <span>{c.problemCount || 0} Problems</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Users size={12} /> {c.participantCount || 0} Joined
                      </span>
                    </div>
                  </div>

                  <button className="btn btn-primary btn-sm" style={{ padding: '6px 10px', flexShrink: 0 }}>
                    Enter <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seasons Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--accent-primary)" />
              Problem Bundles
            </h2>
            <button onClick={onNavigateSeasons} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', minHeight: '28px' }}>
              View All
            </button>
          </div>

          {seasons.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-dim)' }}>
              No seasons created yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {seasons.filter(s => !s.isArchived).slice(0, 4).map((s) => {
                const coverage = s.totalPoolCount > 0 ? Math.round((s.usedProblemCount / s.totalPoolCount) * 100) : 0;
                return (
                  <div
                    key={s.id}
                    className="card"
                    style={{ padding: '14px 16px', cursor: 'pointer' }}
                    onClick={onNavigateSeasons}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '0.975rem', fontWeight: '700' }}>{s.title}</h3>
                      <span className="badge badge-orange">{coverage}%</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.description || 'Non-repeating problem curriculum.'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.775rem', color: 'var(--color-easy)' }}>
                      <ShieldCheck size={13} />
                      <span>{s.remainingProblemCount || s.totalPoolCount || 0} unseen problems left</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
