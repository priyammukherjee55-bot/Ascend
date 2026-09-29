import {
  StatsCricket,
  StatsFootball,
  CricketPlayerRanking,
  FootballPlayerRanking,
  CricketFormat,
  MatchItem,
} from '../types/models';
import { evaluateBattingMilestone } from './milestoneEngine';

/**
 * ASCEND Dynamic Ranking Engine
 * 
 * CRICKET RANKING LOGIC:
 * - Points Formula:
 *   * +5 points per run
 *   * +15 points per wicket
 *   * +10 points per catch
 * - Ranking Score Formula:
 *   Match Rating = Total Accumulated Points / Total Matches Played
 * - Format Breakdown:
 *   Separate, independent ranking tables for TEST, ODI, and T20.
 * - Position Leaderboards:
 *   Top Batsman, Top Bowler, Top All-Rounder, Best Fielder.
 * 
 * FOOTBALL RANKING LOGIC:
 * - Points Formula:
 *   * +50 points per goal
 *   * +50 points per goalkeeper save
 *   * +30 points per defender save/last-ditch tackle
 * - Ranking Score Formula:
 *   Match Rating = Total Accumulated Points / Total Matches Played
 * - Position Leaderboards:
 *   Best Striker, Best Midfielder, Best Defender, Best Goalkeeper.
 * 
 * DATA INTEGRITY PRINCIPLE:
 * - Only official matches (isOfficial !== false && !isSimulated) count towards player rankings.
 */

// Cricket Point Weights
export const CRICKET_POINTS = {
  RUN: 5,
  WICKET: 15,
  CATCH: 10,
};

// Football Point Weights
export const FOOTBALL_POINTS = {
  GOAL: 50,
  GK_SAVE: 50,
  DEF_SAVE_OR_TACKLE: 30,
};

export interface CricketAggregatedProfile {
  playerId: string;
  playerName: string;
  teamName: string;
  format: CricketFormat;
  matchesPlayed: number;
  totalRuns: number;
  totalBalls: number;
  totalFours: number;
  totalSixes: number;
  highestScore: number;
  fifties: number; // dynamically computed
  centuries: number; // dynamically computed
  totalWickets: number;
  totalRunsConceded: number;
  totalOversBowled: number;
  bowlingAverage: number;
  bowlingStrikeRate: number;
  bestBowlingFigures: string;
  totalCatches: number;
  totalRunOuts: number;
  totalStumpings: number;
  totalPoints: number;
  matchRating: number;
  battingAverage: number;
  strikeRate: number;
  bowlingEconomy: number;
  category: 'batsman' | 'bowler' | 'all_rounder' | 'fielder';
}

export interface FootballAggregatedProfile {
  playerId: string;
  playerName: string;
  teamName: string;
  matchesPlayed: number;
  minutesPlayed: number;
  // Physical & Skill Ratings (0-100)
  speedRating: number;
  sprint100mSec?: number;
  defensePower: number;
  strikingAttackPower: number;
  passing: number;
  dribbling: number;
  // Performance Metrics
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  gkSaves: number;
  cleanSheets: number;
  defenderSavesOrTackles: number;
  successfulTackles: number;
  yellowCards: number;
  redCards: number;
  totalPoints: number;
  matchRating: number;
  category: 'striker' | 'midfielder' | 'defender' | 'goalkeeper';
}

/**
 * Filter stats strictly by verified official match IDs
 */
export function filterOfficialCricketStats(
  stats: StatsCricket[],
  officialMatchIds?: Set<string>
): StatsCricket[] {
  if (!officialMatchIds) return stats;
  return stats.filter((s) => officialMatchIds.has(s.matchId));
}

export function filterOfficialFootballStats(
  stats: StatsFootball[],
  officialMatchIds?: Set<string>
): StatsFootball[] {
  if (!officialMatchIds) return stats;
  return stats.filter((s) => officialMatchIds.has(s.matchId));
}

/**
 * Compute Cricket Rankings for a given format or all formats
 */
