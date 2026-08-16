import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import SeasonManager from './components/SeasonManager';
import LobbyArena from './components/LobbyArena';
import CreateContestModal from './components/CreateContestModal';
import CreateSeasonModal from './components/CreateSeasonModal';
import AuthModal from './components/AuthModal';
import { api } from './services/api';

export default function App() {
  const [activeView, setActiveView] = useState('home'); // 'home' | 'seasons' | 'arena'
  const [activeContestCode, setActiveContestCode] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [isCreateContestOpen, setIsCreateContestOpen] = useState(false);
  const [createContestSeasonId, setCreateContestSeasonId] = useState(null);
  const [isCreateSeasonOpen, setIsCreateSeasonOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // 1. Check current logged-in user
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      api.getMe().then(verifiedUser => {
        if (verifiedUser) setCurrentUser(verifiedUser);
      });
    }

    // 2. Check direct lobby link
    const params = new URLSearchParams(window.location.search);
    const lobby = params.get('lobby');
    if (lobby) {
      setActiveContestCode(lobby.toUpperCase());
      setActiveView('arena');
    }
  }, []);

  const handleSelectContest = (code) => {
    setActiveContestCode(code);
    setActiveView('arena');
    const url = new URL(window.location);
    url.searchParams.set('lobby', code);
    window.history.pushState({}, '', url);
  };

  const handleBackToHome = () => {
    setActiveView('home');
    setActiveContestCode(null);
    const url = new URL(window.location);
    url.searchParams.delete('lobby');
    window.history.pushState({}, '', url);
  };

  const handleContestCreated = (contest) => {
    handleSelectContest(contest.code);
  };

  const handleOpenCreateContestForSeason = (seasonId) => {
    setCreateContestSeasonId(seasonId);
    setIsCreateContestOpen(true);
  };

  const handleSeasonCreated = (season) => {
    setActiveView('seasons');
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  return (
    <div className="app-container">
      {/* Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={(view) => {
          if (view !== 'arena') {
            const url = new URL(window.location);
            url.searchParams.delete('lobby');
            window.history.pushState({}, '', url);
          }
          setActiveView(view);
        }}
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
        {activeView === 'home' && (
          <Home
            onSelectContest={handleSelectContest}
            onOpenCreateContest={() => {
              setCreateContestSeasonId(null);
              setIsCreateContestOpen(true);
            }}
            onOpenCreateSeason={() => setIsCreateSeasonOpen(true)}
            onNavigateSeasons={() => setActiveView('seasons')}
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

        {activeView === 'arena' && activeContestCode && (
          <LobbyArena
            contestCode={activeContestCode}
            onBack={handleBackToHome}
            currentUser={currentUser}
          />
        )}
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
