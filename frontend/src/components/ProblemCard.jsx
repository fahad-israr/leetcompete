import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ProblemCard({
  problem,
  index,
  contestStatus,
  userSolved,
  solvePenalty,
  onVerify,
  disabled
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleVerifyClick = async () => {
    setIsVerifying(true);
    setFeedback(null);

    try {
      const res = await onVerify(problem.titleSlug);
      if (res && res.verified) {
        try {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        setFeedback({
          type: 'success',
          message: `Accepted! Solved with +${res.submission?.penaltyMinutes ?? 0}m penalty.`
        });
      } else {
        setFeedback({
          type: 'error',
          message: res?.reason || 'No recent accepted submission found on LeetCode.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Verification failed. Try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const isSolved = userSolved || false;
  const leetcodeUrl = `https://leetcode.com/problems/${problem.titleSlug}/`;

  return (
    <div
      style={{
        background: isSolved ? 'rgba(16, 185, 129, 0.07)' : 'var(--bg-card)',
        border: `1px solid ${isSolved ? 'rgba(16, 185, 129, 0.45)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        {/* Left Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: isSolved ? 'var(--color-easy)' : 'var(--bg-input)',
            color: isSolved ? '#fff' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            fontSize: '0.9rem',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${isSolved ? 'var(--color-easy)' : 'var(--border-color)'}`
          }}>
            {isSolved ? '✓' : index + 1}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Problem {index + 1}: {problem.title}
              </span>
              <span className={`badge badge-${problem.difficulty?.toLowerCase() || 'medium'}`}>
                {problem.difficulty || 'Medium'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {problem.points || 100} pts
              </span>
            </div>

            <a
              href={leetcodeUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.825rem',
                color: 'var(--accent-purple)',
                textDecoration: 'none',
                marginTop: '4px'
              }}
            >
              <span>Solve on LeetCode</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Right Submit Button */}
        <div>
          {isSolved ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: 'var(--color-easy)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '700',
              fontSize: '0.875rem'
            }}>
              <CheckCircle2 size={16} />
              <span>Solved (+{solvePenalty}m)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleVerifyClick}
              disabled={disabled || isVerifying || contestStatus !== 'IN_PROGRESS'}
              className="btn btn-primary"
              style={{ minWidth: '105px' }}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={14} className="pulse-animation" />
                  Verifying...
                </>
              ) : (
                'Submit'
              )}
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            color: feedback.type === 'success' ? '#34d399' : '#fb7185',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
