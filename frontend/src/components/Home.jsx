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
      <div className="glass-panel" style={{
        padding: '48px 36px',
        marginBottom: '36px',
        background: 'linear-gradient(135deg, rgba(24, 24, 28, 0.95), rgba(18, 18, 21, 0.98))',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, rgba(245, 158, 11, 0.06) 50%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '820px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.35)', padding: '6px 14px', borderRadius: '30px', marginBottom: '16px' }}>
            <Sparkles size={15} color="#fb923c" />
            <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#fed7aa', letterSpacing: '0.04em' }}>
              MULTIPLAYER LEETCODE ARENA & ZERO-REPETITION LEAGUES
            </span>
          </div>

          <h1 style={{
            fontSize: '2.9rem',
            fontWeight: '800',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            background: 'linear-gradient(to right, #ffffff, #e4e4e7, #fb923c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Compete, Practice, and Master Problem Bundles Together
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
            Host public or private LeetCode contests, organize multi-round seasons from custom problem lists or URLs with zero question repetition, and verify solutions in real-time.
          </p>

          {/* Quick Join Bar + Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter Lobby Code (e.g. 55OH7)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 18px',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1rem',
                  letterSpacing: '0.1em',
                  width: '240px',
                  outline: 'none'
                }}
              />
              <button type="submit" disabled={!joinCode.trim()} className="btn btn-primary btn-lg">
                Join Arena <ArrowRight size={16} />
              </button>
            </form>

            <button onClick={onOpenCreateContest} className="btn btn-secondary btn-lg">
              <Plus size={18} /> Host Contest
            </button>

            <button onClick={onOpenCreateSeason} className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(249, 115, 22, 0.4)' }}>
              <Layers size={18} color="#fb923c" /> New Season League
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card">
          <div style={{
            background: 'var(--accent-primary-light)',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <Code2 size={22} color="var(--accent-primary)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>
            Custom Problem Bundles
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Import problem lists from LeetCode links or bulk URLs of any size. Rounds automatically partition problems with zero duplicates across the season.
          </p>
        </div>

        <div className="card">
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <Globe size={22} color="var(--color-easy)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>
            Public & Private Contests
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Host open matches for the community or password-protected private contests for classes, study groups, and friends.
          </p>
        </div>

        <div className="card">
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <Flame size={22} color="var(--accent-gold)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>
            Live Submission Verifier
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Solve on LeetCode and click Submit. AWS Lambda checks the accepted timestamp in real-time and broadcasts rankings.
          </p>
        </div>
      </div>

      {/* 2-Column: Active Lobbies & Seasons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '24px' }}>
        
        {/* Contests Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={20} color="var(--accent-primary)" />
              Active & Recent Lobbies
            </h2>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setFilterType('all')}
                className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('public')}
                className={`btn btn-sm ${filterType === 'public' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Public
              </button>
              <button
                onClick={() => setFilterType('private')}
                className={`btn btn-sm ${filterType === 'private' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Private
              </button>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Loading contests...</div>
          ) : filteredContests.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              No contests found. Click <strong>Host Contest</strong> to create a lobby!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredContests.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    cursor: 'pointer'
                  }}
                  onClick={() => onSelectContest(c.code)}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.9rem', color: '#fb923c' }}>
                        {c.code}
                      </span>
                      <span className={`badge badge-${c.status === 'IN_PROGRESS' ? 'easy' : c.status === 'FINISHED' ? 'hard' : 'medium'}`}>
                        {c.status}
                      </span>
                      {c.isPrivate ? (
                        <span className="badge badge-lock">
                          <Lock size={11} /> Private
                        </span>
                      ) : (
                        <span className="badge badge-gold">
                          Public
                        </span>
                      )}
                      {c.seasonTitle && (
                        <span className="badge badge-orange">
                          {c.seasonTitle}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                      {c.title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {c.durationMinutes}m
                      </span>
                      <span>{c.problemCount || 0} Problems</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={13} /> {c.participantCount || 0} Joined
                      </span>
                    </div>
                  </div>

                  <button className="btn btn-primary btn-sm">
                    Enter Arena <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seasons Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="var(--accent-primary)" />
              Season Problem Bundles
            </h2>
            <button onClick={onNavigateSeasons} className="btn btn-secondary btn-sm">
              View All
            </button>
          </div>

          {seasons.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              No seasons created yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {seasons.filter(s => !s.isArchived).slice(0, 4).map((s) => {
                const coverage = s.totalPoolCount > 0 ? Math.round((s.usedProblemCount / s.totalPoolCount) * 100) : 0;
                return (
                  <div
                    key={s.id}
                    className="card"
                    style={{ padding: '16px 20px', cursor: 'pointer' }}
                    onClick={onNavigateSeasons}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{s.title}</h3>
                      <span className="badge badge-orange">{coverage}% Covered</span>
                    </div>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>
                      {s.description || 'Non-repeating problem curriculum.'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-easy)' }}>
                      <ShieldCheck size={14} />
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
