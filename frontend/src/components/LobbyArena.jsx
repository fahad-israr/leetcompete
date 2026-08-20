import React, { useState, useEffect } from 'react';
import { Trophy, HelpCircle, Share2, Play, CheckCircle2, AlertCircle, Check, UserCheck, Layers, ArrowLeft, Lock, KeyRound, ShieldCheck, Edit3, User, Sparkles, Clock, Plus, X, RefreshCw, Calendar, Loader2 } from 'lucide-react';
import Countdown from './Countdown';
import ProblemCard from './ProblemCard';
import Leaderboard from './Leaderboard';
import LobbyChat from './LobbyChat';
import { EyeIcon, EyeOffIcon } from './ProblemPicker';
import { api } from '../services/api';

export default function LobbyArena({ contestCode, onBack, currentUser }) {
  const [contest, setContest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'ranking'
  
  // Contest Alias & Private LeetCode handle state (Max 25 chars for Display Name)
  const [displayName, setDisplayName] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  
  // Entry gate state (Requires alias + LeetCode handle, and password if private)
  const [hasEnteredArena, setHasEnteredArena] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [entryError, setEntryError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadContest();
    
    // Retrieve remembered browser alias & confidential LeetCode handle
    const savedAlias = localStorage.getItem('leetcompete_display_name') || currentUser?.displayName || '';
    const savedLC = localStorage.getItem('leetcompete_lc_handle') || localStorage.getItem('leetcompete_username') || '';
    
    if (savedAlias) {
      const trimmedAlias = savedAlias.slice(0, 25);
      setDisplayName(trimmedAlias);
      setDisplayNameInput(trimmedAlias);
    }
    if (savedLC) {
      setUsername(savedLC.toLowerCase().trim());
      setUsernameInput(savedLC.trim());
    }

    const savedPass = sessionStorage.getItem(`contest_pass_${contestCode}`);
    if (savedPass) {
      setPasswordInput(savedPass);
      setIsPasswordUnlocked(true);
    }

    // If user already has alias & LC handle saved in their browser
    if (savedAlias && savedLC) {
      setHasEnteredArena(true);
    }
  }, [contestCode, currentUser]);

  // Adaptive auto-polling for serverless real-time updates (Cost-optimized for AWS Free Tier)
  useEffect(() => {
    if (!contest?.id) return;
    if (contest.status === 'FINISHED') return; // Stop polling completely once match is finished

    const runPoll = async () => {
      // If browser tab is hidden/minimized, skip polling to avoid consuming AWS Free Tier invocations
      if (document.hidden) return;

      try {
        const updated = await api.getContest(contestCode);
        if (updated && updated.id) {
          setContest(updated);
        }
        try {
          const msgs = await api.getMessages(contest.id);
          if (Array.isArray(msgs)) {
            setMessages(msgs);
          }
        } catch (e) {}
      } catch (e) {}
    };

    // Fast poll (2s) when right at scheduled start time; otherwise 6s
    const now = Math.floor(Date.now() / 1000);
    const isWaitingScheduled = contest.status === 'WAITING' && contest.scheduledStartTime && now >= (contest.scheduledStartTime - 5);
    const pollInterval = isWaitingScheduled ? 2000 : 6000;

    const interval = setInterval(runPoll, pollInterval);
    return () => clearInterval(interval);
  }, [contest?.id, contest?.status, contest?.scheduledStartTime, contestCode]);

  // Auto-start prescheduled contests when scheduled start time arrives
  useEffect(() => {
    if (!contest || contest.status !== 'WAITING' || !contest.scheduledStartTime) return;

    const triggerAutoStart = async () => {
      const nowMs = Date.now();
      const schedMs = Number(contest.scheduledStartTime) * 1000;

      if (nowMs >= (schedMs - 300)) {
        const isCreator = (currentUser && (
          (currentUser.username || '').toLowerCase() === (contest.ownerUsername || '').toLowerCase() ||
          (currentUser.username || '').toLowerCase() === (contest.hostUsername || '').toLowerCase()
        )) || !!contest.isOrganizer;

        if (isCreator) {
          try {
            await api.startContest(contest.id || contestCode);
          } catch (e) {
            console.error('Auto-start request error:', e);
          }
        }
        await loadContest();
      }
    };

    const nowMs = Date.now();
    const schedMs = Number(contest.scheduledStartTime) * 1000;
    const delayMs = Math.max(0, schedMs - nowMs + 250);

    const timer = setTimeout(triggerAutoStart, delayMs);
    return () => clearTimeout(timer);
  }, [contest?.status, contest?.scheduledStartTime, contestCode, currentUser]);

  const loadContest = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getContest(contestCode);
      if (!data || !data.id) {
        throw new Error(`Contest lobby "${contestCode}" not found.`);
      }
      setContest(data);
      
      const isCreator = (currentUser && (
        (currentUser.username || '').toLowerCase() === (data.ownerUsername || '').toLowerCase() ||
        (currentUser.username || '').toLowerCase() === (data.hostUsername || '').toLowerCase()
      )) || !!data.isOrganizer;

      if (!data.isPrivate || isCreator || (data.password && data.password !== '••••••••')) {
        setIsPasswordUnlocked(true);
      }
      
      try {
        const msgs = await api.getMessages(data.id);
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch (e) {
        setMessages([]);
      }
    } catch (err) {
      setError(err.message || 'Could not load contest lobby.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimerEnd = async () => {
    if (contest?.status === 'WAITING' && contest?.scheduledStartTime) {
      const isCreator = (currentUser && (
        (currentUser.username || '').toLowerCase() === (contest.ownerUsername || '').toLowerCase() ||
        (currentUser.username || '').toLowerCase() === (contest.hostUsername || '').toLowerCase()
      )) || !!contest.isOrganizer;

      if (isCreator) {
        try {
          await api.startContest(contest.id || contestCode);
        } catch (e) {}
      }
    }
    loadContest();
  };

  // Unified Entry Form (Handles Name/Alias, Private LeetCode Handle, and Contest Password)
  const handleJoinArenaSubmit = async (e) => {
    e.preventDefault();
    if (!displayNameInput.trim()) {
      return setEntryError('Please enter a display name / alias for rankings.');
    }
    if (!usernameInput.trim()) {
      return setEntryError('Please enter your LeetCode handle for submission verification.');
    }
    if (contest?.isPrivate && !isPasswordUnlocked && !passwordInput.trim()) {
      return setEntryError('Contest password is required for this private lobby.');
    }

    setEntryError('');
    setIsJoining(true);

    const cleanAlias = displayNameInput.trim().slice(0, 25);
    const cleanLC = usernameInput.trim().toLowerCase();

    try {
      if (contest?.id) {
        await api.joinContest(contest.id, cleanLC, cleanAlias, passwordInput.trim() || undefined);
      }

      // Permanently remember username & handle in user's browser
      localStorage.setItem('leetcompete_display_name', cleanAlias);
      localStorage.setItem('leetcompete_lc_handle', cleanLC);
      localStorage.setItem('leetcompete_username', cleanLC);
      if (passwordInput.trim()) {
        sessionStorage.setItem(`contest_pass_${contestCode}`, passwordInput.trim());
      }

      setDisplayName(cleanAlias);
      setUsername(cleanLC);
      setIsPasswordUnlocked(true);
      setHasEnteredArena(true);
      setIsEditingProfile(false);
      loadContest();
    } catch (err) {
      setEntryError(err.message || 'Failed to join contest arena. Please verify your details.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartContest = async () => {
    if (!contest?.id) return;
    try {
      await api.startContest(contest.id);
      loadContest();
    } catch (err) {
      alert(err.message || 'Failed to start contest');
    }
  };

  const handleFinishContest = async () => {
    if (!contest?.id) return;
    if (!window.confirm('Are you sure you want to end the contest early?')) return;
    try {
      await api.finishContest(contest.id);
      loadContest();
    } catch (err) {
      alert(err.message || 'Failed to finish contest');
    }
  };

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendMinutes, setExtendMinutes] = useState(10);
  const [isExtending, setIsExtending] = useState(false);

  const handleExtendContest = async (mins) => {
    const minutesToAdd = Number(mins || extendMinutes);
    if (!minutesToAdd || minutesToAdd <= 0) return;
    setIsExtending(true);
    try {
      await api.extendContest(contest.id, minutesToAdd);
      setShowExtendModal(false);
      await loadContest();
    } catch (err) {
      alert(err.message || 'Failed to extend contest');
    } finally {
      setIsExtending(false);
    }
  };

  const handleVerifyProblem = async (problemSlug) => {
    if (!username) {
      throw new Error('Please set your LeetCode handle in the participant profile bar above!');
    }
    if (!contest?.id) return;

    const res = await api.verifySubmission(contest.id, username, problemSlug);
    if (res.verified) {
      loadContest();
    }
    return res;
  };

  const handleSendMessage = async (text) => {
    if (!contest?.id) return;
    try {
      const sender = displayName || username || 'Guest';
      const msg = await api.sendMessage(contest.id, sender, text);
      if (msg) {
        setMessages(prev => [...prev, msg]);
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleCopyLobbyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?lobby=${contest?.code || contestCode}`;
    const fullText = (contest?.isPrivate && contest?.password && contest.password !== '••••••••') 
      ? `Join LeetCode Contest: ${contest?.title || 'Contest'}\nLink: ${url}\nPassword: ${contest.password}`
      : url;
    
    navigator.clipboard.writeText(fullText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPassword = () => {
    if (!contest?.password) return;
    navigator.clipboard.writeText(contest.password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <Loader2 size={32} className="spin-animation" color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
        <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>Loading contest arena...</div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="glass-panel" style={{ maxWidth: '550px', margin: '40px auto', padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={40} color="#fb7185" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>Lobby Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error || `No active lobby found with code "${contestCode}".`}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={loadContest} className="btn btn-secondary">
            <RefreshCw size={15} /> Try Again
          </button>
          <button onClick={onBack} className="btn btn-primary">
            <ArrowLeft size={16} /> Return to Lobbies
          </button>
        </div>
      </div>
    );
  }

  const isOrganizer = (currentUser && (
    (currentUser.username || '').toLowerCase() === (contest?.ownerUsername || '').toLowerCase() ||
    (currentUser.username || '').toLowerCase() === (contest?.hostUsername || '').toLowerCase()
  )) || !!contest?.isOrganizer;

  // ENTRY GATE: If not yet joined, or private lobby locked
  const requiresGate = (!hasEnteredArena && !isOrganizer) || (contest?.isPrivate && !isPasswordUnlocked && !isOrganizer);

  if (requiresGate) {
    return (
      <div className="glass-panel" style={{ maxWidth: '500px', margin: '40px auto', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 0 16px var(--accent-orange-glow)'
          }}>
            {contest.isPrivate ? <Lock size={24} color="#fff" /> : <Trophy size={24} color="#fff" />}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '4px' }}>
            {contest.title}
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Lobby Code: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{contest.code}</strong>
            {contest.isPrivate && ' • 🔒 Private Match'}
          </div>
        </div>

        <form onSubmit={handleJoinArenaSubmit}>
          {/* Field 1: Contest Alias / Display Name (Max 25 chars) */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ fontWeight: '700', marginBottom: 0 }}>
                <User size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Contest Display Name / Alias *
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {displayNameInput.length}/25
              </span>
            </div>
            <input
              type="text"
              maxLength={25}
              placeholder="e.g. SpeedyFox, Alex, Ninja99"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value.slice(0, 25))}
              className="form-input"
              autoFocus
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
              This is the only name shown on live rankings and chat (Max 25 chars).
            </span>
          </div>

          {/* Field 2: LeetCode Handle */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '700' }}>
              <ShieldCheck size={13} color="var(--color-easy)" style={{ display: 'inline', marginRight: '4px' }} />
              LeetCode Handle (Confidential) *
            </label>
            <input
              type="text"
              placeholder="e.g. alexzu2000"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="form-input"
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-easy)', marginTop: '2px', display: 'block', lineHeight: 1.3 }}>
              🔒 Kept strictly private for automated AC submission verification. Never revealed on public rankings.
            </span>
          </div>

          {/* Field 3: Password (If Private Lobby) */}
          {contest.isPrivate && !isPasswordUnlocked && (
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" style={{ fontWeight: '700', color: '#fbbf24' }}>
                <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Contest Password *
              </label>
              <input
                type="password"
                placeholder="Enter password shared by organizer"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="form-input"
                required
              />
            </div>
          )}

          {entryError && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              color: '#fb7185',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{entryError}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
            <button
              type="button"
              onClick={onBack}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Back
            </button>

            <button
              type="submit"
              disabled={isJoining || !displayNameInput.trim() || !usernameInput.trim() || (contest.isPrivate && !isPasswordUnlocked && !passwordInput.trim())}
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              <Sparkles size={16} />
              {isJoining ? 'Entering Arena...' : 'Enter Match Arena'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const userEntry = contest.leaderboard?.find(entry =>
    entry.isSelf ||
    (entry.username && username && entry.username.toLowerCase() === username.toLowerCase()) ||
    (entry.displayName && displayName && entry.displayName.toLowerCase() === displayName.toLowerCase())
  );

  return (
    <div>
      {/* Top Header */}
      <div className="arena-header">
        <div className="arena-title-area">
          <button onClick={onBack} className="btn btn-secondary btn-sm" title="Back to Lobbies" style={{ flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 className="arena-title-text">
                {contest.title}
              </h1>
              {contest.seasonTitle && (
                <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                  <Layers size={11} /> {contest.seasonTitle} (Round #{contest.seasonRound || 1})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status controls */}
        <div className="arena-status-group">
          {/* Active Contestant Alias Badge with Edit option */}
          {displayName && (
            <div
              onClick={() => {
                setDisplayNameInput(displayName);
                setUsernameInput(username);
                setIsEditingProfile(true);
              }}
              className="arena-chip"
              style={{ cursor: 'pointer' }}
              title="Click to edit your display name / alias"
            >
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Alias:</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                {displayName}
              </strong>
              <Edit3 size={11} color="var(--text-dim)" />
            </div>
          )}

          {/* Selected LeetCode Handle Badge with Edit option */}
          {username && (
            <div
              onClick={() => {
                setDisplayNameInput(displayName);
                setUsernameInput(username);
                setIsEditingProfile(true);
              }}
              className="arena-chip"
              style={{
                cursor: 'pointer',
                background: 'rgba(16, 185, 129, 0.08)',
                borderColor: 'rgba(16, 185, 129, 0.35)'
              }}
              title="Click to update your LeetCode username"
            >
              <ShieldCheck size={13} color="var(--color-easy)" />
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>LeetCode:</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--color-easy)', fontFamily: 'var(--font-mono)' }}>
                @{username}
              </strong>
              <Edit3 size={11} color="var(--color-easy)" />
            </div>
          )}

          {/* Lobby ID Card */}
          <div
            onClick={handleCopyLobbyLink}
            className="arena-chip"
            style={{ cursor: 'pointer' }}
            title="Click to copy full invite link"
          >
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>ID:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#60a5fa', letterSpacing: '0.05em' }}>
              {contest.code}
            </strong>
            {copiedLink ? <Check size={13} color="var(--color-easy)" /> : <Share2 size={13} color="var(--text-dim)" />}
          </div>

          {/* Organizer / Admin Password Card */}
          {contest.isPrivate && (contest.password || isOrganizer) && contest.password !== '' && (
            <div
              className="arena-chip"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                borderColor: 'rgba(245, 158, 11, 0.35)',
                color: '#f59e0b'
              }}
              title="Contest Password (Visible to Creator / Organizer)"
            >
              <Lock size={13} color="#f59e0b" />
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: '600' }}>Pass:</span>
              <strong style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                color: '#f59e0b',
                letterSpacing: '0.05em'
              }}>
                {showPassword ? contest.password : '••••••••'}
              </strong>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? "Hide password" : "Reveal password"}
              >
                {showPassword ? <EyeOffIcon size={13} color="var(--text-dim)" /> : <EyeIcon size={13} color="#f59e0b" />}
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copiedPass ? 'var(--color-easy)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Copy password"
              >
                {copiedPass ? <Check size={13} color="var(--color-easy)" /> : <Share2 size={12} />}
              </button>
            </div>
          )}

          {/* Extra Time Added Badge (Visible to all candidates & host) */}
          {contest.extendedMinutes > 0 && (
            <div
              className="arena-chip"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                color: '#f59e0b',
                fontWeight: '700'
              }}
              title={`Contest duration was extended by +${contest.extendedMinutes} minutes`}
            >
              <Clock size={13} color="#f59e0b" />
              <span>+{contest.extendedMinutes}m Extra</span>
            </div>
          )}

          {/* Scheduled Start Badge (If waiting and future scheduled) */}
          {contest.status === 'WAITING' && contest.scheduledStartTime && (
            <div
              className="arena-chip"
              style={{
                background: 'rgba(96, 165, 250, 0.1)',
                borderColor: 'rgba(96, 165, 250, 0.4)',
                color: '#60a5fa',
                fontSize: '0.8rem'
              }}
              title={`Scheduled for ${new Date(contest.scheduledStartTime * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} (${contest.timezone || 'UTC'})`}
            >
              <Calendar size={12} color="#60a5fa" />
              <span>{new Date(contest.scheduledStartTime * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(contest.scheduledStartTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({contest.timezone || 'UTC'})</span>
            </div>
          )}

          <Countdown
            status={contest.status}
            startTime={contest.startTime}
            endTime={contest.endTime}
            scheduledStartTime={contest.scheduledStartTime}
            timezone={contest.timezone || 'UTC'}
            problemsCount={contest.problems?.length || 0}
            onTimerEnd={handleTimerEnd}
          />

          {/* Start Contest (Organizer Only) */}
          {contest.status === 'WAITING' && isOrganizer && (
            <button onClick={handleStartContest} className="btn btn-success btn-sm">
              <Play size={15} /> Start Contest
            </button>
          )}

          {/* Candidate Waiting State Indicator */}
          {contest.status === 'WAITING' && !isOrganizer && (
            <div className="arena-chip" style={{ color: 'var(--text-muted)' }}>
              <Clock size={12} color="var(--text-dim)" /> Waiting for Host
            </div>
          )}

          {/* Organizer Match Active Controls (Extend Time & End Match) */}
          {contest.status === 'IN_PROGRESS' && isOrganizer && (
            <>
              <button
                type="button"
                onClick={() => setShowExtendModal(true)}
                className="btn btn-secondary btn-sm"
                style={{ borderColor: 'rgba(245, 158, 11, 0.5)', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Extend contest duration"
              >
                <Plus size={14} /> Extend Time
              </button>
              <button onClick={handleFinishContest} className="btn btn-danger btn-sm">
                End Contest
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit Contestant Profile Modal */}
      {isEditingProfile && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Update Contestant Profile</h3>
              </div>
              <button type="button" onClick={() => setIsEditingProfile(false)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinArenaSubmit}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontWeight: '700', marginBottom: 0 }}>
                    Contest Display Name / Alias *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {displayNameInput.length}/25
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={25}
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value.slice(0, 25))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '700' }}>
                  <ShieldCheck size={13} color="var(--color-easy)" style={{ display: 'inline', marginRight: '4px' }} />
                  LeetCode Username (Confidential) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. alexzu2000"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="form-input"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-easy)', marginTop: '4px', display: 'block', lineHeight: 1.3 }}>
                  🔒 Used in real-time to verify your LeetCode AC submissions.
                </span>
              </div>

              {entryError && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  marginBottom: '14px',
                  fontSize: '0.825rem',
                  color: '#fb7185',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={15} />
                  <span>{entryError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !displayNameInput.trim() || !usernameInput.trim()}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: '700' }}
                >
                  {isJoining ? 'Saving...' : 'Save & Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Time Modal */}
      {showExtendModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Extend Contest Time</h3>
              </div>
              <button type="button" onClick={() => setShowExtendModal(false)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.4' }}>
              Add extra minutes to this live match. Candidates will immediately see the updated countdown and extra time badge.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {[5, 10, 15, 30].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setExtendMinutes(mins)}
                  className={`btn ${extendMinutes === mins ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ fontWeight: '600' }}
                >
                  +{mins}m
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Or custom extra minutes:</label>
              <input
                type="number"
                min="1"
                max="180"
                value={extendMinutes}
                onChange={(e) => setExtendMinutes(Math.max(1, Number(e.target.value)))}
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowExtendModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExtendContest(extendMinutes)}
                disabled={isExtending}
                className="btn btn-primary btn-sm"
                style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: '700' }}
              >
                {isExtending ? 'Applying...' : `+ Apply ${extendMinutes}m Extra Time`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="arena-layout-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px',
            marginBottom: '20px'
          }}>
            <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
              <button
                onClick={() => setActiveTab('questions')}
                className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
              >
                📋 Questions ({contest.problems?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('ranking')}
                className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
              >
                <Trophy size={15} /> Rankings
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`tab-btn mobile-only-tab ${activeTab === 'chat' ? 'active' : ''}`}
              >
                💬 Chat ({messages?.length || 0})
              </button>
            </div>

            <button
              onClick={() => setShowHelp(!showHelp)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.8rem',
                padding: '4px 8px'
              }}
            >
              <HelpCircle size={14} /> How to Submit?
            </button>
          </div>

          {showHelp && (
            <div style={{
              background: 'var(--accent-primary-light)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: '20px',
              fontSize: '0.875rem',
              color: 'var(--text-main)',
              lineHeight: 1.5
            }}>
              <strong>How Submission Verification Works:</strong>
              <ol style={{ marginLeft: '20px', marginTop: '6px' }}>
                <li>Solve problems directly on LeetCode by clicking <em>"Solve on LeetCode"</em>.</li>
                <li>Once accepted on LeetCode, click <strong>"Submit"</strong> here.</li>
                <li>AWS Lambda checks your private LeetCode submission in real-time and updates the rankings under your alias: <strong>{displayName}</strong>!</li>
              </ol>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div>
              {contest.status === 'WAITING' ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 24px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  margin: '10px 0'
                }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: '14px' }}>🔒</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>Problems are Locked</h3>
                  {contest.scheduledStartTime ? (
                    <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 16px', lineHeight: '1.5', fontSize: '0.9rem' }}>
                      This match is scheduled for <strong>{new Date(contest.scheduledStartTime * 1000).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({contest.timezone || 'UTC'})</strong>. The problem set will automatically unlock and appear on this page as soon as the match starts!
                    </p>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 16px', lineHeight: '1.5', fontSize: '0.9rem' }}>
                      Contest setup is in progress. The problems will unlock automatically and appear on this page as soon as the contest starts.
                    </p>
                  )}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} color="var(--accent-primary)" /> {contest.scheduledStartTime ? 'Contest will auto-start at scheduled time...' : 'Waiting for contest organizer to start the match...'}
                  </div>
                </div>
              ) : (
                <div>
                  {contest.problems?.map((prob, idx) => {
                    const userSolve = userEntry?.solves?.find(s => s.problemSlug?.toLowerCase() === prob.titleSlug?.toLowerCase());
                    return (
                      <ProblemCard
                        key={prob.titleSlug || idx}
                        index={idx + 1}
                        problem={prob}
                        disabled={false}
                        userSolved={!!userSolve}
                        solvePenalty={userSolve?.penaltyMinutes}
                        contestStatus={contest.status}
                        onVerify={handleVerifyProblem}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Ranking Tab */}
          {activeTab === 'ranking' && (
            <Leaderboard
              leaderboard={contest.leaderboard || []}
              problems={contest.problems || []}
            />
          )}

          {/* Mobile Chat Tab */}
          {activeTab === 'chat' && (
            <div className="mobile-only-tab" style={{ width: '100%', display: 'block' }}>
              <LobbyChat
                messages={messages}
                onSendMessage={handleSendMessage}
                currentUsername={displayName || username}
              />
            </div>
          )}
        </div>

        {/* Right Column: Chat (Desktop) */}
        <div className="desktop-arena-sidebar">
          <LobbyChat
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUsername={displayName || username}
          />
        </div>
      </div>
    </div>
  );
}