export function computeCricketRankings(
  statsList: StatsCricket[],
  targetFormat?: CricketFormat
): CricketAggregatedProfile[] {
  const filtered = targetFormat
    ? statsList.filter((s) => s.format === targetFormat)
    : statsList;

  const playerMap = new Map<string, {
    playerId: string;
    playerName: string;
    teamName: string;
    format: CricketFormat;
    matchIds: Set<string>;
    totalRuns: number;
    totalBalls: number;
    totalFours: number;
    totalSixes: number;
    highestScore: number;
    fifties: number;
    centuries: number;
    outs: number;
    totalWickets: number;
    totalRunsConceded: number;
    totalOversBowled: number;
    bestWickets: number;
    bestRunsConceded: number;
    totalCatches: number;
    totalRunOuts: number;
    totalStumpings: number;
  }>();

  for (const s of filtered) {
    const key = `${s.playerId}_${s.format}`;
    let p = playerMap.get(key);
    if (!p) {
      p = {
        playerId: s.playerId,
        playerName: s.playerName || 'Player',
        teamName: s.teamName || 'Independent',
        format: s.format,
        matchIds: new Set<string>(),
        totalRuns: 0,
        totalBalls: 0,
        totalFours: 0,
        totalSixes: 0,
        highestScore: 0,
        fifties: 0,
        centuries: 0,
        outs: 0,
        totalWickets: 0,
        totalRunsConceded: 0,
        totalOversBowled: 0,
        bestWickets: 0,
        bestRunsConceded: 999,
        totalCatches: 0,
        totalRunOuts: 0,
        totalStumpings: 0,
      };
      playerMap.set(key, p);
    }

    if (s.matchId) p.matchIds.add(s.matchId);
    const runs = s.runsScored || 0;
    p.totalRuns += runs;
    p.totalBalls += s.ballsFaced || 0;
    p.totalFours += s.fours || 0;
    p.totalSixes += s.sixes || 0;
    if (runs > p.highestScore) p.highestScore = runs;

    // Apply ASCEND Dynamic Milestone Evaluation
    const defaultOvers = s.format?.toLowerCase() === 'test' ? 90 : 20;
    const milestoneRes = evaluateBattingMilestone(runs, defaultOvers, s.format);
    if (milestoneRes.isCentury) {
      p.centuries += 1;
    } else if (milestoneRes.isFifty) {
      p.fifties += 1;
    }

    if (s.isOut) p.outs += 1;
    const wickets = s.wicketsTaken || 0;
    p.totalWickets += wickets;
    p.totalRunsConceded += s.runsConceded || 0;
    p.totalOversBowled += s.oversBowled || 0;

    // Best Bowling Figures tracking
    if (wickets > 0) {
      const runsConceded = s.runsConceded || 0;
      if (
        wickets > p.bestWickets ||
        (wickets === p.bestWickets && runsConceded < p.bestRunsConceded)
      ) {
        p.bestWickets = wickets;
        p.bestRunsConceded = runsConceded;
      }
    }

    p.totalCatches += s.catches || 0;
    p.totalRunOuts += s.runOuts || 0;
    p.totalStumpings += s.stumpings || 0;
  }

  const results: CricketAggregatedProfile[] = [];

  for (const p of playerMap.values()) {
    const matchesPlayed = Math.max(p.matchIds.size, 1);
    
    // Formula: +5 per run, +15 per wicket, +10 per catch
    const totalPoints =
      p.totalRuns * CRICKET_POINTS.RUN +
      p.totalWickets * CRICKET_POINTS.WICKET +
      p.totalCatches * CRICKET_POINTS.CATCH;

    // Formula: Match Rating = Total Points / Total Matches Played
    const matchRating = Math.round((totalPoints / matchesPlayed) * 10) / 10;

    const battingAverage =
      p.outs > 0 ? Math.round((p.totalRuns / p.outs) * 10) / 10 : p.totalRuns;

    const strikeRate =
      p.totalBalls > 0
        ? Math.round(((p.totalRuns * 100) / p.totalBalls) * 10) / 10
        : 0;

    const bowlingEconomy =
      p.totalOversBowled > 0
        ? Math.round((p.totalRunsConceded / p.totalOversBowled) * 10) / 10
        : 0;

    const bowlingAverage =
      p.totalWickets > 0
        ? Math.round((p.totalRunsConceded / p.totalWickets) * 10) / 10
        : 0;

    const bowlingStrikeRate =
      p.totalWickets > 0
        ? Math.round(((p.totalOversBowled * 6) / p.totalWickets) * 10) / 10
        : 0;

    const bestBowlingFigures =
      p.bestWickets > 0
        ? `${p.bestWickets}/${p.bestRunsConceded}`
        : p.totalWickets > 0
        ? `${p.totalWickets}/${p.totalRunsConceded}`
        : '-';

    // Position Categorization Logic
    let category: 'batsman' | 'bowler' | 'all_rounder' | 'fielder' = 'batsman';
    if (p.totalWickets >= 3 && p.totalRuns >= 50) {
      category = 'all_rounder';
    } else if (p.totalWickets >= 3 || (p.totalWickets > 0 && p.totalRuns < 20)) {
      category = 'bowler';
    } else if (p.totalCatches >= 3 && p.totalRuns < 25 && p.totalWickets === 0) {
      category = 'fielder';
    } else {
      category = 'batsman';
    }

    results.push({
      playerId: p.playerId,
      playerName: p.playerName,
      teamName: p.teamName,
      format: p.format,
      matchesPlayed,
      totalRuns: p.totalRuns,
      totalBalls: p.totalBalls,
      totalFours: p.totalFours,
      totalSixes: p.totalSixes,
      highestScore: p.highestScore,
      fifties: p.fifties,
      centuries: p.centuries,
      totalWickets: p.totalWickets,
      totalRunsConceded: p.totalRunsConceded,
      totalOversBowled: p.totalOversBowled,
      bowlingAverage,
      bowlingStrikeRate,
      bestBowlingFigures,
      totalCatches: p.totalCatches,
      totalRunOuts: p.totalRunOuts,
      totalStumpings: p.totalStumpings,
      totalPoints,
      matchRating,
      battingAverage,
      strikeRate,
      bowlingEconomy,
      category,
    });
  }

  // Sort descending by Match Rating
  return results.sort((a, b) => b.matchRating - a.matchRating);
}

