import React, { useState, useEffect } from 'react';
import { Trophy, PlusCircle, Compass, Layers, User, Check, Edit2 } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, onOpenCreateContest, onOpenCreateSeason }) {
  const [username, setUsername] = useState('');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('leetjam_username') || '';
    setUsername(saved);
    setInputVal(saved);
  }, []);

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const clean = inputVal.trim().toLowerCase();
    localStorage.setItem('leetjam_username', clean);
    setUsername(clean);
    setIsEditingUser(false);
    // Dispatch custom event so arena updates instantly
    window.dispatchEvent(new CustomEvent('leetjam_user_changed', { detail: clean }));
  };

  return (
    <nav style={{
      background: 'rgba(14, 16, 28, 0.95)',
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
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)'
          }}>
            <Trophy size={20} color="#fff" />
          </div>
          <span style={{
            fontSize: '1.4rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to right, #fff, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            LeetJam <span style={{ fontSize: '0.8rem', color: '#a855f7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', WebkitTextFillColor: '#a855f7' }}>Live</span>
          </span>
        </div>

        {/* Navigation Links */}
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
            Seasons & Leagues
          </button>
        </div>
      </div>

      {/* Actions & User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onOpenCreateSeason}
          className="btn btn-secondary btn-sm"
          style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}
        >
          <Layers size={15} />
          New Season
        </button>

        <button
          onClick={onOpenCreateContest}
          className="btn btn-primary btn-sm"
        >
          <PlusCircle size={15} />
          Create Contest
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
          <User size={15} color="var(--accent-purple)" />
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
                  border: '1px solid var(--accent-purple)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  width: '140px',
                  outline: 'none'
                }}
              />
              <button type="submit" style={{ background: 'var(--accent-purple)', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: '#fff' }}>
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
