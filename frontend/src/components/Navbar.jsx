import React, { useState, useEffect } from 'react';
import { Flame, PlusCircle, Compass, Layers, User, Check, Edit2, ShieldCheck, Lock, Sun, Moon, Menu, X } from 'lucide-react';

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
  const [theme, setTheme] = useState('light'); // Default to light theme
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Initialize Theme (Default = light)
    const savedTheme = localStorage.getItem('leetcompete_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 2. Initialize Username & Admin state
    const savedUser = localStorage.getItem('leetcompete_username') || '';
    setUsername(savedUser);
    setInputVal(savedUser);
    checkAdmin();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('leetcompete_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

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

  const handleNavClick = (view) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className="navbar-container"
      style={{
        background: 'var(--navbar-bg)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 20px',
        height: '66px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background 0.2s ease, border-color 0.2s ease'
      }}
    >
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div
          onClick={() => handleNavClick('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          {/* Flame Icon Logo */}
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
            width: '36px',
            height: '36px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px var(--accent-orange-glow)'
          }}>
            <Flame size={20} color="#ffffff" />
          </div>
          <span style={{
            fontSize: '1.35rem',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            color: 'var(--text-main)'
          }}>
            LeetCompete
          </span>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="desktop-nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => handleNavClick('home')}
            className={`tab-btn ${activeView === 'home' ? 'active' : ''}`}
            style={{ padding: '6px 12px', borderRadius: '6px' }}
          >
            <Compass size={16} />
            Lobbies
          </button>
          <button
            onClick={() => handleNavClick('seasons')}
            className={`tab-btn ${activeView === 'seasons' ? 'active' : ''}`}
            style={{ padding: '6px 12px', borderRadius: '6px' }}
          >
            <Layers size={16} />
            Seasons & Bundles
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Light / Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          style={{
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-main)'
          }}
          title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="#fbbf24" />}
          <span className="desktop-only-controls">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        {/* Desktop Admin Mode Badge */}
        <button
          onClick={onOpenAdminModal}
          className="btn btn-secondary btn-sm desktop-only-controls"
          style={{
            borderColor: isAdminUnlocked ? 'var(--color-easy)' : 'var(--border-color)',
            color: isAdminUnlocked ? 'var(--color-easy)' : 'var(--text-muted)',
            padding: '6px 10px'
          }}
          title={isAdminUnlocked ? 'Admin Mode Active' : 'Unlock Admin Mode'}
        >
          {isAdminUnlocked ? <ShieldCheck size={14} color="var(--color-easy)" /> : <Lock size={14} />}
          <span>{isAdminUnlocked ? 'Admin' : 'Admin Login'}</span>
        </button>

        {/* Desktop New Season Button */}
        <button
          onClick={onOpenCreateSeason}
          className="btn btn-secondary btn-sm desktop-only-controls"
        >
          <Layers size={14} color="var(--accent-primary)" />
          <span>New Season</span>
        </button>

        {/* Quick Host Button (Visible on both Mobile & Desktop) */}
        <button
          onClick={() => {
            onOpenCreateContest();
            setIsMobileMenuOpen(false);
          }}
          className="btn btn-primary btn-sm"
          style={{ padding: '6px 12px' }}
        >
          <PlusCircle size={15} />
          <span>Host</span>
        </button>

        {/* Desktop LeetCode User Badge */}
        <div className="desktop-only-controls" style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '4px 10px',
          gap: '6px'
        }}>
          <User size={14} color="var(--accent-primary)" />
          {isEditingUser ? (
            <form onSubmit={handleSaveUser} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Username"
                autoFocus
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  width: '100px',
                  outline: 'none'
                }}
              />
              <button type="submit" style={{ background: 'var(--accent-primary)', border: 'none', borderRadius: '4px', padding: '3px', cursor: 'pointer', color: '#fff' }}>
                <Check size={12} />
              </button>
            </form>
          ) : (
            <div
              onClick={() => setIsEditingUser(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              title="Click to change your LeetCode username"
            >
              <span style={{ fontSize: '0.825rem', fontWeight: '500', color: username ? 'var(--text-main)' : 'var(--text-dim)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {username ? `@${username}` : 'Set ID'}
              </span>
              <Edit2 size={11} color="var(--text-muted)" />
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-nav-toggle"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Slide-Down Drawer Menu */}
      <div className={`mobile-menu-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <button
          onClick={() => handleNavClick('home')}
          className={`mobile-nav-link ${activeView === 'home' ? 'active' : ''}`}
        >
          <Compass size={18} />
          <span>Contest Lobbies</span>
        </button>

        <button
          onClick={() => handleNavClick('seasons')}
          className={`mobile-nav-link ${activeView === 'seasons' ? 'active' : ''}`}
        >
          <Layers size={18} />
          <span>Seasons & Problem Bundles</span>
        </button>

        <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

        <button
          onClick={() => {
            onOpenCreateSeason();
            setIsMobileMenuOpen(false);
          }}
          className="mobile-nav-link"
        >
          <Layers size={18} color="var(--accent-primary)" />
          <span>Create New Season</span>
        </button>

        <button
          onClick={() => {
            onOpenAdminModal();
            setIsMobileMenuOpen(false);
          }}
          className="mobile-nav-link"
        >
          {isAdminUnlocked ? <ShieldCheck size={18} color="var(--color-easy)" /> : <Lock size={18} />}
          <span>{isAdminUnlocked ? 'Admin Mode (Active)' : 'Unlock Admin Mode'}</span>
        </button>

        {/* Mobile User Profile ID Form */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginTop: '6px'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} color="var(--accent-primary)" />
            <span>LeetCode Username:</span>
          </div>
          <form onSubmit={handleSaveUser} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. neetcode"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                color: 'var(--text-main)',
                fontSize: '16px',
                flex: 1,
                outline: 'none'
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 14px' }}>
              Save
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