/**
 * Compute Football Rankings
 */
export function computeFootballRankings(
  statsList: StatsFootball[]
): FootballAggregatedProfile[] {
  const playerMap = new Map<string, {
    playerId: string;
    playerName: string;
    teamName: string;
    matchIds: Set<string>;
    minutesPlayed: number;
    goals: number;
    assists: number;
    shots: number;
    shotsOnTarget: number;
    gkSaves: number;
    cleanSheets: number;
    tackles: number;
    interceptions: number;
    yellowCards: number;
    redCards: number;
  }>();

  for (const s of statsList) {
    let p = playerMap.get(s.playerId);
    if (!p) {
      p = {
        playerId: s.playerId,
        playerName: s.playerName || 'Player',
        teamName: s.teamName || 'Independent',
        matchIds: new Set<string>(),
        minutesPlayed: 0,
        goals: 0,
        assists: 0,
        shots: 0,
        shotsOnTarget: 0,
        gkSaves: 0,
        cleanSheets: 0,
        tackles: 0,
        interceptions: 0,
        yellowCards: 0,
        redCards: 0,
      };
      playerMap.set(s.playerId, p);
    }

    if (s.matchId) p.matchIds.add(s.matchId);
    p.minutesPlayed += s.minutesPlayed || 0;
    p.goals += s.goals || 0;
    p.assists += s.assists || 0;
    p.shots += s.shots || 0;
    p.shotsOnTarget += s.shotsOnTarget || 0;
    p.gkSaves += s.saves || 0;
    if (s.cleanSheet) p.cleanSheets += 1;
    p.tackles += s.tackles || 0;
    p.interceptions += s.interceptions || 0;
    p.yellowCards += s.yellowCards || 0;
    p.redCards += s.redCards || 0;
  }

  const results: FootballAggregatedProfile[] = [];

  for (const p of playerMap.values()) {
    const matchesPlayed = Math.max(p.matchIds.size, 1);
    const defenderSavesOrTackles = p.tackles + p.interceptions;

    // Formula: +50 per goal, +50 per gk save, +30 per defender save/tackle
    const totalPoints =
      p.goals * FOOTBALL_POINTS.GOAL +
      p.gkSaves * FOOTBALL_POINTS.GK_SAVE +
      defenderSavesOrTackles * FOOTBALL_POINTS.DEF_SAVE_OR_TACKLE;

    // Formula: Match Rating = Total Points / Total Matches Played
    const matchRating = Math.round((totalPoints / matchesPlayed) * 10) / 10;

    // Position Categorization
    let category: 'striker' | 'midfielder' | 'defender' | 'goalkeeper' = 'striker';
    if (p.gkSaves >= 2 || (p.gkSaves > 0 && p.goals === 0)) {
      category = 'goalkeeper';
    } else if (defenderSavesOrTackles >= 4 || p.cleanSheets > 0) {
      category = 'defender';
    } else if (p.assists >= 2 || (p.goals <= 1 && p.assists > 0)) {
      category = 'midfielder';
    } else {
      category = 'striker';
    }

    // Physical & Skill Ratings Calculations (0-100 Rating & 100m sprint time)
    const speedRating = Math.min(99, Math.max(65, Math.round(78 + (p.goals * 2) + (p.assists * 1.5) + (p.tackles * 0.4))));
    const sprint100mSec = Math.round((13.8 - ((speedRating - 65) / 34) * 3.2) * 100) / 100;
    const defensePower = Math.min(99, Math.max(60, Math.round(68 + (defenderSavesOrTackles * 2.8) + (p.cleanSheets * 6) + (p.gkSaves * 2))));
    const strikingAttackPower = Math.min(99, Math.max(60, Math.round(70 + (p.goals * 4) + (p.shotsOnTarget * 2))));
    const passing = Math.min(99, Math.max(62, Math.round(72 + (p.assists * 5) + (p.minutesPlayed > 90 ? 4 : 2))));
    const dribbling = Math.min(99, Math.max(64, Math.round(74 + (p.goals * 2.5) + (p.assists * 2.5))));

    results.push({
      playerId: p.playerId,
      playerName: p.playerName,
      teamName: p.teamName,
      matchesPlayed,
      minutesPlayed: p.minutesPlayed,
      speedRating,
      sprint100mSec,
      defensePower,
      strikingAttackPower,
      passing,
      dribbling,
      goals: p.goals,
      assists: p.assists,
      shots: p.shots,
      shotsOnTarget: p.shotsOnTarget,
      gkSaves: p.gkSaves,
      cleanSheets: p.cleanSheets,
      defenderSavesOrTackles,
      successfulTackles: p.tackles,
      yellowCards: p.yellowCards,
      redCards: p.redCards,
      totalPoints,
      matchRating,
      category,
    });
  }

  // Sort descending by Match Rating
  return results.sort((a, b) => b.matchRating - a.matchRating);
}
