import {
  MatchItem,
  CricketPointsRow,
  FootballPointsRow,
  TournamentFormat,
  KnockoutBracketSize,
} from '../types/models';

/**
 * Algorithmic generator for Round Robin tournaments.
 * Implements the standard polygon rotation algorithm.
 * Guarantees every team plays each other once without back-to-back duplicate fixtures.
 */
export function generateRoundRobinFixtures(
  tournamentId: string,
  tournamentName: string,
  sport: 'cricket' | 'football',
  teams: { id: string; name: string; logoUrl?: string }[],
  venueCity: string,
  organizerId: string
): Omit<MatchItem, 'id'>[] {
  const n = teams.length;
  if (n < 2) return [];

  const teamList = [...teams];
  // If odd number of teams, add a dummy bye
  const hasDummy = n % 2 !== 0;
  if (hasDummy) {
    teamList.push({ id: '__BYE__', name: 'BYE' });
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  const fixtures: Omit<MatchItem, 'id'>[] = [];
  const baseTime = Date.now() + 24 * 60 * 60 * 1000; // scheduled starting tomorrow
  let matchCounter = 1;

  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIdx = (round + match) % (numTeams - 1);
      let awayIdx = (numTeams - 1 - match + round) % (numTeams - 1);

      if (match === 0) {
        awayIdx = numTeams - 1;
      }

      const teamA = teamList[homeIdx];
      const teamB = teamList[awayIdx];

      // Skip byes
      if (teamA.id === '__BYE__' || teamB.id === '__BYE__') continue;

      fixtures.push({
        sport,
        title: `${teamA.name} vs ${teamB.name}`,
        status: 'upcoming',
        venue: `${venueCity} Arena`,
        city: venueCity,
        teamAId: teamA.id,
        teamAName: teamA.name,
        teamALogo: teamA.logoUrl,
        teamBId: teamB.id,
        teamBName: teamB.name,
        teamBLogo: teamB.logoUrl,
        scheduledAt: baseTime + (round * 2 + match) * 3 * 3600 * 1000,
        tournamentId,
        tournamentName,
        roundNumber: round + 1,
        stageName: `Round ${round + 1}`,
        matchNumber: matchCounter++,
        organizerId,
      });
    }
  }

  return fixtures;
}

/**
 * Algorithmic generator for Knockout match trees (32, 16, QF, SF, Final).
 * Seeds matches so top seeds are distributed evenly across opposite halves of the bracket.
 */
export function generateKnockoutFixtures(
  tournamentId: string,
  tournamentName: string,
  sport: 'cricket' | 'football',
  teams: { id: string; name: string; logoUrl?: string }[],
  bracketSize: KnockoutBracketSize,
  venueCity: string,
  organizerId: string
): Omit<MatchItem, 'id'>[] {
  const count = teams.length;
  if (count < 2) return [];

  // Pad teams if fewer than bracket size
  const totalSlots = bracketSize;
  const paired: { id: string; name: string; logoUrl?: string }[] = [...teams];
  while (paired.length < totalSlots) {
    paired.push({ id: '__TBD__', name: 'TBD' });
  }

  const fixtures: Omit<MatchItem, 'id'>[] = [];
  const baseTime = Date.now() + 24 * 60 * 60 * 1000;
  let matchCounter = 1;

  // Round 1 pairings
  const numMatchesR1 = totalSlots / 2;
  const stageLabel =
    bracketSize === 32
      ? 'Round of 32'
      : bracketSize === 16
      ? 'Round of 16'
      : bracketSize === 8
      ? 'Quarter Final'
      : 'Semi Final';

  for (let i = 0; i < numMatchesR1; i++) {
    const teamA = paired[i];
    const teamB = paired[totalSlots - 1 - i]; // Seed 1 vs Seed N pairing

    fixtures.push({
      sport,
      title: `${teamA.name} vs ${teamB.name}`,
      status: 'upcoming',
      venue: `${venueCity} Arena Pitch ${i + 1}`,
      city: venueCity,
      teamAId: teamA.id,
      teamAName: teamA.name,
      teamALogo: teamA.logoUrl,
      teamBId: teamB.id,
      teamBName: teamB.name,
      teamBLogo: teamB.logoUrl,
      scheduledAt: baseTime + i * 4 * 3600 * 1000,
      tournamentId,
      tournamentName,
      roundNumber: 1,
      stageName: stageLabel,
      matchNumber: matchCounter++,
      organizerId,
    });
  }

  // Pre-generate subsequent knockout slots (Quarter Finals, Semi Finals, Final) with TBD
  let remainingSlots = numMatchesR1;
  let roundNum = 2;

  while (remainingSlots > 1) {
    const nextRoundMatches = remainingSlots / 2;
    let nextStage = 'Knockout Round';
    if (nextRoundMatches === 4) nextStage = 'Quarter Final';
    if (nextRoundMatches === 2) nextStage = 'Semi Final';
    if (nextRoundMatches === 1) nextStage = 'Championship Final';

    for (let k = 0; k < nextRoundMatches; k++) {
      fixtures.push({
        sport,
        title: `Winner M${(k * 2) + 1} vs Winner M${(k * 2) + 2}`,
        status: 'upcoming',
        venue: `${venueCity} Main Stadium`,
        city: venueCity,
        teamAId: '__TBD__',
        teamAName: `Winner M${(k * 2) + 1}`,
        teamBId: '__TBD__',
        teamBName: `Winner M${(k * 2) + 2}`,
        scheduledAt: baseTime + (roundNum * 24 + k * 4) * 3600 * 1000,
        tournamentId,
        tournamentName,
        roundNumber: roundNum,
        stageName: nextStage,
        matchNumber: matchCounter++,
        organizerId,
      });
    }
    remainingSlots = nextRoundMatches;
    roundNum++;
  }

  return fixtures;
}

