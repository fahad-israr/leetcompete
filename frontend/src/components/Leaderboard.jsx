import React from 'react';
import { Trophy, Check, Minus } from 'lucide-react';

export default function Leaderboard({ leaderboard = [], problems = [] }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
        <Trophy size={36} color="var(--border-color)" style={{ marginBottom: '12px' }} />
        <p>No participants have joined this lobby yet.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '70px', textAlign: 'center' }}>Rank</th>
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
          {leaderboard.map((entry, idx) => (
            <tr key={entry?.username || idx}>
              <td style={{ textAlign: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  fontSize: '0.95rem',
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
                    borderRadius: '8px',
                    background: 'var(--accent-primary-light)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.85rem'
                  }}>
                    {(entry?.displayName || entry?.username || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.925rem', color: 'var(--text-main)' }}>
                      {entry?.displayName || entry?.username || 'Contestant'}
                    </div>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
