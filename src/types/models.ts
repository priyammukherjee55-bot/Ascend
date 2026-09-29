export type SportType = 'cricket' | 'football';
export type UserRole = 'player' | 'organizer' | 'admin';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'semi-pro' | 'pro';
export type AvailabilityType = 'available_now' | 'weekends' | 'evenings' | 'all';
export type TeamSeekingStatus = 'looking_for_team' | 'looking_for_players' | 'none';
export type CommentaryLanguage = 'en' | 'hi' | 'bn';
export type FootballCommentaryStyle = 'worldcup' | 'epl' | 'laliga' | 'sidhu';

// Location Model
export interface UserLocation {
  country?: string;
  state?: string;
  district?: string;
  city: string;
  locality?: string;
  geohash?: string;
  latitude?: number;
  longitude?: number;
}

// Cricket Profile Model
export type CricketBattingStyle = 'RHB' | 'LHB';
export type CricketBattingPosition = 'Opener' | 'Top Order' | 'Middle Order' | 'Lower Order' | 'Tailender';
export type CricketBowlingStyle =
  | 'Right-arm Fast'
  | 'Right-arm Medium'
  | 'Right-arm Off-Spin'
  | 'Right-arm Leg-Spin'
  | 'Left-arm Fast'
  | 'Left-arm Medium'
  | 'Slow Left-arm Orthodox'
  | 'Left-arm Wrist-Spin (Chinaman)'
  | 'None';
export type CricketFormat = 'Test' | 'ODI' | 'T20' | 'test' | 'odi' | 't20';

export type NavTab =
  | 'home'
  | 'cricket'
  | 'football'
  | 'nearby'
  | 'players'
  | 'teams'
  | 'matches'
  | 'live'
  | 'tournaments'
  | 'leagues'
  | 'rankings'
  | 'statistics'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'admin'
  | 'arena';

export interface CricketProfile {
  battingStyle: CricketBattingStyle;
  battingPosition: CricketBattingPosition;
  bowlingStyle: CricketBowlingStyle;
  isWicketKeeper: boolean;
  preferredFormats: CricketFormat[];
  jerseyNumber?: number;
}

// Football Profile Model
export type FootballFoot = 'Left' | 'Right' | 'Both';
export type FootballPosition =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'LWB'
  | 'RWB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'LM'
  | 'RM'
  | 'LW'
  | 'RW'
  | 'ST'
  | 'CF';

export interface FootballProfile {
  preferredFoot: FootballFoot;
  primaryPosition: FootballPosition;
  secondaryPosition?: FootballPosition;
  characteristics: string[];
  jerseyNumber?: number;
}

// Ability Testing & Physical Skill Models
export type AbilityTestType =
  | 'speed_100m'
  | 'striking_attack'
  | 'defense_power'
  | 'bowling_radar'
  | 'passing_accuracy'
  | 'dribbling_agility';

export interface AbilityTestRecord {
  id: string;
  userId: string;
  sport: SportType;
  testType: AbilityTestType;
  testTitle: string;
  rawValue: number;
  unit: string;
  calculatedScore: number; // 0-100 rating
  tierLabel: string; // 'World-Class' | 'Elite' | 'Pro' | 'Semi-Pro' | 'Club'
  notes?: string;
  testedAt: number;
}

export interface PlayerAbilityRatings {
  speed: number; // 0-100 rating
  speedScore?: number; // alias
  sprint100mSec?: number; // e.g. 10.8s
  topSpeedKmph?: number; // e.g. 33.4 km/h
  defensePower: number; // 0-100 rating
  defenseScore?: number; // alias
  strikingAttackPower: number; // 0-100 rating
  attackScore?: number; // alias
  shotVelocityKmph?: number; // e.g. 115 km/h
  passing: number; // 0-100 rating
  passingScore?: number; // alias
  dribbling: number; // 0-100 rating
  dribblingScore?: number; // alias
  bowlingRadarKmph?: number; // cricket bowling speed e.g. 142 km/h
  overallRating: number; // weighted average 0-100
  overallScore?: number; // alias
  abilityTier?: string; // e.g. 'World-Class' | 'Elite' | 'Pro'
  lastTestedAt?: number;
  totalTestsLogged?: number;
}

