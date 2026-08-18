import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function Countdown({ status, startTime, endTime, onTimerEnd }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    function updateTimer() {
      const now = Math.floor(Date.now() / 1000);

      if (status === 'WAITING') {
        setTimeLeft(0);
        return;
      }

      if (status === 'FINISHED') {
        setTimeLeft(0);
        return;
      }

      if (status === 'IN_PROGRESS' && endTime) {
        const remaining = Math.max(0, endTime - now);
        setTimeLeft(remaining);
        if (remaining === 0 && onTimerEnd) {
          onTimerEnd();
        }
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status, startTime, endTime, onTimerEnd]);

  if (status === 'WAITING') {
    return (
      <div
        className="timer-display"
        style={{
          background: 'var(--bg-input)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 14px',
          fontSize: '0.9rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <Clock size={14} color="var(--text-dim)" />
        Waiting to Start
      </div>
    );
  }

  if (status === 'FINISHED') {
    return (
      <div
        className="timer-display timer-finished"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 14px',
          fontSize: '0.9rem',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        Contest Ended
      </div>
    );
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad = (n) => String(n).padStart(2, '0');

  const isLowTime = timeLeft < 300 && timeLeft > 0;

  return (
    <div
      className={`timer-display ${isLowTime ? 'pulse-animation' : ''}`}
      style={{
        background: isLowTime ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-input)',
        color: isLowTime ? '#f43f5e' : 'var(--text-main)',
        border: `1px solid ${isLowTime ? 'rgba(244, 63, 94, 0.5)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '6px 14px',
        fontFamily: 'var(--font-mono)',
        fontSize: '1.1rem',
        fontWeight: '700',
        letterSpacing: '0.05em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <Clock size={15} color={isLowTime ? '#f43f5e' : 'var(--text-muted)'} />
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </div>
  );
}
