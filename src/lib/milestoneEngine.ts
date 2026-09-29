import { CricketFormat } from '../types/models';

export interface MilestoneEvaluation {
  isFifty: boolean;
  isCentury: boolean;
  milestoneBadge: '100' | '50' | null;
  milestoneTitle: string | null;
  ruleDescription: string;
  isDynamicRuleActive: boolean;
  thresholdOvers: number;
}

/**
 * Determines whether a batter's score qualifies as a 50 (Half-Century) or 100 (Century)
 * under ASCEND Dynamic Milestone Threshold Rules:
 *
 * A) Limited Overs / Short Formats (T20, ODI, Local formats):
 *    - Inning/Match Overs <= 12 overs:
 *      * 30 to 59 runs = 50 (Half-Century)
 *      * 60+ runs = 100 (Century)
 *    - Inning/Match Overs > 12 overs:
 *      * 50 to 99 runs = 50 | 100+ runs = 100 (Standard)
 *
 * B) Test Match Format:
 *    - Inning/Match Overs <= 45 overs:
 *      * 30 to 59 runs = 50 (Half-Century)
 *      * 60+ runs = 100 (Century)
 *    - Inning/Match Overs > 45 overs:
 *      * 50 to 99 runs = 50 | 100+ runs = 100 (Standard)
 */
export function evaluateBattingMilestone(
  runs: number,
  oversThreshold: number = 20,
  format: CricketFormat | string = 't20'
): MilestoneEvaluation {
  const normFormat = (format || 't20').toString().toLowerCase();
  const isTest = normFormat === 'test';

  const threshold = isTest ? 45 : 12;
  const isDynamicRuleActive = oversThreshold <= threshold;

  let isFifty = false;
  let isCentury = false;
  let milestoneBadge: '100' | '50' | null = null;
  let milestoneTitle: string | null = null;
  let ruleDescription = '';

  if (isDynamicRuleActive) {
    // Dynamic rule applies (<= 12 overs for Limited/Short or <= 45 overs for Test)
    if (runs >= 60) {
      isCentury = true;
      milestoneBadge = '100';
      milestoneTitle = `Dynamic Century (60+ runs in ≤${threshold} ov format)`;
      ruleDescription = `Achieved Century milestone via Dynamic Rule (60+ runs in ≤${threshold} overs threshold)`;
    } else if (runs >= 30) {
      isFifty = true;
      milestoneBadge = '50';
      milestoneTitle = `Dynamic Half-Century (30+ runs in ≤${threshold} ov format)`;
      ruleDescription = `Achieved Half-Century milestone via Dynamic Rule (30-59 runs in ≤${threshold} overs threshold)`;
    } else {
      ruleDescription = `Standard progression (< 30 runs in ≤${threshold} overs)`;
    }
  } else {
    // Standard rule applies (> 12 overs for Limited or > 45 overs for Test)
    if (runs >= 100) {
      isCentury = true;
      milestoneBadge = '100';
      milestoneTitle = 'Standard Century (100+ runs)';
      ruleDescription = 'Standard Century milestone (100+ runs)';
    } else if (runs >= 50) {
      isFifty = true;
      milestoneBadge = '50';
      milestoneTitle = 'Standard Half-Century (50+ runs)';
      ruleDescription = 'Standard Half-Century milestone (50-99 runs)';
    } else {
      ruleDescription = `Standard progression (< 50 runs in >${threshold} overs)`;
    }
  }

  return {
    isFifty,
    isCentury,
    milestoneBadge,
    milestoneTitle,
    ruleDescription,
    isDynamicRuleActive,
    thresholdOvers: threshold,
  };
}

/**
 * Computes aggregate batting milestones (50s, 100s, Highest Score) across all historical match innings
 */
export function aggregatePlayerMilestones(
  inningsList: Array<{
    runsScored: number;
    format?: CricketFormat | string;
    matchOvers?: number;
    oversFaced?: number;
  }>
): {
  fifties: number;
  centuries: number;
  highestScore: number;
  totalRuns: number;
  dynamic50Count: number;
  dynamic100Count: number;
} {
  let fifties = 0;
  let centuries = 0;
  let dynamic50Count = 0;
  let dynamic100Count = 0;
  let highestScore = 0;
  let totalRuns = 0;

  for (const inn of inningsList) {
    const runs = inn.runsScored || 0;
    totalRuns += runs;
    if (runs > highestScore) highestScore = runs;

    const oversThreshold = inn.matchOvers || (inn.format?.toString().toLowerCase() === 'test' ? 90 : 20);
    const evalResult = evaluateBattingMilestone(runs, oversThreshold, inn.format || 't20');

    if (evalResult.isCentury) {
      centuries += 1;
      if (evalResult.isDynamicRuleActive && runs < 100) {
        dynamic100Count += 1;
      }
    } else if (evalResult.isFifty) {
      fifties += 1;
      if (evalResult.isDynamicRuleActive && runs < 50) {
        dynamic50Count += 1;
      }
    }
  }

  return {
    fifties,
    centuries,
    highestScore,
    totalRuns,
    dynamic50Count,
    dynamic100Count,
  };
}
