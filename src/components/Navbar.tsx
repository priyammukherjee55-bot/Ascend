import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOfflineSync } from '../context/OfflineSyncContext';
import { OfflineSyncModal } from './OfflineSyncModal';
import { PWAInstallNavbarButton } from './PWAInstallNotification';
import { CodebaseDownloadModal } from './CodebaseDownloadModal';
import { SportType } from '../types/models';
import {
  Sun,
  Moon,
  Flame,
  User,
  Shield,
  LogOut,
  MapPin,
  Trophy,
  Users,
  Compass,
  Radio,
  BarChart3,
  Bell,
  Settings,
  LogIn,
  Search,
  ChevronDown,
  Wifi,
  WifiOff,
  Sparkles,
  Box,
  Gamepad2,
  FolderArchive,
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'cricket'
  | 'football'
  | 'nearby'
  | 'players'
  | 'teams'
  | 'matches'
  | 'live'
  | 'tournaments'
  | 'leagues'
  | 'rankings'
  | 'statistics'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'admin'
  | 'arena';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  selectedSport: SportType;
  onSelectSport: (sport: SportType) => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onOpen3DArena?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  selectedSport,
  onSelectSport,
  onOpenAuth,
  onOpen3DArena,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userProfile, logout } = useAuth();
  const { isOnline, isSyncing, queuedActionsCount } = useOfflineSync();
  const [offlineModalOpen, setOfflineModalOpen] = useState(false);
  const [isCodebaseModalOpen, setIsCodebaseModalOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'Home', icon: <Flame className="w-4 h-4" /> },
    { id: 'cricket', label: 'Cricket', icon: <span className="text-xs">🏏</span> },
    { id: 'football', label: 'Football', icon: <span className="text-xs">⚽</span> },
    { id: 'nearby', label: 'Nearby', icon: <MapPin className="w-4 h-4" /> },
    { id: 'players', label: 'Players', icon: <User className="w-4 h-4" /> },
    { id: 'teams', label: 'Teams', icon: <Users className="w-4 h-4" /> },
    { id: 'matches', label: 'Matches', icon: <Compass className="w-4 h-4" /> },
    { id: 'live', label: 'Live', icon: <Radio className="w-4 h-4 text-rose-500 animate-pulse" />, badge: 'LIVE' },
    { id: 'tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" /> },
    { id: 'leagues', label: 'Leagues', icon: <Shield className="w-4 h-4" /> },
    { id: 'rankings', label: 'Rankings', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'statistics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'arena', label: 'Game Arena', icon: <Gamepad2 className="w-4 h-4 text-emerald-500" />, badge: '3D PLAY' },
    { id: 'admin', label: 'Admin', icon: <Shield className="w-4 h-4 text-rose-500" />, badge: userProfile?.role === 'admin' ? 'SECURE' : undefined },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors bg-white/90 dark:bg-zinc-950/90 border-zinc-200 dark:border-zinc-800">
      {/* Top Bar: Brand, Sport Context, Search, Theme, Auth */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Sport Pills */}
          <div className="flex items-center gap-6">
            <div
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                  <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-cyan-300 text-sm tracking-tighter">
                    ASC
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-widest text-zinc-900 dark:text-white uppercase font-sans leading-none">
                  ASCEND
                </span>
                <span className="text-[10px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                  Sports Platform
                </span>
              </div>
            </div>

            {/* Sport Context Switcher Quick Selector */}
            <div className="hidden md:flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold">
              <button
                onClick={() => {
                  onSelectSport('cricket');
                  onSelectTab('cricket');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  selectedSport === 'cricket'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>🏏</span>
                <span>Cricket</span>
              </button>
              <button
                onClick={() => {
                  onSelectSport('football');
                  onSelectTab('football');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  selectedSport === 'football'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span>⚽</span>
                <span>Football</span>
              </button>
            </div>
          </div>

          {/* Right Controls: Offline Sync, 3D Arena, Theme Toggle, Notifications, User/Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Offline Sync Status Badge & Modal Trigger */}
            <button
              onClick={() => setOfflineModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                isOnline
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-amber-500/40 bg-amber-500/15 text-amber-500 animate-pulse hover:bg-amber-500/25'
              }`}
              title={
                isOnline
                  ? 'Online: Firestore Connected (Click for Sync Manager)'
                  : `Offline Mode Active (${queuedActionsCount} actions queued for auto-sync)`
              }
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="hidden lg:inline text-[11px] font-black uppercase">
                    {isSyncing ? 'Syncing...' : 'Online'}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-black uppercase">
                    Offline {queuedActionsCount > 0 ? `(${queuedActionsCount})` : ''}
                  </span>
                </>
              )}
            </button>

            {/* 3D Sports Arena Experience Shortcut */}
            {onOpen3DArena && (
              <button
                onClick={onOpen3DArena}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 hover:from-amber-500/20 hover:to-emerald-500/20 text-xs font-black uppercase text-zinc-800 dark:text-zinc-200 transition shadow-sm"
                title="Launch 3D Three.js Stadium (Virat, Rohit, Root, Bumrah, Messi, Ronaldo, Chhetri)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] tracking-tight">3D Arena</span>
              </button>
            )}

            {/* PWA App Install Button */}
            <PWAInstallNavbarButton />

            {/* Download Entire Codebase (ZIP / PDF) */}
            <button
              onClick={() => setIsCodebaseModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase transition shadow-sm cursor-pointer"
              title="Download Whole Codebase as ZIP (325 KB) or Official PDF (30 KB)"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span className="text-[11px] tracking-tight hidden md:inline">Code (ZIP/PDF)</span>
            </button>

            {/* Bright / Night Mode Theme Switcher */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Bright / Night Mode"
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition flex items-center gap-1.5"
              title={theme === 'dark' ? 'Switch to Bright Mode (Day Stadium)' : 'Switch to Dark Mode (Night Stadium)'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 transition" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition" />
              )}
            </button>

            {/* Notifications Shortcut */}
            <button
              onClick={() => onSelectTab('notifications')}
              className={`p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition ${
                currentTab === 'notifications'
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* User Session Profile or Login */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab('profile')}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition ${
                    currentTab === 'profile'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-black uppercase">
                    {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold leading-tight">{userProfile?.name || 'Athlete'}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize font-medium">
                      {userProfile?.role || 'Player'}
                    </p>
                  </div>
                </button>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-200 dark:border-zinc-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition shadow-md shadow-emerald-500/20"
                >
                  Join
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Horizontal Nav Row: All Global Navigation items specified in Prompt */}
      <div className="border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 py-1.5 min-w-max">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'cricket') onSelectSport('cricket');
                  if (item.id === 'football') onSelectSport('football');
                  onSelectTab(item.id);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full uppercase tracking-tighter">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-800 mx-2" />

          {/* Profile & Settings Tab shortcut in the row */}
          <button
            onClick={() => onSelectTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
              currentTab === 'profile'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
              currentTab === 'settings'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Offline Synchronization Modal */}
      <OfflineSyncModal
        isOpen={offlineModalOpen}
        onClose={() => setOfflineModalOpen(false)}
      />

      {/* Codebase ZIP & PDF Download Modal */}
      <CodebaseDownloadModal
        isOpen={isCodebaseModalOpen}
        onClose={() => setIsCodebaseModalOpen(false)}
      />
    </header>
  );
};
