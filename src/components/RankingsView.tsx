import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  SportType,
  CricketFormat,
  StatsCricket,
  StatsFootball,
  MatchItem,
} from '../types/models';
import {
  computeCricketRankings,
  computeFootballRankings,
  CricketAggregatedProfile,
  FootballAggregatedProfile,
  filterOfficialCricketStats,
  filterOfficialFootballStats,
} from '../lib/rankingEngine';
import { EmptyState } from './EmptyState';
import {
  Trophy,
  Award,
  Shield,
  Zap,
  Flame,
  Target,
  BarChart3,
  ChevronRight,
  Filter,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface RankingsViewProps {
  selectedSport: SportType;
  onOpenMatch?: (matchId: string) => void;
  onSelectPlayer?: (playerId: string) => void;
}

export const RankingsView: React.FC<RankingsViewProps> = ({
  selectedSport,
  onOpenMatch,
  onSelectPlayer,
}) => {
  const [sport, setSport] = useState<SportType>(selectedSport);
  const [cricketFormat, setCricketFormat] = useState<CricketFormat>('t20');
  
  // Cricket position category tab
  const [cricketCategory, setCricketCategory] = useState<
    'all' | 'batsman' | 'bowler' | 'all_rounder' | 'fielder'
  >('all');

  // Football position category tab
  const [footballCategory, setFootballCategory] = useState<
    'all' | 'striker' | 'midfielder' | 'defender' | 'goalkeeper'
  >('all');

  const [loading, setLoading] = useState(true);
  const [cricketStats, setCricketStats] = useState<StatsCricket[]>([]);
  const [footballStats, setFootballStats] = useState<StatsFootball[]>([]);
  const [officialMatchIds, setOfficialMatchIds] = useState<Set<string>>(new Set());

  // Listen for official matches for Data Integrity
  useEffect(() => {
    const qMatches = query(collection(db, 'matches'));
    const unsubMatches = onSnapshot(qMatches, (snap) => {
      const ids = new Set<string>();
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data() as MatchItem;
        // Data integrity: Only matches that are not simulated and are official
        if (data.isOfficial !== false && !data.isSimulated) {
          ids.add(docSnap.id);
        }
      });
      setOfficialMatchIds(ids);
    });

    return () => unsubMatches();
  }, []);

  // Listen for Cricket stats
  useEffect(() => {
    const qCricket = query(collection(db, 'stats_cricket'));
    const unsubCricket = onSnapshot(qCricket, (snap) => {
      const list: StatsCricket[] = [];
      snap.docs.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setCricketStats(list);
      setLoading(false);
    });

    return () => unsubCricket();
  }, []);

  // Listen for Football stats
  useEffect(() => {
    const qFootball = query(collection(db, 'stats_football'));
    const unsubFootball = onSnapshot(qFootball, (snap) => {
      const list: StatsFootball[] = [];
      snap.docs.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setFootballStats(list);
      setLoading(false);
    });

    return () => unsubFootball();
  }, []);

  // Filter stats strictly by verified official matches
  const verifiedCricketStats = filterOfficialCricketStats(cricketStats, officialMatchIds);
  const verifiedFootballStats = filterOfficialFootballStats(footballStats, officialMatchIds);

  // Compute rankings
  const cricketRankings = computeCricketRankings(verifiedCricketStats, cricketFormat);
  const filteredCricketRankings = cricketCategory === 'all'
    ? cricketRankings
    : cricketRankings.filter((p) => p.category === cricketCategory);

  const footballRankings = computeFootballRankings(verifiedFootballStats);
  const filteredFootballRankings = footballCategory === 'all'
    ? footballRankings
    : footballRankings.filter((p) => p.category === footballCategory);

  return (
    <div className="space-y-6">
      {/* Header & Sport Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-amber-500">
              Official Power Rankings
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-1">
            Dynamic Athlete Leaderboards
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Computed in real time strictly from verified match scorecards with data integrity isolation.
          </p>
        </div>

        {/* Sport Switcher */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 self-start md:self-auto">
          <button
            onClick={() => setSport('cricket')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              sport === 'cricket'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <span>🏏</span>
            <span>Cricket Rankings</span>
          </button>
          <button
            onClick={() => setSport('football')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${
              sport === 'football'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <span>⚽</span>
            <span>Football Rankings</span>
          </button>
        </div>
      </div>

      {/* Logic & Point Formula Banner */}
      <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider block">
              Official Mathematical Ranking Model
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {sport === 'cricket' ? (
                <>
                  Points: <strong className="text-amber-500">+5</strong> per Run • <strong className="text-amber-500">+15</strong> per Wicket • <strong className="text-amber-500">+10</strong> per Catch |{' '}
                  <span className="font-mono">Match Rating = Total Points / Total Matches</span>
                </>
              ) : (
                <>
                  Points: <strong className="text-emerald-500">+50</strong> per Goal • <strong className="text-emerald-500">+50</strong> per GK Save • <strong className="text-emerald-500">+30</strong> per Def Save/Tackle |{' '}
                  <span className="font-mono">Match Rating = Total Points / Total Matches</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Data Integrity Active (Simulated matches filtered out)</span>
        </div>
      </div>

      {/* CRICKET SECTION */}
      {sport === 'cricket' && (
        <div className="space-y-6">
          {/* Format Sub-tabs (Independent Tables: TEST, ODI, T20) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 uppercase">Format:</span>
              <div className="flex items-center gap-1.5">
                {(['t20', 'odi', 'test'] as CricketFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setCricketFormat(fmt)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
                      cricketFormat === fmt
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {fmt} Table
                  </button>
                ))}
              </div>
            </div>

            {/* Position Category Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Players' },
                { id: 'batsman', label: 'Top Batsman' },
                { id: 'bowler', label: 'Top Bowler' },
                { id: 'all_rounder', label: 'Top All-Rounder' },
                { id: 'fielder', label: 'Best Fielder' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCricketCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    cricketCategory === tab.id
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rankings Table */}
          {filteredCricketRankings.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-8 h-8 text-amber-500" />}
              title={`No official ${cricketFormat.toUpperCase()} Cricket stats found yet`}
              description={`Official scorecards logged in ${cricketFormat.toUpperCase()} matches will automatically calculate and rank players here.`}
            />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Player</th>
                    <th className="py-4 px-4 text-center">Category</th>
                    <th className="py-4 px-4 text-center">Matches</th>
                    <th className="py-4 px-4 text-center">Runs (+5)</th>
                    <th className="py-4 px-4 text-center">Wickets (+15)</th>
                    <th className="py-4 px-4 text-center">Catches (+10)</th>
                    <th className="py-4 px-4 text-center">Total Points</th>
                    <th className="py-4 px-6 text-right">Match Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredCricketRankings.map((player, idx) => {
                    const isTopThree = idx < 3;
                    return (
                      <tr
                        key={player.playerId}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition group"
                      >
                        <td className="py-4 px-6 text-center font-mono font-black">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-zinc-950 shadow-sm">
                              🥇
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-300 dark:bg-zinc-700 text-zinc-950 dark:text-zinc-100">
                              🥈
                            </span>
                          ) : idx === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-amber-100">
                              🥉
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-bold">#{idx + 1}</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 p-0.5 flex-shrink-0">
                              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-white font-bold text-sm">
                                {player.playerName.charAt(0)}
                              </div>
                            </div>
                            <div>
                              <div className="font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                                <span>{player.playerName}</span>
                                {isTopThree && (
                                  <Flame className="w-3.5 h-3.5 text-amber-500 inline" />
                                )}
                              </div>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                {player.teamName}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {player.category.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300">
                          {player.matchesPlayed}
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold text-zinc-900 dark:text-white">
                          {player.totalRuns}
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold text-zinc-900 dark:text-white">
                          {player.totalWickets}
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold text-zinc-900 dark:text-white">
                          {player.totalCatches}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold text-zinc-600 dark:text-zinc-400">
                            {player.totalPoints.toLocaleString()}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <span className="font-mono font-black text-base text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                            {player.matchRating.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FOOTBALL SECTION */}
      {sport === 'football' && (
        <div className="space-y-6">
          {/* Position Category Filters */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-500 uppercase">Position Leaderboard:</span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Players' },
                { id: 'striker', label: 'Best Striker' },
                { id: 'midfielder', label: 'Best Midfielder' },
                { id: 'defender', label: 'Best Defender' },
                { id: 'goalkeeper', label: 'Best Goalkeeper' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFootballCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    footballCategory === tab.id
                      ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Football Rankings Table */}
          {filteredFootballRankings.length === 0 ? (
            <EmptyState
              icon={<Trophy className="w-8 h-8 text-emerald-500" />}
              title="No official Football match statistics logged yet"
              description="Official goals, goalkeeper saves, and defensive tackles from match fixtures will calculate dynamic player ratings here."
            />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Player</th>
                    <th className="py-4 px-4 text-center">Category</th>
                    <th className="py-4 px-4 text-center">Matches</th>
                    <th className="py-4 px-4 text-center">Goals (+50)</th>
                    <th className="py-4 px-4 text-center">GK Saves (+50)</th>
                    <th className="py-4 px-4 text-center">Def Saves/Tackles (+30)</th>
                    <th className="py-4 px-4 text-center">Total Points</th>
                    <th className="py-4 px-6 text-right">Match Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredFootballRankings.map((player, idx) => {
                    const isTopThree = idx < 3;
                    return (
                      <tr
                        key={player.playerId}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition group"
                      >
                        <td className="py-4 px-6 text-center font-mono font-black">
                          {idx === 0 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-zinc-950 shadow-sm">
                              🥇
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-300 dark:bg-zinc-700 text-zinc-950 dark:text-zinc-100">
                              🥈
                            </span>
                          ) : idx === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-amber-100">
                              🥉
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-bold">#{idx + 1}</span>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-700 p-0.5 flex-shrink-0">
                              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center text-white font-bold text-sm">
                                {player.playerName.charAt(0)}
                              </div>
                            </div>
                            <div>
                              <div className="font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                                <span>{player.playerName}</span>
                                {isTopThree && (
                                  <Flame className="w-3.5 h-3.5 text-emerald-500 inline" />
                                )}
                              </div>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                {player.teamName}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {player.category}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300">
                          {player.matchesPlayed}
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold text-zinc-900 dark:text-white">
                          {player.goals}
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold text-zinc-900 dark:text-white">
                          {player.gkSaves}
                        </td>

                        <td className="py-4 px-4 text-center font-mono font-bold text-zinc-900 dark:text-white">
                          {player.defenderSavesOrTackles}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold text-zinc-600 dark:text-zinc-400">
                            {player.totalPoints.toLocaleString()}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                            {player.matchRating.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
