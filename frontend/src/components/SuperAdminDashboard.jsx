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
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function SuperAdminDashboard({ currentUser, onNavigateContest }) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('organizers');
  const [searchQuery, setSearchQuery] = useState('');

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
              👑 Super Admin
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }}>
              Platform Analytics & Control Center
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Real-time telemetry on registered organizers, email verification states, curricula leagues, active matches, and AC submissions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={loadAnalytics} className="btn btn-secondary btn-sm" title="Refresh Live Metrics">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExportJSON} className="btn btn-primary btn-sm" style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: '700' }}>
            <Download size={14} /> Export JSON
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* Card 1 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>Registered Organizers</span>
            <Users size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {stats?.totalOrganizers || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-easy)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> {stats?.verifiedOrganizers || 0} Email Verified
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Season Leagues</span>
            <Layers size={18} color="#a855f7" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {stats?.totalSeasons || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Curricula tracking pools
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>Matches & Contests</span>
            <Trophy size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {stats?.totalContests || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '4px' }}>
            {stats?.activeContests || 0} Active / Waiting
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>AC Solves Verified</span>
            <Activity size={18} color="var(--color-easy)" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {stats?.totalSubmissions || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            LeetCode GraphQL verified
          </div>
        </div>

        {/* Card 5 */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: '600' }}>Chat Messages</span>
            <MessageSquare size={18} color="#ec4899" />
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {stats?.totalMessages || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Live arena interaction
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
                </tr>
              </thead>
              <tbody>
                {filteredOrganizers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                      No registered organizers found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredOrganizers.map((org) => (
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
                          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={11} /> Unverified
                          </span>
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
                    </tr>
                  ))
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
                </tr>
              </thead>
              <tbody>
                {filteredSeasons.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
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
                  <th>Action</th>
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
                      <td>
                        <button
                          type="button"
                          onClick={() => onNavigateContest && onNavigateContest(c.code)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          View <ExternalLink size={12} />
                        </button>
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
    </div>
  );
}
