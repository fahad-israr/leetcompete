import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import SeasonManager from './components/SeasonManager';
import LobbyArena from './components/LobbyArena';
import CreateContestModal from './components/CreateContestModal';
import CreateSeasonModal from './components/CreateSeasonModal';

export default function App() {
  const [activeView, setActiveView] = useState('home'); // 'home' | 'seasons' | 'arena'
  const [activeContestCode, setActiveContestCode] = useState(null);
  
  const [isCreateContestOpen, setIsCreateContestOpen] = useState(false);
  const [createContestSeasonId, setCreateContestSeasonId] = useState(null);
  const [isCreateSeasonOpen, setIsCreateSeasonOpen] = useState(false);

  // Check URL search params for direct lobby links (?lobby=55OH7)
  useEffect(() => {
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
    // Update browser URL without reload
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

  return (
    <div className="app-container">
      {/* Top Navbar */}
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
      />

      {/* Main Content Body */}
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
          />
        )}

        {activeView === 'seasons' && (
          <SeasonManager
            onSelectContest={handleSelectContest}
            onOpenCreateContestForSeason={handleOpenCreateContestForSeason}
            onOpenCreateSeason={() => setIsCreateSeasonOpen(true)}
          />
        )}

        {activeView === 'arena' && activeContestCode && (
          <LobbyArena
            contestCode={activeContestCode}
            onBack={handleBackToHome}
          />
        )}
      </main>

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
      />
    </div>
  );
}
