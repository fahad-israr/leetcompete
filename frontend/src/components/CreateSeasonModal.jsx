import React, { useState } from 'react';
import { X, Layers, Plus, Link as LinkIcon, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function CreateSeasonModal({ isOpen, onClose, onSeasonCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [poolType, setPoolType] = useState('preset-standard'); // 'preset-standard' | 'custom-urls'
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
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '620px' }}>
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
                placeholder="e.g. Blind 75 League / Interview Sprint"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
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
              />
            </div>

            {/* Problem Pool Ingestion */}
            <div className="form-group">
              <label className="form-label">Problem Pool Bundle Source</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setPoolType('preset-standard')}
                  className={`btn btn-sm ${poolType === 'preset-standard' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  <Sparkles size={14} /> Standard Problem Catalog
                </button>
                <button
                  type="button"
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
                    placeholder="https://leetcode.com/problems/two-sum/&#10;https://leetcode.com/problems/add-two-numbers/&#10;https://leetcode.com/problems/trapping-rain-water/"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    className="form-textarea"
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.825rem',
              color: '#93c5fd'
            }}>
              ✨ <strong>Zero-Repetition Partitioning:</strong> Contests hosted under this season will automatically draw problems from the unused pool until all problems are covered!
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !title.trim()} className="btn btn-primary">
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
