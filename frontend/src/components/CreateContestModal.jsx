import React, { useState, useEffect } from 'react';
import { X, Play, Clock, Trophy, Lock, Globe, Layers, AlertCircle } from 'lucide-react';
import ProblemPicker from './ProblemPicker';
import { api } from '../services/api';

export default function CreateContestModal({ isOpen, onClose, onContestCreated, initialSeasonId = null }) {
  const [title, setTitle] = useState('');
  const [seasonId, setSeasonId] = useState(initialSeasonId || '');
  const [seasons, setSeasons] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [hostUsername, setHostUsername] = useState('');
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSeasons();
      const savedUser = localStorage.getItem('leetcompete_username') || '';
      setHostUsername(savedUser);
      setSeasonId(initialSeasonId || '');
      setIsPrivate(false);
      setPassword('');
      setErrorMessage('');
    }
  }, [isOpen, initialSeasonId]);

  const loadSeasons = async () => {
    try {
      const list = await api.getSeasons();
      setSeasons(list);
    } catch (err) {
      console.error('Failed to load seasons:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProblems.length === 0) {
      setErrorMessage('Please select at least 1 problem for the contest.');
      return;
    }

    if (isPrivate && !password.trim()) {
      setErrorMessage('Please provide a password for this private contest.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const contest = await api.createContest({
        title: title.trim() || undefined,
        seasonId: seasonId || undefined,
        durationMinutes: Number(durationMinutes) || 90,
        hostUsername: hostUsername.trim() || 'Host',
        password: isPrivate ? password.trim() : undefined,
        problems: selectedProblems
      });

      if (hostUsername.trim()) {
        localStorage.setItem('leetcompete_username', hostUsername.trim().toLowerCase());
      }

      onContestCreated(contest);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create contest');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSeason = seasons.find(s => s.id === seasonId);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '820px' }}>
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
              <Trophy size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Host New Contest</h3>
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
            {errorMessage && (
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
                {errorMessage}
              </div>
            )}

            {/* Top Config Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '18px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Contest Title</label>
                <input
                  type="text"
                  placeholder={selectedSeason ? `${selectedSeason.title} Round` : "e.g. Weekly Speed Clash #1"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="var(--accent-purple)" />
                    Season Binding
                  </span>
                </label>
                <select
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  className="form-select"
                >
                  <option value="">None (Standalone Contest)</option>
                  {seasons.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.remainingProblemCount || s.totalPoolCount || 0} unseen pool problems)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="var(--accent-cyan)" />
                    Duration
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[30, 60, 90, 120].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`btn btn-sm ${durationMinutes === mins ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '8px 4px', fontSize: '0.8rem' }}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Public vs Private Contest Toggle */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.925rem' }}>
                  {isPrivate ? <Lock size={16} color="#fcd34d" /> : <Globe size={16} color="var(--color-easy)" />}
                  <span>{isPrivate ? 'Private Contest (Password Protected)' : 'Public Contest (Open to All)'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {isPrivate ? 'Participants must enter a password to join this lobby.' : 'Anyone with the lobby code can enter and solve without a password.'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isPrivate && (
                  <input
                    type="text"
                    placeholder="Enter Contest Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--accent-purple)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      width: '180px',
                      outline: 'none'
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`btn btn-sm ${isPrivate ? 'btn-secondary' : 'btn-secondary'}`}
                  style={{ borderColor: isPrivate ? '#fcd34d' : 'var(--border-color)' }}
                >
                  {isPrivate ? 'Make Public' : 'Set as Private'}
                </button>
              </div>
            </div>

            {/* Embedded Problem Picker */}
            <ProblemPicker
              selectedProblems={selectedProblems}
              setSelectedProblems={setSelectedProblems}
              seasonId={seasonId}
              seasonRemainingCount={selectedSeason?.remainingProblemCount}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedProblems.length === 0}
              className="btn btn-primary"
            >
              <Play size={16} />
              {isSubmitting ? 'Creating Contest...' : 'Launch Contest Arena'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
