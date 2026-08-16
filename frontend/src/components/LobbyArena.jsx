import React, { useState, useEffect } from 'react';
import { Trophy, HelpCircle, Share2, Play, CheckCircle2, AlertCircle, Check, UserCheck, Layers, ArrowLeft, Lock, KeyRound, ShieldCheck } from 'lucide-react';
import Countdown from './Countdown';
import ProblemCard from './ProblemCard';
import Leaderboard from './Leaderboard';
import LobbyChat from './LobbyChat';
import { api } from '../services/api';

export default function LobbyArena({ contestCode, onBack, currentUser }) {
  const [contest, setContest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'ranking'
  
  // Contest Alias & Private LeetCode handle state
  const [displayName, setDisplayName] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadContest();
    
    const savedAlias = localStorage.getItem('leetcompete_display_name') || currentUser?.displayName || '';
    const savedLC = localStorage.getItem('leetcompete_lc_handle') || localStorage.getItem('leetcompete_username') || '';
    
    if (savedAlias) {
      setDisplayName(savedAlias);
      setDisplayNameInput(savedAlias);
    }
    if (savedLC) {
      setUsername(savedLC.toLowerCase());
      setUsernameInput(savedLC);
    }

    const savedPass = sessionStorage.getItem(`contest_pass_${contestCode}`);
    if (savedPass) {
      setPasswordInput(savedPass);
      setIsPasswordUnlocked(true);
    }
  }, [contestCode, currentUser]);

  // Adaptive auto-polling for serverless real-time updates
  useEffect(() => {
    if (!contest?.id) return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.getContest(contestCode);
        setContest(updated);
        try {
          const msgs = await api.getMessages(contest.id);
          setMessages(msgs || []);
        } catch (e) {}
      } catch (e) {}
    }, 6000);

    return () => clearInterval(interval);
  }, [contest?.id, contestCode]);

  const loadContest = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getContest(contestCode);
      setContest(data);
      if (!data.isPrivate) {
        setIsPasswordUnlocked(true);
      }
      try {
        const msgs = await api.getMessages(data.id);
        setMessages(msgs || []);
      } catch (e) {
        setMessages([]);
      }
    } catch (err) {
      setError(err.message || 'Could not load contest lobby.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockPassword = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setPasswordError('');

    try {
      await api.joinContest(contest.id, username || displayName || 'Guest', displayName || username || 'Guest', passwordInput.trim());
      sessionStorage.setItem(`contest_pass_${contestCode}`, passwordInput.trim());
      setIsPasswordUnlocked(true);
      loadContest();
    } catch (err) {
      setPasswordError(err.message || 'Incorrect password');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;
    
    const cleanAlias = displayNameInput.trim();
    const cleanLC = (usernameInput.trim() || cleanAlias).toLowerCase();
    
    localStorage.setItem('leetcompete_display_name', cleanAlias);
    localStorage.setItem('leetcompete_lc_handle', cleanLC);
    localStorage.setItem('leetcompete_username', cleanLC);
    
    setDisplayName(cleanAlias);
    setUsername(cleanLC);

    if (contest?.id) {
      try {
        await api.joinContest(contest.id, cleanLC, cleanAlias, passwordInput || undefined);
        loadContest();
      } catch (err) {
        console.error('Join error:', err);
      }
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
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleCopyLobbyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?lobby=${contest?.code || contestCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-dim)' }}>
        Loading arena...
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="glass-panel" style={{ maxWidth: '550px', margin: '40px auto', padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={40} color="#fb7185" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>Lobby Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error || `No active lobby found with code "${contestCode}".`}</p>
        <button onClick={onBack} className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Lobbies
        </button>
      </div>
    );
  }

  // Private Lobby Password Screen
  if (contest.isPrivate && !isPasswordUnlocked) {
    return (
      <div className="glass-panel" style={{ maxWidth: '480px', margin: '60px auto', padding: '36px', textAlign: 'center' }}>
        <div style={{
          background: 'rgba(245, 158, 11, 0.15)',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Lock size={26} color="#fcd34d" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '6px' }}>Private Contest Lobby</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          This contest is password-protected. Please enter the password shared by the host.
        </p>

        <form onSubmit={handleUnlockPassword}>
          <input
            type="password"
            placeholder="Enter Contest Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="form-input"
            style={{ marginBottom: '12px', textAlign: 'center', fontSize: '1rem' }}
            autoFocus
          />

          {passwordError && (
            <div style={{ color: '#fb7185', fontSize: '0.85rem', marginBottom: '12px' }}>
              {passwordError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onBack} className="btn btn-secondary" style={{ flex: 1 }}>
              Back
            </button>
            <button type="submit" disabled={!passwordInput.trim()} className="btn btn-primary" style={{ flex: 1 }}>
              <KeyRound size={15} /> Unlock Arena
            </button>
          </div>
        </form>
      </div>
    );
  }

  const userEntry = contest.leaderboard?.find(entry => entry.username?.toLowerCase() === username?.toLowerCase());

  return (
    <div>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={onBack} className="btn btn-secondary btn-sm" title="Back to Lobbies">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                {contest.title}
              </h1>
              {contest.seasonTitle && (
                <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={12} /> {contest.seasonTitle} (Round #{contest.seasonRound || 1})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            onClick={handleCopyLobbyLink}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
            title="Click to copy invite link"
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lobby ID:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: '#60a5fa', letterSpacing: '0.05em' }}>
              {contest.code}
            </strong>
            {copiedLink ? <Check size={14} color="var(--color-easy)" /> : <Share2 size={14} color="var(--text-dim)" />}
          </div>

          <Countdown
            status={contest.status}
            startTime={contest.startTime}
            endTime={contest.endTime}
            onTimerEnd={loadContest}
          />

          {contest.status === 'WAITING' && (
            <button onClick={handleStartContest} className="btn btn-success">
              <Play size={16} /> Start Contest
            </button>
          )}

          {contest.status === 'IN_PROGRESS' && (
            <button onClick={handleFinishContest} className="btn btn-danger btn-sm">
              End Contest
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Grid */}
      <div className="arena-layout-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
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
                <Trophy size={16} /> Live Rankings
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`tab-btn mobile-only-tab ${activeTab === 'chat' ? 'active' : ''}`}
              >
                💬 Live Chat ({messages?.length || 0})
              </button>
            </div>

            <button
              onClick={() => setShowHelp(!showHelp)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem'
              }}
            >
              <HelpCircle size={15} /> How to Submit?
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
                <li>Set your <strong>Display Name</strong> and <strong>LeetCode Handle</strong> in the profile bar below.</li>
                <li>Click <em>"Solve on LeetCode"</em> on any question to open the problem in LeetCode.</li>
                <li>Submit your solution on LeetCode until you get an <strong>Accepted (AC)</strong> verdict.</li>
                <li>Return here and click <strong>"Submit"</strong>. Our AWS Lambda backend queries LeetCode GraphQL in real-time, verifies your AC timestamp, and updates the leaderboard!</li>
              </ol>
            </div>
          )}

          {/* Privacy-Preserving Contest Profile Banner */}
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: '24px'
          }}>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="var(--color-easy)" />
                  Contest Profile & Privacy
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-easy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🔒 LeetCode handles are strictly private and never shown on rankings
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'flex-end' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.775rem', marginBottom: '4px' }}>
                    Contest Alias (Shown on Leaderboard) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SpeedyFox or Alex"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.775rem', marginBottom: '4px' }}>
                    LeetCode Handle (Private for AC Check) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. fahad00cms"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <UserCheck size={15} /> Save & Join
                </button>
              </div>

              {displayName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--color-easy)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Active as: <strong>{displayName}</strong>
                  </span>
                  <span>•</span>
                  <span>Linked LeetCode handle: <strong>{username ? `${username.slice(0, 2)}•••${username.slice(-1)}` : 'Set'}</strong> (Hidden from peers)</span>
                </div>
              )}
            </form>
          </div>

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div>
              {contest.status === 'WAITING' && (
                <div style={{
                  background: 'var(--accent-primary-light)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '0.9rem',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>Waiting for host to start the contest. Problems will unlock upon start.</span>
                </div>
              )}

              {contest.problems?.map((prob, idx) => {
                const userSolve = userEntry?.solves?.find(s => s.problemSlug?.toLowerCase() === prob.titleSlug?.toLowerCase());
                return (
                  <ProblemCard
                    key={prob.titleSlug || idx}
                    index={idx + 1}
                    problem={prob}
                    disabled={contest.status === 'WAITING'}
                    userSolved={!!userSolve}
                    solvePenalty={userSolve?.penaltyMinutes}
                    contestStatus={contest.status}
                    onVerify={handleVerifyProblem}
                  />
                );
              })}
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
