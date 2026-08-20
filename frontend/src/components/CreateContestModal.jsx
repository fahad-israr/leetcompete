import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, Clock, Trophy, Lock, Globe, Layers, AlertCircle, Loader2, Calendar, Zap, CheckCircle2 } from 'lucide-react';
import ProblemPicker from './ProblemPicker';
import { api } from '../services/api';

const POPULAR_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST / EDT, UTC-5 / UTC-4)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST / CDT, UTC-6 / UTC-5)' },
  { value: 'America/Denver', label: 'America/Denver (MST / MDT, UTC-7 / UTC-6)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST / PDT, UTC-8 / UTC-7)' },
  { value: 'Europe/London', label: 'Europe/London (GMT / BST, UTC+0 / UTC+1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET / CEST, UTC+1 / UTC+2)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET / CEST, UTC+1 / UTC+2)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST, UTC+4)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+9)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST, UTC+8)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST / AEDT, UTC+10 / UTC+11)' }
];

export default function CreateContestModal({ isOpen, onClose, onContestCreated, initialSeasonId = null }) {
  const [title, setTitle] = useState('');
  const [seasonId, setSeasonId] = useState(initialSeasonId || '');
  const [seasons, setSeasons] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(60); // Default: 60 minutes
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [hostUsername, setHostUsername] = useState('');

  // Start Mode: 'instant' or 'scheduled'
  const [scheduleMode, setScheduleMode] = useState('instant');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (e) {
      return 'UTC';
    }
  });
  
  // Mandatory Difficulty Counts (Defaults: 1 Easy, 2 Medium, 1 Hard)
  const [countEasy, setCountEasy] = useState(1);
  const [countMedium, setCountMedium] = useState(2);
  const [countHard, setCountHard] = useState(1);
  
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-fill default scheduled time to 2 hours from now in YYYY-MM-DDTHH:mm format
  useEffect(() => {
    if (isOpen) {
      loadSeasons();
      const savedUser = localStorage.getItem('leetcompete_username') || '';
      setHostUsername(savedUser);
      setSeasonId(initialSeasonId || '');
      setDurationMinutes(60);
      setCountEasy(1);
      setCountMedium(2);
      setCountHard(1);
      setIsPrivate(false);
      setPassword('');
      setErrorMessage('');
      setScheduleMode('instant');

      const future = new Date(Date.now() + 2 * 3600 * 1000);
      const year = future.getFullYear();
      const month = String(future.getMonth() + 1).padStart(2, '0');
      const day = String(future.getDate()).padStart(2, '0');
      const hours = String(future.getHours()).padStart(2, '0');
      const mins = String(future.getMinutes()).padStart(2, '0');
      setScheduledDateTime(`${year}-${month}-${day}T${hours}:${mins}`);
    }
  }, [isOpen, initialSeasonId]);

  const loadSeasons = async () => {
    try {
      const list = await api.getSeasons();
      setSeasons(list);
    } catch (err) {
      console.error('Failed to load seasons:', err);
    }
  };

  // Compute live human-readable preview of the scheduled time
  const scheduledPreview = useMemo(() => {
    if (scheduleMode !== 'scheduled' || !scheduledDateTime) return null;
    try {
      const dt = new Date(scheduledDateTime);
      const epochSeconds = Math.floor(dt.getTime() / 1000);
      const nowSeconds = Math.floor(Date.now() / 1000);
      const diff = epochSeconds - nowSeconds;

      const isPast = diff <= 0;
      const hours = Math.floor(Math.abs(diff) / 3600);
      const mins = Math.floor((Math.abs(diff) % 3600) / 60);

      const localStr = dt.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        epochSeconds,
        isPast,
        diffText: isPast ? 'Selected time is in the past' : `Starts in ${hours > 0 ? `${hours}h ` : ''}${mins}m`,
        localStr
      };
    } catch (e) {
      return null;
    }
  }, [scheduleMode, scheduledDateTime]);

  // Timezone options (prepend current if unique)
  const timezoneOptions = useMemo(() => {
    const list = [...POPULAR_TIMEZONES];
    if (timezone && !list.some(tz => tz.value === timezone)) {
      list.unshift({ value: timezone, label: `${timezone} (Local Device Timezone)` });
    }
    return list;
  }, [timezone]);

  if (!isOpen) return null;

  const selectedSeason = seasons.find(s => s.id === seasonId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalCount = countEasy + countMedium + countHard;
    
    if (totalCount === 0 && selectedProblems.length === 0) {
      setErrorMessage('Please specify at least 1 problem count (Easy, Medium, or Hard).');
      return;
    }

    if (isPrivate && !password.trim()) {
      setErrorMessage('Please provide a password for this private contest.');
      return;
    }

    let scheduledStartTimeEpoch = null;
    if (scheduleMode === 'scheduled') {
      if (!scheduledDateTime) {
        setErrorMessage('Please choose a date and time for the scheduled match.');
        return;
      }
      const dt = new Date(scheduledDateTime);
      scheduledStartTimeEpoch = Math.floor(dt.getTime() / 1000);
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (scheduledStartTimeEpoch <= nowSeconds) {
        setErrorMessage('Scheduled start time must be in the future.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let finalProblems = selectedProblems;

      // If user hasn't explicitly populated problems, perform auto-draw
      if (finalProblems.length === 0) {
        if (seasonId) {
          const genRes = await api.generateSeasonRound(seasonId, {
            countEasy,
            countMedium,
            countHard,
            countTotal: totalCount
          });
          finalProblems = genRes.problems || [];
        } else {
          const catalog = await api.searchProblems({ limit: 120 });
          const easy = catalog.filter(p => p.difficulty === 'Easy').sort(() => 0.5 - Math.random()).slice(0, countEasy);
          const med = catalog.filter(p => p.difficulty === 'Medium').sort(() => 0.5 - Math.random()).slice(0, countMedium);
          const hard = catalog.filter(p => p.difficulty === 'Hard').sort(() => 0.5 - Math.random()).slice(0, countHard);
          finalProblems = [...easy, ...med, ...hard].map((p, idx) => ({ ...p, points: (idx + 1) * 100 }));
        }
      }

      const contest = await api.createContest({
        title: title.trim() || undefined,
        seasonId: seasonId || undefined,
        durationMinutes: Number(durationMinutes) || 60,
        countEasy,
        countMedium,
        countHard,
        hostUsername: hostUsername.trim() || 'Host',
        password: isPrivate ? password.trim() : undefined,
        scheduledStartTime: scheduledStartTimeEpoch,
        timezone: timezone || 'UTC',
        problems: finalProblems
      });

      if (contest && contest.code) {
        if (hostUsername.trim()) {
          localStorage.setItem('leetcompete_username', hostUsername.trim().toLowerCase());
        }
        onContestCreated(contest);
        onClose();
      } else {
        throw new Error('Contest creation did not return a valid lobby code.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create contest');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '840px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px var(--accent-orange-glow)'
            }}>
              <Trophy size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Host New Contest</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMessage && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: '#fb7185',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}>
                <AlertCircle size={16} />
                {errorMessage}
              </div>
            )}

            {/* Top Config Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contest Title (Optional)</label>
                <input
                  type="text"
                  placeholder={selectedSeason ? `${selectedSeason.title} Round` : "e.g. Weekly Speed Clash #1"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="var(--accent-primary)" />
                    Season Pool
                  </span>
                </label>
                <select
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  className="form-select"
                >
                  <option value="">None (Standard LeetCode Catalog)</option>
                  {seasons.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.remainingProblemCount || s.totalPoolCount || 0} unseen pool problems)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="var(--accent-primary)" />
                    Duration *
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[30, 60, 90, 120].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`btn btn-sm ${durationMinutes === mins ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '8px 4px', fontSize: '0.8rem' }}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Timing: Instant Live vs Schedule in Advance */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                Launch Timing *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div
                  onClick={() => setScheduleMode('instant')}
                  style={{
                    border: `2px solid ${scheduleMode === 'instant' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: scheduleMode === 'instant' ? 'var(--accent-primary-light)' : 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.925rem', color: scheduleMode === 'instant' ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                    <Zap size={17} />
                    <span>Instant Live Lobby</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                    Launch room immediately. Match starts when host clicks Start.
                  </span>
                </div>

                <div
                  onClick={() => setScheduleMode('scheduled')}
                  style={{
                    border: `2px solid ${scheduleMode === 'scheduled' ? '#60a5fa' : 'var(--border-color)'}`,
                    background: scheduleMode === 'scheduled' ? 'rgba(96, 165, 250, 0.08)' : 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.925rem', color: scheduleMode === 'scheduled' ? '#60a5fa' : 'var(--text-main)' }}>
                    <Calendar size={17} />
                    <span>Schedule in Advance</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                    Set exact future date, time, and timezone. Timer counts down.
                  </span>
                </div>
              </div>

              {/* Scheduled Date, Time & Timezone Inputs */}
              {scheduleMode === 'scheduled' && (
                <div style={{
                  background: 'var(--bg-input)',
                  border: '1px solid rgba(96, 165, 250, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700', color: '#60a5fa' }}>
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledDateTime}
                        onChange={(e) => setScheduledDateTime(e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: '700', color: '#60a5fa' }}>
                        Timezone *
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="form-select"
                      >
                        {timezoneOptions.map(tz => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {scheduledPreview && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: scheduledPreview.isPast ? 'rgba(244, 63, 94, 0.12)' : 'rgba(96, 165, 250, 0.12)',
                      border: `1px solid ${scheduledPreview.isPast ? 'rgba(244, 63, 94, 0.3)' : 'rgba(96, 165, 250, 0.35)'}`,
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.825rem',
                      color: scheduledPreview.isPast ? '#fb7185' : '#93c5fd'
                    }}>
                      {scheduledPreview.isPast ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                      <div>
                        <strong>Scheduled Start:</strong> {scheduledPreview.localStr} ({timezone}) • <em>{scheduledPreview.diffText}</em>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Public vs Private Lobby Access Selector */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                Lobby Privacy Access *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div
                  onClick={() => setIsPrivate(false)}
                  style={{
                    border: `2px solid ${!isPrivate ? 'var(--color-easy)' : 'var(--border-color)'}`,
                    background: !isPrivate ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.925rem', color: !isPrivate ? 'var(--color-easy)' : 'var(--text-main)' }}>
                    <Globe size={18} />
                    <span>Public Lobby</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                    Open to all competitors without password.
                  </span>
                </div>

                <div
                  onClick={() => setIsPrivate(true)}
                  style={{
                    border: `2px solid ${isPrivate ? '#fbbf24' : 'var(--border-color)'}`,
                    background: isPrivate ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.925rem', color: isPrivate ? '#fbbf24' : 'var(--text-main)' }}>
                    <Lock size={18} />
                    <span>Private Lobby</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                    Requires a password to join.
                  </span>
                </div>
              </div>

              {isPrivate && (
                <div style={{ marginTop: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: '700' }}>
                    Set Contest Password *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. clash2026"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    autoFocus
                    required
                  />
                </div>
              )}
            </div>

            {/* Embedded Problem Picker */}
            <ProblemPicker
              selectedProblems={selectedProblems}
              setSelectedProblems={setSelectedProblems}
              seasonId={seasonId}
              seasonRemainingCount={selectedSeason?.remainingProblemCount}
              countEasy={countEasy}
              setCountEasy={setCountEasy}
              countMedium={countMedium}
              setCountMedium={setCountMedium}
              countHard={countHard}
              setCountHard={setCountHard}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (countEasy + countMedium + countHard === 0 && selectedProblems.length === 0)}
              className="btn btn-primary"
              style={{ minWidth: '180px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>{scheduleMode === 'scheduled' ? 'Scheduling...' : 'Launching Arena...'}</span>
                </>
              ) : (
                <>
                  {scheduleMode === 'scheduled' ? <Calendar size={16} /> : <Play size={16} />}
                  <span>{scheduleMode === 'scheduled' ? 'Schedule Contest' : 'Launch Contest Arena'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
