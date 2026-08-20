import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Layers,
  Trophy,
  Activity,
  MessageSquare,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Lock,
  Globe,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Trash2,
  AlertTriangle,
  Check,
  X,
  UserCheck,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

export default function SuperAdminDashboard({ currentUser, onNavigateContest }) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('organizers');
  const [searchQuery, setSearchQuery] = useState('');

  // Mutation & Modal States
  const [confirmModal, setConfirmModal] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to load superadmin analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExportJSON = () => {
    if (!analytics) return;
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leetcompete_analytics_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerifyUser = async (username) => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await api.adminVerifyUser(username);
      setFeedback({ type: 'success', text: res.message || `Organizer @${username} verified successfully.` });
      await loadAnalytics();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || `Failed to verify @${username}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!confirmModal) return;
    setIsProcessing(true);
    setFeedback(null);

    const { type, target } = confirmModal;
    try {
      if (type === 'user') {
        const res = await api.adminDeleteUser(target.username);
        setFeedback({ type: 'success', text: res.message || `Organizer @${target.username} deleted.` });
      } else if (type === 'season') {
        const res = await api.adminDeleteSeason(target.id);
        setFeedback({ type: 'success', text: res.message || `Season "${target.title}" deleted.` });
      } else if (type === 'contest') {
        const res = await api.adminDeleteContest(target.id || target.code);
        setFeedback({ type: 'success', text: res.message || `Contest ${target.code} deleted.` });
      }
      setConfirmModal(null);
      await loadAnalytics();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Delete operation failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-dim)' }}>
        <RefreshCw size={28} className="spin-animation" style={{ marginBottom: '16px', color: 'var(--accent-primary)' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Loading Superadmin Analytics & Infrastructure Metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ maxWidth: '600px', margin: '40px auto', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚫</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '8px' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{error}</p>
        <button onClick={loadAnalytics} className="btn btn-primary btn-sm">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const { stats, organizers = [], seasons = [], contests = [], recentSubmissions = [] } = analytics || {};

  const filteredOrganizers = organizers.filter(o =>
    (o.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.displayName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSeasons = seasons.filter(s =>
    (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.ownerUsername || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContests = contests.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.hostUsername || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
              fontWeight: '800',
              fontSize: '0.75rem',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Super Admin
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Connected as <strong style={{ color: 'var(--text-main)' }}>@{currentUser?.username}</strong>
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={26} color="var(--accent-primary)" />
            Platform Analytics & Control Center
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={loadAnalytics} className="btn btn-secondary btn-sm" title="Refresh Live Metrics">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExportJSON} className="btn btn-primary btn-sm" title="Export Analytics Dump">
            <Download size={14} /> Export Dump
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: feedback.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Metric 1: Organizers */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Registered Organizers</span>
            <Users size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
            {stats?.totalOrganizers || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-easy)' }}>
            ✓ {stats?.verifiedOrganizers || 0} Email Verified
          </div>
        </div>

        {/* Metric 2: Seasons */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Curriculum Seasons</span>
            <Layers size={18} color="#a78bfa" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
            {stats?.totalSeasons || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Active problem bundles
          </div>
        </div>

        {/* Metric 3: Contests */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Contests</span>
            <Trophy size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
            {stats?.totalContests || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
            ⚡ {stats?.activeContests || 0} Active / Waiting
          </div>
        </div>

        {/* Metric 4: AC Solves */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Verified AC Solves</span>
            <Activity size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
            {stats?.totalSubmissions || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            LeetCode GraphQL verified
          </div>
        </div>

        {/* Metric 5: Chat Messages */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Lobby Messages</span>
            <MessageSquare size={18} color="#ec4899" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
            {stats?.totalMessages || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Live room interactions
          </div>
        </div>
      </div>

      {/* Main Analytics Container */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        
        {/* Navigation & Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}>
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
            <button
              onClick={() => { setActiveTab('organizers'); setSearchQuery(''); }}
              className={`tab-btn ${activeTab === 'organizers' ? 'active' : ''}`}
            >
              👥 Organizers ({organizers.length})
            </button>
            <button
              onClick={() => { setActiveTab('seasons'); setSearchQuery(''); }}
              className={`tab-btn ${activeTab === 'seasons' ? 'active' : ''}`}
            >
              🏆 Seasons ({seasons.length})
            </button>
            <button
              onClick={() => { setActiveTab('contests'); setSearchQuery(''); }}
              className={`tab-btn ${activeTab === 'contests' ? 'active' : ''}`}
            >
              ⚔️ Contests ({contests.length})
            </button>
            <button
              onClick={() => { setActiveTab('submissions'); setSearchQuery(''); }}
              className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
            >
              ⚡ Recent Solves ({recentSubmissions.length})
            </button>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Tab 1: Registered Organizers Table */}
        {activeTab === 'organizers' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Organizer / Username</th>
                  <th>Registered Email</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Seasons</th>
                  <th>Contests</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganizers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                      No registered organizers found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredOrganizers.map((org) => {
                    const isRootSuper = org.username?.toLowerCase() === 'fahad00cms' || org.email?.toLowerCase() === 'fahad00cms@gmail.com';
                    return (
                      <tr key={org.username}>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>@{org.username}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{org.displayName}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa', fontWeight: '500' }}>
                            {org.email}
                          </span>
                        </td>
                        <td>
                          {org.isVerified ? (
                            <span className="badge badge-easy" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={11} /> Verified
                            </span>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} /> Unverified
                              </span>
                              <button
                                type="button"
                                onClick={() => handleVerifyUser(org.username)}
                                disabled={isProcessing}
                                className="btn btn-sm"
                                style={{
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10b981',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  padding: '2px 8px',
                                  fontSize: '0.75rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  cursor: 'pointer'
                                }}
                                title="Mark email verified immediately"
                              >
                                <UserCheck size={11} /> Verify
                              </button>
                            </div>
                          )}
                        </td>
                        <td>
                          {org.role === 'superadmin' ? (
                            <span className="badge" style={{ background: '#f59e0b', color: '#000', fontWeight: '700' }}>
                              👑 Super Admin
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                              Organizer
                            </span>
                          )}
                        </td>
                        <td>
                          <strong>{org.seasonsCount}</strong>
                        </td>
                        <td>
                          <strong>{org.contestsCount}</strong>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {org.createdAt ? new Date(org.createdAt * 1000).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isRootSuper ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Protected</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmModal({
                                type: 'user',
                                target: org,
                                title: `Permanently Delete @${org.username}`,
                                message: `Are you sure you want to delete organizer @${org.username}? This will CASCADE and permanently remove the user, their ${org.seasonsCount} seasons, ${org.contestsCount} contests, and all linked submissions from DynamoDB.`
                              })}
                              disabled={isProcessing}
                              className="btn btn-danger btn-sm"
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                              }}
                              title="Delete user and all associated data"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Seasons & Curricula Table */}
        {activeTab === 'seasons' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Season Title</th>
                  <th>Owner / Creator</th>
                  <th>Curriculum Pool</th>
                  <th>Problems Used</th>
                  <th>Rounds Played</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSeasons.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                      No seasons found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredSeasons.map((season) => (
                    <tr key={season.id}>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>{season.title}</strong>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>{season.id}</div>
                      </td>
                      <td>
                        <span style={{ color: '#60a5fa' }}>@{season.ownerUsername}</span>
                      </td>
                      <td>
                        <strong>{season.poolCount}</strong> questions
                      </td>
                      <td>
                        <span style={{ color: 'var(--color-easy)', fontWeight: '600' }}>{season.usedCount}</span> / {season.poolCount}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          ({Math.round((season.usedCount / (season.poolCount || 1)) * 100)}%)
                        </span>
                      </td>
                      <td>
                        <strong>{season.roundsCount}</strong> rounds
                      </td>
                      <td>
                        <span className={`badge badge-${season.status === 'ACTIVE' ? 'easy' : 'hard'}`}>
                          {season.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setConfirmModal({
                            type: 'season',
                            target: season,
                            title: `Permanently Delete Season "${season.title}"`,
                            message: `Are you sure you want to delete this season? This will CASCADE and permanently remove the season, all ${season.roundsCount} linked contest rounds, and all associated submissions from DynamoDB.`
                          })}
                          disabled={isProcessing}
                          className="btn btn-danger btn-sm"
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                          title="Delete season and linked contest rounds"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Contests & Matches Table */}
        {activeTab === 'contests' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Lobby Code</th>
                  <th>Match Title</th>
                  <th>Host</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Participants</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContests.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                      No contests found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredContests.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa', fontWeight: '700', letterSpacing: '0.05em' }}>
                          {c.code}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>{c.title}</strong>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)' }}>@{c.hostUsername}</span>
                      </td>
                      <td>
                        {c.isPrivate ? (
                          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Lock size={11} /> Private
                          </span>
                        ) : (
                          <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Globe size={11} /> Public
                          </span>
                        )}
                      </td>
                      <td>
                        <span>{c.durationMinutes}m</span>
                        {c.extendedMinutes > 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '700', marginLeft: '4px' }}>
                            (+{c.extendedMinutes}m)
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${c.status === 'IN_PROGRESS' ? 'easy' : c.status === 'WAITING' ? 'blue' : 'hard'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <strong>{c.participantCount}</strong> players
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => onNavigateContest && onNavigateContest(c.code)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            View <ExternalLink size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmModal({
                              type: 'contest',
                              target: c,
                              title: `Permanently Delete Contest "${c.title}" (${c.code})`,
                              message: `Are you sure you want to delete contest ${c.code}? This will permanently remove the match, all player submissions, and chat history from DynamoDB.`
                            })}
                            disabled={isProcessing}
                            className="btn btn-danger btn-sm"
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                            title="Delete contest and submissions"
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Recent Solves Table */}
        {activeTab === 'submissions' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th>Competitor Handle</th>
                  <th>Problem Solved</th>
                  <th>Points</th>
                  <th>Penalty</th>
                  <th>Verified Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                      No recent submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentSubmissions.map((sub) => (
                    <tr key={sub.id || sub.submissionId}>
                      <td>
                        <strong style={{ color: 'var(--color-easy)' }}>@{sub.username}</strong>
                      </td>
                      <td>
                        <span>{sub.problemTitle || sub.problemSlug}</span>
                      </td>
                      <td>
                        <span className="badge badge-easy">+{sub.points} pts</span>
                      </td>
                      <td>
                        <span>{sub.penaltyMinutes}m</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {sub.verifiedAt ? new Date(sub.verifiedAt * 1000).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Confirmation & Cascade Impact Modal */}
      {confirmModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '90%',
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '2px' }}>
                  {confirmModal.title}
                </h3>
                <span style={{ fontSize: '0.775rem', color: '#ef4444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Permanent DynamoDB Cascade Deletion
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
              {confirmModal.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={isProcessing}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isProcessing}
                className="btn btn-danger"
                style={{
                  background: '#ef4444',
                  borderColor: '#dc2626',
                  color: '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '700'
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={15} className="spin-animation" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Yes, Hard Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
