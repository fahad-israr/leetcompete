import React, { useState } from 'react';
import { X, Layers, Plus, Link as LinkIcon, Sparkles, AlertCircle, Loader2, LogIn, Lock } from 'lucide-react';
import { api } from '../services/api';

export default function CreateSeasonModal({ isOpen, onClose, onSeasonCreated, currentUser, onOpenAuthModal }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [poolType, setPoolType] = useState('preset-standard'); // 'preset-standard' | 'custom-urls'
  const [bulkUrls, setBulkUrls] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in or create an account to create a season.');
      return;
    }
    if (!title.trim()) {
      setError('Season title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let pool = undefined;

      if (poolType === 'custom-urls' && bulkUrls.trim()) {
        const importRes = await api.importProblemList(bulkUrls.trim());
        if (importRes && importRes.problems && importRes.problems.length > 0) {
          pool = importRes.problems;
        } else {
          throw new Error('No valid problems could be imported from the provided URL or list link.');
        }
      }

      const season = await api.createSeason({
        title: title.trim(),
        description: description.trim(),
        pool
      });

      setTitle('');
      setDescription('');
      setBulkUrls('');
      onSeasonCreated(season);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create season');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px var(--accent-orange-glow)'
            }}>
              <Layers size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Create Contest Season</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* If unauthenticated, show login prompt banner */}
            {!currentUser ? (
              <div style={{
                background: 'var(--accent-primary-light)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <Lock size={28} color="var(--accent-primary)" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  Sign In Required to Create Seasons
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Each user gets completely isolated storage for custom curricula, non-repeating problem pools, and tournament rounds.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal();
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ margin: '0 auto' }}
                >
                  <LogIn size={15} /> Sign In / Create Account
                </button>
              </div>
            ) : null}

            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: '#fb7185',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Season Title</label>
              <input
                type="text"
                placeholder="e.g. Blind 75 League / Interview Sprint"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                disabled={!currentUser}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Objective</label>
              <textarea
                placeholder="e.g. Multi-round league covering problem sets sequentially with zero question repetition."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows={2}
                disabled={!currentUser}
              />
            </div>

            {/* Problem Pool Ingestion */}
            <div className="form-group">
              <label className="form-label">Problem Pool Bundle Source</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <button
                  type="button"
                  disabled={!currentUser}
                  onClick={() => setPoolType('preset-standard')}
                  className={`btn btn-sm ${poolType === 'preset-standard' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  <Sparkles size={14} /> Standard Problem Catalog
                </button>
                <button
                  type="button"
                  disabled={!currentUser}
                  onClick={() => setPoolType('custom-urls')}
                  className={`btn btn-sm ${poolType === 'custom-urls' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  <LinkIcon size={14} /> Import List Link / URLs
                </button>
              </div>

              {poolType === 'custom-urls' && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>
                    Paste LeetCode problem URLs or slugs (one per line, comma-separated, or paste a list link):
                  </label>
                  <textarea
                    placeholder="https://leetcode.com/problem-list/a0b4xdj1/&#10;or https://leetcode.com/problems/two-sum/"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    className="form-textarea"
                    rows={4}
                    disabled={!currentUser}
                  />
                </div>
              )}
            </div>

            <div style={{
              background: 'var(--accent-primary-light)',
              border: '1px solid var(--border-glow)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.825rem',
              color: 'var(--text-main)'
            }}>
              ✨ <strong>Zero-Repetition Tracking:</strong> Contests hosted under this season will automatically partition and draw from your unused pool until all problems are covered!
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!currentUser || isSubmitting || !title.trim()}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="pulse-animation" />
                  Resolving & Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Season
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
