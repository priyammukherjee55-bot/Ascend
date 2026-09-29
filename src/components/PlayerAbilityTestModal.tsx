import React, { useState, useEffect } from 'react';
import {
  AppUser,
  PlayerAbilityRatings,
  AbilityTestType,
  AbilityTestRecord,
  SportType,
} from '../types/models';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Zap,
  Shield,
  Target,
  Activity,
  Flame,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Trophy,
  Award,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface PlayerAbilityTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  player?: AppUser | null;
  onSuccess?: (newRatings: PlayerAbilityRatings) => void;
}

export const PlayerAbilityTestModal: React.FC<PlayerAbilityTestModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
}) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const targetUser = player || userProfile;

  const [activeTest, setActiveTest] = useState<AbilityTestType>('speed_100m');
  const [sportContext, setSportContext] = useState<SportType>('football');

  // Input states for each test
  const [sprintTime, setSprintTime] = useState<number>(
    targetUser?.abilityRatings?.sprint100mSec || 11.2
  );
  const [shotVelocity, setShotVelocity] = useState<number>(
    targetUser?.abilityRatings?.shotVelocityKmph || 105
  );
  const [shotAccuracy, setShotAccuracy] = useState<number>(85);
  const [defenseSuccessRate, setDefenseSuccessRate] = useState<number>(88);
  const [bowlingRadarSpeed, setBowlingRadarSpeed] = useState<number>(
    targetUser?.abilityRatings?.bowlingRadarKmph || 135
  );
  const [passingAccuracy, setPassingAccuracy] = useState<number>(86);
  const [dribblingShuttleSec, setDribblingShuttleSec] = useState<number>(14.2);

  // Stopwatch state for real-time 100m sprint testing
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTimeMs, setStopwatchTimeMs] = useState(0);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Stopwatch timer effect
  useEffect(() => {
    let interval: any;
    if (stopwatchRunning) {
      const startTime = Date.now() - stopwatchTimeMs;
      interval = setInterval(() => {
        setStopwatchTimeMs(Date.now() - startTime);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  if (!isOpen) return null;

  // Calculators for 0-100 Ratings
  const calculateSpeedRating = (sec: number): { score: number; tier: string; topKmph: number } => {
    // 10.2s or below = 99 (Olympic/World Class), 11.0s = 92, 12.0s = 85, 13.0s = 76, 14.0s = 68
    const topKmph = Math.round(((100 / Math.max(sec, 9.5)) * 3.6) * 10) / 10;
    let score = Math.round(99 - (sec - 10.2) * 8.5);
    score = Math.max(45, Math.min(99, score));

    let tier = 'Club Athlete';
    if (score >= 95) tier = 'World-Class (Olympic Tier)';
    else if (score >= 90) tier = 'Elite Pro League';
    else if (score >= 82) tier = 'Semi-Pro Division 1';
    else if (score >= 74) tier = 'Competitive Club';

    return { score, tier, topKmph };
  };

  const calculateAttackRating = (kmph: number, acc: number): { score: number; tier: string } => {
    // Velocity: 80 - 140 km/h, Accuracy: 50 - 100%
    const velScore = Math.min(50, ((kmph - 70) / 70) * 50);
    const accScore = (acc / 100) * 50;
    const score = Math.max(50, Math.min(99, Math.round(velScore + accScore)));
    let tier = 'Club Striker';
    if (score >= 93) tier = 'World-Class Finisher';
    else if (score >= 85) tier = 'Elite Striker';
    else if (score >= 75) tier = 'Advanced Attacker';
    return { score, tier };
  };

  const calculateDefenseRating = (successRate: number): { score: number; tier: string } => {
    const score = Math.max(50, Math.min(99, Math.round((successRate / 100) * 99)));
    let tier = 'Solid Defender';
    if (score >= 92) tier = 'World-Class Interceptor';
    else if (score >= 84) tier = 'Elite Center-Back / Defensive Wall';
    else if (score >= 75) tier = 'Reliable Marker';
    return { score, tier };
  };

  const calculateBowlingRating = (kmph: number): { score: number; tier: string } => {
    let score = Math.round(55 + ((kmph - 80) / 75) * 44);
    score = Math.max(50, Math.min(99, score));
    let tier = 'Club Bowler';
    if (kmph >= 145) tier = 'Express Fast Bowler (Bumrah/Starc Tier)';
    else if (kmph >= 135) tier = 'Fast-Medium Attack';
    else if (kmph >= 120) tier = 'Medium Pacer';
    else if (kmph <= 95) tier = 'Elite Spin Drift';
    return { score, tier };
  };

  const calculatePassingRating = (acc: number): { score: number; tier: string } => {
    const score = Math.max(50, Math.min(99, Math.round((acc / 100) * 99)));
    return { score, tier: score >= 90 ? 'Master Playmaker' : 'Accurate Distributor' };
  };

  const calculateDribblingRating = (shuttleSec: number): { score: number; tier: string } => {
    // 12.0s = 96, 14.0s = 85, 16.0s = 74
    let score = Math.round(96 - (shuttleSec - 12.0) * 5.5);
    score = Math.max(50, Math.min(99, score));
    return { score, tier: score >= 90 ? 'Elite Dribbler (Messi/Neymar Tier)' : 'Agile Ball Carrier' };
  };

  // Current calculations
  const speedCalc = calculateSpeedRating(sprintTime);
  const attackCalc = calculateAttackRating(shotVelocity, shotAccuracy);
  const defenseCalc = calculateDefenseRating(defenseSuccessRate);
  const bowlingCalc = calculateBowlingRating(bowlingRadarSpeed);
  const passingCalc = calculatePassingRating(passingAccuracy);
  const dribblingCalc = calculateDribblingRating(dribblingShuttleSec);

  // Overall Rating synthesis
  const currentOverall = Math.round(
    (speedCalc.score * 0.25 +
      attackCalc.score * 0.25 +
      defenseCalc.score * 0.2 +
      passingCalc.score * 0.15 +
      dribblingCalc.score * 0.15)
  );

  const handleStopwatchStop = () => {
    setStopwatchRunning(false);
    const recordedSec = Math.round((stopwatchTimeMs / 1000) * 100) / 100;
    if (recordedSec > 8 && recordedSec < 20) {
      setSprintTime(recordedSec);
    }
  };

  const handleSaveTest = async () => {
    const uid = targetUser?.id || currentUser?.uid;
    if (!uid) return;

    setSaving(true);
    try {
      let rawVal = sprintTime;
      let unit = 'sec';
      let title = '100m Sprint Speed Test';
      let currentScore = speedCalc.score;
      let currentTier = speedCalc.tier;

      if (activeTest === 'striking_attack') {
        rawVal = shotVelocity;
        unit = 'km/h';
        title = 'Striking Shot Power & Velocity';
        currentScore = attackCalc.score;
        currentTier = attackCalc.tier;
      } else if (activeTest === 'defense_power') {
        rawVal = defenseSuccessRate;
        unit = '%';
        title = 'Defense Interception & 1v1 Tackle Test';
        currentScore = defenseCalc.score;
        currentTier = defenseCalc.tier;
      } else if (activeTest === 'bowling_radar') {
        rawVal = bowlingRadarSpeed;
        unit = 'km/h';
        title = 'Cricket Bowling Radar Pace Test';
        currentScore = bowlingCalc.score;
        currentTier = bowlingCalc.tier;
      } else if (activeTest === 'passing_accuracy') {
        rawVal = passingAccuracy;
        unit = '%';
        title = 'Passing & Vision Accuracy Drill';
        currentScore = passingCalc.score;
        currentTier = passingCalc.tier;
      } else if (activeTest === 'dribbling_agility') {
        rawVal = dribblingShuttleSec;
        unit = 'sec';
        title = '20m Slalom Agility & Dribbling Shuttle';
        currentScore = dribblingCalc.score;
        currentTier = dribblingCalc.tier;
      }

      // 1. Log test record to 'ability_tests' collection
      const testRecord: Omit<AbilityTestRecord, 'id'> = {
        userId: uid,
        sport: sportContext,
        testType: activeTest,
        testTitle: title,
        rawValue: rawVal,
        unit,
        calculatedScore: currentScore,
        tierLabel: currentTier,
        testedAt: Date.now(),
      };

      await addDoc(collection(db, 'ability_tests'), testRecord);

      // 2. Compute and update player's public ability ratings
      const updatedRatings: PlayerAbilityRatings = {
        speed: speedCalc.score,
        sprint100mSec: sprintTime,
        topSpeedKmph: speedCalc.topKmph,
        strikingAttackPower: attackCalc.score,
        shotVelocityKmph: shotVelocity,
        defensePower: defenseCalc.score,
        passing: passingCalc.score,
        dribbling: dribblingCalc.score,
        bowlingRadarKmph: bowlingRadarSpeed,
        overallRating: currentOverall,
        lastTestedAt: Date.now(),
        totalTestsLogged: ((targetUser?.abilityRatings?.totalTestsLogged || 0) + 1),
      };

      // Update Firestore user document
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { abilityRatings: updatedRatings }, { merge: true });

      if (updateUserProfile && uid === currentUser?.uid) {
        await updateUserProfile({
          abilityRatings: updatedRatings,
        });
      }

      if (onSuccess) {
        onSuccess(updatedRatings);
      }

      setSuccessMsg(`Logged successfully! New Overall Skill: ${currentOverall} (${currentTier})`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Error logging ability test:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-zinc-950 flex items-center justify-center font-black shadow-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                Player Ability & Speed Testing Module
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">
                Official Standards
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Measure sprint speed, attack power, defense, and bowling radar metrics to update your verified profile card.
            </p>
          </div>
        </div>

        {/* Test Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800 mb-4 scrollbar-none">
          <button
            onClick={() => setActiveTest('speed_100m')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition shrink-0 ${
              activeTest === 'speed_100m'
                ? 'bg-amber-500 text-zinc-950 shadow-md'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>100m Sprint Speed</span>
          </button>

          <button
            onClick={() => setActiveTest('striking_attack')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition shrink-0 ${
              activeTest === 'striking_attack'
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Striking Attack</span>
          </button>

          <button
            onClick={() => setActiveTest('defense_power')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition shrink-0 ${
              activeTest === 'defense_power'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Defense Power</span>
          </button>

          <button
            onClick={() => setActiveTest('bowling_radar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition shrink-0 ${
              activeTest === 'bowling_radar'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Cricket Bowling Radar</span>
          </button>

          <button
            onClick={() => setActiveTest('passing_accuracy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition shrink-0 ${
              activeTest === 'passing_accuracy'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Passing & Vision</span>
          </button>

          <button
            onClick={() => setActiveTest('dribbling_agility')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition shrink-0 ${
              activeTest === 'dribbling_agility'
                ? 'bg-cyan-500 text-zinc-950 shadow-md'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dribbling Agility</span>
          </button>
        </div>

        {/* Scrollable Active Test Details */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TEST 1: 100M SPRINT */}
          {activeTest === 'speed_100m' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase text-amber-500">Speed Benchmark Test</div>
                  <h4 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">
                    100m Sprint & Acceleration
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Standard athletic track or turf test. Determines Player Speed rating (0-100) and peak velocity.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-500">{speedCalc.score}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Speed Rating</div>
                </div>
              </div>

              {/* Stopwatch & Manual Entry Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Real-Time Digital Stopwatch */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-zinc-400 mb-1 uppercase flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Sprint Stopwatch
                  </div>
                  <div className="font-mono text-3xl font-black text-zinc-900 dark:text-white tracking-wider my-2">
                    {(stopwatchTimeMs / 1000).toFixed(2)}s
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {!stopwatchRunning ? (
                      <button
                        onClick={() => setStopwatchRunning(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Start Run
                      </button>
                    ) : (
                      <button
                        onClick={handleStopwatchStop}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs transition"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" /> Stop & Apply
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setStopwatchRunning(false);
                        setStopwatchTimeMs(0);
                      }}
                      className="p-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Direct Slider & Precision Input */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between mb-1">
                      <span>Enter Sprint Time</span>
                      <span className="font-mono font-black text-amber-500 text-sm">{sprintTime.toFixed(2)}s</span>
                    </label>
                    <input
                      type="range"
                      min={10.0}
                      max={15.0}
                      step={0.05}
                      value={sprintTime}
                      onChange={(e) => setSprintTime(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>10.0s (Olympic)</span>
                      <span>11.5s (Pro)</span>
                      <span>15.0s (Club)</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Calculated Top Speed:</span>
                    <span className="font-mono font-bold text-emerald-500">{speedCalc.topKmph} km/h</span>
                  </div>
                </div>
              </div>

              {/* Tier Benchmark Breakdown */}
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-xs flex items-center justify-between">
                <span className="text-zinc-500">Performance Classification:</span>
                <span className="font-black text-amber-500 uppercase flex items-center gap-1">
                  <Award className="w-4 h-4" /> {speedCalc.tier}
                </span>
              </div>
            </div>
          )}

          {/* TEST 2: STRIKING ATTACK POWER */}
          {activeTest === 'striking_attack' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase text-rose-500">Shooting Velocity Drill</div>
                  <h4 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">
                    Striking Attack Power
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Radar ball speed off the boot + 5-target corner box accuracy test.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-rose-500">{attackCalc.score}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Attack Rating</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between mb-1">
                    <span>Radar Shot Velocity</span>
                    <span className="font-mono font-black text-rose-500 text-sm">{shotVelocity} km/h</span>
                  </label>
                  <input
                    type="range"
                    min={70}
                    max={140}
                    step={1}
                    value={shotVelocity}
                    onChange={(e) => setShotVelocity(parseInt(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                    <span>70 km/h</span>
                    <span>105 km/h (Pro)</span>
                    <span>140 km/h (Rocket)</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between mb-1">
                    <span>Target Accuracy Rate</span>
                    <span className="font-mono font-black text-rose-500 text-sm">{shotAccuracy}%</span>
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    step={2}
                    value={shotAccuracy}
                    onChange={(e) => setShotAccuracy(parseInt(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                    <span>50%</span>
                    <span>80% (Clinical)</span>
                    <span>100% (Pinpoint)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-xs flex items-center justify-between">
                <span className="text-zinc-500">Classification:</span>
                <span className="font-black text-rose-500 uppercase flex items-center gap-1">
                  <Flame className="w-4 h-4" /> {attackCalc.tier}
                </span>
              </div>
            </div>
          )}

          {/* TEST 3: DEFENSE POWER */}
          {activeTest === 'defense_power' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase text-blue-500">Tackling & Interception Drill</div>
                  <h4 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">
                    Defense Power & Reaction
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Measures 1v1 ground tackle success rate and aerial interception reaction time.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-500">{defenseCalc.score}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Defense Rating</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between mb-1">
                  <span>Successful Tackle & Interception Rate</span>
                  <span className="font-mono font-black text-blue-500 text-sm">{defenseSuccessRate}%</span>
                </label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={defenseSuccessRate}
                  onChange={(e) => setDefenseSuccessRate(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>50% (Breakthroughs allowed)</span>
                  <span>85% (Solid Wall)</span>
                  <span>100% (Unbreakable)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-xs flex items-center justify-between">
                <span className="text-zinc-500">Classification:</span>
                <span className="font-black text-blue-500 uppercase flex items-center gap-1">
                  <Shield className="w-4 h-4" /> {defenseCalc.tier}
                </span>
              </div>
            </div>
          )}

          {/* TEST 4: CRICKET BOWLING RADAR */}
          {activeTest === 'bowling_radar' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase text-emerald-500">Radar Gun Delivery Test</div>
                  <h4 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">
                    Cricket Bowling Release Speed
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Radar pace calibrated at popping crease for fast bowlers and revs/turn for spinners.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-500">{bowlingCalc.score}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Bowling Rating</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between mb-1">
                  <span>Radar Velocity at Delivery</span>
                  <span className="font-mono font-black text-emerald-500 text-sm">
                    {bowlingRadarSpeed} km/h ({(bowlingRadarSpeed * 0.621371).toFixed(1)} mph)
                  </span>
                </label>
                <input
                  type="range"
                  min={70}
                  max={155}
                  step={1}
                  value={bowlingRadarSpeed}
                  onChange={(e) => setBowlingRadarSpeed(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>80 km/h (Spin)</span>
                  <span>120 km/h (Medium)</span>
                  <span>145 km/h (Express Fast)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-xs flex items-center justify-between">
                <span className="text-zinc-500">Bowler Archetype:</span>
                <span className="font-black text-emerald-500 uppercase flex items-center gap-1">
                  <Target className="w-4 h-4" /> {bowlingCalc.tier}
                </span>
              </div>
            </div>
          )}

          {/* TEST 5: PASSING ACCURACY */}
          {activeTest === 'passing_accuracy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase text-purple-500">Distribution & Vision Drill</div>
                  <h4 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">
                    Passing Precision
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Evaluates long diagonal switches, ground through-balls, and short combination accuracy.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-purple-500">{passingCalc.score}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Passing Rating</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between mb-1">
                  <span>Pass Completion Rate</span>
                  <span className="font-mono font-black text-purple-500 text-sm">{passingAccuracy}%</span>
                </label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={passingAccuracy}
                  onChange={(e) => setPassingAccuracy(parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TEST 6: DRIBBLING AGILITY */}
          {activeTest === 'dribbling_agility' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase text-cyan-500">20m Slalom Shuttle</div>
                  <h4 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">
                    Dribbling & Agility
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Cone weave agility test measuring close control, touch frequency, and lateral burst.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-cyan-500">{dribblingCalc.score}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Dribble Rating</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between mb-1">
                  <span>Slalom Completion Time</span>
                  <span className="font-mono font-black text-cyan-500 text-sm">{dribblingShuttleSec.toFixed(1)}s</span>
                </label>
                <input
                  type="range"
                  min={11.0}
                  max={18.0}
                  step={0.1}
                  value={dribblingShuttleSec}
                  onChange={(e) => setDribblingShuttleSec(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Live Skill Radar & Attribute Bar Summary */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Simulated Skill Matrix</span>
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-500 text-xs font-black">
                <span>OVR:</span>
                <span className="text-sm">{currentOverall}</span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400">SPEED</div>
                <div className="text-sm font-black text-amber-500 mt-0.5">{speedCalc.score}</div>
                <div className="text-[9px] text-zinc-400">{sprintTime}s</div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400">ATTACK</div>
                <div className="text-sm font-black text-rose-500 mt-0.5">{attackCalc.score}</div>
                <div className="text-[9px] text-zinc-400">{shotVelocity}k</div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400">DEFENSE</div>
                <div className="text-sm font-black text-blue-500 mt-0.5">{defenseCalc.score}</div>
                <div className="text-[9px] text-zinc-400">{defenseSuccessRate}%</div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400">PASSING</div>
                <div className="text-sm font-black text-purple-500 mt-0.5">{passingCalc.score}</div>
                <div className="text-[9px] text-zinc-400">{passingAccuracy}%</div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400">DRIBBLE</div>
                <div className="text-sm font-black text-cyan-500 mt-0.5">{dribblingCalc.score}</div>
                <div className="text-[9px] text-zinc-400">{dribblingShuttleSec}s</div>
              </div>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveTest}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <span>Verifying & Synchronizing...</span>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>Log & Update Profile Card</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
