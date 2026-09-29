import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  MatchItem,
  SportType,
  CommentaryLanguage,
  FootballCommentaryStyle,
} from '../types/models';
import { CricketScoringPanel } from './CricketScoringPanel';
import { FootballScoringPanel } from './FootballScoringPanel';
import { MultiLanguageCommentaryFeed } from './MultiLanguageCommentaryFeed';
import { CircularCoinTossModal } from './CircularCoinTossModal';
import { MatchDownloadModal } from './MatchDownloadModal';
import { CricbuzzLiveScorecard } from './CricbuzzLiveScorecard';
import { CrickHeroesCricketScoringDashboard } from './CrickHeroesCricketScoringDashboard';
import { CrickHeroesFootballScoringDashboard } from './CrickHeroesFootballScoringDashboard';
import { InteractiveFootballPlayerModal } from './InteractiveFootballPlayerModal';
import { EmptyState } from './EmptyState';
import {
  Radio,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Flame,
  Globe,
  Sliders,
  CheckCircle2,
  ChevronRight,
  Shield,
  Download,
  Zap,
} from 'lucide-react';

interface LiveMatchCenterProps {
  selectedSport: SportType;
  onOpenAuth: () => void;
}

export const LiveMatchCenter: React.FC<LiveMatchCenterProps> = ({
  selectedSport,
  onOpenAuth,
}) => {
  // Stored language preference in localStorage
  const [commentaryLang, setCommentaryLang] = useState<CommentaryLanguage>(() => {
    const saved = localStorage.getItem('commentaryLang') as CommentaryLanguage | null;
    if (saved === 'en' || saved === 'hi' || saved === 'bn') return saved;
    return 'en';
  });

  const handleSetLanguage = (lang: CommentaryLanguage) => {
    setCommentaryLang(lang);
    localStorage.setItem('commentaryLang', lang);
  };

  // Football style selector
  const [footballStyle, setFootballStyle] = useState<FootballCommentaryStyle>('worldcup');

  // Active Live Matches from Firestore
  const [liveMatches, setLiveMatches] = useState<MatchItem[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tossModalOpen, setTossModalOpen] = useState(false);

  // Tabs inside Match Center: Scorecard & Controls | Commentary
  const [activeTab, setActiveTab] = useState<'scoring' | 'commentary' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cricbuzz' | 'crickheroes'>('cricbuzz');
  const [selectedFootballPlayer, setSelectedFootballPlayer] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef,
      where('sport', '==', selectedSport)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: MatchItem[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as MatchItem);
        });

        // Filter live or toss_completed or upcoming
        setLiveMatches(list);
        if (list.length > 0) {
          // Default to live match or first fixture
          const liveOne = list.find((m) => m.status === 'live');
          setSelectedMatch((prev) => (prev ? list.find((m) => m.id === prev.id) || liveOne || list[0] : liveOne || list[0]));
        } else {
          setSelectedMatch(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching live matches:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedSport]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
              Live Sports Match Center
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time ball-by-ball & pitch telemetry with multi-language AI commentary (English, Hindi, Bengali)
          </p>
        </div>

        {/* Global Match Center Language Switcher */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-zinc-400">Language:</span>
          <div className="p-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center text-xs font-black">
            {(['en', 'hi', 'bn'] as CommentaryLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleSetLanguage(lang)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider transition ${
                  commentaryLang === lang
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'HI हिन्दी' : 'BN বাংলা'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Match Selector Strip */}
      {liveMatches.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {liveMatches.map((m) => {
            const isSelected = selectedMatch?.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMatch(m)}
                className={`p-3.5 rounded-2xl text-left border transition min-w-[240px] shrink-0 ${
                  isSelected
                    ? 'bg-zinc-900 border-emerald-500 text-white shadow-lg'
                    : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-1">
                  <span>{m.tournamentName || m.stageName || 'Match'}</span>
                  {m.status === 'live' ? (
                    <span className="text-rose-500 font-bold flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse" /> LIVE
                    </span>
                  ) : (
                    <span className="capitalize">{m.status.replace('_', ' ')}</span>
                  )}
                </div>
                <p className="font-extrabold text-xs truncate">
                  {m.teamAName} vs {m.teamBName}
                </p>
                <p className="text-[11px] font-mono text-emerald-400 mt-0.5">
                  {m.teamAScore || '0'} : {m.teamBScore || '0'} • {m.currentOverOrMinute || '0 ov'}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
          Connecting to Live Match Stream...
        </div>
      ) : !selectedMatch ? (
        <EmptyState
          icon={<Radio className="w-6 h-6 text-rose-500 animate-pulse" />}
          title={`No live ${selectedSport} matches currently streaming`}
          description="Go to Tournaments or Matches to initiate a scheduled fixture and begin real-time ball-by-ball scoring."
        />
      ) : (
        /* Active Live Match Center Workspace */
        <div className="space-y-6">
          {/* Match Scoreboard & Toss Snapshot */}
          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                🪙
              </div>
              <div className="text-xs">
                {selectedMatch.toss?.executed ? (
                  <p className="text-zinc-800 dark:text-zinc-200 font-bold">
                    Toss won by <strong className="text-amber-500">{selectedMatch.toss.winnerTeamName}</strong> (Landed {selectedMatch.toss.zoneLanded}), elected to{' '}
                    <strong className="uppercase text-emerald-500">{selectedMatch.toss.choice}</strong>.
                  </p>
                ) : (
                  <p className="text-zinc-500">
                    Match coin toss has not been executed yet.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Global Dual-App Experience Switcher (Cricbuzz vs CrickHeroes) */}
              <div className="flex items-center p-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                <button
                  onClick={() => setViewMode('cricbuzz')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                    viewMode === 'cricbuzz'
                      ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Cricbuzz View</span>
                </button>
                <button
                  onClick={() => setViewMode('crickheroes')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                    viewMode === 'crickheroes'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>CrickHeroes Scorer</span>
                </button>
              </div>

              {/* Download Match Scorecard Button */}
              <button
                onClick={() => setDownloadModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition"
                title="Download / Print Official Match Scorecard"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Scorecard</span>
              </button>

              <button
                onClick={() => setTossModalOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase rounded-xl transition shadow-md shadow-amber-500/20"
              >
                {selectedMatch.toss?.executed ? 'Inspect Official Toss' : 'Execute Coin Toss'}
              </button>
            </div>
          </div>

          {/* Dual Engine Workspace: Scoring Panel + Multi-Language Commentary Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Real-Time Scoring / Cricbuzz Scorecard (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {selectedSport === 'cricket' ? (
                viewMode === 'cricbuzz' ? (
                  <CricbuzzLiveScorecard match={selectedMatch} />
                ) : (
                  <CrickHeroesCricketScoringDashboard
                    match={selectedMatch}
                    onStateUpdated={(upState) => {
                      setSelectedMatch((prev) =>
                        prev ? { ...prev, cricketState: upState } : null
                      );
                    }}
                  />
                )
              ) : viewMode === 'cricbuzz' ? (
                /* Cricbuzz-style Pro Football Match Center View */
                <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between text-xs font-black uppercase text-emerald-500 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4" /> Pro Football Scoreboard
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      Click any player for Opponent Impact Analytics
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 text-white flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-zinc-400">{selectedMatch.teamAName}</div>
                      <div className="text-3xl font-mono font-black text-emerald-400">
                        {selectedMatch.footballState?.teamAGoals || 0}
                      </div>
                    </div>
                    <div className="text-center font-mono">
                      <div className="text-xs text-amber-400 font-bold">
                        {selectedMatch.footballState?.currentMinute || 0}' ({selectedMatch.footballState?.period || '1H'})
                      </div>
                      <div className="text-zinc-500 text-[10px]">VS</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-400">{selectedMatch.teamBName}</div>
                      <div className="text-3xl font-mono font-black text-amber-400">
                        {selectedMatch.footballState?.teamBGoals || 0}
                      </div>
                    </div>
                  </div>

                  {/* Clickable Lineup Players for Opponent Impact Analytics Pop-up */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">
                        {selectedMatch.teamAName} Lineup
                      </div>
                      {['Sunil Chhetri', 'Sandesh Jhingan', 'Gurpreet Sandhu', 'Sahal Samad'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setSelectedFootballPlayer(p)}
                          className="w-full text-left p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-emerald-500/10 text-zinc-800 dark:text-zinc-200 flex items-center justify-between text-xs font-bold transition"
                        >
                          <span>{p}</span>
                          <span className="text-[10px] text-emerald-500">Impact Stats →</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">
                        {selectedMatch.teamBName} Lineup
                      </div>
                      {['Lionel Messi', 'Julian Alvarez', 'Emiliano Martinez', 'Rodrigo De Paul'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setSelectedFootballPlayer(p)}
                          className="w-full text-left p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-emerald-500/10 text-zinc-800 dark:text-zinc-200 flex items-center justify-between text-xs font-bold transition"
                        >
                          <span>{p}</span>
                          <span className="text-[10px] text-cyan-500">Impact Stats →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <CrickHeroesFootballScoringDashboard
                  match={selectedMatch}
                  onStateUpdated={(upState) => {
                    setSelectedMatch((prev) =>
                      prev ? { ...prev, footballState: upState } : null
                    );
                  }}
                />
              )}
            </div>

            {/* Right Column: Multi-Language Commentary Engine Feed (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <MultiLanguageCommentaryFeed
                matchId={selectedMatch.id}
                sport={selectedSport}
                currentLanguage={commentaryLang}
                onLanguageChange={handleSetLanguage}
                footballStyle={footballStyle}
                onFootballStyleChange={setFootballStyle}
              />
            </div>
          </div>

          {/* Interactive Football Player Modal */}
          {selectedFootballPlayer && (
            <InteractiveFootballPlayerModal
              isOpen={!!selectedFootballPlayer}
              onClose={() => setSelectedFootballPlayer(null)}
              playerName={selectedFootballPlayer}
              match={selectedMatch}
              events={selectedMatch.footballState?.events}
            />
          )}
        </div>
      )}

      {/* COIN TOSS MODAL */}
      {tossModalOpen && selectedMatch && (
        <CircularCoinTossModal
          match={selectedMatch}
          isOpen={tossModalOpen}
          onClose={() => setTossModalOpen(false)}
          onTossCompleted={(updated) => setSelectedMatch(updated)}
        />
      )}

      {/* MATCH RECORDS DOWNLOAD MODAL */}
      {downloadModalOpen && selectedMatch && (
        <MatchDownloadModal
          match={selectedMatch}
          isOpen={downloadModalOpen}
          onClose={() => setDownloadModalOpen(false)}
        />
      )}
    </div>
  );
};
