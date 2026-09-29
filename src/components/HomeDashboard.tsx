import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SportType, NavTab } from '../types/models';
import { EntrySportSelector } from './EntrySportSelector';
import { Sports3DCanvas } from './3d/Sports3DCanvas';
import { EmptyState } from './EmptyState';
import { Flame, Trophy, Compass, Users, MapPin, Radio, Shield, BarChart3, ChevronRight, Activity, Sparkles } from 'lucide-react';

interface HomeDashboardProps {
  selectedSport: SportType;
  onSelectSport: (sport: SportType) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  selectedSport,
  onSelectSport,
  onNavigate,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();

  return (
    <div className="space-y-8">
      {/* 1. Entry Sport Selection Hero */}
      <EntrySportSelector selectedSport={selectedSport} onSelectSport={onSelectSport} />

      {/* 2. Interactive 3D Stadium & World-Class Legends Arena */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-base uppercase tracking-tight text-zinc-900 dark:text-white">
              {selectedSport === 'cricket'
                ? '3D Cricket Pitch: Legends in Motion (Virat, Rohit, Root, Williamson, Bumrah, Starc)'
                : '3D Football Stadium: World-Class Match Action (Messi, Ronaldo, Chhetri, Neymar, Ramos)'}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-zinc-500 hidden sm:inline">
            Interactive 3D Three.js WebGL Engine
          </span>
        </div>

        <Sports3DCanvas currentSport={selectedSport} opacity={0.96} />
      </div>

      {/* 3. Platform Status & Role Context Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-tight">
              {currentUser ? `Welcome Back, ${userProfile?.name || 'Athlete'}!` : 'ASCEND Architecture Active'}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {currentUser
                ? `Role: ${userProfile?.role?.toUpperCase()} | Home: ${userProfile?.location?.city || 'Not set'}`
                : 'Zero fake data policy enforced. Register to populate real Firestore sport documents.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!currentUser ? (
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold uppercase text-xs rounded-xl transition shadow-md"
            >
              Register Athlete Profile
            </button>
          ) : (
            <button
              onClick={() => onNavigate('profile')}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl transition"
            >
              Configure Technical Profile
            </button>
          )}
        </div>
      </div>

      {/* 3. Sport Quick Action Hub Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('matches')}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition group"
        >
          <Compass className="w-6 h-6 text-emerald-500 mb-2 group-hover:scale-110 transition" />
          <h5 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase">Fixtures & Matches</h5>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Live scores, scheduled games & results</p>
        </div>

        <div
          onClick={() => onNavigate('players')}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition group"
        >
          <Users className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition" />
          <h5 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase">Talent Directory</h5>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Filtered by bowling/batting & positions</p>
        </div>

        <div
          onClick={() => onNavigate('tournaments')}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition group"
        >
          <Trophy className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition" />
          <h5 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase">Tournaments</h5>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Leagues, cups, and knockout brackets</p>
        </div>

        <div
          onClick={() => onNavigate('nearby')}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition group"
        >
          <MapPin className="w-6 h-6 text-rose-500 mb-2 group-hover:scale-110 transition" />
          <h5 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase">Nearby Sports</h5>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">City grounds, turf arenas & local hubs</p>
        </div>
      </div>

      {/* 4. Live Match Section Showcase (Zero hardcoded data, clean real empty state) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h3 className="font-black text-lg text-zinc-900 dark:text-white uppercase tracking-tight">
              Live Sports Telemetry
            </h3>
          </div>
          <button
            onClick={() => onNavigate('live')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View Live Hub</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <EmptyState
          icon={<Radio className="w-6 h-6 text-rose-500 animate-pulse" />}
          title={`No live ${selectedSport} matches currently streaming`}
          description="When matches are initiated by registered league organizers, ball-by-ball commentary and pitch stats stream instantly via Firestore snapshot listeners."
          actionText="Explore Fixture Schedule"
          onAction={() => onNavigate('matches')}
        />
      </div>
    </div>
  );
};
