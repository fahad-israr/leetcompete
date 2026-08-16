import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, ArrowRight, UserPlus, LogIn, AlertCircle, KeyRound, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  // 'login' | 'register' | 'verify' | 'forgot' | 'reset'
  const [view, setView] = useState('login');
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [pendingUsername, setPendingUsername] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  
  // Reset Password state
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  // 1. Submit Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim()) return setError('Please enter a username.');
    if (!password) return setError('Please enter a password.');

    resetMessages();
    setIsLoading(true);

    try {
      const res = await api.register(username.trim(), email.trim(), password, displayName.trim());
      if (res.requiresVerification) {
        setPendingUsername(username.trim().toLowerCase());
        setPendingEmail(email.trim());
        setView('verify');
        setSuccessMsg(`Verification code sent to ${email.trim()}.`);
        setCooldown(60);
      } else if (res.user) {
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Submit Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return setError('Username and password are required.');

    resetMessages();
    setIsLoading(true);

    try {
      const res = await api.login(username.trim(), password);
      if (res.user) {
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      if (err.message?.includes('verify your email')) {
        setPendingUsername(username.trim().toLowerCase());
        setView('verify');
        setError('Please enter the verification code sent to your email.');
      } else {
        setError(err.message || 'Invalid username or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Submit 6-Digit Email Verification Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      return setError('Please enter the 6-digit verification code.');
    }

    resetMessages();
    setIsLoading(true);

    try {
      const res = await api.verifyEmail(pendingUsername, otpCode.trim());
      if (res.user) {
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Resend Verification Code (Rate Limited 10 per 12h)
  const handleResendCode = async () => {
    if (cooldown > 0) return;
    resetMessages();
    setIsLoading(true);

    try {
      const res = await api.resendCode(pendingUsername);
      setSuccessMsg(res.message || 'New verification code sent!');
      setCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Submit Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!username.trim() && !email.trim()) return setError('Enter your username or email.');

    resetMessages();
    setIsLoading(true);

    try {
      const target = email.trim() || username.trim();
      const res = await api.forgotPassword(target);
      setPendingUsername(res.username || target);
      setView('reset');
      setSuccessMsg(res.message || 'Password reset code sent to your email.');
      setCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Submit Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword) return setError('All fields are required.');

    resetMessages();
    setIsLoading(true);

    try {
      const res = await api.resetPassword(pendingUsername, resetCode.trim(), newPassword);
      setSuccessMsg(res.message);
      setView('login');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Password reset failed.');
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
            {view === 'login' && <LogIn size={20} color="var(--accent-primary)" />}
            {view === 'register' && <UserPlus size={20} color="var(--accent-primary)" />}
            {view === 'verify' && <ShieldCheck size={20} color="var(--color-easy)" />}
            {(view === 'forgot' || view === 'reset') && <KeyRound size={20} color="var(--accent-primary)" />}

            <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
              {view === 'login' && 'Sign In to LeetCompete'}
              {view === 'register' && 'Create Account'}
              {view === 'verify' && 'Verify Your Email'}
              {view === 'forgot' && 'Reset Password'}
              {view === 'reset' && 'Enter New Password'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher (Only on login / register views) */}
        {(view === 'login' || view === 'register') && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
            <button
              type="button"
              onClick={() => { setView('login'); resetMessages(); }}
              style={{
                flex: 1,
                padding: '12px',
                background: view === 'login' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                borderBottom: view === 'login' ? '2px solid var(--accent-primary)' : 'none',
                color: view === 'login' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setView('register'); resetMessages(); }}
              style={{
                flex: 1,
                padding: '12px',
                background: view === 'register' ? 'var(--bg-card)' : 'transparent',
                border: 'none',
                borderBottom: view === 'register' ? '2px solid var(--accent-primary)' : 'none',
                color: view === 'register' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body">
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

          {successMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              color: 'var(--color-easy)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW 1: SIGN IN */}
          {view === 'login' && (
            <form onSubmit={handleLogin}>
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

              <div className="form-group" style={{ marginBottom: '8px' }}>
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

              <div style={{ textAlign: 'right', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => { setView('forgot'); resetMessages(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim() || !password}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {isLoading ? 'Signing In...' : <>Sign In <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* VIEW 2: CREATE ACCOUNT */}
          {view === 'register' && (
            <form onSubmit={handleRegister}>
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

              <div className="form-group">
                <label className="form-label">
                  <Mail size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Email Address (For Verification & Password Recovery)
                </label>
                <input
                  type="email"
                  placeholder="e.g. user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

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
                disabled={isLoading || !username.trim() || !password || !email.trim()}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {isLoading ? 'Creating Account...' : <>Send Verification Code <ArrowRight size={16} /></>}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <ShieldCheck size={13} color="var(--color-easy)" />
                <span>Rate limited to 10 verification requests per 12 hours.</span>
              </div>
            </form>
          )}

          {/* VIEW 3: 6-DIGIT OTP VERIFICATION SCREEN */}
          {view === 'verify' && (
            <form onSubmit={handleVerifyCode}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  background: 'var(--accent-primary-light)',
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <Mail size={26} color="var(--accent-primary)" />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '4px' }}>
                  Check Your Inbox
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  We sent a 6-digit code to <strong>{pendingEmail || `@${pendingUsername}`}</strong>
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ textAlign: 'center' }}>
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="form-input"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.8rem',
                    letterSpacing: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    color: 'var(--accent-primary)'
                  }}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginBottom: '12px' }}
              >
                {isLoading ? 'Verifying...' : 'Verify & Log In'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                <button
                  type="button"
                  onClick={() => { setView('register'); resetMessages(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  ← Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading || cooldown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: cooldown > 0 ? 'var(--text-dim)' : 'var(--accent-primary)',
                    cursor: cooldown > 0 ? 'default' : 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={13} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 4: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">
                  Your Username or Verified Email
                </label>
                <input
                  type="text"
                  placeholder="e.g. neetcode or user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginBottom: '12px' }}
              >
                {isLoading ? 'Sending Code...' : 'Send Password Reset Code'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setView('login'); resetMessages(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.825rem', cursor: 'pointer' }}
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* VIEW 5: RESET PASSWORD */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">
                  6-Digit Reset Code (From Email)
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="form-input"
                  style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.2rem', letterSpacing: '4px' }}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !resetCode.trim() || !newPassword}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginBottom: '12px' }}
              >
                {isLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
