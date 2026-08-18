import React, { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';

export default function Countdown({ status, startTime, endTime, problemsCount = 0, onTimerEnd }) {
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

      if (status === 'IN_PROGRESS' && problemsCount > 0 && endTime) {
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
  }, [status, startTime, endTime, problemsCount, onTimerEnd]);

  if (status === 'WAITING') {
    return (
      <div
        className="timer-display arena-chip"
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}
      >
        <Clock size={13} color="var(--text-dim)" />
        Waiting to Start
      </div>
    );
  }

  if (status === 'FINISHED') {
    return (
      <div
        className="timer-display timer-finished arena-chip"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#f87171',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}
      >
        Contest Ended
      </div>
    );
  }

  // If status is IN_PROGRESS but problems haven't rendered on the user page yet:
  if (status === 'IN_PROGRESS' && problemsCount === 0) {
    return (
      <div
        className="timer-display arena-chip"
        style={{
          color: 'var(--accent-primary)',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}
      >
        <Loader2 size={13} className="spin-animation" color="var(--accent-primary)" />
        Loading Problems...
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
      className={`timer-display arena-chip ${isLowTime ? 'pulse-animation' : ''}`}
      style={{
        background: isLowTime ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-input)',
        color: isLowTime ? '#f43f5e' : 'var(--text-main)',
        borderColor: isLowTime ? 'rgba(244, 63, 94, 0.5)' : 'var(--border-color)',
        fontFamily: 'var(--font-mono)',
        fontSize: '1.05rem',
        fontWeight: '700',
        letterSpacing: '0.05em'
      }}
    >
      <Clock size={14} color={isLowTime ? '#f43f5e' : 'var(--text-muted)'} />
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </div>
  );
}
