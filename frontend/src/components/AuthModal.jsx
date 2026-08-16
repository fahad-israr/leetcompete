import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, ArrowRight, UserPlus, LogIn, AlertCircle, KeyRound, RotateCcw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  // 'login' | 'register' | 'verify' | 'forgot' | 'reset'
  const [view, setView] = useState('login');
  
  const [identifier, setIdentifier] = useState(''); // Email or Username for Login
  const [email, setEmail] = useState(''); // Email for Register
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

  // 1. Submit Registration (Email & Password Only Required)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      return setError('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    resetMessages();
    setIsLoading(true);

    try {
      const res = await api.register({
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined
      });
      if (res.requiresVerification) {
        setPendingUsername(res.username || email.trim().toLowerCase());
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

  // 2. Submit Login (Email OR Username + Password)
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      return setError('Email/Username and password are required.');
    }

    resetMessages();
    setIsLoading(true);

    try {
      const res = await api.login(identifier.trim(), password);
      if (res.user) {
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      if (err.message?.includes('verify your email')) {
        setPendingUsername(identifier.trim().toLowerCase());
        setPendingEmail(identifier.trim());
        setView('verify');
        setError('Please enter the verification code sent to your email.');
      } else {
        setError(err.message || 'Invalid email/username or password.');
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
      const res = await api.verifyEmail(pendingUsername || pendingEmail, otpCode.trim());
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
      const res = await api.resendCode(pendingUsername || pendingEmail);
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
    if (!identifier.trim()) return setError('Enter your email or username.');

    resetMessages();
    setIsLoading(true);

    try {
      const res = await api.forgotPassword(identifier.trim());
      setPendingUsername(res.username || identifier.trim());
      setView('reset');
      setSuccessMsg('Reset code sent to your email address.');
    } catch (err) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Submit Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      return setError('Please enter the 6-digit reset code.');
    }
    if (!newPassword || newPassword.length < 6) {
      return setError('New password must be at least 6 characters.');
    }

    resetMessages();
    setIsLoading(true);

    try {
      await api.resetPassword(pendingUsername, resetCode.trim(), newPassword);
      setView('login');
      setSuccessMsg('Password reset successful! Please sign in with your new password.');
    } catch (err) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px var(--accent-orange-glow)'
            }}>
              {view === 'verify' ? <ShieldCheck size={18} color="#fff" /> : <KeyRound size={18} color="#fff" />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>
                {view === 'login' && 'Organizer Sign In'}
                {view === 'register' && 'Create Organizer Account'}
                {view === 'verify' && 'Verify Email Address'}
                {view === 'forgot' && 'Reset Password'}
                {view === 'reset' && 'Set New Password'}
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {view === 'login' && 'Manage your seasons & custom contest tracks'}
                {view === 'register' && 'Only email & password needed to get started'}
                {view === 'verify' && 'Check your inbox for 6-digit OTP code'}
                {view === 'forgot' && 'We will send a reset code to your email'}
                {view === 'reset' && 'Enter reset code and choose a new password'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Navigation Tabs (Sign In / Create Account) */}
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
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LogIn size={15} /> Sign In
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
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <UserPlus size={15} /> Create Account
            </button>
          </div>
        )}

        <div className="modal-body">
          {/* Notifications */}
          {error && (
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
                  <Mail size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Email Address or Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. you@example.com or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
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
                disabled={isLoading || !identifier.trim() || !password}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {isLoading ? 'Signing In...' : <>Sign In <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* VIEW 2: CREATE ACCOUNT (Email + Password Only Required) */}
          {view === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="e.g. you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  autoFocus
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', display: 'block' }}>
                  A 6-digit verification code will be sent to this email.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
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

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {isLoading ? 'Creating Account...' : <>Create Account <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* VIEW 3: 6-DIGIT EMAIL OTP VERIFICATION */}
          {view === 'verify' && (
            <form onSubmit={handleVerifyCode}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Enter the 6-digit verification code sent to:
                </p>
                <div style={{ fontWeight: '700', color: 'var(--accent-primary)', fontSize: '0.95rem', marginTop: '2px' }}>
                  {pendingEmail || pendingUsername}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="form-input"
                  style={{
                    fontSize: '1.6rem',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    color: 'var(--accent-primary)',
                    padding: '12px'
                  }}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.trim().length !== 6}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginBottom: '14px' }}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => { setView('login'); resetMessages(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  ← Back to Sign In
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || isLoading}
                  onClick={handleResendCode}
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
                  <RotateCcw size={12} />
                  {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 4: FORGOT PASSWORD */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">
                  <Mail size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Enter your Email Address or Username
                </label>
                <input
                  type="text"
                  placeholder="e.g. you@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="form-input"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !identifier.trim()}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginBottom: '14px' }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setView('login'); resetMessages(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer' }}
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
                <label className="form-label">6-Digit Reset Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="form-input"
                  style={{
                    fontSize: '1.4rem',
                    letterSpacing: '6px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700'
                  }}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">
                  <Lock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || resetCode.trim().length !== 6 || !newPassword}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', marginBottom: '14px' }}
              >
                {isLoading ? 'Updating...' : 'Set New Password'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setView('login'); resetMessages(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
