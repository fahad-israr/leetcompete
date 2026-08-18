import React, { useState, useEffect } from 'react';
import { Flame, PlusCircle, Compass, Layers, User, LogIn, LogOut, Sun, Moon, Menu, X, Check } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({
  activeView,
  setActiveView,
  onOpenCreateContest,
  onOpenCreateSeason,
  onOpenAuthModal,
  currentUser,
  onLogout
}) {
  const [theme, setTheme] = useState('light');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('leetcompete_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('leetcompete_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
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
            My Seasons & Bundles
          </button>

          {(currentUser?.role === 'superadmin' || (currentUser?.username || '').toLowerCase() === 'fahad00cms') && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`tab-btn ${activeView === 'admin' ? 'active' : ''}`}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                color: activeView === 'admin' ? '#000' : '#f59e0b',
                background: activeView === 'admin' ? '#f59e0b' : 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                fontWeight: '700'
              }}
            >
              👑 Admin Dashboard
            </button>
          )}
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

        {/* Desktop New Season Button */}
        <button
          onClick={onOpenCreateSeason}
          className="btn btn-secondary btn-sm desktop-only-controls"
        >
          <Layers size={14} color="var(--accent-primary)" />
          <span>New Season</span>
        </button>

        {/* Quick Host Button */}
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

        {/* Desktop User Account Badge / Auth Trigger */}
        {currentUser ? (
          <div className="desktop-only-controls" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '4px 10px',
              gap: '6px'
            }}>
              <div style={{
                background: 'var(--accent-primary-light)',
                color: 'var(--accent-primary)',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '800'
              }}>
                {(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-main)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{currentUser.username}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 8px', color: 'var(--text-dim)' }}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="btn btn-secondary btn-sm desktop-only-controls"
            style={{ borderColor: 'var(--accent-primary)', color: 'var(--text-main)' }}
          >
            <LogIn size={14} color="var(--accent-primary)" />
            <span>Sign In</span>
          </button>
        )}

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
          <span>My Seasons & Problem Bundles</span>
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

        {/* Mobile Account Section */}
        {currentUser ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'var(--accent-primary-light)',
                color: 'var(--accent-primary)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: '800'
              }}>
                {(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {currentUser.displayName || currentUser.username}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  @{currentUser.username}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="btn btn-danger btn-sm"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              onOpenAuthModal();
              setIsMobileMenuOpen(false);
            }}
            className="mobile-nav-link"
            style={{ color: 'var(--accent-primary)', borderColor: 'var(--border-glow)' }}
          >
            <LogIn size={18} />
            <span>Sign In / Create Account</span>
          </button>
        )}
      </div>
    </nav>
  );
}
