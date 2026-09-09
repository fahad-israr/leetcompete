import React from 'react';
import { Trophy, Check, Minus, Sparkles, Clock, ShieldCheck } from 'lucide-react';

export default function Leaderboard({
  leaderboard = [],
  problems = [],
  currentUsername = '',
  currentDisplayName = '',
  currentUser = null,
  isVirtual = false,
  virtualRank = null,
  virtualStats = null
}) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
        <Trophy size={36} color="var(--border-color)" style={{ marginBottom: '12px' }} />
        <p>No participants have joined this lobby yet.</p>
      </div>
    );
  }

  const cleanLC = (currentUsername || '').trim().toLowerCase();
  const cleanAlias = (currentDisplayName || '').trim().toLowerCase();
  const cleanAuthUser = (currentUser?.username || '').trim().toLowerCase();
  const cleanAuthName = (currentUser?.displayName || '').trim().toLowerCase();

  return (
    <div>
      {/* Virtual Standing Banner if active in virtual practice */}
      {isVirtual && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(168, 85, 247, 0.2)',
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={18} color="#c084fc" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  Virtual Contest Standings
                </strong>
                <span className="badge badge-purple" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                  Local Machine
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Your practice performance is dynamically ranked against the historical contest leaderboard.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {virtualRank && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.825rem',
                color: 'var(--color-easy)',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700'
              }}>
                Rank #{virtualRank} of {leaderboard.length}
              </div>
            )}
            {virtualStats && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', gap: '10px' }}>
                <span>Solved: <strong style={{ color: 'var(--color-easy)' }}>{virtualStats.solvedCount || 0}/{problems.length}</strong></span>
                <span>Score: <strong style={{ color: '#60a5fa' }}>{virtualStats.totalScore || 0} pts</strong></span>
                <span>Penalty: <strong style={{ color: 'var(--text-muted)' }}>{virtualStats.totalPenalty || 0}m</strong></span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '75px', textAlign: 'center' }}>Rank</th>
              <th>Contestant</th>
              <th style={{ textAlign: 'center' }}>Solved</th>
              <th style={{ textAlign: 'center' }}>Score</th>
              <th style={{ textAlign: 'center' }}>Penalty</th>
              {problems.map((p, idx) => (
                <th key={p?.titleSlug || idx} style={{ textAlign: 'center', minWidth: '85px' }}>
                  Q{idx + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, idx) => {
              const entryUser = (entry?.username || '').toLowerCase().trim();
              const entryDisplay = (entry?.displayName || '').toLowerCase().trim();

              const isSelfRow = Boolean(
                entry?.isSelf ||
                entry?.isVirtual ||
                (cleanLC && entryUser && entryUser === cleanLC) ||
                (cleanAlias && entryDisplay && (entryDisplay === cleanAlias || entryDisplay === `${cleanAlias} (virtual)`)) ||
                (cleanAuthUser && entryUser && entryUser === cleanAuthUser) ||
                (cleanAuthName && entryDisplay && entryDisplay === cleanAuthName)
              );

              return (
                <tr key={entry?.username ? `${entry.username}_${idx}` : idx} className={isSelfRow ? 'highlight-self' : ''}>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      color: idx === 0 ? '#facc15' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#f97316' : 'var(--text-dim)'
                    }}>
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${entry?.rank || idx + 1}`}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSelfRow ? 'rgba(16, 185, 129, 0.18)' : 'var(--accent-primary-light)',
                        border: isSelfRow ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(245, 158, 11, 0.35)',
                        color: isSelfRow ? 'var(--color-easy)' : 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '0.85rem'
                      }}>
                        {(entry?.displayName || entry?.username || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <div style={{
                          fontWeight: '700',
                          fontSize: '0.925rem',
                          color: isSelfRow ? 'var(--color-easy)' : 'var(--text-main)'
                        }}>
                          {entry?.displayName || entry?.username || 'Contestant'}
                        </div>
                        {isSelfRow && (
                          <span className="badge badge-you" style={{ fontSize: '0.675rem', padding: '1px 6px' }}>
                            YOU
                          </span>
                        )}
                        {entry?.isVirtual && (
                          <span className="badge badge-virtual" style={{ fontSize: '0.675rem', padding: '1px 6px' }}>
                            VIRTUAL
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '700', color: (entry?.solvedCount || 0) > 0 ? 'var(--color-easy)' : 'var(--text-dim)' }}>
                    {entry?.solvedCount || 0} / {problems.length}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#60a5fa' }}>
                    {entry?.totalScore || 0}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {entry?.totalPenalty || 0}m
                  </td>
                  {problems.map((p, pIdx) => {
                    const slug = p?.titleSlug || p?.slug;
                    const status = slug ? entry?.problemStatus?.[slug] : null;
                    const isSolved = status?.solved;
                    return (
                      <td key={slug || pIdx} style={{ textAlign: 'center' }}>
                        {isSolved ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '4px 8px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: 'var(--color-easy)',
                            borderRadius: '4px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '700',
                            fontSize: '0.75rem'
                          }}>
                            <Check size={12} />
                            +{status.penaltyMinutes || 0}m
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>
                            <Minus size={14} />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