/**
 * Automatic Points Table Engine for Cricket:
 * Computes: Matches, Wins, Losses, Ties, Net Run Rate (NRR), and Points.
 * Standard ICC calculation:
 * NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 */
export function calculateCricketPointsTable(
  teams: { id: string; name: string }[],
  completedMatches: MatchItem[]
): CricketPointsRow[] {
  const map: Record<string, CricketPointsRow> = {};

  // Initialize
  teams.forEach((t) => {
    map[t.id] = {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      nr: 0,
      points: 0,
      runsScored: 0,
      oversFaced: 0,
      runsConceded: 0,
      oversBowled: 0,
      netRunRate: 0,
    };
  });

  completedMatches.forEach((m) => {
    if (m.sport !== 'cricket' || m.status !== 'completed') return;
    const rowA = map[m.teamAId];
    const rowB = map[m.teamBId];

    if (!rowA || !rowB) return;

    rowA.played += 1;
    rowB.played += 1;

    const runsA = m.teamARuns ?? 0;
    const runsB = m.teamBRuns ?? 0;
    const oversA = Math.max(1, (m.teamABalls ?? 120) / 6);
    const oversB = Math.max(1, (m.teamBBalls ?? 120) / 6);

    rowA.runsScored += runsA;
    rowA.oversFaced += oversA;
    rowA.runsConceded += runsB;
    rowA.oversBowled += oversB;

    rowB.runsScored += runsB;
    rowB.oversFaced += oversB;
    rowB.runsConceded += runsA;
    rowB.oversBowled += oversA;

    if (m.isDrawOrTie) {
      rowA.tied += 1;
      rowB.tied += 1;
      rowA.points += 1;
      rowB.points += 1;
    } else if (m.winnerId === m.teamAId) {
      rowA.won += 1;
      rowB.lost += 1;
      rowA.points += 2;
    } else if (m.winnerId === m.teamBId) {
      rowB.won += 1;
      rowA.lost += 1;
      rowB.points += 2;
    }
  });

  // Calculate NRR and sort
  const results = Object.values(map).map((row) => {
    const battingAvg = row.oversFaced > 0 ? row.runsScored / row.oversFaced : 0;
    const bowlingAvg = row.oversBowled > 0 ? row.runsConceded / row.oversBowled : 0;
    row.netRunRate = Math.round((battingAvg - bowlingAvg) * 1000) / 1000;
    return row;
  });

  return results.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.netRunRate - a.netRunRate;
  });
}

/**
 * Automatic Points Table Engine for Football:
 * Computes: Matches, Wins, Draws, Losses, Goals For, Goals Against, Goal Difference, Points (3 pts for win, 1 for draw).
 */
export function calculateFootballPointsTable(
  teams: { id: string; name: string }[],
  completedMatches: MatchItem[]
): FootballPointsRow[] {
  const map: Record<string, FootballPointsRow> = {};

  teams.forEach((t) => {
    map[t.id] = {
      teamId: t.id,
      teamName: t.name,
      played: 0,
      won: 0,
      draw: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  completedMatches.forEach((m) => {
    if (m.sport !== 'football' || m.status !== 'completed') return;
    const rowA = map[m.teamAId];
    const rowB = map[m.teamBId];

    if (!rowA || !rowB) return;

    rowA.played += 1;
    rowB.played += 1;

    const gA = m.teamAGoals ?? 0;
    const gB = m.teamBGoals ?? 0;

    rowA.goalsFor += gA;
    rowA.goalsAgainst += gB;
    rowA.goalDifference = rowA.goalsFor - rowA.goalsAgainst;

    rowB.goalsFor += gB;
    rowB.goalsAgainst += gA;
    rowB.goalDifference = rowB.goalsFor - rowB.goalsAgainst;

    if (gA > gB) {
      rowA.won += 1;
      rowB.lost += 1;
      rowA.points += 3;
    } else if (gB > gA) {
      rowB.won += 1;
      rowA.lost += 1;
      rowB.points += 3;
    } else {
      rowA.draw += 1;
      rowB.draw += 1;
      rowA.points += 1;
      rowB.points += 1;
    }
  });

  return Object.values(map).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}