// Detailed Custom Cricket Stats
export interface CricketDetailedStats {
  // Batting
  totalRuns: number;
  strikeRate: number;
  battingAverage: number;
  highestScore: number;
  fifties: number; // Dynamic milestone based
  centuries: number; // Dynamic milestone based
  fours: number;
  sixes: number;
  ballsFaced: number;
  inningsBatted: number;
  notOuts: number;
  // Bowling
  totalWickets: number;
  bowlingEconomy: number;
  bowlingAverage: number;
  bowlingStrikeRate: number;
  bestBowlingFigures: string; // e.g. "4/16"
  oversBowled: number;
  runsConceded: number;
  maidens: number;
  inningsBowled: number;
}

// Detailed Custom Football Stats
export interface FootballDetailedStats {
  goals: number;
  assists: number;
  cleanSheets: number;
  gkSaves: number;
  successfulTackles: number;
  interceptions: number;
  minutesPlayed: number;
  matchesPlayed: number;
  shotsOnTarget: number;
  shotAccuracyPercent: number;
  passAccuracyPercent: number;
}

// Main User Model
export interface AppUser {
  id: string; // Firebase Auth UID
  email: string;
  name: string;
  photoUrl?: string;
  phone?: string;
  age?: number;
  role: UserRole;
  isSuspended?: boolean;
  experienceLevel: ExperienceLevel;
  location: UserLocation;
  bio: string;
  activeSports: SportType[];
  cricketProfile?: CricketProfile;
  footballProfile?: FootballProfile;
  abilityRatings?: PlayerAbilityRatings;
  cricketStats?: CricketDetailedStats;
  footballStats?: FootballDetailedStats;
  customStats?: {
    cricket?: Partial<CricketDetailedStats> & {
      totalRuns?: number;
      strikeRate?: number;
      battingAvg?: number;
      highestScore?: number | string;
      fifties?: number;
      centuries?: number;
      fours?: number;
      sixes?: number;
      totalWickets?: number;
      economyRate?: number;
      bowlingAvg?: number;
      bowlingStrikeRate?: number;
      bestBowlingFigures?: string;
    };
    football?: Partial<FootballDetailedStats> & {
      goals?: number;
      assists?: number;
      cleanSheets?: number;
      goalkeeperSaves?: number;
      gkSaves?: number;
      successfulTackles?: number;
    };
  };
  availability?: AvailabilityType;
  teamStatus?: TeamSeekingStatus;
  isVerified?: boolean;
  followersCount?: number;
  createdAt: number;
  updatedAt: number;
}

// Saved Search Configuration
export interface SavedSearchConfig {
  id: string;
  userId: string;
  title: string;
  sport: SportType;
  radiusKm: number;
  locationName: string;
  lat?: number;
  lon?: number;
  filters: Record<string, any>;
  createdAt: number;
}

// Recent Search Item
export interface RecentSearchItem {
  id: string;
  queryText: string;
  sport: SportType;
  radiusKm: number;
  cityName: string;
  timestamp: number;
}

// Team Member Model
export interface TeamMember {
  userId: string;
  name: string;
  role: 'captain' | 'vice_captain' | 'player';
  joinedAt: number;
  photoUrl?: string;
  jerseyNumber?: number;
  battingRole?: string;
  bowlingRole?: string;
  pitchPosition?: string;
}

// Team Join Request
export interface TeamJoinRequest {
  id: string;
  teamId: string;
  teamName: string;
  sport: SportType;
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  createdAt: number;
}

// Team Model
export interface TeamItem {
  id: string;
  sport: SportType;
  name: string;
  shortName: string;
  logoUrl?: string;
  city: string;
  district?: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  geohash?: string;
  captainId: string;
  captainName: string;
  viceCaptainId?: string;
  viceCaptainName?: string;
  membersCount: number;
  playerIds: string[];
  members?: TeamMember[];
  isLookingForPlayers?: boolean;
  isVerified?: boolean;
  createdAt: number;
}

// Team Invitation Model
export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  sport: SportType;
  senderId: string;
  senderName: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: number;
}

