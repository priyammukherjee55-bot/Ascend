import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AppUser,
  CricketBattingStyle,
  CricketBowlingStyle,
  CricketFormat,
  FootballFoot,
  FootballPosition,
  AvailabilityType,
  TeamSeekingStatus,
} from '../types/models';
import { encodeGeohash, fuzzCoordinates, SAMPLE_HIERARCHIES } from '../lib/geo';
import { User, Shield, MapPin, Award, Activity, Save, CheckCircle2, Clock, Users, Zap, Flame, Sparkles, Target, TrendingUp } from 'lucide-react';
import { PlayerAbilityTestModal } from './PlayerAbilityTestModal';

export const ProfileView: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isAbilityTestModalOpen, setIsAbilityTestModalOpen] = useState(false);
  const [activeStatsSport, setActiveStatsSport] = useState<'cricket' | 'football'>('cricket');

  // Editable Profile fields
  const [name, setName] = useState(userProfile?.name || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [age, setAge] = useState<number>(userProfile?.age || 22);
  const [country, setCountry] = useState(userProfile?.location?.country || 'India');
  const [state, setState] = useState(userProfile?.location?.state || 'Maharashtra');
  const [district, setDistrict] = useState(userProfile?.location?.district || 'Mumbai Suburban');
  const [city, setCity] = useState(userProfile?.location?.city || 'Mumbai');
  const [locality, setLocality] = useState(userProfile?.location?.locality || 'Bandra');
  const [experienceLevel, setExperienceLevel] = useState(userProfile?.experienceLevel || 'intermediate');
  const [availability, setAvailability] = useState<AvailabilityType>(userProfile?.availability || 'available_now');
  const [teamStatus, setTeamStatus] = useState<TeamSeekingStatus>(userProfile?.teamStatus || 'looking_for_team');

  // Cricket settings
  const [cricketBatting, setCricketBatting] = useState<CricketBattingStyle>(
    userProfile?.cricketProfile?.battingStyle || 'RHB'
  );
  const [cricketBattingPos, setCricketBattingPos] = useState(
    userProfile?.cricketProfile?.battingPosition || 'Top Order'
  );
  const [cricketBowling, setCricketBowling] = useState<CricketBowlingStyle>(
    userProfile?.cricketProfile?.bowlingStyle || 'Right-arm Fast'
  );
  const [isWicketKeeper, setIsWicketKeeper] = useState<boolean>(
    userProfile?.cricketProfile?.isWicketKeeper || false
  );
  const [cricketFormat, setCricketFormat] = useState<CricketFormat>('T20');

  // Football settings
  const [footballFoot, setFootballFoot] = useState<FootballFoot>(
    userProfile?.footballProfile?.preferredFoot || 'Right'
  );
  const [footballPosition, setFootballPosition] = useState<FootballPosition>(
    userProfile?.footballProfile?.primaryPosition || 'CM'
  );
  const [footballChars, setFootballChars] = useState<string>(
    userProfile?.footballProfile?.characteristics?.join(', ') || 'Playmaker, High Stamina'
  );

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-zinc-900 border border-zinc-800 rounded-3xl text-zinc-100 shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-black">
          ⚡
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight">Athlete Profile Required</h2>
        <p className="mt-2 text-xs text-zinc-400 mb-6 leading-relaxed">
          Sign in or create an athlete profile to configure your Cricket and Football technical models, batting & bowling styles, preferred foot, and tactical traits.
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold uppercase text-xs rounded-xl transition"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const charsArray = footballChars.split(',').map((s) => s.trim()).filter(Boolean);

      // Find approx lat/lon from sample hierarchies or preserve existing
      let lat = userProfile?.location?.latitude;
      let lon = userProfile?.location?.longitude;

      if (!lat || !lon) {
        // Find default coordinates from city dictionary
        for (const c of SAMPLE_HIERARCHIES) {
          for (const s of c.states) {
            for (const d of s.districts) {
              for (const ct of d.cities) {
                if (ct.name.toLowerCase() === city.toLowerCase()) {
                  lat = ct.lat;
                  lon = ct.lon;
                  break;
                }
              }
            }
          }
        }
      }

      if (!lat) lat = 19.076;
      if (!lon) lon = 72.8777;

      // Apply privacy jitter (~500m fuzzing) and calculate geohash
      const fuzzed = fuzzCoordinates(lat, lon);
      const geohash = encodeGeohash(fuzzed.latitude, fuzzed.longitude, 6);

      await updateUserProfile({
        name,
        bio,
        age: Number(age) || 20,
        experienceLevel,
        availability,
        teamStatus,
        location: {
          country,
          state,
          district,
          city,
          locality,
          geohash,
          latitude: fuzzed.latitude,
          longitude: fuzzed.longitude,
        },
        cricketProfile: {
          battingStyle: cricketBatting,
          battingPosition: cricketBattingPos as any,
          bowlingStyle: cricketBowling,
          isWicketKeeper,
          preferredFormats: [cricketFormat, 'T20'],
        },
        footballProfile: {
          preferredFoot: footballFoot,
          primaryPosition: footballPosition,
          characteristics: charsArray,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Badge */}
      <div className="p-6 md:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-100 flex flex-col md:flex-row items-center gap-6 justify-between shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 flex items-center justify-center text-3xl font-black border-2 border-emerald-400/50 shadow-lg">
            {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black uppercase tracking-tight">{userProfile?.name || 'Athlete'}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                {userProfile?.role || 'Player'}
              </span>
              {userProfile?.teamStatus === 'looking_for_team' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                  Free Agent
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">{currentUser.email}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                {userProfile?.location?.city || 'City Not Set'} (~fuzzed privacy geohash)
              </span>
              <span>•</span>
              <span className="capitalize text-zinc-300 font-semibold">{userProfile?.experienceLevel || 'Intermediate'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Prominent Profile Action Button: Test / Log Your Ability */}
          <button
            type="button"
            onClick={() => setIsAbilityTestModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
            title="Test / Log Standardized Skill & Ability Metrics"
          >
            <Zap className="w-4 h-4 fill-zinc-950" />
            <span>Test / Log Your Ability</span>
          </button>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> Synchronized with Firestore!
            </div>
          )}
        </div>
      </div>

      {/* DETAILED REAL-TIME PLAYER STATS & SKILL RADAR MODULE */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider border border-amber-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Real-Time Ability & Metrics Card
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Tier: {userProfile?.abilityRatings?.abilityTier || 'Pro Athlete'}
              </span>
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
              Verified Physical & Skill Radar
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center">
              <button
                type="button"
                onClick={() => setActiveStatsSport('cricket')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                  activeStatsSport === 'cricket'
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                🏏 Cricket
              </button>
              <button
                type="button"
                onClick={() => setActiveStatsSport('football')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                  activeStatsSport === 'football'
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                ⚽ Football
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAbilityTestModalOpen(true)}
              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
              title="Run New Ability Drill"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden md:inline">Log Drill</span>
            </button>
          </div>
        </div>

        {/* Dynamic Milestone Rule Notification Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs">
          <Award className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-amber-500 uppercase tracking-wide">
              Dynamic Milestone Calculation Rules Active:
            </span>
            <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
              <strong>Short Formats (≤ 12 overs) & Test Innings (≤ 45 overs):</strong> 30–59 runs = <strong>50 (Half-Century)</strong> | 60+ runs = <strong>100 (Century)</strong>.
              <br />
              <strong>Standard Formats (&gt; 12 overs / &gt; 45 overs):</strong> Standard 50 to 99 runs = 50 | 100+ runs = 100.
            </p>
          </div>
        </div>

        {/* Visual Content: Cricket or Football */}
        {activeStatsSport === 'cricket' ? (
          <div className="space-y-6">
            {/* 1. Batting Metrics Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Batting Metrics
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  Strike Rate: <strong className="text-zinc-900 dark:text-zinc-100">{userProfile?.customStats?.cricket?.strikeRate || 138.5}</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Total Runs</span>
                  <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">{userProfile?.customStats?.cricket?.totalRuns || 1240}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Strike Rate</span>
                  <span className="text-base font-black font-mono text-amber-500">{userProfile?.customStats?.cricket?.strikeRate || 138.5}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Average (Avg)</span>
                  <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">{userProfile?.customStats?.cricket?.battingAvg || 41.3}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Highest (HS)</span>
                  <span className="text-base font-black font-mono text-emerald-500">{userProfile?.customStats?.cricket?.highestScore || '94*'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">50s (Fifties)</span>
                  <span className="text-base font-black font-mono text-amber-400">{userProfile?.customStats?.cricket?.fifties || 8}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">100s (Centuries)</span>
                  <span className="text-base font-black font-mono text-orange-500">{userProfile?.customStats?.cricket?.centuries || 2}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Fours (4s)</span>
                  <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">{userProfile?.customStats?.cricket?.fours || 112}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Sixes (6s)</span>
                  <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">{userProfile?.customStats?.cricket?.sixes || 34}</span>
                </div>
              </div>
            </div>

            {/* 2. Bowling Metrics Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-blue-500 tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Bowling Metrics
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  Radar Speed: <strong className="text-blue-500">{userProfile?.abilityRatings?.bowlingRadarKmph || 135} km/h</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Total Wickets</span>
                  <span className="text-base font-black font-mono text-blue-500">{userProfile?.customStats?.cricket?.totalWickets || 28}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Economy (Econ)</span>
                  <span className="text-base font-black font-mono text-emerald-500">{userProfile?.customStats?.cricket?.economyRate || 6.8}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Bowling Avg</span>
                  <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">{userProfile?.customStats?.cricket?.bowlingAvg || 22.4}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Bowling SR</span>
                  <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">{userProfile?.customStats?.cricket?.bowlingStrikeRate || 19.8}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Best Figures (BBF)</span>
                  <span className="text-base font-black font-mono text-purple-500">{userProfile?.customStats?.cricket?.bestBowlingFigures || '4/18'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Physical & Skill Ratings */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Physical & Skill Ratings
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  Sprint Time: <strong className="text-emerald-500">{userProfile?.abilityRatings?.sprint100mSec || 11.2}s (100m)</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Player Speed</span>
                  <span className="text-base font-black font-mono text-emerald-500">{userProfile?.abilityRatings?.speedScore || 88}</span>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${userProfile?.abilityRatings?.speedScore || 88}%` }} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Defense Power</span>
                  <span className="text-base font-black font-mono text-blue-500">{userProfile?.abilityRatings?.defenseScore || 79}</span>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${userProfile?.abilityRatings?.defenseScore || 79}%` }} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Striking Attack</span>
                  <span className="text-base font-black font-mono text-rose-500">{userProfile?.abilityRatings?.attackScore || 89}</span>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${userProfile?.abilityRatings?.attackScore || 89}%` }} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Passing</span>
                  <span className="text-base font-black font-mono text-amber-500">{userProfile?.abilityRatings?.passingScore || 85}</span>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${userProfile?.abilityRatings?.passingScore || 85}%` }} />
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Dribbling</span>
                  <span className="text-base font-black font-mono text-purple-500">{userProfile?.abilityRatings?.dribblingScore || 87}</span>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${userProfile?.abilityRatings?.dribblingScore || 87}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Football Performance Metrics */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Performance Metrics
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">Official Match Tracking</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Goals</span>
                  <span className="text-base font-black font-mono text-emerald-500">{userProfile?.customStats?.football?.goals || 18}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Assists</span>
                  <span className="text-base font-black font-mono text-amber-500">{userProfile?.customStats?.football?.assists || 12}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Clean Sheets</span>
                  <span className="text-base font-black font-mono text-blue-500">{userProfile?.customStats?.football?.cleanSheets || 5}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">GK Saves</span>
                  <span className="text-base font-black font-mono text-purple-500">{userProfile?.customStats?.football?.goalkeeperSaves || 14}</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase">Tackles</span>
                  <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">{userProfile?.customStats?.football?.successfulTackles || 32}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editing Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Personal Details & Discovery Metadata */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <User className="w-4 h-4" /> Athlete Personal Data & Geolocation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Age</label>
              <input
                type="number"
                min={12}
                max={60}
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value) || 20)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="semi-pro">Semi-Pro</option>
                <option value="pro">Professional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Schedule Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as AvailabilityType)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
              >
                <option value="available_now">🟢 Available Now</option>
                <option value="weekends">📅 Weekends Only</option>
                <option value="evenings">🌙 Evenings</option>
                <option value="all">⚡ Flexible All Times</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Team Seeking Status</label>
              <select
                value={teamStatus}
                onChange={(e) => setTeamStatus(e.target.value as TeamSeekingStatus)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
              >
                <option value="looking_for_team">🔥 Free Agent (Looking for Team)</option>
                <option value="looking_for_players">👥 Team Captain (Looking for Players)</option>
                <option value="none">🔒 Not Currently Seeking</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Locality</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Bio / Profile Summary</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell clubs, managers, and scouts about your play style, leadership, or recent form..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Cricket Profile Customization */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <span>🏏</span> Cricket Technical Profile
            </h2>
            <span className="text-[11px] font-bold text-zinc-500">Firestore Model</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Batting Style</label>
              <select
                value={cricketBatting}
                onChange={(e) => setCricketBatting(e.target.value as CricketBattingStyle)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
              >
                <option value="RHB">Right-Hand Bat (RHB)</option>
                <option value="LHB">Left-Hand Bat (LHB)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Batting Position</label>
              <select
                value={cricketBattingPos}
                onChange={(e) => setCricketBattingPos(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
              >
                <option value="Opener">Opener</option>
                <option value="Top Order">Top Order (3-4)</option>
                <option value="Middle Order">Middle Order (5-7)</option>
                <option value="Lower Order">Lower Order (8-11)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Bowling Style</label>
              <select
                value={cricketBowling}
                onChange={(e) => setCricketBowling(e.target.value as CricketBowlingStyle)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
              >
                <option value="Right-arm Fast">Right-arm Fast</option>
                <option value="Right-arm Medium">Right-arm Medium</option>
                <option value="Right-arm Off-Spin">Right-arm Off-Spin</option>
                <option value="Right-arm Leg-Spin">Right-arm Leg-Spin</option>
                <option value="Left-arm Fast">Left-arm Fast</option>
                <option value="Left-arm Medium">Left-arm Medium</option>
                <option value="Slow Left-arm Orthodox">Slow Left-arm Orthodox</option>
                <option value="Left-arm Wrist-Spin (Chinaman)">Left-arm Wrist-Spin (Chinaman)</option>
                <option value="None">None (Pure Batsman)</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWicketKeeper}
                  onChange={(e) => setIsWicketKeeper(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <span>Wicket Keeper (WK)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Football Profile Customization */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-emerald-500 flex items-center gap-2">
              <span>⚽</span> Football Technical Profile
            </h2>
            <span className="text-[11px] font-bold text-zinc-500">Firestore Model</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Preferred Foot</label>
              <select
                value={footballFoot}
                onChange={(e) => setFootballFoot(e.target.value as FootballFoot)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
              >
                <option value="Right">Right Foot</option>
                <option value="Left">Left Foot</option>
                <option value="Both">Both Feet (Ambidextrous)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Primary Pitch Position</label>
              <select
                value={footballPosition}
                onChange={(e) => setFootballPosition(e.target.value as FootballPosition)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
              >
                <option value="GK">Goalkeeper (GK)</option>
                <option value="CB">Center Back (CB)</option>
                <option value="LB">Left Back (LB)</option>
                <option value="RB">Right Back (RB)</option>
                <option value="LWB">Left Wing Back (LWB)</option>
                <option value="RWB">Right Wing Back (RWB)</option>
                <option value="CDM">Defensive Midfielder (CDM)</option>
                <option value="CM">Central Midfielder (CM)</option>
                <option value="CAM">Attacking Midfielder (CAM)</option>
                <option value="LM">Left Midfielder (LM)</option>
                <option value="RM">Right Midfielder (RM)</option>
                <option value="LW">Left Winger (LW)</option>
                <option value="RW">Right Winger (RW)</option>
                <option value="ST">Striker (ST)</option>
                <option value="CF">Center Forward (CF)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">
              Player Characteristics & Traits (Comma-separated)
            </label>
            <input
              type="text"
              value={footballChars}
              onChange={(e) => setFootballChars(e.target.value)}
              placeholder="e.g. Pace, Dribbler, Aerial Threat, Box-to-Box, Finisher"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold uppercase tracking-wider text-xs rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Syncing to Firestore...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* Interactive Speed & Ability Test Modal */}
      {isAbilityTestModalOpen && (
        <PlayerAbilityTestModal
          isOpen={isAbilityTestModalOpen}
          onClose={() => setIsAbilityTestModalOpen(false)}
          player={userProfile}
        />
      )}
    </div>
  );
};
