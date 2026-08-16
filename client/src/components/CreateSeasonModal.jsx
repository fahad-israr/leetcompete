import React, { useState } from 'react';
import { X, Layers, Plus, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function CreateSeasonModal({ isOpen, onClose, onSeasonCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      const season = await api.createSeason({
        title: title.trim(),
        description: description.trim()
      });
      setTitle('');
      setDescription('');
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
      <div className="modal-content" style={{ maxWidth: '550px' }}>
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Create Contest Season</h3>
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
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: '#f87171',
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
                placeholder="e.g. Spring 2026 Competitive League"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Rules (Optional)</label>
              <textarea
                placeholder="e.g. 10 weekly rounds. No problem is ever repeated across the season. Top 3 receive awards."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                rows={3}
              />
            </div>

            <div style={{
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.825rem',
              color: '#d8b4fe'
            }}>
              💡 <strong>How Seasons Work:</strong> Every contest in this season shares a problem registry. When generating or picking problems for future rounds, previously used problems are strictly barred from repeating!
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !title.trim()} className="btn btn-primary">
              <Plus size={16} />
              {isSubmitting ? 'Creating...' : 'Create Season'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
