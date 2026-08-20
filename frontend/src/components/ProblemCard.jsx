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
  const slug = problem?.titleSlug || problem?.slug || '';
  const leetcodeUrl = slug ? `https://leetcode.com/problems/${slug}/` : 'https://leetcode.com/problemset/';
  const problemTitle = problem?.title || `Problem ${index || 1}`;
  const difficulty = problem?.difficulty || 'Medium';
  const points = problem?.points || 100;

  return (
    <div className={`problem-card-item ${isSolved ? 'solved' : ''}`}>
      <div className="problem-card-content">
        {/* Left Info */}
        <div className="problem-card-info">
          <div className={`problem-number-badge ${isSolved ? 'solved' : ''}`}>
            {isSolved ? '✓' : index + 1}
          </div>

          <div className="problem-details">
            <div className="problem-header-row">
              <span className="problem-title-link">
                Problem {index + 1}: {problemTitle}
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span className={`badge badge-${difficulty.toLowerCase()}`}>
                  {difficulty}
                </span>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                  {points} pts
                </span>
              </div>
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
                marginTop: '3px'
              }}
            >
              <span>Solve on LeetCode</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Right Submit Button */}
        <div className="problem-action-area">
          {isSolved ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: 'var(--color-easy)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: '700',
              fontSize: '0.85rem',
              width: '100%'
            }}>
              <CheckCircle2 size={15} />
              <span>Solved (+{solvePenalty}m)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleVerifyClick}
              disabled={disabled || isVerifying || contestStatus !== 'IN_PROGRESS'}
              className="btn btn-primary btn-sm"
              style={{ minWidth: '100px', fontWeight: '700' }}
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
