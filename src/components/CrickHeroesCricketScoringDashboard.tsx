import React, { useState, useEffect } from 'react';
import {
  MatchItem,
  LiveCricketState,
  LiveBatter,
  LiveBowler,
  CommentaryLog,
} from '../types/models';
import { doc, updateDoc, addDoc, collection, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { generateCricketCommentary } from '../lib/commentaryEngine';
import { evaluateBattingMilestone } from '../lib/milestoneEngine';
import {
  RotateCcw,
  Zap,
  Shield,
  Activity,
  Award,
  AlertCircle,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Radio,
  Trophy,
  Sliders,
  History,
  AlertTriangle,
  Target,
} from 'lucide-react';

interface CrickHeroesCricketScoringDashboardProps {
  match: MatchItem;
  onStateUpdated?: (updatedState: LiveCricketState) => void;
  onConcludeMatch?: () => void;
}

export const CrickHeroesCricketScoringDashboard: React.FC<CrickHeroesCricketScoringDashboardProps> = ({
  match,
  onStateUpdated,
  onConcludeMatch,
}) => {
  const { currentUser, userProfile } = useAuth();
  const isAuthorized =
    currentUser &&
    (userProfile?.role === 'organizer' ||
      userProfile?.role === 'admin' ||
      match.organizerId === currentUser.uid ||
      !match.organizerId);

  // Undo history stack
  const [historyStack, setHistoryStack] = useState<LiveCricketState[]>([]);

  // Squad rosters (supports real registered players or dynamic custom local squads)
  const defaultRosterTeamA = [
    'Rohit Sharma (C)',
    'Shubman Gill',
    'Virat Kohli',
    'KL Rahul (WK)',
    'Suryakumar Yadav',
    'Hardik Pandya',
    'Ravindra Jadeja',
    'Jasprit Bumrah',
    'Mohammed Shami',
    'Kuldeep Yadav',
    'Mohammed Siraj',
  ];

  const defaultRosterTeamB = [
    'David Warner',
    'Travis Head',
    'Mitchell Marsh (C)',
    'Steve Smith',
    'Glenn Maxwell',
    'Alex Carey (WK)',
    'Marcus Stoinis',
    'Pat Cummins',
    'Mitchell Starc',
    'Adam Zampa',
    'Josh Hazlewood',
  ];

  // Current innings state
  const [cricketState, setCricketState] = useState<LiveCricketState>(() => {
    if (match.cricketState) return match.cricketState;
    return {
      currentInnings: 1,
      battingTeamId: match.teamAId,
      battingTeamName: match.teamAName,
      bowlingTeamId: match.teamBId,
      bowlingTeamName: match.teamBName,
      runs: 0,
      wickets: 0,
      overs: 0,
      ballsInCurrentOver: 0,
      maxOvers: match.maxOvers || (match.format?.toString().toLowerCase() === 'test' ? 90 : 20),
      striker: {
        name: defaultRosterTeamA[0],
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isStriker: true,
      },
      nonStriker: {
        name: defaultRosterTeamA[1],
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isStriker: false,
      },
      currentBowler: {
        name: defaultRosterTeamB[8], // Starc / Opening bowler
        bowlingType: 'fast',
        overs: 0,
        ballsThisOver: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
      },
      currentOverBalls: [],
      allBatters: [
        {
          name: defaultRosterTeamA[0],
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isStriker: true,
        },
        {
          name: defaultRosterTeamA[1],
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isStriker: false,
        },
      ],
      allBowlers: [
        {
          name: defaultRosterTeamB[8],
          bowlingType: 'fast',
          overs: 0,
          ballsThisOver: 0,
          maidens: 0,
          runs: 0,
          wickets: 0,
          economy: 0,
        },
      ],
      fallOfWickets: [],
      totalExtras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penaltyRuns: 0 },
      powerplayStatus: { active: true, type: 'mandatory', startOver: 1, endOver: 6 },
      isFastBounceWarning: false,
    };
  });

  // Previous bowler to block consecutive overs
  const [previousBowlerName, setPreviousBowlerName] = useState<string>('');

  // Modals & Panels
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [wicketType, setWicketType] = useState<'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | 'hitwicket'>('caught');
  const [fielderInvolved, setFielderInvolved] = useState<string>('');
  const [nextBatterName, setNextBatterName] = useState<string>('');
  const [customOversModalOpen, setCustomOversModalOpen] = useState(false);
  const [umpireSignalToast, setUmpireSignalToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync state if match prop changes
  useEffect(() => {
    if (match.cricketState) {
      setCricketState(match.cricketState);
    }
  }, [match.cricketState]);

  // Max overs threshold for milestone calculation
  const maxOvers = cricketState.maxOvers || match.maxOvers || 20;

  // Trigger temporary umpire signal toast
  const triggerUmpireSignal = (signal: string) => {
    setUmpireSignalToast(signal);
    setTimeout(() => setUmpireSignalToast(null), 2500);
  };

  // Push state snapshot to history for Undo Last Ball
  const pushHistorySnapshot = (state: LiveCricketState) => {
    setHistoryStack((prev) => [...prev.slice(-15), JSON.parse(JSON.stringify(state))]);
  };

  // Instant Undo Last Ball feature
  const handleUndoLastBall = async () => {
    if (historyStack.length === 0 || saving) return;
    const previousState = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setSaving(true);
    try {
      setCricketState(previousState);
      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, {
        cricketState: previousState,
        teamAScore:
          previousState.battingTeamId === match.teamAId
            ? `${previousState.runs}/${previousState.wickets}`
            : match.teamAScore,
        teamBScore:
          previousState.battingTeamId === match.teamBId
            ? `${previousState.runs}/${previousState.wickets}`
            : match.teamBScore,
        currentOverOrMinute: `Over ${previousState.overs}.${previousState.ballsInCurrentOver}`,
      });
      if (onStateUpdated) onStateUpdated(previousState);
      triggerUmpireSignal('↺ Last Ball Undone');
    } catch (err) {
      console.error('Error undoing ball:', err);
    } finally {
      setSaving(false);
    }
  };

  // Execute ball delivery
  const handleDeliverBall = async (
    runVal: number,
    options: {
      isExtra?: boolean;
      extraType?: 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty';
      isWicket?: boolean;
      wType?: 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | 'hitwicket';
      fielder?: string;
      newBatter?: string;
      isOverthrow?: boolean;
    } = {}
  ) => {
    if (saving) return;
    setSaving(true);

    try {
      // Save snapshot for Undo
      pushHistorySnapshot(cricketState);

      const nextState: LiveCricketState = JSON.parse(JSON.stringify(cricketState));
      const striker = nextState.striker;
      const nonStriker = nextState.nonStriker;
      const bowler = nextState.currentBowler;
      const extras = nextState.totalExtras;
      const currentOverBalls = nextState.currentOverBalls || [];

      let ballSymbol = runVal.toString();
      let isLegalBall = true;
      let commentaryType: any = 'cricket_run';

      if (options.isWicket) {
        ballSymbol = 'W';
        nextState.wickets += 1;
        bowler.wickets += 1;
        striker.balls += 1;
        striker.isOut = true;
        striker.dismissal = options.fielder
          ? `c ${options.fielder} b ${bowler.name}`
          : options.wType === 'bowled'
          ? `b ${bowler.name}`
          : options.wType || 'Out';

        // Add to Fall of Wickets (FOW) timeline
        const fowEntry = {
          score: nextState.runs,
          wicketNumber: nextState.wickets,
          batterName: striker.name,
          over: `${nextState.overs}.${nextState.ballsInCurrentOver + 1}`,
        };
        nextState.fallOfWickets = [...(nextState.fallOfWickets || []), fowEntry];

        triggerUmpireSignal('☝️ OUT! Wicket Fallen');
        commentaryType = 'cricket_wicket';

        // Insert new batter
        const nextName = options.newBatter || `Batter ${nextState.wickets + 2}`;
        striker.name = nextName;
        striker.runs = 0;
        striker.balls = 0;
        striker.fours = 0;
        striker.sixes = 0;
        striker.strikeRate = 0;
        striker.isOut = false;
        striker.dismissal = undefined;
      } else if (options.isExtra) {
        if (options.extraType === 'wide') {
          ballSymbol = `${runVal > 1 ? runVal : ''}Wd`;
          extras.wides = (extras.wides || 0) + runVal;
          nextState.runs += runVal;
          bowler.runs += runVal;
          isLegalBall = false;
          triggerUmpireSignal('↔ WIDE BALL');
          commentaryType = 'cricket_extra';
        } else if (options.extraType === 'noball') {
          ballSymbol = `${runVal > 1 ? runVal : ''}Nb`;
          extras.noBalls = (extras.noBalls || 0) + 1;
          nextState.runs += runVal + 1;
          bowler.runs += runVal + 1;
          striker.runs += runVal;
          if (runVal === 4) striker.fours += 1;
          if (runVal === 6) striker.sixes += 1;
          isLegalBall = false;
          triggerUmpireSignal('⚑ NO BALL (Free Hit)');
          commentaryType = 'cricket_extra';
        } else if (options.extraType === 'bye') {
          ballSymbol = `${runVal}B`;
          extras.byes = (extras.byes || 0) + runVal;
          nextState.runs += runVal;
          striker.balls += 1;
          triggerUmpireSignal('✋ BYE RUN');
        } else if (options.extraType === 'legbye') {
          ballSymbol = `${runVal}LB`;
          extras.legByes = (extras.legByes || 0) + runVal;
          nextState.runs += runVal;
          striker.balls += 1;
          triggerUmpireSignal('🦵 LEG BYE');
        } else if (options.extraType === 'penalty') {
          ballSymbol = `+5P`;
          extras.penaltyRuns = (extras.penaltyRuns || 0) + 5;
          nextState.runs += 5;
          isLegalBall = false;
          triggerUmpireSignal('⚠️ +5 PENALTY RUNS');
        }
      } else {
        // Legal bat runs
        nextState.runs += runVal;
        striker.runs += runVal;
        striker.balls += 1;
        bowler.runs += runVal;

        if (runVal === 4) {
          striker.fours += 1;
          triggerUmpireSignal('⚡ FOUR RUNS');
          commentaryType = 'cricket_boundary';
        } else if (runVal === 6) {
          striker.sixes += 1;
          triggerUmpireSignal('🙌 SIX RUNS');
          commentaryType = 'cricket_boundary';
        } else if (runVal === 0) {
          triggerUmpireSignal('• DOT BALL');
        }
      }

      currentOverBalls.push(ballSymbol);
      nextState.currentOverBalls = currentOverBalls;

      // Strike rate
      striker.strikeRate =
        striker.balls > 0 ? Math.round((striker.runs / striker.balls) * 100 * 10) / 10 : 0;

      // Check dynamic milestone
      const milestone = evaluateBattingMilestone(striker.runs, maxOvers, match.format || 't20');
      if (milestone.milestoneBadge && (striker.runs === 30 || striker.runs === 50 || striker.runs === 60 || striker.runs === 100)) {
        triggerUmpireSignal(`🎖️ ${milestone.milestoneTitle}`);
      }

      // Auto-swap striker upon odd runs (1 or 3)
      if (runVal % 2 !== 0 && !options.isWicket) {
        striker.isStriker = false;
        nonStriker.isStriker = true;
        nextState.striker = nonStriker;
        nextState.nonStriker = striker;
      }

      // Legal ball progression
      if (isLegalBall) {
        nextState.ballsInCurrentOver += 1;
        bowler.ballsThisOver = nextState.ballsInCurrentOver;

        // End of over transition (6 legal balls)
        if (nextState.ballsInCurrentOver === 6) {
          nextState.overs += 1;
          nextState.ballsInCurrentOver = 0;
          bowler.overs += 1;
          bowler.ballsThisOver = 0;

          // Check maiden
          const runsInOver = currentOverBalls.reduce((acc, sym) => {
            const num = parseInt(sym.replace(/[^0-9]/g, '')) || 0;
            return acc + num;
          }, 0);
          if (runsInOver === 0) {
            bowler.maidens += 1;
          }

          // Swap striker at end of over
          const prevStriker = nextState.striker;
          nextState.striker = nextState.nonStriker;
          nextState.nonStriker = prevStriker;
          nextState.striker.isStriker = true;
          nextState.nonStriker.isStriker = false;

          // Reset over deliveries
          nextState.currentOverBalls = [];

          // Block consecutive overs: store previous bowler
          setPreviousBowlerName(bowler.name);

          // Cycle to another bowler in roster
          const roster = defaultRosterTeamB;
          const nextBowlerCandidates = roster.filter((b) => b !== bowler.name);
          const nextBowlerName = nextBowlerCandidates[Math.floor(Math.random() * nextBowlerCandidates.length)];
          bowler.name = nextBowlerName;

          triggerUmpireSignal(`🔔 Over Complete! Over ${nextState.overs}`);
        }
      }

      // Bowler economy
      const totalBowlerOvers = bowler.overs + bowler.ballsThisOver / 6;
      bowler.economy = totalBowlerOvers > 0 ? Math.round((bowler.runs / totalBowlerOvers) * 100) / 100 : 0;

      // Update in Firestore
      const overStr = `${nextState.overs}.${nextState.ballsInCurrentOver}`;
      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, {
        cricketState: nextState,
        teamAScore:
          nextState.battingTeamId === match.teamAId ? `${nextState.runs}/${nextState.wickets}` : match.teamAScore,
        teamBScore:
          nextState.battingTeamId === match.teamBId ? `${nextState.runs}/${nextState.wickets}` : match.teamBScore,
        currentOverOrMinute: `Over ${overStr}`,
        status: 'live',
      });

      // Generate real-time commentary
      let commEventType: 'dot' | 'single' | 'two' | 'three' | 'four' | 'six' | 'wide' | 'noball' | 'wicket' = 'dot';
      let wicketSubtype: 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | undefined = undefined;

      if (options.isWicket) {
        commEventType = 'wicket';
        if (
          options.wType === 'bowled' ||
          options.wType === 'caught' ||
          options.wType === 'lbw' ||
          options.wType === 'runout' ||
          options.wType === 'stumped'
        ) {
          wicketSubtype = options.wType;
        }
      } else if (options.isExtra) {
        if (options.extraType === 'wide') commEventType = 'wide';
        else if (options.extraType === 'noball') commEventType = 'noball';
        else commEventType = runVal > 0 ? 'single' : 'dot';
      } else {
        if (runVal === 0) commEventType = 'dot';
        else if (runVal === 1) commEventType = 'single';
        else if (runVal === 2) commEventType = 'two';
        else if (runVal === 3) commEventType = 'three';
        else if (runVal === 4) commEventType = 'four';
        else if (runVal === 6) commEventType = 'six';
        else commEventType = 'single';
      }

      const totalDelivered = nextState.overs * 6 + nextState.ballsInCurrentOver;
      const commentaryPayload: Omit<CommentaryLog, 'id'> = generateCricketCommentary(
        match.id,
        overStr,
        totalDelivered,
        commEventType,
        wicketSubtype,
        bowler.name,
        bowler.bowlingType,
        striker.name,
        `${nextState.runs}/${nextState.wickets}`
      );
      await addDoc(collection(db, 'commentary'), commentaryPayload);

      setCricketState(nextState);
      if (onStateUpdated) onStateUpdated(nextState);
    } catch (err) {
      console.error('Error delivering ball:', err);
    } finally {
      setSaving(false);
    }
  };

  // Conclude match & trigger dynamic milestone recalculation
  const handleFinishMatch = async () => {
    if (!isAuthorized || saving) return;
    setSaving(true);
    try {
      const matchRef = doc(db, 'matches', match.id);
      const isTeamAWinner = cricketState.runs > (cricketState.targetRuns || 0);

      await updateDoc(matchRef, {
        status: 'completed',
        winnerId: isTeamAWinner ? cricketState.battingTeamId : cricketState.bowlingTeamId,
        winnerName: isTeamAWinner ? cricketState.battingTeamName : cricketState.bowlingTeamName,
      });

      // Push striker official stats
      await addDoc(collection(db, 'stats_cricket'), {
        matchId: match.id,
        playerId: `p_${cricketState.striker.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        playerName: cricketState.striker.name,
        teamId: cricketState.battingTeamId,
        teamName: cricketState.battingTeamName,
        format: match.format || 't20',
        innings: cricketState.currentInnings,
        runsScored: cricketState.striker.runs,
        ballsFaced: cricketState.striker.balls,
        fours: cricketState.striker.fours,
        sixes: cricketState.striker.sixes,
        strikeRate: cricketState.striker.strikeRate,
        isOut: false,
        oversBowled: 0,
        maidens: 0,
        runsConceded: 0,
        wicketsTaken: 0,
        economy: 0,
        catches: 0,
        runOuts: 0,
        stumpings: 0,
        createdAt: Date.now(),
      });

      triggerUmpireSignal('🏆 MATCH CONCLUDED! Stats Pushed to Leaderboards');
      if (onConcludeMatch) onConcludeMatch();
    } catch (err) {
      console.error('Error concluding match:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Umpire Signal Popup Toast */}
      {umpireSignalToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-zinc-950 text-white border border-emerald-500 shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-black">
            ⚡
          </div>
          <div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Official Signal</div>
            <div className="text-sm font-black text-emerald-400">{umpireSignalToast}</div>
          </div>
        </div>
      )}

      {/* 1. Header Bar: Team Scores, Overs, Run Rates & Custom Overs Button */}
      <div className="p-5 rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" /> CrickHeroes Scorer
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-300">
              {match.teamAName} vs {match.teamBName}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-4xl font-black font-mono text-emerald-400">
              {cricketState.runs}/{cricketState.wickets}
            </h2>
            <span className="text-base font-mono text-zinc-400">
              ({cricketState.overs}.{cricketState.ballsInCurrentOver} / {maxOvers} ov)
            </span>
          </div>
        </div>

        {/* Quick Config & Undo Actions */}
        <div className="flex items-center gap-2">
          {/* Undo Last Ball Button */}
          <button
            onClick={handleUndoLastBall}
            disabled={historyStack.length === 0 || saving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-amber-400 text-xs font-black uppercase transition border border-zinc-700"
            title="Instant Undo Last Ball to Correct Scoring Input"
          >
            <History className="w-3.5 h-3.5" />
            <span>Undo ({historyStack.length})</span>
          </button>

          {/* Custom Overs Selector Button */}
          <button
            onClick={() => setCustomOversModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition border border-zinc-700"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>{maxOvers} Overs</span>
          </button>

          {/* Conclude Match Button */}
          <button
            onClick={handleFinishMatch}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black uppercase transition shadow-md"
          >
            Conclude Match
          </button>
        </div>
      </div>

      {/* 2. Live Batting & Bowling Control Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Batters Strip */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase text-amber-500">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Live Batters
            </span>
            <button
              onClick={() => {
                const s = cricketState.striker;
                const ns = cricketState.nonStriker;
                s.isStriker = false;
                ns.isStriker = true;
                setCricketState({ ...cricketState, striker: ns, nonStriker: s });
                triggerUmpireSignal('↔ Strikers Swapped');
              }}
              className="text-[10px] text-zinc-400 hover:text-emerald-500 underline flex items-center gap-1"
            >
              <span>Swap Strike</span>
            </button>
          </div>

          <div className="space-y-2">
            {/* Striker */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1">
                  <span>{cricketState.striker.name}</span>
                  <span className="text-emerald-500 text-xs">*</span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  {cricketState.striker.fours} fours • {cricketState.striker.sixes} sixes
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-base text-amber-500">
                  {cricketState.striker.runs} ({cricketState.striker.balls})
                </div>
                <div className="text-[10px] font-mono text-zinc-400">
                  SR: {cricketState.striker.strikeRate.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Non-Striker */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {cricketState.nonStriker.name}
                </div>
                <div className="text-[10px] text-zinc-500">
                  {cricketState.nonStriker.fours} fours • {cricketState.nonStriker.sixes} sixes
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-sm text-zinc-700 dark:text-zinc-300">
                  {cricketState.nonStriker.runs} ({cricketState.nonStriker.balls})
                </div>
                <div className="text-[10px] font-mono text-zinc-400">
                  SR: {cricketState.nonStriker.strikeRate.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Bowler & Over Deliveries */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase text-blue-500">
            <span className="flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Current Bowler
            </span>
            <span className="text-[10px] text-zinc-400">
              {previousBowlerName ? `Prev: ${previousBowlerName} (Blocked)` : 'Over in progress'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-zinc-900 dark:text-white">
                {cricketState.currentBowler.name}
              </div>
              <div className="text-[10px] text-zinc-500 capitalize">
                {cricketState.currentBowler.bowlingType} pace • Maidens: {cricketState.currentBowler.maidens}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-black text-base text-blue-500">
                {cricketState.currentBowler.wickets}/{cricketState.currentBowler.runs}
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                Econ: {cricketState.currentBowler.economy.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Current Over Delivery Pills */}
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
              Over Deliveries ({cricketState.ballsInCurrentOver}/6):
            </div>
            <div className="flex items-center gap-1.5 min-h-[32px] overflow-x-auto">
              {(cricketState.currentOverBalls || []).map((b, i) => (
                <span
                  key={i}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-black border ${
                    b === 'W'
                      ? 'bg-rose-500 text-white border-rose-600'
                      : b === '4'
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-600'
                      : b === '6'
                      ? 'bg-amber-500 text-zinc-950 border-amber-600'
                      : b.includes('Wd') || b.includes('Nb')
                      ? 'bg-purple-500 text-white border-purple-600'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {b}
                </span>
              ))}
              {Array.from({ length: Math.max(0, 6 - cricketState.ballsInCurrentOver) }).map((_, i) => (
                <span
                  key={i}
                  className="w-7 h-7 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 text-xs"
                >
                  •
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Fast Scoring Actions Grid (CrickHeroes Real-Time Engine) */}
      <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 text-white space-y-4 shadow-xl">
        <div className="flex items-center justify-between text-xs font-black uppercase text-emerald-400">
          <span className="flex items-center gap-1.5">
            <Flame className="w-4 h-4" /> Scoring Actions Grid
          </span>
          <span className="text-[10px] text-zinc-400">Click button to log delivery</span>
        </div>

        {/* Regular Runs Row */}
        <div className="grid grid-cols-6 gap-2">
          <button
            onClick={() => handleDeliverBall(0)}
            className="py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-mono text-lg font-black transition active:scale-95 cursor-pointer shadow-sm"
          >
            0 <span className="block text-[9px] font-sans font-normal text-zinc-400">Dot</span>
          </button>
          <button
            onClick={() => handleDeliverBall(1)}
            className="py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-mono text-lg font-black transition active:scale-95 cursor-pointer shadow-sm"
          >
            1 <span className="block text-[9px] font-sans font-normal text-zinc-400">Single</span>
          </button>
          <button
            onClick={() => handleDeliverBall(2)}
            className="py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-mono text-lg font-black transition active:scale-95 cursor-pointer shadow-sm"
          >
            2 <span className="block text-[9px] font-sans font-normal text-zinc-400">Double</span>
          </button>
          <button
            onClick={() => handleDeliverBall(3)}
            className="py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-mono text-lg font-black transition active:scale-95 cursor-pointer shadow-sm"
          >
            3 <span className="block text-[9px] font-sans font-normal text-zinc-400">Three</span>
          </button>
          <button
            onClick={() => handleDeliverBall(4)}
            className="py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xl font-black transition active:scale-95 cursor-pointer shadow-lg"
          >
            4 <span className="block text-[9px] font-sans font-black text-zinc-950">FOUR</span>
          </button>
          <button
            onClick={() => handleDeliverBall(6)}
            className="py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xl font-black transition active:scale-95 cursor-pointer shadow-lg"
          >
            6 <span className="block text-[9px] font-sans font-black text-zinc-950">SIX</span>
          </button>
        </div>

        {/* Extras & Wicket Action Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-zinc-800">
          <button
            onClick={() => handleDeliverBall(1, { isExtra: true, extraType: 'wide' })}
            className="py-2.5 px-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/40 text-xs font-bold transition active:scale-95"
          >
            Wide (+1)
          </button>
          <button
            onClick={() => handleDeliverBall(0, { isExtra: true, extraType: 'noball' })}
            className="py-2.5 px-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/40 text-xs font-bold transition active:scale-95"
          >
            No Ball (+1)
          </button>
          <button
            onClick={() => handleDeliverBall(1, { isExtra: true, extraType: 'bye' })}
            className="py-2.5 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition active:scale-95"
          >
            Bye (1B)
          </button>
          <button
            onClick={() => handleDeliverBall(1, { isExtra: true, extraType: 'legbye' })}
            className="py-2.5 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition active:scale-95"
          >
            Leg Bye (1LB)
          </button>
          <button
            onClick={() => handleDeliverBall(5, { isExtra: true, extraType: 'penalty' })}
            className="py-2.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold transition active:scale-95"
          >
            Penalty (+5)
          </button>
          <button
            onClick={() => setWicketModalOpen(true)}
            className="py-2.5 px-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase transition active:scale-95 shadow-lg flex items-center justify-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            <span>WICKET</span>
          </button>
        </div>
      </div>

      {/* 4. Umpire Control Center & Signals Panel */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-black uppercase text-zinc-700 dark:text-zinc-300">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Umpire Control Center & Match Signals</span>
          </span>
          <span className="text-[10px] text-zinc-400">Match Official Panel</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Fast bounce delivery warning */}
          <button
            onClick={() => {
              const nextVal = !cricketState.isFastBounceWarning;
              setCricketState({ ...cricketState, isFastBounceWarning: nextVal });
              triggerUmpireSignal(nextVal ? '⚠️ Fast Bounce / Short Delivery Warning (1 of 2)' : 'Bounce Warning Cleared');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              cricketState.isFastBounceWarning
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Short Pitch Warning</span>
          </button>

          {/* Powerplay Toggle */}
          <button
            onClick={() => {
              const currentActive = !!cricketState.powerplayStatus?.active;
              const nextStatus = {
                active: !currentActive,
                type: 'mandatory' as const,
                startOver: 1,
                endOver: Math.min(6, maxOvers),
              };
              setCricketState({ ...cricketState, powerplayStatus: nextStatus });
              triggerUmpireSignal(!currentActive ? '⚡ Powerplay ON (2 outside circle)' : 'Powerplay OFF (5 outside)');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              cricketState.powerplayStatus?.active
                ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Powerplay: {cricketState.powerplayStatus?.active ? 'ON' : 'OFF'}</span>
          </button>

          {/* Signal Buttons */}
          <button
            onClick={() => triggerUmpireSignal('☝️ OUT')}
            className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[11px] font-bold"
          >
            ☝️ Signal OUT
          </button>
          <button
            onClick={() => triggerUmpireSignal('🙌 SIX')}
            className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[11px] font-bold"
          >
            🙌 Signal SIX
          </button>
          <button
            onClick={() => triggerUmpireSignal('⚡ FOUR')}
            className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[11px] font-bold"
          >
            ⚡ Signal FOUR
          </button>
          <button
            onClick={() => triggerUmpireSignal('⚑ NO BALL')}
            className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[11px] font-bold"
          >
            ⚑ Signal NO-BALL
          </button>
          <button
            onClick={() => triggerUmpireSignal('↔ WIDE')}
            className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[11px] font-bold"
          >
            ↔ Signal WIDE
          </button>
          <button
            onClick={() => triggerUmpireSignal('✕ DEAD BALL')}
            className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[11px] font-bold"
          >
            ✕ Dead Ball
          </button>
        </div>
      </div>

      {/* Wicket Modal: Select Dismissal Type, Fielder, and Next Batsman */}
      {wicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-zinc-900 dark:text-zinc-100">
            <h3 className="text-lg font-black uppercase text-rose-500 mb-1 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Wicket Dismissal Entry
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Batter Out: <strong>{cricketState.striker.name}</strong> on {cricketState.striker.runs} ({cricketState.striker.balls} balls).
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Dismissal Mode
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                  {(['caught', 'bowled', 'lbw', 'runout', 'stumped', 'hitwicket'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setWicketType(mode)}
                      className={`p-2 rounded-xl uppercase transition ${
                        wicketType === mode
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {wicketType === 'caught' && (
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                    Fielder Involved
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kohli, Jadeja, Warner"
                    value={fielderInvolved}
                    onChange={(e) => setFielderInvolved(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Select Next Batsman
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${defaultRosterTeamA[cricketState.wickets + 2] || 'Next Batter'}`}
                  value={nextBatterName}
                  onChange={(e) => setNextBatterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs border border-zinc-300 dark:border-zinc-700"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setWicketModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setWicketModalOpen(false);
                    handleDeliverBall(0, {
                      isWicket: true,
                      wType: wicketType,
                      fielder: fielderInvolved,
                      newBatter: nextBatterName,
                    });
                    setFielderInvolved('');
                    setNextBatterName('');
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase"
                >
                  Confirm Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Match Overs Configuration Modal */}
      {customOversModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-zinc-900 dark:text-zinc-100">
            <h3 className="text-base font-black uppercase text-emerald-500 mb-1 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Custom Match Overs Setup
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Dynamically set overs for friendly match, local club game, or amateur tournament.
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[3, 5, 8, 10, 12, 20, 30, 45, 50, 90].map((ov) => (
                <button
                  key={ov}
                  onClick={() => {
                    const next = { ...cricketState, maxOvers: ov };
                    setCricketState(next);
                    setCustomOversModalOpen(false);
                    triggerUmpireSignal(`Match Length Configured: ${ov} Overs`);
                  }}
                  className={`py-2 rounded-xl text-xs font-mono font-black ${
                    maxOvers === ov
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {ov} Ov
                </button>
              ))}
            </div>

            <button
              onClick={() => setCustomOversModalOpen(false)}
              className="w-full py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
