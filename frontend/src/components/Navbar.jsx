import React, { useState, useEffect } from 'react';
import { Trophy, PlusCircle, Compass, Layers, User, Check, Edit2, ShieldCheck, Lock } from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  onOpenCreateContest,
  onOpenCreateSeason,
  onOpenAdminModal
}) {
  const [username, setUsername] = useState('');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('leetcompete_username') || '';
    setUsername(saved);
    setInputVal(saved);
    checkAdmin();
  }, []);

  const checkAdmin = () => {
    const savedPass = sessionStorage.getItem('leetcompete_admin_passcode') || localStorage.getItem('leetcompete_admin_passcode');
    setIsAdminUnlocked(!!savedPass);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const clean = inputVal.trim().toLowerCase();
    localStorage.setItem('leetcompete_username', clean);
    setUsername(clean);
    setIsEditingUser(false);
    window.dispatchEvent(new CustomEvent('leetcompete_user_changed', { detail: clean }));
  };

  return (
    <nav style={{
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 24px',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div
          onClick={() => setActiveView('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(37, 99, 235, 0.45)'
          }}>
            <Trophy size={20} color="#fff" />
          </div>
          <span style={{
            fontSize: '1.45rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to right, #ffffff, #93c5fd, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            LeetCompete
          </span>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setActiveView('home')}
            className={`tab-btn ${activeView === 'home' ? 'active' : ''}`}
            style={{ padding: '8px 14px', borderRadius: '8px' }}
          >
            <Compass size={17} />
            Lobbies
          </button>
          <button
            onClick={() => setActiveView('seasons')}
            className={`tab-btn ${activeView === 'seasons' ? 'active' : ''}`}
            style={{ padding: '8px 14px', borderRadius: '8px' }}
          >
            <Layers size={17} />
            Seasons & Bundles
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Admin Mode Badge / Button */}
        <button
          onClick={onOpenAdminModal}
          className="btn btn-secondary btn-sm"
          style={{
            borderColor: isAdminUnlocked ? 'var(--color-easy)' : 'var(--border-color)',
            color: isAdminUnlocked ? 'var(--color-easy)' : 'var(--text-muted)'
          }}
          title={isAdminUnlocked ? 'Admin Mode Active' : 'Unlock Admin Mode'}
        >
          {isAdminUnlocked ? <ShieldCheck size={15} color="var(--color-easy)" /> : <Lock size={15} />}
          <span>{isAdminUnlocked ? 'Admin' : 'Admin Login'}</span>
        </button>

        <button
          onClick={onOpenCreateSeason}
          className="btn btn-secondary btn-sm"
          style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}
        >
          <Layers size={15} color="#60a5fa" />
          New Season
        </button>

        <button
          onClick={onOpenCreateContest}
          className="btn btn-primary btn-sm"
        >
          <PlusCircle size={15} />
          Host Contest
        </button>

        {/* LeetCode User Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          gap: '8px'
        }}>
          <User size={15} color="var(--accent-primary)" />
          {isEditingUser ? (
            <form onSubmit={handleSaveUser} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="LeetCode username"
                autoFocus
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  width: '140px',
                  outline: 'none'
                }}
              />
              <button type="submit" style={{ background: 'var(--accent-primary)', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: '#fff' }}>
                <Check size={13} />
              </button>
            </form>
          ) : (
            <div
              onClick={() => setIsEditingUser(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              title="Click to change your LeetCode username"
            >
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: username ? 'var(--text-main)' : 'var(--text-dim)' }}>
                {username ? `@${username}` : 'Set LeetCode ID'}
              </span>
              <Edit2 size={12} color="var(--text-muted)" />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
