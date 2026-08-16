import React, { useState } from 'react';
import { X, User, Lock, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      let result;
      if (tab === 'register') {
        result = await api.register(username.trim(), password, displayName.trim());
      } else {
        result = await api.login(username.trim(), password);
      }

      if (result.user) {
        onAuthSuccess(result.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {tab === 'login' ? (
              <LogIn size={20} color="var(--accent-primary)" />
            ) : (
              <UserPlus size={20} color="var(--accent-primary)" />
            )}
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
              {tab === 'login' ? 'Sign In to LeetCompete' : 'Create Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Auth Mode Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: tab === 'login' ? 'var(--bg-card)' : 'transparent',
              border: 'none',
              borderBottom: tab === 'login' ? '2px solid var(--accent-primary)' : 'none',
              color: tab === 'login' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px',
              background: tab === 'register' ? 'var(--bg-card)' : 'transparent',
              border: 'none',
              borderBottom: tab === 'register' ? '2px solid var(--accent-primary)' : 'none',
              color: tab === 'register' ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              color: 'var(--color-hard)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <User size={13} style={{ display: 'inline', marginRight: '4px' }} />
              LeetCode Username / Handle
            </label>
            <input
              type="text"
              placeholder="e.g. neetcode"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              autoFocus
              required
            />
          </div>

          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">
                Display Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">
              <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : tab === 'login' ? (
              <>Sign In <ArrowRight size={16} /></>
            ) : (
              <>Register & Start <ArrowRight size={16} /></>
            )}
          </button>

          <p style={{ fontSize: '0.775rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '14px', lineHeight: 1.4 }}>
            Each account provides isolated storage for your custom problem curricula, rounds, and contest history.
          </p>
        </form>
      </div>
    </div>
  );
}
