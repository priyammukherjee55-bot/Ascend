import React, { useState } from 'react';
import { LiveBatter, LiveBowler, MatchItem, CricketFormat } from '../types/models';
import { evaluateBattingMilestone } from '../lib/milestoneEngine';
import {
  User,
  Zap,
  Target,
  Trophy,
  Award,
  ChevronRight,
  X,
  ExternalLink,
  Flame,
  CheckCircle2,
  TrendingUp,
  Activity,
  Shield,
} from 'lucide-react';

interface InteractiveCricketPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  batterStats?: LiveBatter;
  bowlerStats?: LiveBowler;
  match?: MatchItem;
  onNavigateToProfile?: (playerName: string) => void;
}

export const InteractiveCricketPlayerModal: React.FC<InteractiveCricketPlayerModalProps> = ({
  isOpen,
  onClose,
  playerName,
  batterStats,
  bowlerStats,
  match,
  onNavigateToProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'profile_preview'>('live');

  if (!isOpen) return null;

  const matchOvers = match?.maxOvers || (match?.format?.toString().toLowerCase() === 'test' ? 90 : 20);
  const milestone = batterStats
    ? evaluateBattingMilestone(batterStats.runs, matchOvers, match?.format || 't20')
    : null;

  // Dot ball percentage estimation for bowler
  const totalDeliveries = bowlerStats ? bowlerStats.overs * 6 + (bowlerStats.ballsThisOver || 0) : 0;
  const estimatedDotBalls = bowlerStats
    ? Math.max(0, Math.round(totalDeliveries * 0.45 + (bowlerStats.maidens || 0) * 4))
    : 0;
  const dotBallPct = totalDeliveries > 0 ? Math.min(100, Math.round((estimatedDotBalls / totalDeliveries) * 100)) : 0;

  // Boundary runs %
  const boundaryRuns = batterStats ? batterStats.fours * 4 + batterStats.sixes * 6 : 0;
  const boundaryPct = batterStats && batterStats.runs > 0 ? Math.round((boundaryRuns / batterStats.runs) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative text-zinc-900 dark:text-zinc-100 flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Player Header Card */}
        <div className="flex items-center gap-4 mb-5 pr-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-zinc-950 font-black text-xl flex items-center justify-center shadow-lg">
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                {playerName}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase">
                {bowlerStats ? 'Bowler' : 'Batter'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {match ? `${match.teamAName} vs ${match.teamBName}` : 'Live Cricket Match'}
            </p>
          </div>
        </div>

        {/* Two Dedicated Interactive Options / Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 mb-5">
          <button
            onClick={() => setActiveTab('live')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Option 1: Live Performance</span>
          </button>
          <button
            onClick={() => setActiveTab('profile_preview')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 ${
              activeTab === 'profile_preview'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Option 2: Player Profile</span>
          </button>
        </div>

        {/* Tab 1: Live Match Performance Breakdown */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* Batting Live Performance */}
            {batterStats && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-500 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    <span>Live Batting Telemetry</span>
                  </span>
                  {milestone?.milestoneBadge && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      <span>{milestone.milestoneTitle}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Runs</div>
                    <div className="text-xl font-black text-emerald-500 mt-0.5">{batterStats.runs}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Balls</div>
                    <div className="text-xl font-black text-zinc-900 dark:text-white mt-0.5">{batterStats.balls}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">SR</div>
                    <div className="text-xl font-black text-amber-500 mt-0.5">
                      {batterStats.strikeRate.toFixed(1)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">4s / 6s</div>
                    <div className="text-xl font-black text-cyan-500 mt-0.5">
                      {batterStats.fours} / {batterStats.sixes}
                    </div>
                  </div>
                </div>

                {/* Boundary Percentage Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>Boundary Scoring Impact</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {boundaryRuns} runs ({boundaryPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                      style={{ width: `${Math.min(100, boundaryPct)}%` }}
                    />
                  </div>
                </div>

                {batterStats.isOut ? (
                  <div className="text-xs text-rose-500 font-bold bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    Dismissal: {batterStats.dismissal || 'Out'}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-500 font-bold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Currently Batting in the Middle ({batterStats.isStriker ? 'On Strike *' : 'Non-Striker'})</span>
                  </div>
                )}
              </div>
            )}

            {/* Bowling Live Performance */}
            {bowlerStats && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-blue-500 flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    <span>Live Bowling Analysis</span>
                  </span>
                  <span className="text-xs font-bold text-zinc-400 capitalize">
                    {bowlerStats.bowlingType} Pace
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Overs</div>
                    <div className="text-xl font-black text-zinc-900 dark:text-white mt-0.5">
                      {bowlerStats.overs}.{bowlerStats.ballsThisOver || 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Wickets</div>
                    <div className="text-xl font-black text-rose-500 mt-0.5">{bowlerStats.wickets}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Runs</div>
                    <div className="text-xl font-black text-amber-500 mt-0.5">{bowlerStats.runs}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Economy</div>
                    <div className="text-xl font-black text-emerald-500 mt-0.5">
                      {bowlerStats.economy.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Dot Ball Percentage */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>Dot Ball Percentage</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{dotBallPct}% Pressure</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${dotBallPct}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Profile Overview & One-Click Navigation */}
        {activeTab === 'profile_preview' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="text-xs font-black uppercase text-emerald-500 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Career Profile & Milestone Badges</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Verified athletic registration on ASCEND Sports Platform. Includes historical averages, milestone badges (Dynamic 30/60 & Standard 50/100), and speed test telemetry.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Format</div>
                  <div className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">T20 / ODI</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Role</div>
                  <div className="text-sm font-black text-amber-500 mt-0.5">Top-Order</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Verified</div>
                  <div className="text-sm font-black text-emerald-500 mt-0.5">Level 1 Pro</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (onNavigateToProfile) onNavigateToProfile(playerName);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Full Persistent Player Profile</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-4 mt-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase">
            Cricbuzz Official Player Telemetry
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
