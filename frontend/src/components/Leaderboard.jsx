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
              <th key={p.titleSlug} style={{ textAlign: 'center', minWidth: '85px' }}>
                Q{idx + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, idx) => (
            <tr key={entry.username}>
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
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'var(--accent-purple-light)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    color: 'var(--accent-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.8rem'
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
              <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '700', color: entry.solvedCount > 0 ? 'var(--color-easy)' : 'var(--text-dim)' }}>
                {entry.solvedCount} / {problems.length}
              </td>
              <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-purple)' }}>
                {entry.totalScore}
              </td>
              <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {entry.totalPenalty}m
              </td>
              {problems.map((p) => {
                const status = entry.problemStatus?.[p.titleSlug];
                const isSolved = status?.solved;
                return (
                  <td key={p.titleSlug} style={{ textAlign: 'center' }}>
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
                        +{status.penaltyMinutes}m
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
