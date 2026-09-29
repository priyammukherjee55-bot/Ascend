import React, { useState } from 'react';
import { MatchItem, LiveCricketState, LiveBatter, LiveBowler } from '../types/models';
import { evaluateBattingMilestone } from '../lib/milestoneEngine';
import { InteractiveCricketPlayerModal } from './InteractiveCricketPlayerModal';
import {
  Trophy,
  Zap,
  Target,
  Shield,
  Activity,
  Award,
  ChevronRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CricbuzzLiveScorecardProps {
  match: MatchItem;
  onNavigateToProfile?: (playerName: string) => void;
}

export const CricbuzzLiveScorecard: React.FC<CricbuzzLiveScorecardProps> = ({
  match,
  onNavigateToProfile,
}) => {
  const isTest = match.format?.toString().toLowerCase() === 'test';
  const availableInningsCount = isTest ? 4 : 2;

  const [selectedInnings, setSelectedInnings] = useState<1 | 2 | 3 | 4>(
    match.cricketState?.currentInnings || 1
  );

  // Selected player for pop-up
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(null);
  const [selectedBatterStats, setSelectedBatterStats] = useState<LiveBatter | undefined>();
  const [selectedBowlerStats, setSelectedBowlerStats] = useState<LiveBowler | undefined>();

  // Resolve state for selected innings
  const activeState: LiveCricketState =
    (selectedInnings === 1 && match.innings1) ||
    (selectedInnings === 2 && match.innings2) ||
    (selectedInnings === 3 && match.innings3) ||
    (selectedInnings === 4 && match.innings4) ||
    match.cricketState || {
      currentInnings: 1,
      battingTeamId: match.teamAId,
      battingTeamName: match.teamAName,
      bowlingTeamId: match.teamBId,
      bowlingTeamName: match.teamBName,
      runs: 0,
      wickets: 0,
      overs: 0,
      ballsInCurrentOver: 0,
      striker: {
        name: 'Batter 1',
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isStriker: true,
      },
      nonStriker: {
        name: 'Batter 2',
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isStriker: false,
      },
      currentBowler: {
        name: 'Opening Bowler',
        bowlingType: 'fast',
        overs: 0,
        ballsThisOver: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
      },
      currentOverBalls: [],
      totalExtras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penaltyRuns: 0 },
    };

  // Compile full batting lineup
  const battersList: LiveBatter[] = activeState.allBatters && activeState.allBatters.length > 0
    ? activeState.allBatters
    : [activeState.striker, activeState.nonStriker].filter(Boolean);

  // Compile bowlers lineup
  const bowlersList: LiveBowler[] = activeState.allBowlers && activeState.allBowlers.length > 0
    ? activeState.allBowlers
    : [activeState.currentBowler].filter(Boolean);

  // Extras calculations
  const extras = activeState.totalExtras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penaltyRuns: 0 };
  const totalExtrasCount =
    (extras.wides || 0) +
    (extras.noBalls || 0) +
    (extras.byes || 0) +
    (extras.legByes || 0) +
    (extras.penaltyRuns || 0);

  // Run rates
  const totalCompletedOvers = activeState.overs + activeState.ballsInCurrentOver / 6;
  const currentRunRate = totalCompletedOvers > 0 ? (activeState.runs / totalCompletedOvers).toFixed(2) : '0.00';
  const target = activeState.targetRuns;
  const maxOvers = activeState.maxOvers || match.maxOvers || (isTest ? 90 : 20);
  const remainingOvers = Math.max(0, maxOvers - totalCompletedOvers);
  const requiredRuns = target ? Math.max(0, target - activeState.runs) : null;
  const requiredRunRate =
    target && remainingOvers > 0 && requiredRuns !== null
      ? (requiredRuns / remainingOvers).toFixed(2)
      : null;

  // Fall of Wickets (FOW)
  const fowTimeline = activeState.fallOfWickets && activeState.fallOfWickets.length > 0
    ? activeState.fallOfWickets
    : activeState.wickets > 0
    ? [
        {
          score: Math.max(1, Math.round(activeState.runs * 0.4)),
          wicketNumber: 1,
          batterName: 'Opening Batter',
          over: `${Math.max(1, Math.floor(activeState.overs * 0.3))}.${Math.floor(Math.random() * 5 + 1)}`,
        },
      ]
    : [];

  const handlePlayerClick = (pName: string, isBowler: boolean = false) => {
    setSelectedPlayerName(pName);
    if (isBowler) {
      const b = bowlersList.find((x) => x.name.toLowerCase() === pName.toLowerCase());
      setSelectedBowlerStats(b || activeState.currentBowler);
      setSelectedBatterStats(undefined);
    } else {
      const bat = battersList.find((x) => x.name.toLowerCase() === pName.toLowerCase());
      setSelectedBatterStats(bat || activeState.striker);
      setSelectedBowlerStats(undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Innings Navigation Tabs (1st, 2nd, 3rd, 4th Innings) */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {([1, 2, ...(isTest ? [3, 4] : [])] as (1 | 2 | 3 | 4)[]).map((inn) => {
            const isSelected = selectedInnings === inn;
            return (
              <button
                key={inn}
                onClick={() => setSelectedInnings(inn)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-white'
                }`}
              >
                Innings {inn}
              </button>
            );
          })}
        </div>

        {/* Dynamic Milestone Rule Active Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {maxOvers <= (isTest ? 45 : 12)
              ? `Dynamic Milestones Active (30=50 / 60=100 in ≤${isTest ? 45 : 12} ov)`
              : `Standard Milestones Active (50 / 100)`}
          </span>
        </div>
      </div>

      {/* 2. Cricbuzz Innings Header Scorecard Banner */}
      <div className="p-5 rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black uppercase text-amber-400">
              {activeState.battingTeamName}
            </span>
            <span className="text-zinc-500 text-xs">• Innings {selectedInnings}</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-3xl font-black text-emerald-400 font-mono">
              {activeState.runs}/{activeState.wickets}
            </h2>
            <span className="text-sm font-mono text-zinc-400">
              ({activeState.overs}.{activeState.ballsInCurrentOver} / {maxOvers} ov)
            </span>
          </div>
        </div>

        {/* Run Rates Grid */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
            <div className="text-[10px] text-zinc-400 font-sans uppercase">CRR</div>
            <div className="text-base font-black text-emerald-400 mt-0.5">{currentRunRate}</div>
          </div>

          {target && (
            <>
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-[10px] text-zinc-400 font-sans uppercase">Target</div>
                <div className="text-base font-black text-amber-400 mt-0.5">{target}</div>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-[10px] text-zinc-400 font-sans uppercase">RRR</div>
                <div className="text-base font-black text-cyan-400 mt-0.5">
                  {requiredRunRate || '-'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Detailed Batting Breakdown Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="p-3.5 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-black uppercase text-zinc-700 dark:text-zinc-300">
          <span>Batting Breakdown</span>
          <span className="text-[10px] text-zinc-400 font-normal">Click any player for Live Stats</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold">
              <tr>
                <th className="py-2.5 px-4">Batter</th>
                <th className="py-2.5 px-4">Dismissal Mode</th>
                <th className="py-2.5 px-3 text-right">R</th>
                <th className="py-2.5 px-3 text-right">B</th>
                <th className="py-2.5 px-3 text-right">4s</th>
                <th className="py-2.5 px-3 text-right">6s</th>
                <th className="py-2.5 px-4 text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-mono">
              {battersList.map((b, idx) => {
                const milestone = evaluateBattingMilestone(b.runs, maxOvers, match.format || 't20');
                return (
                  <tr
                    key={idx}
                    onClick={() => handlePlayerClick(b.name, false)}
                    className="hover:bg-emerald-500/5 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-sans font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span className="group-hover:text-emerald-500 transition underline-offset-2 group-hover:underline">
                        {b.name}
                      </span>
                      {b.isStriker && <span className="text-emerald-500 text-xs">*</span>}
                      {milestone.milestoneBadge && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 text-[9px] font-black uppercase">
                          {milestone.milestoneBadge}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 font-sans text-[11px]">
                      {b.isOut ? b.dismissal || 'c Fielder b Bowler' : 'not out'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {b.runs}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-600 dark:text-zinc-300">{b.balls}</td>
                    <td className="py-3 px-3 text-right text-zinc-500">{b.fours}</td>
                    <td className="py-3 px-3 text-right text-zinc-500">{b.sixes}</td>
                    <td className="py-3 px-4 text-right font-bold text-zinc-700 dark:text-zinc-300">
                      {b.strikeRate.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Extras Summary Line */}
        <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/70 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">Extras:</span>
            <span className="text-zinc-500">
              {totalExtrasCount} (b {extras.byes || 0}, lb {extras.legByes || 0}, w {extras.wides || 0}, nb {extras.noBalls || 0}, pen {extras.penaltyRuns || 0})
            </span>
          </div>
          <div className="font-bold text-zinc-800 dark:text-zinc-200">
            Total: <span className="text-emerald-500 font-mono text-sm">{activeState.runs}/{activeState.wickets}</span> ({activeState.overs}.{activeState.ballsInCurrentOver} ov)
          </div>
        </div>
      </div>

      {/* 4. Fall of Wickets (FOW) Timeline */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
        <div className="text-xs font-black uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-500" />
          <span>Fall of Wickets (FOW) Timeline</span>
        </div>
        {fowTimeline.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {fowTimeline.map((fow, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono border border-zinc-200 dark:border-zinc-700/60 flex items-center gap-1.5"
              >
                <span className="font-black text-rose-500">
                  {fow.wicketNumber}-{fow.score}
                </span>
                <span className="text-zinc-500 font-sans">
                  ({fow.batterName}, {fow.over} ov)
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic">No wickets fallen in this innings yet.</p>
        )}
      </div>

      {/* 5. Detailed Bowling Breakdown Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
        <div className="p-3.5 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-black uppercase text-zinc-700 dark:text-zinc-300">
          <span>Bowling Breakdown</span>
          <span className="text-[10px] text-zinc-400 font-normal">Click bowler for Dot Ball %</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold">
              <tr>
                <th className="py-2.5 px-4">Bowler</th>
                <th className="py-2.5 px-3 text-right">O</th>
                <th className="py-2.5 px-3 text-right">M</th>
                <th className="py-2.5 px-3 text-right">R</th>
                <th className="py-2.5 px-3 text-right">W</th>
                <th className="py-2.5 px-4 text-right">Econ</th>
                <th className="py-2.5 px-3 text-right">WD</th>
                <th className="py-2.5 px-3 text-right">NB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-mono">
              {bowlersList.map((bw, idx) => (
                <tr
                  key={idx}
                  onClick={() => handlePlayerClick(bw.name, true)}
                  className="hover:bg-blue-500/5 transition cursor-pointer group"
                >
                  <td className="py-3 px-4 font-sans font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="group-hover:text-blue-500 transition underline-offset-2 group-hover:underline">
                      {bw.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 capitalize">({bw.bowlingType})</span>
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-700 dark:text-zinc-200">
                    {bw.overs}.{bw.ballsThisOver || 0}
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-500">{bw.maidens || 0}</td>
                  <td className="py-3 px-3 text-right text-amber-500">{bw.runs}</td>
                  <td className="py-3 px-3 text-right font-black text-rose-500 text-sm">{bw.wickets}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-500">{bw.economy.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-zinc-500">{extras.wides || 0}</td>
                  <td className="py-3 px-3 text-right text-zinc-500">{extras.noBalls || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Cricket Player Pop-Up */}
      {selectedPlayerName && (
        <InteractiveCricketPlayerModal
          isOpen={!!selectedPlayerName}
          onClose={() => setSelectedPlayerName(null)}
          playerName={selectedPlayerName}
          batterStats={selectedBatterStats}
          bowlerStats={selectedBowlerStats}
          match={match}
          onNavigateToProfile={onNavigateToProfile}
        />
      )}
    </div>
  );
};
