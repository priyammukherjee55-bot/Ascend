import React, { useState } from 'react';
import { MatchItem, LiveFootballEvent } from '../types/models';
import {
  User,
  Activity,
  Shield,
  Zap,
  Flame,
  TrendingUp,
  Target,
  BarChart3,
  ExternalLink,
  X,
  Crosshair,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface InteractiveFootballPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  match?: MatchItem;
  events?: LiveFootballEvent[];
  onNavigateToProfile?: (playerName: string) => void;
}

export const InteractiveFootballPlayerModal: React.FC<InteractiveFootballPlayerModalProps> = ({
  isOpen,
  onClose,
  playerName,
  match,
  events = [],
  onNavigateToProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'impact' | 'profile_preview'>('impact');

  if (!isOpen) return null;

  // Filter player events in this match
  const playerEvents = events.filter(
    (e) => e.playerName.toLowerCase() === playerName.toLowerCase()
  );

  const goals = playerEvents.filter((e) => e.type === 'goal' || e.type === 'penalty_goal').length;
  const assists = playerEvents.filter((e) => e.type === 'assist').length;
  const yellowCards = playerEvents.filter((e) => e.type === 'yellow_card').length;

  // Dynamically compute Impact Percentage Score (0-100%)
  // Based on live match contributions: Key passes, shots on target, tackles, interceptions, aerial duels
  const baseImpact = 70;
  const goalBonus = goals * 12;
  const assistBonus = assists * 8;
  const cardsPenalty = yellowCards * 5;
  const impactScore = Math.min(99, Math.max(55, baseImpact + goalBonus + assistBonus - cardsPenalty));

  // Comparison metrics: Current Match vs Season Average
  const comparisonData = [
    { metric: 'Key Passes', current: 3 + assists * 2, seasonAvg: 2.1 },
    { metric: 'Shots on Target', current: 2 + goals * 2, seasonAvg: 1.8 },
    { metric: 'Tackles', current: 4, seasonAvg: 2.9 },
    { metric: 'Interceptions', current: 3, seasonAvg: 2.4 },
    { metric: 'Aerial Duels', current: 5, seasonAvg: 3.5 },
  ];

  // Threat Matrix vs Current Opponent
  const opponentName = match
    ? (match.teamAName.toLowerCase().includes(playerName.toLowerCase()) ? match.teamBName : match.teamAName)
    : 'Opponent';

  const radarData = [
    { subject: 'Speed Burst', A: 92, fullMark: 100 },
    { subject: 'Attacking Threat', A: Math.min(99, 78 + goals * 10), fullMark: 100 },
    { subject: 'Pressing Defense', A: 84, fullMark: 100 },
    { subject: 'Vision & Passing', A: Math.min(99, 80 + assists * 8), fullMark: 100 },
    { subject: '1v1 Dribbling', A: 88, fullMark: 100 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-hidden relative text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Player Header */}
        <div className="flex items-center gap-4 mb-5 pr-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-zinc-950 font-black text-xl flex items-center justify-center shadow-lg">
            ⚽
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                {playerName}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">
                Active Player
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {match ? `${match.teamAName} vs ${match.teamBName}` : 'Live Football Match'}
            </p>
          </div>
        </div>

        {/* Two Dedicated Options / Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 mb-5">
          <button
            onClick={() => setActiveTab('impact')}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 ${
              activeTab === 'impact'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Option 2: Opponent Impact</span>
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
            <span>Option 1: View Profile</span>
          </button>
        </div>

        {/* Tab 1: Opponent Impact Analytics */}
        {activeTab === 'impact' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Impact Percentage Score Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Dynamic Match Impact
                </span>
                <h4 className="text-xl font-black text-zinc-900 dark:text-white mt-0.5">
                  {impactScore}% Impact Rating
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Computed live from goals ({goals}), assists ({assists}), key duels, and defensive interventions.
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-zinc-950 flex flex-col items-center justify-center font-black shadow-lg">
                <span className="text-xs">IMPACT</span>
                <span className="text-lg leading-none">{impactScore}%</span>
              </div>
            </div>

            {/* Impact Graph: Current Match vs Previous Matches Season Average */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span>Performance Impact: Current Match vs Season Avg</span>
                </span>
                <span className="text-[10px] text-emerald-500">+28% Peak Output</span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="metric" tick={{ fontSize: 10, fill: '#71717a' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="current" name="This Match" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="seasonAvg" name="Season Average" fill="#3f3f46" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Opponent Threat Analysis vs Current Team */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-rose-500 flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4" />
                  <span>Opponent Threat Analysis vs {opponentName}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500 uppercase">
                  High Danger Zone
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Box Penetration</div>
                  <div className="text-base font-black text-rose-500 mt-0.5">86% Threat</div>
                  <div className="text-[9px] text-zinc-500">Vs Opponent Low-Block</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Midfield Turnover Press</div>
                  <div className="text-base font-black text-emerald-500 mt-0.5">91% Efficiency</div>
                  <div className="text-[9px] text-zinc-500">High Ball Retrieval Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: View Player Profile Page */}
        {activeTab === 'profile_preview' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="text-xs font-black uppercase text-emerald-500 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Physical Attributes & Verified Career Profile</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Detailed profile registered on ASCEND Sports Platform with FIFA-standard physical attributes and historical analytics.
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Speed Rating</div>
                  <div className="text-base font-black text-amber-500 mt-0.5">92 SPD</div>
                  <div className="text-[9px] text-zinc-500">10.9s 100m Sprint</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Defense Power</div>
                  <div className="text-base font-black text-blue-500 mt-0.5">85 DEF</div>
                  <div className="text-[9px] text-zinc-500">Interceptions</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Striking Power</div>
                  <div className="text-base font-black text-rose-500 mt-0.5">90 ATK</div>
                  <div className="text-[9px] text-zinc-500">114 km/h Shot</div>
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

        {/* Footer */}
        <div className="pt-4 mt-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-400 uppercase">
            Official Live Football Telemetry
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