// Follow Model
export interface FollowRecord {
  id: string;
  followerId: string;
  targetUserId: string;
  createdAt: number;
}

// Match Toss Model
export interface MatchTossInfo {
  executed: boolean;
  executedBy: string;
  executedByName: string;
  executedAt: number;
  winnerTeamId: string;
  winnerTeamName: string;
  choice: 'bat' | 'bowl' | 'kickoff' | 'side';
  zoneLanded: 'HEAD' | 'TAIL';
}

// Live Cricket Batter State
export interface LiveBatter {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isStriker: boolean;
  isOut?: boolean;
  dismissal?: string;
}

// Live Cricket Bowler State
export interface LiveBowler {
  name: string;
  bowlingType: 'fast' | 'spin' | 'medium';
  overs: number;
  ballsThisOver: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

// Live Cricket Innings State
export interface LiveCricketState {
  currentInnings: 1 | 2 | 3 | 4;
  battingTeamId: string;
  battingTeamName: string;
  bowlingTeamId: string;
  bowlingTeamName: string;
  runs: number;
  wickets: number;
  overs: number;
  ballsInCurrentOver: number;
  targetRuns?: number;
  maxOvers?: number;
  striker: LiveBatter;
  nonStriker: LiveBatter;
  currentBowler: LiveBowler;
  currentOverBalls: string[];
  allBatters?: LiveBatter[];
  allBowlers?: LiveBowler[];
  fallOfWickets?: Array<{
    score: number;
    wicketNumber: number;
    batterName: string;
    over: string;
  }>;
  totalExtras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penaltyRuns?: number;
  };
  powerplayStatus?: {
    active: boolean;
    type: 'mandatory' | 'batting' | 'bowling' | 'last_over' | 'none';
    startOver?: number;
    endOver?: number;
  };
  isFastBounceWarning?: boolean;
}

// Live Football Match State
export interface LiveFootballEvent {
  minute: number;
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'sub' | 'penalty_goal' | 'penalty_miss';
  teamId: string;
  teamName: string;
  playerName: string;
  secondaryPlayerName?: string;
  detail?: string;
}

export interface LiveFootballState {
  currentMinute: number;
  period: '1H' | 'HT' | '2H' | 'FT' | 'ET1' | 'ET2' | 'PEN';
  isTimerRunning: boolean;
  teamAGoals: number;
  teamBGoals: number;
  teamAYellows: number;
  teamBYellows: number;
  teamAReds: number;
  teamBReds: number;
  events: LiveFootballEvent[];
  penaltyShootout?: {
    teamAScores: number;
    teamBScores: number;
    teamAPens: ('goal' | 'miss')[];
    teamBPens: ('goal' | 'miss')[];
  };
}

// Match Model
export interface MatchItem {
  id: string;
  sport: SportType;
  title: string;
  status: 'upcoming' | 'toss_completed' | 'live' | 'completed' | 'cancelled';
  isOfficial?: boolean; // Data integrity flag: true = official tournament/league, false = casual/simulated
  isSimulated?: boolean;
  venue: string;
  city: string;
  teamAId: string;
  teamAName: string;
  teamALogo?: string;
  teamAScore?: string;
  teamBId: string;
  teamBName: string;
  teamBLogo?: string;
  teamBScore?: string;
  currentOverOrMinute?: string;
  scheduledAt: number;
  tournamentId?: string;
  tournamentName?: string;
  format?: CricketFormat | 'standard_football';
  roundNumber?: number;
  stageName?: string;
  matchNumber?: number;
  organizerId: string;
  toss?: MatchTossInfo;
  // Cricket live state persistence
  cricketState?: LiveCricketState;
  innings1?: LiveCricketState;
  innings2?: LiveCricketState;
  innings3?: LiveCricketState;
  innings4?: LiveCricketState;
  maxOvers?: number;
  halfDurationMinutes?: number;
  matchType?: 'international' | 'local_club' | 'friendly' | 'tournament';
  // Football live state persistence
  footballState?: LiveFootballState;
  // Result fields
  winnerId?: string;
  winnerName?: string;
  isDrawOrTie?: boolean;
  teamARuns?: number;
  teamABalls?: number;
  teamAWickets?: number;
  teamBRuns?: number;
  teamBBalls?: number;
  teamBWickets?: number;
  teamAGoals?: number;
  teamBGoals?: number;
}

