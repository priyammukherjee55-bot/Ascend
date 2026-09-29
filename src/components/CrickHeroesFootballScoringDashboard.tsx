import React, { useState, useEffect } from 'react';
import { MatchItem, LiveFootballState, LiveFootballEvent, CommentaryLog } from '../types/models';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { generateFootballCommentary } from '../lib/commentaryEngine';
import {
  Flame,
  Shield,
  Activity,
  Award,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sliders,
  AlertCircle,
  Crosshair,
  User,
  Users,
} from 'lucide-react';

interface CrickHeroesFootballScoringDashboardProps {
  match: MatchItem;
  onStateUpdated?: (updatedState: LiveFootballState) => void;
  onConcludeMatch?: () => void;
}

export const CrickHeroesFootballScoringDashboard: React.FC<CrickHeroesFootballScoringDashboardProps> = ({
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

  // Default rosters
  const teamAPlayers = [
    'Sunil Chhetri (C)',
    'Gurpreet Singh Sandhu (GK)',
    'Sandesh Jhingan',
    'Anirudh Thapa',
    'Sahal Abdul Samad',
    'Lallianzuala Chhangte',
    'Subhasish Bose',
    'Nikhil Poojary',
    'Jeakson Singh',
    'Manvir Singh',
    'Mahesh Singh',
  ];

  const teamBPlayers = [
    'Lionel Messi (C)',
    'Emiliano Martinez (GK)',
    'Cristian Romero',
    'Nicolas Otamendi',
    'Rodrigo De Paul',
    'Enzo Fernandez',
    'Alexis Mac Allister',
    'Julian Alvarez',
    'Angel Di Maria',
    'Nahuel Molina',
    'Nicolas Tagliafico',
  ];

  // Custom half duration (e.g. 10, 20, 30, 40, or 45 mins)
  const [halfDuration, setHalfDuration] = useState<number>(match.halfDurationMinutes || 45);

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
    };
  });

  // Goal Modal states
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTeam, setGoalTeam] = useState<'A' | 'B'>('A');
  const [goalScorer, setGoalScorer] = useState<string>(teamAPlayers[0]);
  const [goalAssist, setGoalAssist] = useState<string>('None');
  const [goalPosition, setGoalPosition] = useState<'Inside Box' | 'Outside Box' | 'Header' | 'Penalty'>('Inside Box');

  // Defensive & Disciplinary Modal states
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardTeam, setCardTeam] = useState<'A' | 'B'>('A');
  const [cardPlayer, setCardPlayer] = useState<string>(teamAPlayers[2]);
  const [cardType, setCardType] = useState<'yellow_card' | 'red_card'>('yellow_card');

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Sync if match changes
  useEffect(() => {
    if (match.footballState) {
      setFootballState(match.footballState);
    }
  }, [match.footballState]);

  // Match clock ticker
  useEffect(() => {
    let interval: any;
    if (footballState.isTimerRunning) {
      interval = setInterval(() => {
        setFootballState((prev) => {
          const nextMin = prev.currentMinute + 1;
          // Check Half-Time trigger
          if (prev.period === '1H' && nextMin >= halfDuration) {
            triggerToast(`🔔 Half-Time Whistle! First Half Ended at ${halfDuration}'`);
            return {
              ...prev,
              currentMinute: halfDuration,
              period: 'HT',
              isTimerRunning: false,
            };
          }
          // Check Full-Time trigger
          if (prev.period === '2H' && nextMin >= halfDuration * 2) {
            triggerToast(`🏁 Full-Time Whistle! Match Ended at ${halfDuration * 2}'`);
            return {
              ...prev,
              currentMinute: halfDuration * 2,
              period: 'FT',
              isTimerRunning: false,
            };
          }
          return { ...prev, currentMinute: nextMin };
        });
      }, 3000); // 3-second simulation ticker
    }
    return () => clearInterval(interval);
  }, [footballState.isTimerRunning, footballState.period, halfDuration]);

  // Toggle timer
  const toggleTimer = async () => {
    const nextRunning = !footballState.isTimerRunning;
    const nextState = { ...footballState, isTimerRunning: nextRunning };
    setFootballState(nextState);
    const matchRef = doc(db, 'matches', match.id);
    await updateDoc(matchRef, { footballState: nextState });
  };

  // Resume Second Half transition
  const resumeSecondHalf = async () => {
    const nextState: LiveFootballState = {
      ...footballState,
      period: '2H',
      currentMinute: halfDuration,
      isTimerRunning: true,
    };
    setFootballState(nextState);
    triggerToast('▶️ Second Half Underway!');
    const matchRef = doc(db, 'matches', match.id);
    await updateDoc(matchRef, { footballState: nextState });
  };

  // Log Goal with Position Tracking
  const handleLogGoal = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const isTeamA = goalTeam === 'A';
      const teamName = isTeamA ? match.teamAName : match.teamBName;
      const teamId = isTeamA ? match.teamAId : match.teamBId;

      const event: LiveFootballEvent = {
        minute: footballState.currentMinute,
        type: 'goal',
        teamId,
        teamName,
        playerName: goalScorer,
        secondaryPlayerName: goalAssist !== 'None' ? goalAssist : undefined,
        detail: `Goal (${goalPosition})`,
      };

      const nextState: LiveFootballState = {
        ...footballState,
        teamAGoals: isTeamA ? footballState.teamAGoals + 1 : footballState.teamAGoals,
        teamBGoals: !isTeamA ? footballState.teamBGoals + 1 : footballState.teamBGoals,
        events: [event, ...footballState.events],
      };

      setFootballState(nextState);
      setGoalModalOpen(false);

      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, {
        footballState: nextState,
        teamAScore: nextState.teamAGoals.toString(),
        teamBScore: nextState.teamBGoals.toString(),
        currentOverOrMinute: `${nextState.currentMinute}'`,
        status: 'live',
      });

      // Commentary entry
      const eventIndex = nextState.events.length;
      const comm = generateFootballCommentary(
        match.id,
        footballState.currentMinute,
        eventIndex,
        'goal',
        'worldcup',
        goalScorer,
        teamName,
        `${nextState.teamAGoals} - ${nextState.teamBGoals}`
      );
      await addDoc(collection(db, 'commentary'), comm);

      triggerToast(`⚽ GOAL! ${goalScorer} (${goalPosition})`);
      if (onStateUpdated) onStateUpdated(nextState);
    } catch (err) {
      console.error('Error logging goal:', err);
    } finally {
      setSaving(false);
    }
  };

  // One-click Goalkeeper Save Tracker (+50 ranking pts)
  const handleLogGKSave = async (team: 'A' | 'B') => {
    if (saving) return;
    setSaving(true);
    try {
      const gkName = team === 'A' ? teamAPlayers[1] : teamBPlayers[1];
      const teamName = team === 'A' ? match.teamAName : match.teamBName;
      const teamId = team === 'A' ? match.teamAId : match.teamBId;

      const eventIndex = (footballState.events?.length || 0) + 1;
      const comm = generateFootballCommentary(
        match.id,
        footballState.currentMinute,
        eventIndex,
        'goal',
        'worldcup',
        gkName,
        teamName,
        `${footballState.teamAGoals} - ${footballState.teamBGoals}`
      );
      comm.eventType = 'football_save';
      comm.textEn = `WHAT A SAVE! Spectacular diving stop by ${gkName}!`;
      comm.textHi = `कमाल का बचाव! गोलकीपर ${gkName} का शानदार डाइव लगाकर गेंद को रोका!`;
      comm.textBn = `অসাধারণ সেভ! গোলরক্ষক ${gkName}-এর দুর্দান্ত ঝাঁপ!`;
      await addDoc(collection(db, 'commentary'), comm);

      triggerToast(`🧤 GK SAVE LOGGED! ${gkName} (+50 Ranking Pts)`);
    } catch (err) {
      console.error('Error logging GK save:', err);
    } finally {
      setSaving(false);
    }
  };

  // Defensive Action Tracker (+30 ranking pts for tackles/interceptions)
  const handleLogDefensiveAction = async (team: 'A' | 'B', actionType: 'tackle' | 'interception') => {
    if (saving) return;
    setSaving(true);
    try {
      const defName = team === 'A' ? teamAPlayers[2] : teamBPlayers[2];
      const teamName = team === 'A' ? match.teamAName : match.teamBName;

      const eventIndex = (footballState.events?.length || 0) + 1;
      const comm = generateFootballCommentary(
        match.id,
        footballState.currentMinute,
        eventIndex,
        'goal',
        'worldcup',
        defName,
        teamName,
        `${footballState.teamAGoals} - ${footballState.teamBGoals}`
      );
      comm.eventType = 'football_tackle';
      comm.textEn = `DEFENSIVE MASTERCLASS! Crucial last-ditch ${actionType} executed cleanly by ${defName}!`;
      comm.textHi = `शानदार डिफेंस! ${defName} ने बेहतरीन टैकल करके खतरे को टाला!`;
      comm.textBn = `দুর্দান্ত ডিফেন্স! ${defName}-এর অনবদ্য হস্তক্ষেপ!`;
      await addDoc(collection(db, 'commentary'), comm);

      triggerToast(`🛡️ ${actionType.toUpperCase()} LOGGED! ${defName} (+30 Pts)`);
    } catch (err) {
      console.error('Error logging defense:', err);
    } finally {
      setSaving(false);
    }
  };

  // Conclude Football Match
  const handleConcludeMatch = async () => {
    if (!isAuthorized || saving) return;
    setSaving(true);
    try {
      const matchRef = doc(db, 'matches', match.id);
      const isTeamAWinner = footballState.teamAGoals > footballState.teamBGoals;
      const isDraw = footballState.teamAGoals === footballState.teamBGoals;

      await updateDoc(matchRef, {
        status: 'completed',
        winnerId: isDraw ? null : isTeamAWinner ? match.teamAId : match.teamBId,
        winnerName: isDraw ? 'Match Drawn' : isTeamAWinner ? match.teamAName : match.teamBName,
        isDrawOrTie: isDraw,
      });

      triggerToast('🏆 MATCH CONCLUDED! Official Stats Pushed to Leaderboards');
      if (onConcludeMatch) onConcludeMatch();
    } catch (err) {
      console.error('Error concluding football match:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-zinc-950 text-white border border-emerald-500 shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-xl">⚡</span>
          <div className="text-xs font-black text-emerald-400">{toastMsg}</div>
        </div>
      )}

      {/* Header Scoreboard & Half Time Indicator */}
      <div className="p-5 rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              ⚽ CrickHeroes Football Scorer
            </span>
            <span className="text-zinc-500">•</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold">
              Period: {footballState.period} ({halfDuration}m halves)
            </span>
          </div>

          <div className="flex items-baseline gap-4 mt-1">
            <h2 className="text-4xl font-black font-mono text-emerald-400">
              {footballState.teamAGoals} - {footballState.teamBGoals}
            </h2>
            <span className="text-xl font-mono text-amber-400 flex items-center gap-1">
              <Clock className="w-5 h-5" /> {footballState.currentMinute}'
            </span>
          </div>
        </div>

        {/* Timer & Half-Time Controls */}
        <div className="flex items-center gap-2">
          {footballState.period === 'HT' ? (
            <button
              onClick={resumeSecondHalf}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase tracking-wider transition shadow-lg flex items-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-current" /> Resume 2nd Half
            </button>
          ) : (
            <button
              onClick={toggleTimer}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition flex items-center gap-1.5 ${
                footballState.isTimerRunning
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-emerald-500 text-zinc-950'
              }`}
            >
              {footballState.isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pause Clock
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Start Clock
                </>
              )}
            </button>
          )}

          {/* Conclude Button */}
          <button
            onClick={handleConcludeMatch}
            className="px-3.5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-black uppercase transition"
          >
            End Match
          </button>
        </div>
      </div>

      {/* Action Logging Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team A Controls */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase text-emerald-500">
            <span>{match.teamAName} Controls</span>
            <span>Goals: {footballState.teamAGoals}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setGoalTeam('A');
                setGoalScorer(teamAPlayers[0]);
                setGoalModalOpen(true);
              }}
              className="py-3 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase transition shadow-md flex flex-col items-center gap-1 cursor-pointer"
            >
              <span>⚽ GOAL</span>
              <span className="text-[9px] font-normal">Select Pitch Pos</span>
            </button>

            <button
              onClick={() => handleLogGKSave('A')}
              className="py-3 px-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 text-xs font-bold transition flex flex-col items-center gap-1"
            >
              <span>🧤 GK Save</span>
              <span className="text-[9px] text-zinc-400">+50 Pts</span>
            </button>

            <button
              onClick={() => handleLogDefensiveAction('A', 'tackle')}
              className="py-3 px-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition flex flex-col items-center gap-1"
            >
              <span>🛡️ Tackle</span>
              <span className="text-[9px] text-zinc-400">+30 Pts</span>
            </button>
          </div>
        </div>

        {/* Team B Controls */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase text-cyan-500">
            <span>{match.teamBName} Controls</span>
            <span>Goals: {footballState.teamBGoals}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setGoalTeam('B');
                setGoalScorer(teamBPlayers[0]);
                setGoalModalOpen(true);
              }}
              className="py-3 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase transition shadow-md flex flex-col items-center gap-1 cursor-pointer"
            >
              <span>⚽ GOAL</span>
              <span className="text-[9px] font-normal">Select Pitch Pos</span>
            </button>

            <button
              onClick={() => handleLogGKSave('B')}
              className="py-3 px-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 text-xs font-bold transition flex flex-col items-center gap-1"
            >
              <span>🧤 GK Save</span>
              <span className="text-[9px] text-zinc-400">+50 Pts</span>
            </button>

            <button
              onClick={() => handleLogDefensiveAction('B', 'tackle')}
              className="py-3 px-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition flex flex-col items-center gap-1"
            >
              <span>🛡️ Tackle</span>
              <span className="text-[9px] text-zinc-400">+30 Pts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Goal Logging Modal with Pitch Position Selection */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-zinc-900 dark:text-zinc-100">
            <h3 className="text-lg font-black uppercase text-emerald-500 mb-1 flex items-center gap-2">
              ⚽ Log Football Goal
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Team: <strong>{goalTeam === 'A' ? match.teamAName : match.teamBName}</strong> at Minute {footballState.currentMinute}'
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Goal Scorer
                </label>
                <select
                  value={goalScorer}
                  onChange={(e) => setGoalScorer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs border border-zinc-300 dark:border-zinc-700"
                >
                  {(goalTeam === 'A' ? teamAPlayers : teamBPlayers).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Assist Provider
                </label>
                <select
                  value={goalAssist}
                  onChange={(e) => setGoalAssist(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs border border-zinc-300 dark:border-zinc-700"
                >
                  <option value="None">None (Solo / Unassisted)</option>
                  {(goalTeam === 'A' ? teamAPlayers : teamBPlayers)
                    .filter((p) => p !== goalScorer)
                    .map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Pitch Position & Style
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  {(['Inside Box', 'Outside Box', 'Header', 'Penalty'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setGoalPosition(pos)}
                      className={`p-2.5 rounded-xl uppercase transition ${
                        goalPosition === pos
                          ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setGoalModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogGoal}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase"
                >
                  Confirm Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
