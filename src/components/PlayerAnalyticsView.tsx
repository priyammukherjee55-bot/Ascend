import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  SportType,
  StatsCricket,
  StatsFootball,
  TeamItem,
  AppUser,
  MatchItem,
} from '../types/models';
import {
  computeCricketRankings,
  computeFootballRankings,
  CricketAggregatedProfile,
  FootballAggregatedProfile,
} from '../lib/rankingEngine';
import { EmptyState } from './EmptyState';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  GitCompare,
  TrendingUp,
  Shield,
  Trophy,
  Users,
  Target,
  ArrowRight,
  Flame,
  Award,
  Layers,
} from 'lucide-react';

interface PlayerAnalyticsViewProps {
  selectedSport: SportType;
}

export const PlayerAnalyticsView: React.FC<PlayerAnalyticsViewProps> = ({
  selectedSport,
}) => {
  const [sport, setSport] = useState<SportType>(selectedSport);
  const [activeTab, setActiveTab] = useState<'analytics' | 'player_compare' | 'team_compare'>('analytics');

  const [loading, setLoading] = useState(true);
  const [cricketStats, setCricketStats] = useState<StatsCricket[]>([]);
  const [footballStats, setFootballStats] = useState<StatsFootball[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);

  // Selected player for deep dive analytics
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  // Comparison selections
  const [comparePlayerAId, setComparePlayerAId] = useState<string>('');
  const [comparePlayerBId, setComparePlayerBId] = useState<string>('');
  const [compareTeamAId, setCompareTeamAId] = useState<string>('');
  const [compareTeamBId, setCompareTeamBId] = useState<string>('');

  // Fetch collections
  useEffect(() => {
    const unsubCricket = onSnapshot(collection(db, 'stats_cricket'), (snap) => {
      const list: StatsCricket[] = [];
      snap.docs.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setCricketStats(list);
      setLoading(false);
    });

    const unsubFootball = onSnapshot(collection(db, 'stats_football'), (snap) => {
      const list: StatsFootball[] = [];
      snap.docs.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setFootballStats(list);
      setLoading(false);
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
      const list: TeamItem[] = [];
      snap.docs.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setTeams(list);
    });

    const unsubMatches = onSnapshot(collection(db, 'matches'), (snap) => {
      const list: MatchItem[] = [];
      snap.docs.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setMatches(list);
    });

    return () => {
      unsubCricket();
      unsubFootball();
      unsubTeams();
      unsubMatches();
    };
  }, []);

  // Compute aggregated player profiles
  const cricketProfiles = computeCricketRankings(cricketStats);
  const footballProfiles = computeFootballRankings(footballStats);

  // Set default selected players when data loads
  useEffect(() => {
    if (sport === 'cricket' && cricketProfiles.length > 0) {
      if (!selectedPlayerId) setSelectedPlayerId(cricketProfiles[0].playerId);
      if (!comparePlayerAId) setComparePlayerAId(cricketProfiles[0].playerId);
      if (!comparePlayerBId && cricketProfiles.length > 1) {
        setComparePlayerBId(cricketProfiles[1].playerId);
      }
    } else if (sport === 'football' && footballProfiles.length > 0) {
      if (!selectedPlayerId) setSelectedPlayerId(footballProfiles[0].playerId);
      if (!comparePlayerAId) setComparePlayerAId(footballProfiles[0].playerId);
      if (!comparePlayerBId && footballProfiles.length > 1) {
        setComparePlayerBId(footballProfiles[1].playerId);
      }
    }
  }, [sport, cricketProfiles.length, footballProfiles.length]);

  // Set default selected teams
  const sportTeams = teams.filter((t) => t.sport === sport);
  useEffect(() => {
    if (sportTeams.length > 0) {
      if (!compareTeamAId) setCompareTeamAId(sportTeams[0].id);
      if (!compareTeamBId && sportTeams.length > 1) setCompareTeamBId(sportTeams[1].id);
    }
  }, [sportTeams.length, sport]);

  // Deep dive player data
  const currentCricketPlayer = cricketProfiles.find((p) => p.playerId === selectedPlayerId);
  const currentFootballPlayer = footballProfiles.find((p) => p.playerId === selectedPlayerId);

  // Match telemetry timeline for selected player
  const playerCricketMatches = cricketStats
    .filter((s) => s.playerId === selectedPlayerId)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  const playerFootballMatches = footballStats
    .filter((s) => s.playerId === selectedPlayerId)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  // Comparison profiles
  const compPlayerA = sport === 'cricket'
    ? cricketProfiles.find((p) => p.playerId === comparePlayerAId)
    : footballProfiles.find((p) => p.playerId === comparePlayerAId);

  const compPlayerB = sport === 'cricket'
    ? cricketProfiles.find((p) => p.playerId === comparePlayerBId)
    : footballProfiles.find((p) => p.playerId === comparePlayerBId);

  // Team comparison metrics calculated from Firestore matches
  const getTeamMetrics = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return null;

    const teamMatches = matches.filter(
      (m) => (m.teamAId === teamId || m.teamBId === teamId) && m.status === 'completed'
    );

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let runsOrGoalsScored = 0;
    let runsOrGoalsConceded = 0;

    teamMatches.forEach((m) => {
      const isTeamA = m.teamAId === teamId;
      if (m.winnerId === teamId) {
        wins += 1;
      } else if (m.isDrawOrTie) {
        draws += 1;
      } else if (m.winnerId) {
        losses += 1;
      }

      if (sport === 'cricket') {
        const scored = isTeamA ? m.teamARuns || 0 : m.teamBRuns || 0;
        const conceded = isTeamA ? m.teamBRuns || 0 : m.teamARuns || 0;
        runsOrGoalsScored += scored;
        runsOrGoalsConceded += conceded;
      } else {
        const scored = isTeamA ? m.teamAGoals || 0 : m.teamBGoals || 0;
        const conceded = isTeamA ? m.teamBGoals || 0 : m.teamAGoals || 0;
        runsOrGoalsScored += scored;
        runsOrGoalsConceded += conceded;
      }
    });

    const played = teamMatches.length;
    const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

    return {
      team,
      played,
      wins,
      losses,
      draws,
      winRate,
      scored: runsOrGoalsScored,
      conceded: runsOrGoalsConceded,
      diff: runsOrGoalsScored - runsOrGoalsConceded,
    };
  };

  const compTeamA = compareTeamAId ? getTeamMetrics(compareTeamAId) : null;
  const compTeamB = compareTeamBId ? getTeamMetrics(compareTeamBId) : null;

  return (
    <div className="space-y-6">
      {/* Header and Mode Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-500">
              Telemetry Analytics & Radar
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-1">
            Player Analytics & Comparison
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Strict empirical metrics generated exclusively from historical Firestore match data.
          </p>
        </div>

        {/* Sport Switcher & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setSport('cricket')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                sport === 'cricket'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>🏏</span>
              <span>Cricket</span>
            </button>
            <button
              onClick={() => setSport('football')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                sport === 'football'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>⚽</span>
              <span>Football</span>
            </button>
          </div>

          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                activeTab === 'analytics'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Performance Charts</span>
            </button>
            <button
              onClick={() => setActiveTab('player_compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                activeTab === 'player_compare'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Player Compare</span>
            </button>
            <button
              onClick={() => setActiveTab('team_compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                activeTab === 'team_compare'
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team Compare</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: INDIVIDUAL PERFORMANCE CHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Athlete Selector */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-zinc-500 uppercase">Select Athlete:</span>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {sport === 'cricket' ? (
                  cricketProfiles.length === 0 ? (
                    <option value="">No Cricket stats recorded yet</option>
                  ) : (
                    cricketProfiles.map((p) => (
                      <option key={p.playerId} value={p.playerId}>
                        {p.playerName} ({p.teamName}) - {p.category.toUpperCase()}
                      </option>
                    ))
                  )
                ) : footballProfiles.length === 0 ? (
                  <option value="">No Football stats recorded yet</option>
                ) : (
                  footballProfiles.map((p) => (
                    <option key={p.playerId} value={p.playerId}>
                      {p.playerName} ({p.teamName}) - {p.category.toUpperCase()}
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedPlayerId && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                Match Rating: {(sport === 'cricket' ? currentCricketPlayer?.matchRating : currentFootballPlayer?.matchRating) || 0}
              </span>
            )}
          </div>

          {/* CRICKET CHARTS */}
          {sport === 'cricket' && (
            <div>
              {!currentCricketPlayer || playerCricketMatches.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="w-8 h-8 text-amber-500" />}
                  title="No historical match data found for this athlete"
                  description="When live cricket matches conclude and stats are saved to Firestore, multi-dimensional bar and radar charts render here without dummy metrics."
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Match-by-match Runs & Strike Rate */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span>Batting Telemetry (Runs & Strike Rate)</span>
                      </h4>
                      <span className="text-xs text-zinc-400 font-mono">
                        Avg: {currentCricketPlayer.battingAverage} | SR: {currentCricketPlayer.strikeRate}
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={playerCricketMatches.map((m, idx) => ({
                            match: `M${idx + 1}`,
                            runs: m.runsScored,
                            balls: m.ballsFaced,
                            strikeRate: m.strikeRate,
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#18181b',
                              borderColor: '#27272a',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="runs" name="Runs Scored" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="balls" name="Balls Faced" fill="#71717a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bowling & Fielding Contributions */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-500" />
                        <span>Bowling & Wicket Telemetry</span>
                      </h4>
                      <span className="text-xs text-zinc-400 font-mono">
                        Wkts: {currentCricketPlayer.totalWickets} | Econ: {currentCricketPlayer.bowlingEconomy}
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={playerCricketMatches.map((m, idx) => ({
                            match: `M${idx + 1}`,
                            wickets: m.wicketsTaken,
                            conceded: m.runsConceded,
                            catches: m.catches,
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#18181b',
                              borderColor: '#27272a',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="wickets" name="Wickets" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="catches" name="Catches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FOOTBALL CHARTS */}
          {sport === 'football' && (
            <div>
              {!currentFootballPlayer || playerFootballMatches.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="w-8 h-8 text-emerald-500" />}
                  title="No historical match data found for this footballer"
                  description="When live football fixtures conclude, goal progression and defensive charts render here directly from Firestore historical logs."
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Goals & Assists Chart */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                        <Flame className="w-4 h-4 text-emerald-500" />
                        <span>Offensive Telemetry (Goals & Assists)</span>
                      </h4>
                      <span className="text-xs text-zinc-400 font-mono">
                        Goals: {currentFootballPlayer.goals} | Assists: {currentFootballPlayer.assists}
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={playerFootballMatches.map((m, idx) => ({
                            match: `M${idx + 1}`,
                            goals: m.goals,
                            assists: m.assists,
                            shots: m.shots,
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#18181b',
                              borderColor: '#27272a',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="goals" name="Goals" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="assists" name="Assists" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="shots" name="Total Shots" fill="#71717a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Defensive Contributions Chart */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-500" />
                        <span>Defensive & GK Contributions</span>
                      </h4>
                      <span className="text-xs text-zinc-400 font-mono">
                        Tackles: {currentFootballPlayer.defenderSavesOrTackles} | Saves: {currentFootballPlayer.gkSaves}
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={playerFootballMatches.map((m, idx) => ({
                            match: `M${idx + 1}`,
                            tackles: m.tackles,
                            saves: m.saves || 0,
                            cleanSheet: m.cleanSheet ? 1 : 0,
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="match" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#18181b',
                              borderColor: '#27272a',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="tackles" name="Tackles" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="saves" name="GK Saves" fill="#eab308" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIDE-BY-SIDE PLAYER COMPARISON TOOL */}
      {activeTab === 'player_compare' && (
        <div className="space-y-6">
          {/* Athlete Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">
                Primary Athlete (A)
              </label>
              <select
                value={comparePlayerAId}
                onChange={(e) => setComparePlayerAId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
              >
                {sport === 'cricket'
                  ? cricketProfiles.map((p) => (
                      <option key={p.playerId} value={p.playerId}>
                        {p.playerName} ({p.teamName})
                      </option>
                    ))
                  : footballProfiles.map((p) => (
                      <option key={p.playerId} value={p.playerId}>
                        {p.playerName} ({p.teamName})
                      </option>
                    ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">
                Comparison Athlete (B)
              </label>
              <select
                value={comparePlayerBId}
                onChange={(e) => setComparePlayerBId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
              >
                {sport === 'cricket'
                  ? cricketProfiles.map((p) => (
                      <option key={p.playerId} value={p.playerId}>
                        {p.playerName} ({p.teamName})
                      </option>
                    ))
                  : footballProfiles.map((p) => (
                      <option key={p.playerId} value={p.playerId}>
                        {p.playerName} ({p.teamName})
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {!compPlayerA || !compPlayerB ? (
            <EmptyState
              icon={<GitCompare className="w-8 h-8 text-indigo-500" />}
              title="Select two athletes to compare side-by-side"
              description="Historical telemetry from both athletes will be contrasted across strike rates, boundaries, efficiency, or goals without synthetic interpolation."
            />
          ) : (
            <div className="space-y-6">
              {/* Dual Cards Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-zinc-900 border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-500 text-zinc-950 text-xs font-black uppercase rounded-bl-2xl">
                    Athlete A
                  </div>
                  <h3 className="text-2xl font-black">{compPlayerA.playerName}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{compPlayerA.teamName} • {compPlayerA.category.toUpperCase()}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-amber-400">
                      {compPlayerA.matchRating}
                    </span>
                    <span className="text-xs font-bold uppercase text-zinc-400">Match Rating</span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-zinc-900 border border-cyan-500/30 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-cyan-500 text-zinc-950 text-xs font-black uppercase rounded-bl-2xl">
                    Athlete B
                  </div>
                  <h3 className="text-2xl font-black">{compPlayerB.playerName}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{compPlayerB.teamName} • {compPlayerB.category.toUpperCase()}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-cyan-400">
                      {compPlayerB.matchRating}
                    </span>
                    <span className="text-xs font-bold uppercase text-zinc-400">Match Rating</span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Metric Table */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-xs uppercase font-bold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-4 px-6 text-left">Metric</th>
                      <th className="py-4 px-6 text-center text-amber-500 font-black">{compPlayerA.playerName}</th>
                      <th className="py-4 px-6 text-center text-zinc-400">Advantage</th>
                      <th className="py-4 px-6 text-center text-cyan-400 font-black">{compPlayerB.playerName}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {sport === 'cricket' ? (
                      <>
                        {[
                          { label: 'Official Matches Played', valA: (compPlayerA as CricketAggregatedProfile).matchesPlayed, valB: (compPlayerB as CricketAggregatedProfile).matchesPlayed },
                          { label: 'Total Runs Scored', valA: (compPlayerA as CricketAggregatedProfile).totalRuns, valB: (compPlayerB as CricketAggregatedProfile).totalRuns },
                          { label: 'Batting Average', valA: (compPlayerA as CricketAggregatedProfile).battingAverage, valB: (compPlayerB as CricketAggregatedProfile).battingAverage },
                          { label: 'Strike Rate', valA: (compPlayerA as CricketAggregatedProfile).strikeRate, valB: (compPlayerB as CricketAggregatedProfile).strikeRate },
                          { label: 'Wickets Taken', valA: (compPlayerA as CricketAggregatedProfile).totalWickets, valB: (compPlayerB as CricketAggregatedProfile).totalWickets },
                          { label: 'Bowling Economy (Lower is Better)', valA: (compPlayerA as CricketAggregatedProfile).bowlingEconomy, valB: (compPlayerB as CricketAggregatedProfile).bowlingEconomy, lowerBetter: true },
                          { label: 'Catches / Fielding Dismissals', valA: (compPlayerA as CricketAggregatedProfile).totalCatches, valB: (compPlayerB as CricketAggregatedProfile).totalCatches },
                          { label: 'Total Accumulated Points', valA: (compPlayerA as CricketAggregatedProfile).totalPoints, valB: (compPlayerB as CricketAggregatedProfile).totalPoints },
                        ].map((row, i) => {
                          const isBetterA = row.lowerBetter ? row.valA < row.valB : row.valA > row.valB;
                          const isBetterB = row.lowerBetter ? row.valB < row.valA : row.valB > row.valA;
                          return (
                            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                              <td className="py-3.5 px-6 font-bold text-zinc-700 dark:text-zinc-300">{row.label}</td>
                              <td className={`py-3.5 px-6 text-center font-mono font-black ${isBetterA ? 'text-amber-500 font-black' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                {row.valA}
                              </td>
                              <td className="py-3.5 px-6 text-center text-xs font-bold">
                                {isBetterA ? (
                                  <span className="text-amber-500">◀ A Lead</span>
                                ) : isBetterB ? (
                                  <span className="text-cyan-400">B Lead ▶</span>
                                ) : (
                                  <span className="text-zinc-400">Even</span>
                                )}
                              </td>
                              <td className={`py-3.5 px-6 text-center font-mono font-black ${isBetterB ? 'text-cyan-400 font-black' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                {row.valB}
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {[
                          { label: 'Matches Played', valA: (compPlayerA as FootballAggregatedProfile).matchesPlayed, valB: (compPlayerB as FootballAggregatedProfile).matchesPlayed },
                          { label: 'Goals', valA: (compPlayerA as FootballAggregatedProfile).goals, valB: (compPlayerB as FootballAggregatedProfile).goals },
                          { label: 'Assists', valA: (compPlayerA as FootballAggregatedProfile).assists, valB: (compPlayerB as FootballAggregatedProfile).assists },
                          { label: 'Minutes Played', valA: (compPlayerA as FootballAggregatedProfile).minutesPlayed, valB: (compPlayerB as FootballAggregatedProfile).minutesPlayed },
                          { label: 'Tackles & Interceptions', valA: (compPlayerA as FootballAggregatedProfile).defenderSavesOrTackles, valB: (compPlayerB as FootballAggregatedProfile).defenderSavesOrTackles },
                          { label: 'GK Saves', valA: (compPlayerA as FootballAggregatedProfile).gkSaves, valB: (compPlayerB as FootballAggregatedProfile).gkSaves },
                          { label: 'Clean Sheets', valA: (compPlayerA as FootballAggregatedProfile).cleanSheets, valB: (compPlayerB as FootballAggregatedProfile).cleanSheets },
                          { label: 'Total Accumulated Points', valA: (compPlayerA as FootballAggregatedProfile).totalPoints, valB: (compPlayerB as FootballAggregatedProfile).totalPoints },
                        ].map((row, i) => {
                          const isBetterA = row.valA > row.valB;
                          const isBetterB = row.valB > row.valA;
                          return (
                            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                              <td className="py-3.5 px-6 font-bold text-zinc-700 dark:text-zinc-300">{row.label}</td>
                              <td className={`py-3.5 px-6 text-center font-mono font-black ${isBetterA ? 'text-emerald-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                {row.valA}
                              </td>
                              <td className="py-3.5 px-6 text-center text-xs font-bold">
                                {isBetterA ? (
                                  <span className="text-emerald-500">◀ A Lead</span>
                                ) : isBetterB ? (
                                  <span className="text-cyan-400">B Lead ▶</span>
                                ) : (
                                  <span className="text-zinc-400">Even</span>
                                )}
                              </td>
                              <td className={`py-3.5 px-6 text-center font-mono font-black ${isBetterB ? 'text-cyan-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                {row.valB}
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TEAM VS TEAM COMPARISON TOOL */}
      {activeTab === 'team_compare' && (
        <div className="space-y-6">
          {/* Team Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">
                Primary Team (A)
              </label>
              <select
                value={compareTeamAId}
                onChange={(e) => setCompareTeamAId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
              >
                {sportTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1.5">
                Opponent Team (B)
              </label>
              <select
                value={compareTeamBId}
                onChange={(e) => setCompareTeamBId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100"
              >
                {sportTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!compTeamA || !compTeamB ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-emerald-500" />}
              title="Select two teams to compare head-to-head"
              description="Official match wins, losses, run rate/goal differences, and win percentages will be analyzed side-by-side."
            />
          ) : (
            <div className="space-y-6">
              {/* Dual Cards Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-zinc-900 border border-emerald-500/30 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-zinc-950 text-xs font-black uppercase rounded-bl-2xl">
                    Team A
                  </div>
                  <h3 className="text-2xl font-black">{compTeamA.team.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{compTeamA.team.city} • Captain: {compTeamA.team.captainName || 'Appointed'}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-emerald-400">
                      {compTeamA.winRate}%
                    </span>
                    <span className="text-xs font-bold uppercase text-zinc-400">Win Rate</span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-zinc-900 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-indigo-500 text-zinc-950 text-xs font-black uppercase rounded-bl-2xl">
                    Team B
                  </div>
                  <h3 className="text-2xl font-black">{compTeamB.team.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{compTeamB.team.city} • Captain: {compTeamB.team.captainName || 'Appointed'}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-indigo-400">
                      {compTeamB.winRate}%
                    </span>
                    <span className="text-xs font-bold uppercase text-zinc-400">Win Rate</span>
                  </div>
                </div>
              </div>

              {/* Head-to-Head Metric Table */}
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-xs uppercase font-bold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-4 px-6 text-left">Metric</th>
                      <th className="py-4 px-6 text-center text-emerald-500 font-black">{compTeamA.team.name}</th>
                      <th className="py-4 px-6 text-center text-zinc-400">Advantage</th>
                      <th className="py-4 px-6 text-center text-indigo-400 font-black">{compTeamB.team.name}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {[
                      { label: 'Official Matches Completed', valA: compTeamA.played, valB: compTeamB.played },
                      { label: 'Total Matches Won', valA: compTeamA.wins, valB: compTeamB.wins },
                      { label: 'Total Matches Lost', valA: compTeamA.losses, valB: compTeamB.losses, lowerBetter: true },
                      { label: 'Tied / Drawn Matches', valA: compTeamA.draws, valB: compTeamB.draws },
                      { label: 'Win Percentage', valA: `${compTeamA.winRate}%`, valB: `${compTeamB.winRate}%`, numA: compTeamA.winRate, numB: compTeamB.winRate },
                      { label: sport === 'cricket' ? 'Total Runs Scored' : 'Total Goals Scored', valA: compTeamA.scored, valB: compTeamB.scored },
                      { label: sport === 'cricket' ? 'Total Runs Conceded' : 'Total Goals Conceded', valA: compTeamA.conceded, valB: compTeamB.conceded, lowerBetter: true },
                      { label: sport === 'cricket' ? 'Run Margin Difference' : 'Goal Difference (GD)', valA: compTeamA.diff, valB: compTeamB.diff },
                    ].map((row, i) => {
                      const vA = row.numA !== undefined ? row.numA : Number(row.valA);
                      const vB = row.numB !== undefined ? row.numB : Number(row.valB);
                      const isBetterA = row.lowerBetter ? vA < vB : vA > vB;
                      const isBetterB = row.lowerBetter ? vB < vA : vB > vA;
                      return (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="py-3.5 px-6 font-bold text-zinc-700 dark:text-zinc-300">{row.label}</td>
                          <td className={`py-3.5 px-6 text-center font-mono font-black ${isBetterA ? 'text-emerald-500' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {row.valA}
                          </td>
                          <td className="py-3.5 px-6 text-center text-xs font-bold">
                            {isBetterA ? (
                              <span className="text-emerald-500">◀ Team A Lead</span>
                            ) : isBetterB ? (
                              <span className="text-indigo-400">Team B Lead ▶</span>
                            ) : (
                              <span className="text-zinc-400">Even</span>
                            )}
                          </td>
                          <td className={`py-3.5 px-6 text-center font-mono font-black ${isBetterB ? 'text-indigo-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {row.valB}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
