import React, { useState, useEffect } from 'react';
import { Trophy, Play, Plus, Compass, Sparkles, Users, Clock, ArrowRight, ShieldCheck, Layers, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export default function Home({ onSelectContest, onOpenCreateContest, onOpenCreateSeason, onNavigateSeasons }) {
  const [contests, setContests] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [joinCode, setJoinCode] = useState('');
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

  return (
    <div>
      {/* Hero Section */}
      <div className="glass-panel" style={{
        padding: '48px 36px',
        marginBottom: '36px',
        background: 'linear-gradient(135deg, rgba(24, 27, 46, 0.95), rgba(14, 16, 28, 0.98))',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(99, 102, 241, 0.05) 50%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '800px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', padding: '6px 14px', borderRadius: '30px', marginBottom: '16px' }}>
            <Sparkles size={15} color="var(--accent-purple)" />
            <span style={{ fontSize: '0.825rem', fontWeight: '700', color: '#e9d5ff', letterSpacing: '0.04em' }}>
              REAL-TIME LEETCODE MULTIPLAYER & TOURNAMENT LEAGUES
            </span>
          </div>

          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: '800',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
            background: 'linear-gradient(to right, #ffffff, #e9d5ff, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Compete in LeetCode Contests with Non-Repeating Seasons
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
            Pick custom problem sets, invite friends to a live arena, solve on LeetCode with instant GraphQL submission verification, and organize multi-round seasons where problems are guaranteed to never repeat.
          </p>

          {/* Quick Join + Action Buttons */}
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
                Join Lobby <ArrowRight size={16} />
              </button>
            </form>

            <button onClick={onOpenCreateContest} className="btn btn-secondary btn-lg">
              <Plus size={18} /> Host New Contest
            </button>

            <button onClick={onOpenCreateSeason} className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(168, 85, 247, 0.4)' }}>
              <Layers size={18} color="var(--accent-purple)" /> Create Season League
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card">
          <div style={{
            background: 'var(--accent-purple-light)',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <Sparkles size={22} color="var(--accent-purple)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>
            Flexible Problem Selection
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Pick specific LeetCode questions, paste problem URLs, or auto-generate balanced random sets by difficulty (Easy, Med, Hard) and algorithm topics.
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
            <ShieldCheck size={22} color="var(--color-easy)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>
            Zero-Repetition Seasons
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Create recurring seasons. The platform remembers all problems solved in previous rounds and strictly bars them from repeating in future contests.
          </p>
        </div>

        <div className="card">
          <div style={{
            background: 'rgba(6, 182, 212, 0.15)',
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <Trophy size={22} color="var(--accent-cyan)" />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px' }}>
            Live Submission Verification
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Contestants submit code directly on LeetCode. Our GraphQL verifier validates the AC timestamp in real-time and updates live rankings instantly.
          </p>
        </div>
      </div>

      {/* 2-Column: Active Contests & Seasons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '24px' }}>
        
        {/* Contests Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={20} color="var(--accent-purple)" />
              Active & Recent Lobbies
            </h2>
            <button onClick={onOpenCreateContest} className="btn btn-secondary btn-sm">
              <Plus size={14} /> Host
            </button>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Loading contests...</div>
          ) : contests.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              No contests created yet. Click <strong>Host New Contest</strong> to get started!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contests.slice(0, 6).map((c) => (
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
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.9rem', color: 'var(--accent-purple)' }}>
                        {c.code}
                      </span>
                      <span className={`badge badge-${c.status === 'IN_PROGRESS' ? 'easy' : c.status === 'FINISHED' ? 'hard' : 'medium'}`}>
                        {c.status}
                      </span>
                      {c.seasonTitle && (
                        <span className="badge badge-purple">
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
              <Layers size={20} color="var(--accent-cyan)" />
              Seasons & Leagues
            </h2>
            <button onClick={onNavigateSeasons} className="btn btn-secondary btn-sm">
              View All
            </button>
          </div>

          {seasons.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
              No seasons created yet. Create a season to group multi-round contests!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {seasons.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="card"
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={onNavigateSeasons}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{s.title}</h3>
                    <span className="badge badge-cyan">{s.contestCount || 0} Rounds</span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
                    {s.description || 'Continuous contest league with non-repeating problem pool.'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-easy)' }}>
                    <ShieldCheck size={14} />
                    <span>{s.usedProblemCount || 0} unique problems used</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
