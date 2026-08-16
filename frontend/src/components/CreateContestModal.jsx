import React, { useState, useEffect } from 'react';
import { X, Play, Clock, Trophy, Lock, Globe, Layers, AlertCircle, Loader2 } from 'lucide-react';
import ProblemPicker from './ProblemPicker';
import { api } from '../services/api';

export default function CreateContestModal({ isOpen, onClose, onContestCreated, initialSeasonId = null }) {
  const [title, setTitle] = useState('');
  const [seasonId, setSeasonId] = useState(initialSeasonId || '');
  const [seasons, setSeasons] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(60); // Default: 60 minutes
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [hostUsername, setHostUsername] = useState('');
  
  // Mandatory Difficulty Counts (Defaults: 1 Easy, 2 Medium, 1 Hard)
  const [countEasy, setCountEasy] = useState(1);
  const [countMedium, setCountMedium] = useState(2);
  const [countHard, setCountHard] = useState(1);
  
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSeasons();
      const savedUser = localStorage.getItem('leetcompete_username') || '';
      setHostUsername(savedUser);
      setSeasonId(initialSeasonId || '');
      setDurationMinutes(60);
      setCountEasy(1);
      setCountMedium(2);
      setCountHard(1);
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
    const totalCount = countEasy + countMedium + countHard;
    
    if (totalCount === 0 && selectedProblems.length === 0) {
      setErrorMessage('Please specify at least 1 problem count (Easy, Medium, or Hard).');
      return;
    }

    if (isPrivate && !password.trim()) {
      setErrorMessage('Please provide a password for this private contest.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let finalProblems = selectedProblems;

      // If user hasn't explicitly populated problems, perform auto-draw
      if (finalProblems.length === 0) {
        if (seasonId) {
          const genRes = await api.generateSeasonRound(seasonId, {
            countEasy,
            countMedium,
            countHard,
            countTotal: totalCount
          });
          finalProblems = genRes.problems || [];
        } else {
          const catalog = await api.searchProblems({ limit: 120 });
          const easy = catalog.filter(p => p.difficulty === 'Easy').sort(() => 0.5 - Math.random()).slice(0, countEasy);
          const med = catalog.filter(p => p.difficulty === 'Medium').sort(() => 0.5 - Math.random()).slice(0, countMedium);
          const hard = catalog.filter(p => p.difficulty === 'Hard').sort(() => 0.5 - Math.random()).slice(0, countHard);
          finalProblems = [...easy, ...med, ...hard].map((p, idx) => ({ ...p, points: (idx + 1) * 100 }));
        }
      }

      const contest = await api.createContest({
        title: title.trim() || undefined,
        seasonId: seasonId || undefined,
        durationMinutes: Number(durationMinutes) || 60,
        countEasy,
        countMedium,
        countHard,
        hostUsername: hostUsername.trim() || 'Host',
        password: isPrivate ? password.trim() : undefined,
        problems: finalProblems
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
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
              <Trophy size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Host New Contest</h3>
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
                <label className="form-label">Contest Title (Optional)</label>
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
                    <Layers size={14} color="var(--accent-primary)" />
                    Season Pool
                  </span>
                </label>
                <select
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  className="form-select"
                >
                  <option value="">None (Standard LeetCode Catalog)</option>
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
                    <Clock size={14} color="var(--accent-primary)" />
                    Duration *
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.9rem' }}>
                  {isPrivate ? <Lock size={15} color="#fbbf24" /> : <Globe size={15} color="var(--color-easy)" />}
                  <span>{isPrivate ? 'Private Contest (Password Protected)' : 'Public Contest (Open to All)'}</span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {isPrivate ? 'Participants must enter password to join.' : 'Anyone with the 5-letter code can join freely.'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isPrivate && (
                  <input
                    type="text"
                    placeholder="Contest Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    style={{ width: '160px', padding: '6px 10px', fontSize: '0.825rem' }}
                    autoFocus
                  />
                )}
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className="btn btn-secondary btn-sm"
                  style={{ borderColor: isPrivate ? '#fbbf24' : 'var(--border-color)' }}
                >
                  {isPrivate ? 'Make Public' : 'Set Private'}
                </button>
              </div>
            </div>

            {/* Embedded Problem Picker */}
            <ProblemPicker
              selectedProblems={selectedProblems}
              setSelectedProblems={setSelectedProblems}
              seasonId={seasonId}
              seasonRemainingCount={selectedSeason?.remainingProblemCount}
              countEasy={countEasy}
              setCountEasy={setCountEasy}
              countMedium={countMedium}
              setCountMedium={setCountMedium}
              countHard={countHard}
              setCountHard={setCountHard}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (countEasy + countMedium + countHard === 0 && selectedProblems.length === 0)}
              className="btn btn-primary"
              style={{ minWidth: '180px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>Launching Arena...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Launch Contest Arena</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
