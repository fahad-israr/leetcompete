import React, { useState, useEffect } from 'react';
import { Trophy, HelpCircle, Share2, Play, CheckCircle2, AlertCircle, Copy, Check, UserCheck, Layers, ArrowLeft } from 'lucide-react';
import Countdown from './Countdown';
import ProblemCard from './ProblemCard';
import Leaderboard from './Leaderboard';
import LobbyChat from './LobbyChat';
import { api } from '../services/api';
import { wsService } from '../services/websocket';

export default function LobbyArena({ contestCode, onBack }) {
  const [contest, setContest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'ranking' | 'season'
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Load initial contest data
  useEffect(() => {
    loadContest();
    const saved = localStorage.getItem('leetjam_username') || '';
    setUsername(saved);
    setUsernameInput(saved);
  }, [contestCode]);

  // Connect WebSocket when contest loaded
  useEffect(() => {
    if (!contest?.id) return;

    wsService.connect(contest.id, username);

    const unsubSync = wsService.on('ROOM_SYNC', (data) => {
      if (data.contest) setContest(data.contest);
      if (data.messages) setMessages(data.messages);
    });

    const unsubStart = wsService.on('CONTEST_STARTED', (updated) => {
      setContest(updated);
    });

    const unsubFinish = wsService.on('CONTEST_FINISHED', (updated) => {
      setContest(updated);
    });

    const unsubSub = wsService.on('SUBMISSION_VERIFIED', (data) => {
      if (data.leaderboard) {
        setContest(prev => prev ? { ...prev, leaderboard: data.leaderboard } : prev);
      }
      if (data.messages) {
        setMessages(data.messages);
      }
    });

    const unsubMsg = wsService.on('NEW_MESSAGE', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    const unsubJoin = wsService.on('PARTICIPANT_JOINED', (data) => {
      if (data.leaderboard) {
        setContest(prev => prev ? { ...prev, leaderboard: data.leaderboard } : prev);
      }
    });

    return () => {
      unsubSync();
      unsubStart();
      unsubFinish();
      unsubSub();
      unsubMsg();
      unsubJoin();
      wsService.disconnect();
    };
  }, [contest?.id, username]);

  const loadContest = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getContest(contestCode);
      setContest(data);
      const msgs = await api.getMessages(data.id);
      setMessages(msgs);
    } catch (err) {
      setError(err.message || 'Could not load contest lobby.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetUsername = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    const clean = usernameInput.trim().toLowerCase();
    localStorage.setItem('leetjam_username', clean);
    setUsername(clean);

    if (contest?.id) {
      try {
        const res = await api.joinContest(contest.id, clean, usernameInput.trim());
        setContest(res.contest);
      } catch (err) {
        console.error('Join error:', err);
      }
    }
  };

  const handleStartContest = async () => {
    if (!contest?.id) return;
    try {
      const updated = await api.startContest(contest.id);
      setContest(updated);
    } catch (err) {
      alert(err.message || 'Failed to start contest');
    }
  };

  const handleFinishContest = async () => {
    if (!contest?.id) return;
    if (!window.confirm('Are you sure you want to end the contest early?')) return;
    try {
      const updated = await api.finishContest(contest.id);
      setContest(updated);
    } catch (err) {
      alert(err.message || 'Failed to finish contest');
    }
  };

  const handleVerifyProblem = async (problemSlug) => {
    if (!username) {
      throw new Error('Please enter and save your LeetCode username first!');
    }
    if (!contest?.id) return;

    const res = await api.verifySubmission(contest.id, username, problemSlug);
    if (res.verified && res.leaderboard) {
      setContest(prev => prev ? { ...prev, leaderboard: res.leaderboard } : prev);
      const msgs = await api.getMessages(contest.id);
      setMessages(msgs);
    }
    return res;
  };

  const handleSendMessage = async (text) => {
    if (!contest?.id) return;
    try {
      const msg = await api.sendMessage(contest.id, username || 'Guest', text);
      // Fallback in case ws broadcast is delayed
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleCopyLobbyLink = () => {
    const url = `${window.location.origin}/?lobby=${contest?.code || contestCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-dim)' }}>
        Loading contest arena...
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="glass-panel" style={{ maxWidth: '600px', margin: '40px auto', padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={40} color="#f87171" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>Lobby Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{error || `No active lobby exists with code "${contestCode}".`}</p>
        <button onClick={onBack} className="btn btn-primary">
          <ArrowLeft size={16} /> Return to Home
        </button>
      </div>
    );
  }

  // Find user's solve map from leaderboard
  const userEntry = contest.leaderboard?.find(entry => entry.username?.toLowerCase() === username?.toLowerCase());

  return (
    <div>
      {/* Top Arena Navigation Header */}
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
              {contest.season && (
                <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={12} /> {contest.season.title} (Round #{contest.seasonRound || 1})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Lobby ID pill */}
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
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: '#fff', letterSpacing: '0.05em' }}>
              {contest.code}
            </strong>
            {copiedLink ? <Check size={14} color="var(--color-easy)" /> : <Share2 size={14} color="var(--text-dim)" />}
          </div>

          {/* Synchronized Timer */}
          <Countdown
            status={contest.status}
            startTime={contest.startTime}
            endTime={contest.endTime}
            onTimerEnd={loadContest}
          />

          {/* Host Controls */}
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

      {/* Main 2-Column Arena Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Questions / Leaderboard */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
              <button
                onClick={() => setActiveTab('questions')}
                className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📋 Questions ({contest.problems?.length || 0})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('ranking')}
                className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={16} /> Ranking
                </span>
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

          {/* How to Submit Tooltip */}
          {showHelp && (
            <div style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: '20px',
              fontSize: '0.875rem',
              color: '#e9d5ff',
              lineHeight: 1.5
            }}>
              <strong>How Verification Works:</strong>
              <ol style={{ marginLeft: '20px', marginTop: '6px' }}>
                <li>Make sure your <strong>LeetCode Username</strong> is registered in the bar below.</li>
                <li>Click <em>"Solve on LeetCode"</em> on any question to open the problem in LeetCode.</li>
                <li>Write and submit your solution on LeetCode until you get an <strong>Accepted (AC)</strong> verdict.</li>
                <li>Come back here and click <strong>"Submit"</strong>. Our server queries LeetCode GraphQL in real-time, verifies your accepted submission timestamp, and updates the leaderboard!</li>
              </ol>
            </div>
          )}

          {/* LeetCode Username Registration Bar (matching screenshot) */}
          <div style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              Enter LeetCode Username:
            </span>
            <form onSubmit={handleSetUsername} style={{ display: 'flex', gap: '8px', flex: '1', maxWidth: '380px' }}>
              <input
                type="text"
                placeholder="e.g. fahad00cms"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="form-input"
                style={{ background: 'var(--bg-surface)', padding: '8px 14px' }}
              />
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                style={{ borderColor: 'var(--accent-purple)', color: '#fff' }}
              >
                <UserCheck size={14} /> Save
              </button>
            </form>

            {username && (
              <span style={{ fontSize: '0.85rem', color: 'var(--color-easy)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Active: @{username}
              </span>
            )}
          </div>

          {/* Tab 1: Questions List */}
          {activeTab === 'questions' && (
            <div>
              {contest.status === 'WAITING' && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '0.9rem',
                  color: '#fcd34d',
                  textAlign: 'center'
                }}>
                  ⏳ The contest has not started yet. When the host clicks <strong>Start Contest</strong>, problem links and submission verification will be unlocked!
                </div>
              )}

              {contest.problems?.map((prob, idx) => {
                const status = userEntry?.problemStatus?.[prob.titleSlug];
                return (
                  <ProblemCard
                    key={prob.titleSlug}
                    problem={prob}
                    index={idx}
                    contestStatus={contest.status}
                    userSolved={status?.solved}
                    solvePenalty={status?.penaltyMinutes}
                    onVerify={handleVerifyProblem}
                    disabled={!username || contest.status !== 'IN_PROGRESS'}
                  />
                );
              })}
            </div>
          )}

          {/* Tab 2: Ranking Table */}
          {activeTab === 'ranking' && (
            <Leaderboard
              leaderboard={contest.leaderboard || []}
              problems={contest.problems || []}
            />
          )}
        </div>

        {/* Right Column: Live Chat & Activity Stream */}
        <div>
          <LobbyChat
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUsername={username}
          />
        </div>
      </div>
    </div>
  );
}