// Admin Audit Log Model
export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: 'score_correction' | 'user_role_change' | 'user_suspension' | 'verification_change' | 'data_integrity_check';
  targetType: 'match' | 'user' | 'tournament';
  targetId: string;
  targetTitle: string;
  previousValue: any;
  newValue: any;
  reason: string;
  timestamp: number;
}

// Dynamic Ranking Models
export interface CricketPlayerRanking {
  playerId: string;
  playerName: string;
  teamName: string;
  format: CricketFormat;
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
  totalCatches: number;
  totalPoints: number; // Runs * 5 + Wickets * 15 + Catches * 10
  matchRating: number; // Total Points / Matches Played
  category: 'batsman' | 'bowler' | 'all_rounder' | 'fielder';
}

export interface FootballPlayerRanking {
  playerId: string;
  playerName: string;
  teamName: string;
  matchesPlayed: number;
  goals: number;
  gkSaves: number;
  defenderSavesOrTackles: number;
  totalPoints: number; // Goals * 50 + GK Saves * 50 + Def Saves/Tackles * 30
  matchRating: number; // Total Points / Matches Played
  category: 'striker' | 'midfielder' | 'defender' | 'goalkeeper';
}

// Tournament Structure Models
export type TournamentFormat = 'round_robin' | 'knockout' | 'group_knockout';
export type KnockoutBracketSize = 32 | 16 | 8 | 4;

export interface TournamentItem {
  id: string;
  sport: SportType;
  name: string;
  city: string;
  format: TournamentFormat;
  bracketSize?: KnockoutBracketSize;
  groupCount?: number;
  teamsPerGroup?: number;
  startDate: number;
  endDate: number;
  teamsCount: number;
  maxTeams: number;
  registeredTeamIds: string[];
  registeredTeams?: { id: string; name: string; logoUrl?: string }[];
  prizePool?: string;
  organizerId: string;
  organizerName: string;
  status: 'open' | 'fixtures_generated' | 'ongoing' | 'finished';
  createdAt: number;
}

// Calculated Points Table Rows
export interface CricketPointsRow {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  nr: number;
  points: number;
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
  netRunRate: number;
}

export interface FootballPointsRow {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

// Commentary Log Model
export interface CommentaryLog {
  id: string;
  matchId: string;
  sport: SportType;
  timestamp: number;
  periodOrOver: string;
  ballOrMinute?: number;
  eventType:
    | 'cricket_run'
    | 'cricket_boundary'
    | 'cricket_wicket'
    | 'cricket_extra'
    | 'football_goal'
    | 'football_card'
    | 'football_sub'
    | 'football_foul'
    | 'football_penalty'
    | 'football_save'
    | 'football_tackle'
    | 'general';
  textEn: string;
  textHi: string;
  textBn: string;
  headline?: string;
  description?: string;
  authorId?: string;
  authorName?: string;
  scoreSnapshot?: string;
  bowlerSpeedKmph?: number;
  bowlerSpeedMph?: number;
  bowlerStyle?: 'fast' | 'spin' | 'medium';
  isSidhuism?: boolean;
  commentaryStyle?: FootballCommentaryStyle;
}

// Match Statistics Models
export interface StatsCricket {
  id: string;
  matchId: string;
  tournamentId?: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  format: CricketFormat;
  innings: 1 | 2;
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalType?: 'bowled' | 'caught' | 'lbw' | 'run-out' | 'stumped' | 'hit-wicket' | 'not-out';
  oversBowled: number;
  maidens: number;
  runsConceded: number;
  wicketsTaken: number;
  economy: number;
  catches: number;
  runOuts: number;
  stumpings: number;
  createdAt: number;
}

export interface StatsFootball {
  id: string;
  matchId: string;
  tournamentId?: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passesCompleted: number;
  tackles: number;
  interceptions: number;
  saves?: number;
  cleanSheet?: boolean;
  yellowCards: number;
  redCards: number;
  createdAt: number;
}

// Notification Model
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'team' | 'system' | 'role' | 'invite';
  read: boolean;
  createdAt: number;
}
