import React, { useState, useEffect } from 'react';
import { Trophy, HelpCircle, Share2, Play, CheckCircle2, AlertCircle, Check, UserCheck, Layers, ArrowLeft, Lock, KeyRound, ShieldCheck, Edit3, User, Sparkles, Clock, Plus, X, RefreshCw, Calendar, Loader2, RotateCcw } from 'lucide-react';
import Countdown from './Countdown';
import ProblemCard from './ProblemCard';
import Leaderboard from './Leaderboard';
import LobbyChat from './LobbyChat';
import { EyeIcon, EyeOffIcon } from './ProblemPicker';
import { api } from '../services/api';

// === LOCAL MACHINE CACHE & VIRTUAL CONTEST HELPERS ===

function getStoredVirtualSession(code) {
  try {
    const raw = localStorage.getItem(`leetcompete_virtual_${code}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveStoredVirtualSession(code, session) {
  try {
    localStorage.setItem(`leetcompete_virtual_${code}`, JSON.stringify(session));
  } catch (e) {}
}

function clearStoredVirtualSession(code) {
  try {
    localStorage.removeItem(`leetcompete_virtual_${code}`);
  } catch (e) {}
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function checkLocalPriorParticipation(code, contestData) {
  if (!contestData) return { participated: false };

  // 1. Direct local storage record on this machine
  const savedRecord = localStorage.getItem(`contest_participated_${code}`);
  let directInfo = null;
  if (savedRecord) {
    try {
      directInfo = JSON.parse(savedRecord);
    } catch (e) {}
  }

  // 2. User handles stored on this local browser
  const savedLC = (localStorage.getItem('leetcompete_lc_handle') || localStorage.getItem('leetcompete_username') || '').trim().toLowerCase();
  const savedAlias = (localStorage.getItem('leetcompete_display_name') || '').trim().toLowerCase();
  const userJson = localStorage.getItem('leetcompete_user');
  let authUser = '';
  let authName = '';
  if (userJson) {
    try {
      const u = JSON.parse(userJson);
      authUser = (u.username || '').trim().toLowerCase();
      authName = (u.displayName || '').trim().toLowerCase();
    } catch (e) {}
  }

  // 3. Search contest leaderboard for this user's historical live record
  const lb = contestData.leaderboard || [];
  const matchedEntry = lb.find((entry, idx) => {
    const entryUser = (entry.username || '').trim().toLowerCase();
    const entryDisplay = (entry.displayName || '').trim().toLowerCase();
    if (entry.isSelf) return true;
    if (savedLC && entryUser && entryUser === savedLC) return true;
    if (savedAlias && entryDisplay && (entryDisplay === savedAlias || entryDisplay === `${savedAlias} (virtual)`)) return true;
    if (authUser && entryUser && entryUser === authUser) return true;
    if (authName && entryDisplay && entryDisplay === authName) return true;
    if (directInfo && directInfo.username && entryUser === directInfo.username.toLowerCase()) return true;
    return false;
  });

  if (matchedEntry) {
    const rank = matchedEntry.rank || (lb.indexOf(matchedEntry) + 1);
    return {
      participated: true,
      rank,
      solvedCount: matchedEntry.solvedCount || 0,
      totalScore: matchedEntry.totalScore || 0,
      totalPenalty: matchedEntry.totalPenalty || 0,
      displayName: matchedEntry.displayName
    };
  }

  // 4. Search participants list
  const parts = contestData.participants || [];
  const matchedParticipant = parts.find(p => {
    const pUser = (p.username || '').trim().toLowerCase();
    const pDisplay = (p.displayName || '').trim().toLowerCase();
    if (savedLC && pUser && pUser === savedLC) return true;
    if (savedAlias && pDisplay && pDisplay === savedAlias) return true;
    if (authUser && pUser && pUser === authUser) return true;
    if (authName && pDisplay && pDisplay === authName) return true;
    return false;
  });

  if (matchedParticipant) {
    return {
      participated: true,
      rank: null,
      solvedCount: 0,
      totalScore: 0,
      totalPenalty: 0,
      displayName: matchedParticipant.displayName
    };
  }

  if (directInfo) {
    return {
      participated: true,
      rank: directInfo.rank || null,
      solvedCount: directInfo.solvedCount || 0,
      totalScore: directInfo.totalScore || 0,
      totalPenalty: directInfo.totalPenalty || 0,
      displayName: directInfo.displayName
    };
  }

  return { participated: false };
}

export default function LobbyArena({ contestCode, onBack, currentUser }) {
  const [contest, setContest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'ranking'
  
  // Virtual Contest Mode State (Local Only, Zero Backend Writes)
  const [isVirtualMode, setIsVirtualMode] = useState(false);
  const [virtualSession, setVirtualSession] = useState(null);
  const [virtualSecondsLeft, setVirtualSecondsLeft] = useState(0);

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

    // Check for existing virtual session
    const storedVS = getStoredVirtualSession(contestCode);
    if (storedVS) {
      const now = Date.now();
      if (storedVS.status === 'IN_PROGRESS' && now < storedVS.endTime) {
        setVirtualSession(storedVS);
        setIsVirtualMode(true);
      } else if (storedVS.status === 'IN_PROGRESS' && now >= storedVS.endTime) {
        const finished = { ...storedVS, status: 'FINISHED' };
        saveStoredVirtualSession(contestCode, finished);
        setVirtualSession(finished);
      } else {
        setVirtualSession(storedVS);
      }
    }

    // If user has explicitly entered this contest arena in this session
    const hasJoinedSession = sessionStorage.getItem(`arena_joined_${contestCode}`);
    if (hasJoinedSession && savedAlias && savedLC) {
      setHasEnteredArena(true);
    }
  }, [contestCode, currentUser]);

  // Virtual countdown timer effect (runs locally, zero network)
  useEffect(() => {
    if (!isVirtualMode || !virtualSession || virtualSession.status !== 'IN_PROGRESS') return;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((virtualSession.endTime - now) / 1000));
      setVirtualSecondsLeft(remaining);

      if (remaining <= 0) {
        const finished = {
          ...virtualSession,
          status: 'FINISHED',
          finishedAt: Date.now()
        };
        saveStoredVirtualSession(contestCode, finished);
        setVirtualSession(finished);
        setActiveTab('ranking');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isVirtualMode, virtualSession?.status, virtualSession?.endTime, contestCode]);

  // Adaptive auto-polling for serverless real-time updates (Cost-optimized for AWS Free Tier)
  useEffect(() => {
    if (!contest?.id) return;
    if (contest.status === 'FINISHED' || isVirtualMode) return; // Stop polling completely once match is finished or in virtual mode

    const runPoll = async () => {
      // If browser tab is hidden/minimized, skip polling to avoid consuming AWS Free Tier invocations
      if (document.hidden) return;

      try {
        const updated = await api.getContest(contestCode);
        if (updated && updated.id) {
          setContest(updated);
          if (Array.isArray(updated.messages)) {
            setMessages(updated.messages);
          }
        }
      } catch (e) {}
    };

    // Instant refresh when user switches tab back into focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        runPoll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Fast poll (5s) when right at scheduled start time; otherwise 25s to minimize API calls
    const now = Math.floor(Date.now() / 1000);
    const isWaitingScheduled = contest.status === 'WAITING' && contest.scheduledStartTime && now >= (contest.scheduledStartTime - 5);
    const pollInterval = isWaitingScheduled ? 5000 : 25000;

    const interval = setInterval(runPoll, pollInterval);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [contest?.id, contest?.status, contest?.scheduledStartTime, contestCode, isVirtualMode]);

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
      
      // Auto-sync stored display alias only if not already joined and match is active
      const savedAlias = localStorage.getItem('leetcompete_display_name') || currentUser?.displayName || '';
      const savedLC = localStorage.getItem('leetcompete_lc_handle') || localStorage.getItem('leetcompete_username') || '';
      const alreadyInParticipants = (data.participants || []).some(
        p => (p.username || '').toLowerCase() === (savedLC || '').toLowerCase() && p.displayName === savedAlias
      );
      if (savedAlias && savedLC && data.id && !alreadyInParticipants && data.status !== 'FINISHED') {
        api.joinContest(data.id, savedLC, savedAlias).catch(() => {});
      }

      // Check session or URL for virtual intent
      const hasVirtualIntent = sessionStorage.getItem(`start_virtual_${contestCode}`) === 'true' ||
        window.location.hash.includes('virtual=1') ||
        window.location.search.includes('virtual=1');
      if (hasVirtualIntent) {
        sessionStorage.removeItem(`start_virtual_${contestCode}`);
        if (data.status === 'FINISHED') {
          const stored = getStoredVirtualSession(contestCode);
          if (!stored || stored.status === 'FINISHED') {
            setTimeout(() => handleStartVirtualContest(data), 50);
          } else if (stored.status === 'IN_PROGRESS') {
            setIsVirtualMode(true);
          }
        }
      }

      const isCreator = (currentUser && (
        (currentUser.username || '').toLowerCase() === (data.ownerUsername || '').toLowerCase() ||
        (currentUser.username || '').toLowerCase() === (data.hostUsername || '').toLowerCase()
      )) || !!data.isOrganizer;

      if (!data.isPrivate || isCreator || (data.password && data.password !== '••••••••')) {
        setIsPasswordUnlocked(true);
      }
      
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else {
        try {
          const msgs = await api.getMessages(data.id);
          setMessages(Array.isArray(msgs) ? msgs : []);
        } catch (e) {
          setMessages([]);
        }
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
      if (contest?.id && contest.status !== 'FINISHED') {
        await api.joinContest(contest.id, cleanLC, cleanAlias, passwordInput.trim() || undefined);
      }

      // Permanently remember username & handle in user's browser local machine cache
      localStorage.setItem('leetcompete_display_name', cleanAlias);
      localStorage.setItem('leetcompete_lc_handle', cleanLC);
      localStorage.setItem('leetcompete_username', cleanLC);
      sessionStorage.setItem(`arena_joined_${contestCode}`, 'true');
      localStorage.setItem(`contest_participated_${contestCode}`, JSON.stringify({
        participatedAt: Date.now(),
        contestCode,
        username: cleanLC,
        displayName: cleanAlias
      }));

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

  // === VIRTUAL CONTEST CONTROLS (LOCAL MACHINE ONLY) ===
  const handleStartVirtualContest = (contestData = null) => {
    const target = contestData || contest;
    if (!target) return;

    const duration = target.durationMinutes || 60;
    const now = Date.now();
    const newSession = {
      contestCode,
      contestId: target.id,
      contestTitle: target.title,
      durationMinutes: duration,
      startedAt: now,
      endTime: now + (duration * 60 * 1000),
      status: 'IN_PROGRESS',
      solves: [],
      problemStatus: {},
      totalScore: 0,
      solvedCount: 0,
      totalPenalty: 0
    };

    saveStoredVirtualSession(contestCode, newSession);
    setVirtualSession(newSession);
    setIsVirtualMode(true);
    setActiveTab('questions');
  };

  const handleFinishVirtualContest = () => {
    if (!virtualSession) return;
    if (!window.confirm('Finish virtual contest and view your final local ranking?')) return;

    const updated = {
      ...virtualSession,
      status: 'FINISHED',
      finishedAt: Date.now()
    };
    saveStoredVirtualSession(contestCode, updated);
    setVirtualSession(updated);
    setActiveTab('ranking');
  };

  const handleResetVirtualContest = () => {
    if (!window.confirm('Reset virtual contest progress and timer? You can restart fresh anytime.')) return;
    clearStoredVirtualSession(contestCode);
    setVirtualSession(null);
    setIsVirtualMode(false);
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
    // 1. Virtual Contest Mode: 100% client-side, zero backend API calls or stats modification
    if (isVirtualMode && virtualSession) {
      const now = Date.now();
      const elapsedMinutes = Math.max(0, Math.floor((now - virtualSession.startedAt) / 60000));
      const targetSlug = (problemSlug || '').toLowerCase().trim();
      const problem = (contest?.problems || []).find(
        p => (p.titleSlug || p.slug || '').toLowerCase().trim() === targetSlug
      );
      const points = problem?.points || (problem?.difficulty === 'Easy' ? 100 : problem?.difficulty === 'Hard' ? 300 : 200);

      const newSolve = {
        problemSlug,
        problemTitle: problem?.title || problemSlug,
        penaltyMinutes: elapsedMinutes,
        points,
        verifiedAt: Math.floor(now / 1000)
      };

      const existingSolves = (virtualSession.solves || []).filter(
        s => (s.problemSlug || '').toLowerCase().trim() !== targetSlug
      );
      const updatedSolves = [...existingSolves, newSolve];
      const updatedStatus = { ...(virtualSession.problemStatus || {}) };
      updatedStatus[problemSlug] = {
        solved: true,
        penaltyMinutes: elapsedMinutes,
        points
      };

      const totalScore = updatedSolves.reduce((acc, s) => acc + (s.points || 0), 0);
      const solvedCount = updatedSolves.length;
      const totalPenalty = updatedSolves.reduce((acc, s) => acc + (s.penaltyMinutes || 0), 0);

      const updatedSession = {
        ...virtualSession,
        solves: updatedSolves,
        problemStatus: updatedStatus,
        totalScore,
        solvedCount,
        totalPenalty
      };

      saveStoredVirtualSession(contestCode, updatedSession);
      setVirtualSession(updatedSession);

      return {
        verified: true,
        submission: {
          penaltyMinutes: elapsedMinutes,
          points
        }
      };
    }

    // 2. Live Contest Mode: Normal backend verification
    if (!username) {
      throw new Error('Please set your LeetCode handle in the participant profile bar above!');
    }
    if (!contest?.id) return;

    if (username && displayName) {
      api.joinContest(contest.id, username, displayName).catch(() => {});
    }

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
      // Instant refresh after user activity
      loadContest();
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

  // ENTRY GATE: If not yet joined (and match not finished), or private lobby locked
  const requiresGate = (contest.status !== 'FINISHED' && !hasEnteredArena && !isOrganizer) || (contest?.isPrivate && !isPasswordUnlocked && !isOrganizer);

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

  const priorParticipation = checkLocalPriorParticipation(contestCode, contest);

  const getDisplayLeaderboard = () => {
    const baseLeaderboard = contest?.leaderboard || [];
    if (!isVirtualMode && (!virtualSession || virtualSession.status !== 'FINISHED')) {
      return baseLeaderboard;
    }

    const vSession = virtualSession || {};
    const virtualEntry = {
      username: username || displayName || 'Virtual Contestant',
      displayName: `${displayName || 'You'} (Virtual)`,
      totalScore: vSession.totalScore || 0,
      solvedCount: vSession.solvedCount || 0,
      totalPenalty: vSession.totalPenalty || 0,
      solves: vSession.solves || [],
      problemStatus: vSession.problemStatus || {},
      isVirtual: true,
      isSelf: true
    };

    const combined = [...baseLeaderboard, virtualEntry].sort((a, b) => {
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      if (a.totalPenalty !== b.totalPenalty) return a.totalPenalty - b.totalPenalty;
      return b.totalScore - a.totalScore;
    }).map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));

    return combined;
  };

  const displayLeaderboard = getDisplayLeaderboard();
  const virtualRank = displayLeaderboard.find(e => e.isVirtual)?.rank || null;

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

          {isVirtualMode && virtualSession && virtualSession.status === 'IN_PROGRESS' ? (
            <div
              className="arena-chip"
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                borderColor: 'rgba(168, 85, 247, 0.45)',
                color: '#c084fc',
                fontWeight: '700'
              }}
              title="Virtual Practice Timer (Local Machine Only)"
            >
              <Clock size={13} color="#c084fc" />
              <span>Virtual: <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatDuration(virtualSecondsLeft)}</strong></span>
            </div>
          ) : (
            <Countdown
              status={contest.status}
              startTime={contest.startTime}
              endTime={contest.endTime}
              scheduledStartTime={contest.scheduledStartTime}
              timezone={contest.timezone || 'UTC'}
              problemsCount={contest.problems?.length || 0}
              onTimerEnd={handleTimerEnd}
            />
          )}

          {/* Virtual Contest Controls in Top Bar */}
          {isVirtualMode && virtualSession?.status === 'IN_PROGRESS' && (
            <div style={{ display: 'inline-flex', gap: '6px' }}>
              <button
                onClick={handleFinishVirtualContest}
                className="btn btn-danger btn-sm"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                title="End virtual contest now"
              >
                Finish Match
              </button>
              <button
                onClick={handleResetVirtualContest}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                title="Reset virtual progress"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}

          {contest.status === 'FINISHED' && !isVirtualMode && (
            <button
              onClick={() => handleStartVirtualContest()}
              className="btn btn-primary btn-sm"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                borderColor: '#a855f7',
                padding: '5px 12px',
                fontSize: '0.8rem',
                fontWeight: '700'
              }}
            >
              <Sparkles size={13} /> {virtualSession?.status === 'FINISHED' ? 'Restart Virtual' : 'Virtual Contest'}
            </button>
          )}

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
                  {/* Virtual Practice Banner for Past Contests (When not actively running) */}
                  {contest.status === 'FINISHED' && !isVirtualMode && (
                    <div className="virtual-banner">
                      <div className="virtual-banner-glow" />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 1 }}>
                        <div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Sparkles size={11} /> Virtual Practice
                            </span>
                            {priorParticipation.participated ? (
                              <span className="badge badge-easy" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle2 size={11} />
                                {priorParticipation.rank
                                  ? `Participated Live: Rank #${priorParticipation.rank} (${priorParticipation.solvedCount}/${contest.problems?.length || 0} Solved)`
                                  : 'Participated in Live Match'}
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-dim)', border: '1px solid var(--border-color)' }}>
                                Not Attempted in Live Match
                              </span>
                            )}
                            {virtualSession?.status === 'FINISHED' && (
                              <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Trophy size={11} />
                                Virtual Run: Rank #{virtualRank} ({virtualSession.solvedCount}/{contest.problems?.length || 0} Solved)
                              </span>
                            )}
                          </div>

                          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '6px', color: 'var(--text-main)' }}>
                            Practice this Contest in Virtual Mode
                          </h2>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '580px', lineHeight: 1.45 }}>
                            Simulate the original timed match locally on your machine. Solves and penalties are calculated client-side with <strong>zero backend API calls</strong>, and your virtual standing is placed into the official rankings!
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleStartVirtualContest()}
                            className="btn btn-primary"
                            style={{
                              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                              borderColor: '#a855f7',
                              boxShadow: '0 0 16px rgba(168, 85, 247, 0.35)',
                              fontWeight: '700'
                            }}
                          >
                            <Play size={16} />
                            {virtualSession?.status === 'FINISHED' ? 'Restart Virtual Contest' : `Start Virtual Contest (${contest.durationMinutes}m)`}
                          </button>

                          <button
                            onClick={() => setActiveTab('ranking')}
                            className="btn btn-secondary"
                          >
                            <Trophy size={15} /> View Rankings
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Virtual Match Banner */}
                  {isVirtualMode && virtualSession?.status === 'IN_PROGRESS' && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.1))',
                      border: '1px solid rgba(168, 85, 247, 0.45)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 18px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="badge badge-purple" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                          ● Virtual Match In Progress
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '600' }}>
                          Time Left: <strong style={{ color: '#c084fc', fontFamily: 'var(--font-mono)' }}>{formatDuration(virtualSecondsLeft)}</strong>
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          (Local practice • Solves stored offline)
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={handleFinishVirtualContest}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                        >
                          Finish Virtual Match
                        </button>
                        <button
                          onClick={handleResetVirtualContest}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          title="Reset virtual timer and solves"
                        >
                          <RotateCcw size={13} /> Reset
                        </button>
                      </div>
                    </div>
                  )}

                  {contest.problems?.map((prob, idx) => {
                    const slug = (prob.titleSlug || prob.slug || '').toLowerCase();
                    const userSolve = (isVirtualMode && virtualSession)
                      ? (virtualSession.solves || []).find(s => (s.problemSlug || '').toLowerCase() === slug)
                      : userEntry?.solves?.find(s => s.problemSlug?.toLowerCase() === slug);

                    const solvePenalty = (isVirtualMode && virtualSession)
                      ? (virtualSession.problemStatus?.[prob.titleSlug] || virtualSession.problemStatus?.[prob.slug])?.penaltyMinutes
                      : userSolve?.penaltyMinutes;

                    const cardStatus = isVirtualMode
                      ? (virtualSession?.status === 'FINISHED' ? 'FINISHED' : 'IN_PROGRESS')
                      : contest.status;

                    return (
                      <ProblemCard
                        key={prob.titleSlug || idx}
                        index={idx + 1}
                        problem={prob}
                        disabled={false}
                        userSolved={!!userSolve}
                        solvePenalty={solvePenalty}
                        contestStatus={cardStatus}
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
              leaderboard={displayLeaderboard}
              problems={contest.problems || []}
              currentUsername={username}
              currentDisplayName={displayName}
              currentUser={currentUser}
              isVirtual={isVirtualMode || !!virtualSession}
              virtualRank={virtualRank}
              virtualStats={virtualSession}
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
