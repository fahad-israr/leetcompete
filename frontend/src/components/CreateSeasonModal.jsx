import React, { useState } from 'react';
import { X, Layers, Plus, Link as LinkIcon, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function CreateSeasonModal({ isOpen, onClose, onSeasonCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [poolType, setPoolType] = useState('preset-150'); // 'preset-150' | 'custom-urls'
  const [bulkUrls, setBulkUrls] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Season title is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let pool = undefined; // defaults to full 150 catalog in backend

      if (poolType === 'custom-urls' && bulkUrls.trim()) {
        const inputs = bulkUrls.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const resolved = [];
        for (const input of inputs) {
          const p = await api.resolveProblem(input);
          if (p && !resolved.some(r => r.titleSlug === p.titleSlug)) {
            resolved.push(p);
          }
        }
        if (resolved.length > 0) {
          pool = resolved;
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
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Create Contest Season</h3>
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
                placeholder="e.g. Top Interview 150 League"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / League Objective</label>
              <textarea
                placeholder="e.g. 25 rounds covering the complete 150 interview problems with 0% repetition."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows={2}
              />
            </div>

            {/* Problem Pool Ingestion */}
            <div className="form-group">
              <label className="form-label">Season Problem Pool Curriculum</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setPoolType('preset-150')}
                  className={`btn btn-sm ${poolType === 'preset-150' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  <Sparkles size={14} /> Top Interview 150 (Preset)
                </button>
                <button
                  type="button"
                  onClick={() => setPoolType('custom-urls')}
                  className={`btn btn-sm ${poolType === 'custom-urls' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  <LinkIcon size={14} /> Bulk Paste URLs
                </button>
              </div>

              {poolType === 'custom-urls' && (
                <div>
                  <textarea
                    placeholder="Paste 10, 50, or 150 LeetCode problem URLs/slugs (one per line)..."
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    className="form-textarea"
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div style={{
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.825rem',
              color: '#d8b4fe'
            }}>
              ✨ <strong>Zero-Repetition Partitioning:</strong> Once the season starts, rounds will automatically draw 4–6 problems sequentially from this pool until all problems have been covered!
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !title.trim()} className="btn btn-primary">
              <Plus size={16} />
              {isSubmitting ? 'Creating Season...' : 'Create Season'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
