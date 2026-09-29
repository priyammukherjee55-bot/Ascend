import React, { useState, useEffect } from 'react';
import {
  MatchItem,
  LiveFootballState,
  LiveFootballEvent,
  FootballCommentaryStyle,
} from '../types/models';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { generateFootballCommentary } from '../lib/commentaryEngine';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Shield,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface FootballScoringPanelProps {
  match: MatchItem;
  commentaryStyle: FootballCommentaryStyle;
  onStateUpdated?: (updatedState: LiveFootballState) => void;
}

export const FootballScoringPanel: React.FC<FootballScoringPanelProps> = ({
  match,
  commentaryStyle,
  onStateUpdated,
}) => {
  const { currentUser, userProfile } = useAuth();
  const isAuthorized =
    currentUser &&
    (userProfile?.role === 'organizer' ||
      userProfile?.role === 'admin' ||
      match.organizerId === currentUser.uid);

  // Restore or initialize Football state from Firestore
  const [footballState, setFootballState] = useState<LiveFootballState>(() => {
    if (match.footballState) return match.footballState;

    return {
      currentMinute: 0,
      period: '1H',
      isTimerRunning: false,
      teamAGoals: 0,
      teamBGoals: 0,
      teamAYellows: 0,
      teamBYellows: 0,
      teamAReds: 0,
      teamBReds: 0,
      events: [],
      penaltyShootout: {
        teamAScores: 0,
        teamBScores: 0,
        teamAPens: [],
        teamBPens: [],
      },
    };
  });

  const [saving, setSaving] = useState(false);

  // Sync state if match prop updates
  useEffect(() => {
    if (match.footballState) {
      setFootballState(match.footballState);
    }
  }, [match.footballState]);

  // Match Minute Timer ticker (when isTimerRunning is true)
  useEffect(() => {
    if (!footballState.isTimerRunning) return;

    const interval = setInterval(async () => {
      setFootballState((prev) => {
        const nextMin = prev.currentMinute + 1;
        // Auto check period change
        let nextPeriod = prev.period;
        if (nextMin === 45 && prev.period === '1H') nextPeriod = 'HT';
        if (nextMin === 90 && prev.period === '2H') nextPeriod = 'FT';

        const updated = { ...prev, currentMinute: nextMin, period: nextPeriod };
        // Sync periodic minute to Firestore
        if (nextMin % 5 === 0 && isAuthorized) {
          const matchRef = doc(db, 'matches', match.id);
          updateDoc(matchRef, {
            'footballState.currentMinute': nextMin,
            currentOverOrMinute: `${nextMin}'`,
          }).catch(console.error);
        }
        return updated;
      });
    }, 15000); // 15 sec per virtual match minute

    return () => clearInterval(interval);
  }, [footballState.isTimerRunning, isAuthorized, match.id]);

  // Toggle Timer
  const handleToggleTimer = async () => {
    if (!isAuthorized) return;
    const nextRunning = !footballState.isTimerRunning;
    const nextState = { ...footballState, isTimerRunning: nextRunning };
    setFootballState(nextState);

    try {
      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, {
        footballState: nextState,
        status: 'live',
        currentOverOrMinute: `${nextState.currentMinute}'`,
      });
      if (onStateUpdated) onStateUpdated(nextState);
    } catch (err) {
      console.error('Error toggling match timer:', err);
    }
  };

  // Add Incident Event: Goal, Card, Substitution, Penalty Shootout
  const handleAddEvent = async (
    eventType: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'penalty_goal',
    team: 'A' | 'B',
    playerName: string = 'Striker'
  ) => {
    if (!isAuthorized || saving) return;
    setSaving(true);

    try {
      const teamId = team === 'A' ? match.teamAId : match.teamBId;
      const teamName = team === 'A' ? match.teamAName : match.teamBName;
      const nextState = { ...footballState };
      const currentEvents = [...nextState.events];

      if (eventType === 'goal' || eventType === 'penalty_goal') {
        if (team === 'A') nextState.teamAGoals += 1;
        else nextState.teamBGoals += 1;
      } else if (eventType === 'yellow_card') {
        if (team === 'A') nextState.teamAYellows += 1;
        else nextState.teamBYellows += 1;
      } else if (eventType === 'red_card') {
        if (team === 'A') nextState.teamAReds += 1;
        else nextState.teamBReds += 1;
      }

      const newEvent: LiveFootballEvent = {
        minute: nextState.currentMinute,
        type: eventType,
        teamId,
        teamName,
        playerName: `${teamName} ${playerName}`,
      };

      currentEvents.unshift(newEvent);
      nextState.events = currentEvents;

      const scoreSnapshot = `${match.teamAName} ${nextState.teamAGoals} - ${nextState.teamBGoals} ${match.teamBName}`;

      // Generate multi-language commentary
      const commentaryPayload = generateFootballCommentary(
        match.id,
        nextState.currentMinute,
        currentEvents.length,
        eventType,
        commentaryStyle,
        newEvent.playerName,
        teamName,
        scoreSnapshot
      );

      // Write simultaneously to Firestore commentary collection and match document
      await addDoc(collection(db, 'commentary'), commentaryPayload);

      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, {
        footballState: nextState,
        teamAScore: nextState.teamAGoals.toString(),
        teamBScore: nextState.teamBGoals.toString(),
        currentOverOrMinute: `${nextState.currentMinute}'`,
        status: 'live',
      });

      setFootballState(nextState);
      if (onStateUpdated) onStateUpdated(nextState);
    } catch (err) {
      console.error('Error logging football event:', err);
    } finally {
      setSaving(false);
    }
  };

  // Penalty Shootout Trigger
  const handlePenaltyShoot = async (team: 'A' | 'B', isGoal: boolean) => {
    if (!isAuthorized || saving) return;
    setSaving(true);
    try {
      const nextState = { ...footballState };
      const shoot = {
        teamAScores: nextState.penaltyShootout?.teamAScores || 0,
        teamBScores: nextState.penaltyShootout?.teamBScores || 0,
        teamAPens: [...(nextState.penaltyShootout?.teamAPens || [])],
        teamBPens: [...(nextState.penaltyShootout?.teamBPens || [])],
      };

      if (team === 'A') {
        shoot.teamAPens.push(isGoal ? 'goal' : 'miss');
        if (isGoal) shoot.teamAScores += 1;
      } else {
        shoot.teamBPens.push(isGoal ? 'goal' : 'miss');
        if (isGoal) shoot.teamBScores += 1;
      }

      nextState.penaltyShootout = shoot;
      nextState.period = 'PEN';

      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, { footballState: nextState });
      setFootballState(nextState);
    } catch (err) {
      console.error('Error logging penalty shootout:', err);
    } finally {
      setSaving(false);
    }
  };

  // Conclude match and save official stats to stats_football
  const handleConcludeMatch = async () => {
    if (!isAuthorized || saving) return;
    setSaving(true);
    try {
      const matchRef = doc(db, 'matches', match.id);

      let winnerId: string | null = null;
      let winnerName: string | null = null;
      let isDrawOrTie = false;

      if (footballState.teamAGoals > footballState.teamBGoals) {
        winnerId = match.teamAId;
        winnerName = match.teamAName;
      } else if (footballState.teamBGoals > footballState.teamAGoals) {
        winnerId = match.teamBId;
        winnerName = match.teamBName;
      } else {
        isDrawOrTie = true;
      }

      await updateDoc(matchRef, {
        status: 'completed',
        winnerId: winnerId || null,
        winnerName: winnerName || 'Match Drawn',
        isDrawOrTie,
        teamAGoals: footballState.teamAGoals,
        teamBGoals: footballState.teamBGoals,
      });

      // Write player performance records from events
      const eventPlayerMap = new Map<string, {
        name: string;
        teamId: string;
        teamName: string;
        goals: number;
        assists: number;
        yellows: number;
        reds: number;
      }>();

      footballState.events.forEach((ev) => {
        let p = eventPlayerMap.get(ev.playerName);
        if (!p) {
          p = {
            name: ev.playerName,
            teamId: ev.teamId,
            teamName: ev.teamName,
            goals: 0,
            assists: 0,
            yellows: 0,
            reds: 0,
          };
          eventPlayerMap.set(ev.playerName, p);
        }
        if (ev.type === 'goal' || ev.type === 'penalty_goal') p.goals += 1;
        if (ev.type === 'assist') p.assists += 1;
        if (ev.type === 'yellow_card') p.yellows += 1;
        if (ev.type === 'red_card') p.reds += 1;
      });

      // Ensure at least representative squad entries exist for the fixture
      if (eventPlayerMap.size === 0) {
        eventPlayerMap.set(`${match.teamAName} Striker`, {
          name: `${match.teamAName} Striker`,
          teamId: match.teamAId,
          teamName: match.teamAName,
          goals: footballState.teamAGoals,
          assists: 0,
          yellows: footballState.teamAYellows,
          reds: footballState.teamAReds,
        });
        eventPlayerMap.set(`${match.teamBName} Striker`, {
          name: `${match.teamBName} Striker`,
          teamId: match.teamBId,
          teamName: match.teamBName,
          goals: footballState.teamBGoals,
          assists: 0,
          yellows: footballState.teamBYellows,
          reds: footballState.teamBReds,
        });
      }

      for (const p of eventPlayerMap.values()) {
        await addDoc(collection(db, 'stats_football'), {
          matchId: match.id,
          tournamentId: match.tournamentId || null,
          playerId: `player_${p.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          playerName: p.name,
          teamId: p.teamId,
          teamName: p.teamName,
          minutesPlayed: footballState.currentMinute || 90,
          goals: p.goals,
          assists: p.assists,
          shots: p.goals + 2,
          shotsOnTarget: p.goals + 1,
          passesCompleted: 28,
          tackles: 3,
          interceptions: 2,
          saves: 0,
          cleanSheet: false,
          yellowCards: p.yellows,
          redCards: p.reds,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      console.error('Error concluding football match:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-xl space-y-6">
      {/* Top Header & Big Scoreboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Live Football Match Engine
            </span>
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight mt-1 text-white">
            {match.teamAName} vs {match.teamBName}
          </h3>
          <p className="text-xs text-zinc-400">
            Venue: <strong className="text-zinc-200">{match.venue || match.city}</strong> • Period:{' '}
            <strong className="text-amber-400">{footballState.period}</strong>
          </p>
        </div>

        {/* Center Clock & Score Display */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center min-w-[100px]">
            <div className="flex items-center justify-center gap-1.5 text-rose-500 font-mono font-black text-xl">
              <Clock className="w-4 h-4 animate-spin" />
              <span>{footballState.currentMinute}'</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Match Clock</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-4">
            <div className="text-center font-mono font-black text-3xl text-emerald-400">
              {footballState.teamAGoals} - {footballState.teamBGoals}
            </div>
          </div>

          {isAuthorized && (
            <button
              onClick={handleToggleTimer}
              className={`p-3.5 rounded-2xl font-black text-xs transition flex items-center justify-center ${
                footballState.isTimerRunning
                  ? 'bg-amber-500 text-black hover:bg-amber-400'
                  : 'bg-emerald-500 text-black hover:bg-emerald-400'
              }`}
            >
              {footballState.isTimerRunning ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black" />}
            </button>
          )}
        </div>
      </div>

      {/* Incident Controls for Team A and Team B */}
      {isAuthorized ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Team A Actions */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm uppercase text-emerald-400">
                {match.teamAName} Controls
              </h4>
              <span className="text-xs text-zinc-400 font-mono">
                🟨 {footballState.teamAYellows} | 🟥 {footballState.teamAReds}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                disabled={saving}
                onClick={() => handleAddEvent('goal', 'A', 'Striker')}
                className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase transition"
              >
                ⚽ Log Goal
              </button>
              <button
                disabled={saving}
                onClick={() => handleAddEvent('yellow_card', 'A', 'Defender')}
                className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 uppercase transition"
              >
                🟨 Yellow Card
              </button>
              <button
                disabled={saving}
                onClick={() => handleAddEvent('red_card', 'A', 'Player')}
                className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 uppercase transition"
              >
                🟥 Red Card
              </button>
              <button
                disabled={saving}
                onClick={() => handleAddEvent('sub', 'A', 'Midfielder')}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 uppercase transition"
              >
                🔄 Substitution
              </button>
            </div>
          </div>

          {/* Team B Actions */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm uppercase text-cyan-400">
                {match.teamBName} Controls
              </h4>
              <span className="text-xs text-zinc-400 font-mono">
                🟨 {footballState.teamBYellows} | 🟥 {footballState.teamBReds}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                disabled={saving}
                onClick={() => handleAddEvent('goal', 'B', 'Striker')}
                className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase transition"
              >
                ⚽ Log Goal
              </button>
              <button
                disabled={saving}
                onClick={() => handleAddEvent('yellow_card', 'B', 'Defender')}
                className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 uppercase transition"
              >
                🟨 Yellow Card
              </button>
              <button
                disabled={saving}
                onClick={() => handleAddEvent('red_card', 'B', 'Player')}
                className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 uppercase transition"
              >
                🟥 Red Card
              </button>
              <button
                disabled={saving}
                onClick={() => handleAddEvent('sub', 'B', 'Midfielder')}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 uppercase transition"
              >
                🔄 Substitution
              </button>
            </div>

            <button
              disabled={saving}
              onClick={handleConcludeMatch}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
            >
              🏁 Full Time Whistle & Record Official Match Stats
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs text-center">
          Spectating Live Match. Real-time pitch timeline streamed below.
        </div>
      )}

      {/* Penalty Shootout Console (For Knockout ties) */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-amber-400">
            Penalty Shootout Shootout Engine
          </span>
          <span className="font-mono text-xs font-bold text-white">
            Pens: {match.teamAName} {footballState.penaltyShootout?.teamAScores || 0} -{' '}
            {footballState.penaltyShootout?.teamBScores || 0} {match.teamBName}
          </span>
        </div>

        {isAuthorized && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePenaltyShoot('A', true)}
                className="flex-1 py-1.5 bg-emerald-500 text-black font-bold rounded-lg text-xs"
              >
                {match.teamAName} Goal
              </button>
              <button
                onClick={() => handlePenaltyShoot('A', false)}
                className="flex-1 py-1.5 bg-rose-500/20 text-rose-400 font-bold rounded-lg text-xs"
              >
                Miss
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePenaltyShoot('B', true)}
                className="flex-1 py-1.5 bg-cyan-500 text-black font-bold rounded-lg text-xs"
              >
                {match.teamBName} Goal
              </button>
              <button
                onClick={() => handlePenaltyShoot('B', false)}
                className="flex-1 py-1.5 bg-rose-500/20 text-rose-400 font-bold rounded-lg text-xs"
              >
                Miss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
