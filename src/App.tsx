import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OfflineSyncProvider } from './context/OfflineSyncContext';
import { Navbar, NavTab } from './components/Navbar';
import { SportType } from './types/models';
import { HomeDashboard } from './components/HomeDashboard';
import { DiscoveryEngine } from './components/DiscoveryEngine';
import { MatchesView } from './components/MatchesView';
import { TeamManagementView } from './components/TeamManagementView';
import { TournamentInfrastructure } from './components/TournamentInfrastructure';
import { LiveMatchCenter } from './components/LiveMatchCenter';
import { RankingsView } from './components/RankingsView';
import { PlayerAnalyticsView } from './components/PlayerAnalyticsView';
import { AdminDashboard } from './components/AdminDashboard';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { EmptyState } from './components/EmptyState';
import { AuthModal } from './components/AuthModal';
import { Sports3DCanvas } from './components/3d/Sports3DCanvas';
import { GudduChatbot } from './components/GudduChatbot';
import { PWAInstallNotification } from './components/PWAInstallNotification';
import { GameArena } from './components/arena/GameArena';
import { Trophy, Shield, BarChart3, MapPin, Radio, Bell, MessageSquare } from 'lucide-react';

function AscendApp() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedSport, setSelectedSport] = useState<SportType>('cricket');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [is3DArenaOpen, setIs3DArenaOpen] = useState(false);
  const [isGlobalGudduOpen, setIsGlobalGudduOpen] = useState(false);

  const openAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleSelectSport = (sport: SportType) => {
    setSelectedSport(sport);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        selectedSport={selectedSport}
        onSelectSport={handleSelectSport}
        onOpenAuth={openAuth}
        onOpen3DArena={() => setIs3DArenaOpen(true)}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'home' && (
          <HomeDashboard
            selectedSport={selectedSport}
            onSelectSport={handleSelectSport}
            onNavigate={setCurrentTab}
            onOpenAuth={openAuth}
          />
        )}

        {currentTab === 'cricket' && (
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Left Sidebar Area: Guddu Sports Rules & Referee AI Chatbot */}
            <aside aria-label="Guddu Cricket Rules AI" className="w-full lg:w-96 lg:sticky lg:top-24 flex-shrink-0 space-y-4">
              <GudduChatbot currentSport="cricket" mode="sidebar" />
            </aside>

            {/* Right Main Arena Area */}
            <div className="flex-1 min-w-0 space-y-6 w-full">
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase text-amber-500 tracking-tight flex items-center gap-2">
                    <span>🏏</span> Cricket Arena Hub
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Batting orders, bowling economies, strike rates, overs, and match stats
                  </p>
                </div>
              </div>

              {/* 3D Cricket Pitch: Virat, Rohit, Root, Williamson, Bumrah, Starc moving with bowl and bat */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                  <span>3D Cricket Pitch: Legends in Motion</span>
                  <span>Virat, Rohit, Root, Williamson, Bumrah, Starc</span>
                </div>
                <Sports3DCanvas currentSport="cricket" opacity={0.95} />
              </div>

              <LiveMatchCenter selectedSport="cricket" onOpenAuth={() => openAuth('login')} />
            </div>
          </div>
        )}

        {currentTab === 'football' && (
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Left Sidebar Area: Guddu Sports Rules & Referee AI Chatbot */}
            <aside aria-label="Guddu Football Rules AI" className="w-full lg:w-96 lg:sticky lg:top-24 flex-shrink-0 space-y-4">
              <GudduChatbot currentSport="football" mode="sidebar" />
            </aside>

            {/* Right Main Arena Area */}
            <div className="flex-1 min-w-0 space-y-6 w-full">
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase text-emerald-500 tracking-tight flex items-center gap-2">
                    <span>⚽</span> Football Arena Hub
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Formations, tactical positions, clean sheets, goals, assists, and disciplinary cards
                  </p>
                </div>
              </div>

              {/* 3D Football Stadium: Sunil Chhetri, Messi, Neymar, Ronaldo, Ramos, and Goalkeeper */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                  <span>3D Football Stadium: World-Class Match Action</span>
                  <span>Sunil Chhetri, Messi, Neymar, Ronaldo, Ramos</span>
                </div>
                <Sports3DCanvas currentSport="football" opacity={0.95} />
              </div>

              <LiveMatchCenter selectedSport="football" onOpenAuth={() => openAuth('login')} />
            </div>
          </div>
        )}

        {/* NEARBY & PLAYERS: Powered by the Full Geospatial Discovery Engine */}
        {(currentTab === 'nearby' || currentTab === 'players') && (
          <DiscoveryEngine
            selectedSport={selectedSport}
            onOpenAuth={() => openAuth('signup')}
            onSelectSport={handleSelectSport}
          />
        )}

        {/* TEAMS: Powered by Full Team Management with Captain, Vice-Captain, and Roster Workflow */}
        {currentTab === 'teams' && (
          <TeamManagementView
            selectedSport={selectedSport}
            onOpenAuth={() => openAuth('signup')}
          />
        )}

        {currentTab === 'matches' && (
          <MatchesView selectedSport={selectedSport} filterStatus="all" />
        )}

        {/* LIVE: Full Live Match Center, Real-Time Scoring Engines & Multi-Language Commentary Feed */}
        {currentTab === 'live' && (
          <LiveMatchCenter
            selectedSport={selectedSport}
            onOpenAuth={() => openAuth('login')}
          />
        )}

        {/* TOURNAMENTS & LEAGUES: Powered by Algorithmic Fixture Generator & ICC/FIFA Points Table Engines */}
        {(currentTab === 'tournaments' || currentTab === 'leagues') && (
          <TournamentInfrastructure
            selectedSport={selectedSport}
            onOpenAuth={() => openAuth('signup')}
          />
        )}

        {currentTab === 'rankings' && (
          <RankingsView
            selectedSport={selectedSport}
            onOpenMatch={(matchId) => {
              setCurrentTab('live');
            }}
          />
        )}

        {currentTab === 'statistics' && (
          <PlayerAnalyticsView selectedSport={selectedSport} />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard />
        )}

        {currentTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-amber-500" />
                <span>Platform Alerts & Notifications</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Squad invites, match reschedule alerts, and tournament milestones
              </p>
            </div>
            <EmptyState
              icon={<Bell className="w-6 h-6 text-zinc-400" />}
              title="Inbox is clear"
              description="You have no unread notifications or fixture alerts."
            />
          </div>
        )}

        {currentTab === 'profile' && (
          <ProfileView onOpenAuth={() => openAuth('login')} />
        )}

        {currentTab === 'settings' && (
          <SettingsView />
        )}

        {/* Dedicated Game Arena Module (Umpire Center, Playable 3D Cricket, Playable 3D Football) */}
        {currentTab === 'arena' && (
          <GameArena />
        )}
      </main>

      {/* 3. Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        suggestedSport={selectedSport}
      />

      {/* 4. Fullscreen 3D Sports Arena Experience Modal */}
      {is3DArenaOpen && (
        <Sports3DCanvas
          currentSport={selectedSport}
          mode="full"
          className="fixed inset-0 z-50"
        />
      )}

      {/* 5. In-App PWA Install Notification Prompt & Shortcut Alert */}
      <PWAInstallNotification />

      {/* 6. Floating Guddu Launcher Button (When outside Cricket & Football Hubs) */}
      {currentTab !== 'cricket' && currentTab !== 'football' && (
        <button
          onClick={() => setIsGlobalGudduOpen(true)}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-zinc-950 dark:bg-zinc-900 text-white border border-amber-500/50 shadow-2xl hover:scale-105 active:scale-95 transition-all backdrop-blur-md cursor-pointer group"
          title="Ask Guddu - Multi-Game Rules Referee AI"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-emerald-400 p-0.5 flex items-center justify-center shadow-md">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <span className="text-base">🧑‍⚖️</span>
            </div>
          </div>
          <div className="text-left hidden sm:block pr-1">
            <div className="text-[11px] font-black uppercase leading-tight text-amber-400 flex items-center gap-1">
              <span>Guddu AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[10px] text-zinc-400">Game Rules & Referee</div>
          </div>
        </button>
      )}

      {/* 7. Global Guddu Modal (Summoned from Floating Launcher) */}
      {isGlobalGudduOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-2xl w-full h-[650px] relative">
            <GudduChatbot
              currentSport={selectedSport}
              mode="modal"
              onClose={() => setIsGlobalGudduOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <OfflineSyncProvider>
        <AuthProvider>
          <AscendApp />
        </AuthProvider>
      </OfflineSyncProvider>
    </ThemeProvider>
  );
}
