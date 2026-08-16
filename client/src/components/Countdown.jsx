import React, { useState, useEffect } from 'react';

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
      <div className="timer-display" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
        Waiting to Start
      </div>
    );
  }

  if (status === 'FINISHED') {
    return (
      <div className="timer-display timer-finished">
        Contest Ended
      </div>
    );
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className={`timer-display ${timeLeft < 300 ? 'pulse-animation' : ''}`} style={{
      color: timeLeft < 300 ? '#ef4444' : '#fff',
      borderColor: timeLeft < 300 ? 'rgba(239, 68, 68, 0.5)' : undefined
    }}>
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </div>
  );
}
