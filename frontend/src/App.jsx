import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import SeasonManager from './components/SeasonManager';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import LobbyArena from './components/LobbyArena';
import CreateContestModal from './components/CreateContestModal';
import CreateSeasonModal from './components/CreateSeasonModal';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import { api } from './services/api';

// ── Hash-based Router ──
// Routes: #/ (home), #/seasons, #/admin, #/lobby/CODE, ?lobby=CODE (legacy)
function parseRoute() {
  // 1. Support legacy ?lobby=CODE query param
  const params = new URLSearchParams(window.location.search);
  const legacyLobby = params.get('lobby');
  if (legacyLobby) {
    return { view: 'arena', contestCode: legacyLobby.toUpperCase() };
  }

  // 2. Parse hash route
  const hash = window.location.hash || '#/';
  if (hash.startsWith('#/lobby/')) {
    const code = hash.replace('#/lobby/', '').toUpperCase();
    return { view: 'arena', contestCode: code || null };
  }
  if (hash.startsWith('#/seasons')) return { view: 'seasons', contestCode: null };
  if (hash.startsWith('#/admin')) return { view: 'admin', contestCode: null };
  return { view: 'home', contestCode: null };
}

function setRoute(view, contestCode) {
  // Clear legacy query param if present
  if (window.location.search.includes('lobby')) {
    const url = new URL(window.location);
    url.searchParams.delete('lobby');
    window.history.replaceState({}, '', url.pathname + url.hash);
  }

  if (view === 'arena' && contestCode) {
    window.location.hash = `#/lobby/${contestCode}`;
  } else if (view === 'seasons') {
    window.location.hash = '#/seasons';
  } else if (view === 'admin') {
    window.location.hash = '#/admin';
  } else {
    window.location.hash = '#/';
  }
}

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [activeContestCode, setActiveContestCode] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [isCreateContestOpen, setIsCreateContestOpen] = useState(false);
  const [createContestSeasonId, setCreateContestSeasonId] = useState(null);
  const [isCreateSeasonOpen, setIsCreateSeasonOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Read initial route on mount
  useEffect(() => {
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      api.getMe().then(verifiedUser => {
        if (verifiedUser) setCurrentUser(verifiedUser);
      });
    }

    const { view, contestCode } = parseRoute();
    setActiveView(view);
    setActiveContestCode(contestCode);

    // Migrate legacy ?lobby= to hash route
    const params = new URLSearchParams(window.location.search);
    if (params.get('lobby')) {
      const code = params.get('lobby').toUpperCase();
      const url = new URL(window.location);
      url.searchParams.delete('lobby');
      url.hash = `#/lobby/${code}`;
      window.history.replaceState({}, '', url.pathname + url.hash);
    }
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const { view, contestCode } = parseRoute();
      setActiveView(view);
      setActiveContestCode(contestCode);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const navigateTo = useCallback((view, contestCode = null) => {
    setActiveView(view);
    setActiveContestCode(contestCode);
    setRoute(view, contestCode);
  }, []);

  const handleSelectContest = useCallback((code) => {
    navigateTo('arena', code);
  }, [navigateTo]);

  const handleBackToHome = useCallback(() => {
    navigateTo('home');
  }, [navigateTo]);

  const handleContestCreated = useCallback((contest) => {
    if (contest && contest.code) {
      // Defer to next tick to avoid React render-during-render error (#310)
      // when modal unmounts and arena view mounts simultaneously
      setTimeout(() => handleSelectContest(contest.code), 0);
    } else {
      console.warn('Contest created with missing code:', contest);
      navigateTo('home');
    }
  }, [handleSelectContest, navigateTo]);

  const handleOpenCreateContestForSeason = (seasonId) => {
    setCreateContestSeasonId(seasonId);
    setIsCreateContestOpen(true);
  };

  const handleSeasonCreated = () => {
    navigateTo('seasons');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    if (activeView === 'admin') navigateTo('home');
  };

  return (
    <div className="app-container">
      {/* Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={(view) => navigateTo(view)}
        onOpenCreateContest={() => {
          setCreateContestSeasonId(null);
          setIsCreateContestOpen(true);
        }}
        onOpenCreateSeason={() => setIsCreateSeasonOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="main-content">
        <ErrorBoundary>
          {activeView === 'home' && (
            <Home
              onSelectContest={handleSelectContest}
              onOpenCreateContest={() => {
                setCreateContestSeasonId(null);
                setIsCreateContestOpen(true);
              }}
              onOpenCreateSeason={() => setIsCreateSeasonOpen(true)}
              onNavigateSeasons={() => navigateTo('seasons')}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              currentUser={currentUser}
            />
          )}

          {activeView === 'seasons' && (
            <SeasonManager
              onSelectContest={handleSelectContest}
              onOpenCreateContestForSeason={handleOpenCreateContestForSeason}
              onOpenCreateSeason={() => setIsCreateSeasonOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              currentUser={currentUser}
            />
          )}

          {activeView === 'admin' && (
            <SuperAdminDashboard
              currentUser={currentUser}
              onNavigateContest={handleSelectContest}
            />
          )}

          {activeView === 'arena' && (
            activeContestCode ? (
              <LobbyArena
                contestCode={activeContestCode}
                onBack={handleBackToHome}
                currentUser={currentUser}
              />
            ) : (
              <Home
                onSelectContest={handleSelectContest}
                onOpenCreateContest={() => {
                  setCreateContestSeasonId(null);
                  setIsCreateContestOpen(true);
                }}
                onOpenCreateSeason={() => setIsCreateSeasonOpen(true)}
                onNavigateSeasons={() => navigateTo('seasons')}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
                currentUser={currentUser}
              />
            )
          )}
        </ErrorBoundary>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Modals */}
      <CreateContestModal
        isOpen={isCreateContestOpen}
        onClose={() => setIsCreateContestOpen(false)}
        onContestCreated={handleContestCreated}
        initialSeasonId={createContestSeasonId}
      />

      <CreateSeasonModal
        isOpen={isCreateSeasonOpen}
        onClose={() => setIsCreateSeasonOpen(false)}
        onSeasonCreated={handleSeasonCreated}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
