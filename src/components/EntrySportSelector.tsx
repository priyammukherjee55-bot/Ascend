import React from 'react';
import { SportType } from '../types/models';
import { Trophy, ChevronRight, Shield, Zap, Target, Activity } from 'lucide-react';

interface EntrySportSelectorProps {
  onSelectSport: (sport: SportType) => void;
  selectedSport: SportType;
}

export const EntrySportSelector: React.FC<EntrySportSelectorProps> = ({
  onSelectSport,
  selectedSport,
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900/90 dark:to-zinc-950 p-6 md:p-10 mb-8 shadow-xl">
      {/* Background ambient glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/30">
          <Zap className="w-3.5 h-3.5" /> High-Performance Sports Arena
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400">ASCEND</span>
        </h1>
        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-medium">
          Select your sport context below to view real-time scoreboards, live match commentary, player analytics, registered tournaments, and local athletic communities.
        </p>
      </div>

      {/* Prominent Sport Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto relative z-10">
        {/* CRICKET CARD */}
        <div
          onClick={() => onSelectSport('cricket')}
          className={`cursor-pointer group relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
            selectedSport === 'cricket'
              ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-950/20 shadow-xl shadow-amber-500/10 scale-[1.02]'
              : 'border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 hover:border-amber-400/50 hover:bg-amber-50/30 dark:hover:bg-zinc-850'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-3xl border border-amber-500/30 shadow-inner group-hover:scale-110 transition">
              🏏
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                selectedSport === 'cricket'
                  ? 'bg-amber-500 text-black font-extrabold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {selectedSport === 'cricket' ? 'Active Context' : 'Select'}
            </span>
          </div>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2 flex items-center gap-2">
            Cricket Arena
            <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition" />
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Ball-by-ball commentary, batting & bowling performance telemetry, T20/ODI/Test profiles, and local league fixtures.
          </p>

          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
              Strike Rates & Averages
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
              Live Ball Overlogs
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
              Bowling Speeds & Styles
            </span>
          </div>
        </div>

        {/* FOOTBALL CARD */}
        <div
          onClick={() => onSelectSport('football')}
          className={`cursor-pointer group relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
            selectedSport === 'football'
              ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-xl shadow-emerald-500/10 scale-[1.02]'
              : 'border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 hover:border-emerald-400/50 hover:bg-emerald-50/30 dark:hover:bg-zinc-850'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-3xl border border-emerald-500/30 shadow-inner group-hover:scale-110 transition">
              ⚽
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                selectedSport === 'football'
                  ? 'bg-emerald-500 text-black font-extrabold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {selectedSport === 'football' ? 'Active Context' : 'Select'}
            </span>
          </div>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2 flex items-center gap-2">
            Football Arena
            <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition" />
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Minute-by-minute timeline logs, goals, assists, defensive stats, positional heat maps, foot dominance, and club tournaments.
          </p>

          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
              Positional Matrix (GK to ST)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
              Clean Sheets & Tackles
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
              Match Incident Timelines
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
