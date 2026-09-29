import React, { useState, useEffect } from 'react';
import {
  MatchItem,
  LiveCricketState,
  LiveBatter,
  LiveBowler,
  CommentaryLog,
} from '../types/models';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { generateCricketCommentary } from '../lib/commentaryEngine';
import {
  RotateCcw,
  Zap,
  Shield,
  Activity,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface CricketScoringPanelProps {
  match: MatchItem;
  onStateUpdated?: (updatedState: LiveCricketState) => void;
}

export const CricketScoringPanel: React.FC<CricketScoringPanelProps> = ({
  match,
  onStateUpdated,
}) => {
  const { currentUser, userProfile } = useAuth();
  const isAuthorized =
    currentUser &&
    (userProfile?.role === 'organizer' ||
      userProfile?.role === 'admin' ||
      match.organizerId === currentUser.uid);

  // Initialize or restore state seamlessly from Firestore
  const [cricketState, setCricketState] = useState<LiveCricketState>(() => {
    if (match.cricketState) return match.cricketState;

    // Default initial match innings state
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
      totalExtras: {
        wides: 0,
        noBalls: 0,
        byes: 0,
        legByes: 0,
      },
    };
  });

  const [totalBallsLogged, setTotalBallsLogged] = useState(
    () => cricketState.overs * 6 + cricketState.ballsInCurrentOver
  );
  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state if match prop changes from Firestore snapshot
  useEffect(() => {
    if (match.cricketState) {
      setCricketState(match.cricketState);
      setTotalBallsLogged(match.cricketState.overs * 6 + match.cricketState.ballsInCurrentOver);
    }
  }, [match.cricketState]);

  // Execute ball delivery
  const handleScoreBall = async (
    runVal: number,
    isExtra: boolean = false,
    extraType?: 'wide' | 'noball' | 'bye',
    isWicket: boolean = false,
    wicketType?: 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped'
  ) => {
    if (!isAuthorized || saving) return;
    setSaving(true);

    try {
      const nextBallsLogged = totalBallsLogged + 1;
      const nextState = { ...cricketState };
      const striker = { ...nextState.striker };
      const nonStriker = { ...nextState.nonStriker };
      const bowler = { ...nextState.currentBowler };
      const extras = { ...nextState.totalExtras };
      const currentOverBalls = [...nextState.currentOverBalls];

      let ballSymbol = runVal.toString();
      let isLegalBall = true;
      let commentaryEventType: any = 'dot';

      if (isWicket) {
        ballSymbol = 'W';
        nextState.wickets += 1;
        bowler.wickets += 1;
        striker.balls += 1;
        striker.isOut = true;
        striker.dismissal = wicketType || 'bowled';
        commentaryEventType = 'wicket';
        // Reset new batter
        striker.name = `Batter ${nextState.wickets + 2}`;
        striker.runs = 0;
        striker.balls = 0;
        striker.fours = 0;
        striker.sixes = 0;
        striker.strikeRate = 0;
      } else if (isExtra) {
        if (extraType === 'wide') {
          ballSymbol = `${runVal > 1 ? runVal : ''}Wd`;
          extras.wides += runVal;
          nextState.runs += runVal;
          bowler.runs += runVal;
          isLegalBall = false;
          commentaryEventType = 'wide';
        } else if (extraType === 'noball') {
          ballSymbol = `${runVal > 1 ? runVal : ''}Nb`;
          extras.noBalls += 1;
          nextState.runs += runVal + 1;
          bowler.runs += runVal + 1;
          striker.runs += runVal;
          if (runVal === 4) striker.fours += 1;
          if (runVal === 6) striker.sixes += 1;
          isLegalBall = false;
          commentaryEventType = 'noball';
        } else if (extraType === 'bye') {
          ballSymbol = `${runVal}B`;
          extras.byes += runVal;
          nextState.runs += runVal;
          striker.balls += 1;
          commentaryEventType = runVal > 0 ? 'single' : 'dot';
        }
      } else {
        // Legal bat runs
        nextState.runs += runVal;
        striker.runs += runVal;
        striker.balls += 1;
        bowler.runs += runVal;

        if (runVal === 0) commentaryEventType = 'dot';
        if (runVal === 1) commentaryEventType = 'single';
        if (runVal === 2) commentaryEventType = 'two';
        if (runVal === 3) commentaryEventType = 'three';
        if (runVal === 4) {
          striker.fours += 1;
          commentaryEventType = 'four';
        }
        if (runVal === 6) {
          striker.sixes += 1;
          commentaryEventType = 'six';
        }
      }

      currentOverBalls.push(ballSymbol);

      // Strike rate calculation
      striker.strikeRate =
        striker.balls > 0 ? Math.round((striker.runs / striker.balls) * 100 * 10) / 10 : 0;

      // Rotate strike on odd runs
      if (runVal % 2 !== 0 && !isWicket) {
        striker.isStriker = false;
        nonStriker.isStriker = true;
        nextState.striker = nonStriker;
        nextState.nonStriker = striker;
      } else {
        nextState.striker = striker;
        nextState.nonStriker = nonStriker;
      }

      // Legal ball advancement & Over completion
      if (isLegalBall) {
        nextState.ballsInCurrentOver += 1;
        bowler.ballsThisOver += 1;

        if (nextState.ballsInCurrentOver >= 6) {
          nextState.overs += 1;
          nextState.ballsInCurrentOver = 0;
          bowler.overs += 1;
          bowler.ballsThisOver = 0;
          nextState.currentOverBalls = [];

          // End of over: switch strike
          const temp = nextState.striker;
          nextState.striker = nextState.nonStriker;
          nextState.nonStriker = temp;
          nextState.striker.isStriker = true;
          nextState.nonStriker.isStriker = false;
        } else {
          nextState.currentOverBalls = currentOverBalls;
        }
      }

      // Bowler economy
      const totalBowlerOvers = bowler.overs + bowler.ballsThisOver / 6;
      bowler.economy =
        totalBowlerOvers > 0 ? Math.round((bowler.runs / totalBowlerOvers) * 10) / 10 : 0;

      nextState.currentBowler = bowler;
      nextState.totalExtras = extras;

      const overStr = `${nextState.overs}.${nextState.ballsInCurrentOver}`;
      const scoreStr = `${nextState.battingTeamName} ${nextState.runs}/${nextState.wickets} (${overStr} ov)`;

      // Generate multi-language commentary line
      const commentaryPayload = generateCricketCommentary(
        match.id,
        overStr,
        nextBallsLogged,
        commentaryEventType,
        wicketType,
        bowler.name,
        bowler.bowlingType,
        nextState.striker.name,
        scoreStr
      );

      // Write simultaneously to Firestore: match state & commentary collection
      await addDoc(collection(db, 'commentary'), commentaryPayload);

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

      setCricketState(nextState);
      setTotalBallsLogged(nextBallsLogged);
      if (onStateUpdated) onStateUpdated(nextState);
    } catch (err) {
      console.error('Error logging ball:', err);
    } finally {
      setSaving(false);
    }
  };

  // Conclude match and save official stats to Firestore
  const handleConcludeMatch = async () => {
    if (!isAuthorized || saving) return;
    setSaving(true);
    try {
      const matchRef = doc(db, 'matches', match.id);
      const currentRuns = cricketState.runs;
      const targetRuns = cricketState.targetRuns;

      let winnerId: string | null = null;
      let winnerName: string | null = null;
      let isDrawOrTie = false;

      if (targetRuns) {
        if (currentRuns >= targetRuns) {
          winnerId = cricketState.battingTeamId;
          winnerName = cricketState.battingTeamName;
        } else {
          winnerId = cricketState.bowlingTeamId;
          winnerName = cricketState.bowlingTeamName;
        }
      } else {
        winnerId = cricketState.battingTeamId;
        winnerName = cricketState.battingTeamName;
      }

      await updateDoc(matchRef, {
        status: 'completed',
        winnerId: winnerId || null,
        winnerName: winnerName || 'Match Concluded',
        isDrawOrTie,
      });

      const format = match.format || 't20';

      // Striker stats
      if (cricketState.striker.runs > 0 || cricketState.striker.balls > 0) {
        await addDoc(collection(db, 'stats_cricket'), {
          matchId: match.id,
          tournamentId: match.tournamentId || null,
          playerId: `player_${cricketState.striker.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          playerName: cricketState.striker.name,
          teamId: cricketState.battingTeamId,
          teamName: cricketState.battingTeamName,
          format,
          innings: cricketState.currentInnings,
          runsScored: cricketState.striker.runs,
          ballsFaced: cricketState.striker.balls,
          fours: cricketState.striker.fours,
          sixes: cricketState.striker.sixes,
          strikeRate: cricketState.striker.strikeRate,
          isOut: !!cricketState.striker.isOut,
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
      }

      // Non-striker stats
      if (cricketState.nonStriker.runs > 0 || cricketState.nonStriker.balls > 0) {
        await addDoc(collection(db, 'stats_cricket'), {
          matchId: match.id,
          tournamentId: match.tournamentId || null,
          playerId: `player_${cricketState.nonStriker.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          playerName: cricketState.nonStriker.name,
          teamId: cricketState.battingTeamId,
          teamName: cricketState.battingTeamName,
          format,
          innings: cricketState.currentInnings,
          runsScored: cricketState.nonStriker.runs,
          ballsFaced: cricketState.nonStriker.balls,
          fours: cricketState.nonStriker.fours,
          sixes: cricketState.nonStriker.sixes,
          strikeRate: cricketState.nonStriker.strikeRate,
          isOut: !!cricketState.nonStriker.isOut,
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
      }

      // Current Bowler stats
      const overs = cricketState.currentBowler.overs + cricketState.currentBowler.ballsThisOver / 6;
      if (overs > 0 || cricketState.currentBowler.wickets > 0) {
        await addDoc(collection(db, 'stats_cricket'), {
          matchId: match.id,
          tournamentId: match.tournamentId || null,
          playerId: `player_${cricketState.currentBowler.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          playerName: cricketState.currentBowler.name,
          teamId: cricketState.bowlingTeamId,
          teamName: cricketState.bowlingTeamName,
          format,
          innings: cricketState.currentInnings,
          runsScored: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          isOut: false,
          oversBowled: Math.round(overs * 10) / 10,
          maidens: cricketState.currentBowler.maidens,
          runsConceded: cricketState.currentBowler.runs,
          wicketsTaken: cricketState.currentBowler.wickets,
          economy: cricketState.currentBowler.economy,
          catches: 1,
          runOuts: 0,
          stumpings: 0,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error concluding match:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-xl space-y-6">
      {/* Top Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-rose-500">
              Live Ball-By-Ball Scoring Console
            </span>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mt-1 text-white">
            {cricketState.battingTeamName}
          </h3>
          <p className="text-xs text-zinc-400">
            Bowling: <strong className="text-zinc-200">{cricketState.bowlingTeamName}</strong> | Innings{' '}
            {cricketState.currentInnings}
          </p>
        </div>

        {/* Big Score Board Display */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-6">
          <div className="text-right">
            <span className="text-3xl font-black font-mono text-emerald-400">
              {cricketState.runs}/{cricketState.wickets}
            </span>
            <p className="text-xs font-bold text-zinc-400 font-mono">
              Overs: {cricketState.overs}.{cricketState.ballsInCurrentOver} (CRR:{' '}
              {cricketState.overs + cricketState.ballsInCurrentOver / 6 > 0
                ? (
                    cricketState.runs /
                    (cricketState.overs + cricketState.ballsInCurrentOver / 6)
                  ).toFixed(2)
                : '0.00'}
              )
            </p>
          </div>
        </div>
      </div>

      {/* Batting and Bowling Telemetry Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Batters On Crease */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider block">
            Active Batters
          </span>
          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-bold text-white">{cricketState.striker.name} *</span>
            </div>
            <span className="font-mono font-bold text-emerald-400">
              {cricketState.striker.runs} ({cricketState.striker.balls}b) • SR:{' '}
              {cricketState.striker.strikeRate}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              <span className="font-bold text-zinc-300">{cricketState.nonStriker.name}</span>
            </div>
            <span className="font-mono font-bold text-zinc-400">
              {cricketState.nonStriker.runs} ({cricketState.nonStriker.balls}b) • SR:{' '}
              {cricketState.nonStriker.strikeRate}
            </span>
          </div>
        </div>

        {/* Current Bowler & Over Timeline */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider">
              Bowler: {cricketState.currentBowler.name} ({cricketState.currentBowler.bowlingType})
            </span>
            <span className="font-mono text-zinc-300">
              Econ: {cricketState.currentBowler.economy}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pt-2 overflow-x-auto">
            <span className="text-[10px] font-bold text-zinc-500 uppercase mr-1">This Over:</span>
            {cricketState.currentOverBalls.length === 0 ? (
              <span className="text-zinc-600 text-xs italic">Awaiting first ball...</span>
            ) : (
              cricketState.currentOverBalls.map((b, idx) => (
                <span
                  key={idx}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-xs ${
                    b === 'W'
                      ? 'bg-rose-500 text-white'
                      : b === '4'
                      ? 'bg-amber-500 text-black'
                      : b === '6'
                      ? 'bg-purple-500 text-white'
                      : b.includes('Wd') || b.includes('Nb')
                      ? 'bg-cyan-500 text-black'
                      : 'bg-zinc-800 text-zinc-200'
                  }`}
                >
                  {b}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons: Runs, Extras, Wickets */}
      {isAuthorized ? (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Deliver Next Ball (Scoring Console)
            </span>
            <span className="text-[10px] text-zinc-500">Writes directly to Firestore & triggers multi-lingual commentary</span>
          </div>

          {/* Runs 0 to 6 */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((r) => (
              <button
                key={r}
                disabled={saving}
                onClick={() => handleScoreBall(r)}
                className={`py-3 rounded-2xl font-mono font-black text-base shadow-sm transition active:scale-95 disabled:opacity-50 ${
                  r === 4
                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                    : r === 6
                    ? 'bg-purple-600 text-white hover:bg-purple-500'
                    : r === 0
                    ? 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                {r === 0 ? 'DOT' : `${r} ${r === 1 ? 'RUN' : 'RUNS'}`}
              </button>
            ))}
          </div>

          {/* Extras and Wickets */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <button
              disabled={saving}
              onClick={() => handleScoreBall(1, true, 'wide')}
              className="py-2.5 px-3 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold transition disabled:opacity-50"
            >
              +1 Wide (Wd)
            </button>
            <button
              disabled={saving}
              onClick={() => handleScoreBall(1, true, 'noball')}
              className="py-2.5 px-3 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold transition disabled:opacity-50"
            >
              +1 No Ball (Nb)
            </button>
            <button
              disabled={saving}
              onClick={() => handleScoreBall(1, true, 'bye')}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-bold transition disabled:opacity-50"
            >
              +1 Bye / Leg Bye
            </button>
            <button
              disabled={saving}
              onClick={() => setWicketModalOpen(true)}
              className="col-span-2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
            >
              ⚡ WICKET FALLEN (OUT)
            </button>
            <button
              disabled={saving}
              onClick={handleConcludeMatch}
              className="col-span-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              🏁 Conclude & Record Official Match Stats
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs text-center">
          Viewing Live Match in Spectator Mode. Only official match organizers can score balls.
        </div>
      )}

      {/* Wicket Modal Subtype Selector */}
      {wicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 shadow-2xl">
            <h4 className="font-black text-sm uppercase text-rose-500 mb-1">
              Select Dismissal Type
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
              Batter: {cricketState.striker.name}
            </p>

            <div className="space-y-2">
              {(['bowled', 'caught', 'lbw', 'runout', 'stumped'] as const).map((wType) => (
                <button
                  key={wType}
                  onClick={() => {
                    handleScoreBall(0, false, undefined, true, wType);
                    setWicketModalOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-rose-500 hover:bg-rose-500/10 text-xs font-bold capitalize text-left flex items-center justify-between"
                >
                  <span>{wType}</span>
                  <span className="text-rose-400">→</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setWicketModalOpen(false)}
              className="mt-4 w-full py-2 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
