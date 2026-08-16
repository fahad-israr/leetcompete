import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Lock, KeyRound, CheckCircle2 } from 'lucide-react';

export default function AdminAuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [passcode, setPasscode] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedPass = sessionStorage.getItem('leetcompete_admin_passcode') || localStorage.getItem('leetcompete_admin_passcode');
    const gToken = sessionStorage.getItem('leetcompete_gtoken');
    if (savedPass || gToken) {
      setIsAdminUnlocked(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    // Save admin passcode
    sessionStorage.setItem('leetcompete_admin_passcode', passcode.trim());
    localStorage.setItem('leetcompete_admin_passcode', passcode.trim());
    setIsAdminUnlocked(true);
    setError('');
    onAuthSuccess();
    onClose();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('leetcompete_admin_passcode');
    localStorage.removeItem('leetcompete_admin_passcode');
    sessionStorage.removeItem('leetcompete_gtoken');
    setIsAdminUnlocked(false);
    onAuthSuccess();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Admin Authentication</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {isAdminUnlocked ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <CheckCircle2 size={28} color="var(--color-easy)" />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px' }}>Admin Mode Active</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                You have full access to create seasons, manage 150-problem master pools, and host contests.
              </p>
              <button onClick={handleLogout} className="btn btn-danger btn-sm">
                Lock Admin Mode
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
                Enter the Admin Passcode to unlock season curriculum management and official contest creation.
              </p>

              <form onSubmit={handlePasscodeSubmit}>
                <div className="form-group">
                  <label className="form-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <KeyRound size={14} color="var(--accent-primary)" />
                      Admin Passcode
                    </span>
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. leetcompete_admin_2026"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="form-input"
                    autoFocus
                  />
                </div>

                {error && (
                  <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={!passcode.trim()} className="btn btn-primary" style={{ width: '100%' }}>
                  <Lock size={15} /> Unlock Admin Mode
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
