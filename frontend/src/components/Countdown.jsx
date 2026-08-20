import React, { useState, useEffect } from 'react';
import { Clock, Loader2, Calendar } from 'lucide-react';

export default function Countdown({ status, startTime, endTime, scheduledStartTime, timezone = 'UTC', problemsCount = 0, onTimerEnd }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [scheduledDiff, setScheduledDiff] = useState(0);

  useEffect(() => {
    function updateTimer() {
      const now = Math.floor(Date.now() / 1000);

      if (status === 'WAITING') {
        if (scheduledStartTime) {
          const schedNum = Number(scheduledStartTime);
          if (!isNaN(schedNum) && schedNum > 0) {
            const diff = Math.max(0, schedNum - now);
            setScheduledDiff(diff);
          } else {
            setScheduledDiff(0);
          }
        } else {
          setScheduledDiff(0);
        }
        setTimeLeft(0);
        return;
      }

      if (status === 'FINISHED') {
        setTimeLeft(0);
        setScheduledDiff(0);
        return;
      }

      if (status === 'IN_PROGRESS' && problemsCount > 0 && endTime) {
        const endNum = Number(endTime);
        if (!isNaN(endNum) && endNum > 0) {
          const remaining = Math.max(0, endNum - now);
          setTimeLeft(remaining);
          if (remaining === 0 && onTimerEnd) {
            onTimerEnd();
          }
        }
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status, startTime, endTime, scheduledStartTime, problemsCount, onTimerEnd]);

  const safeNum = (n) => (isNaN(Number(n)) ? 0 : Math.floor(Number(n)));
  const pad = (n) => String(safeNum(n)).padStart(2, '0');

  if (status === 'WAITING') {
    if (scheduledStartTime && scheduledDiff > 0) {
      const days = Math.floor(scheduledDiff / 86400);
      const hours = Math.floor((scheduledDiff % 86400) / 3600);
      const minutes = Math.floor((scheduledDiff % 3600) / 60);
      const seconds = scheduledDiff % 60;

      return (
        <div
          className="timer-display arena-chip"
          style={{
            background: 'rgba(96, 165, 250, 0.1)',
            borderColor: 'rgba(96, 165, 250, 0.4)',
            color: '#60a5fa',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            fontWeight: '700',
            letterSpacing: '0.03em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title={`Scheduled Start: ${new Date(scheduledStartTime * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} (${timezone})`}
        >
          <Calendar size={13} color="#60a5fa" />
          <span>Starts in {days > 0 ? `${days}d ` : ''}{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
        </div>
      );
    }

    if (scheduledStartTime && scheduledDiff <= 0) {
      return (
        <div
          className="timer-display arena-chip"
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 0.4)',
            color: '#f59e0b',
            fontSize: '0.85rem',
            fontWeight: '700'
          }}
        >
          <Clock size={13} color="#f59e0b" />
          Starting Soon (Waiting for Host)
        </div>
      );
    }

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
