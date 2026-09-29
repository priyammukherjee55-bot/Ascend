import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  CommentaryLog,
  CommentaryLanguage,
  FootballCommentaryStyle,
  SportType,
} from '../types/models';
import {
  Radio,
  Flame,
  Globe,
  Filter,
  Volume2,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

interface MultiLanguageCommentaryFeedProps {
  matchId: string;
  sport: SportType;
  currentLanguage: CommentaryLanguage;
  onLanguageChange: (lang: CommentaryLanguage) => void;
  footballStyle: FootballCommentaryStyle;
  onFootballStyleChange: (style: FootballCommentaryStyle) => void;
}

export const MultiLanguageCommentaryFeed: React.FC<MultiLanguageCommentaryFeedProps> = ({
  matchId,
  sport,
  currentLanguage,
  onLanguageChange,
  footballStyle,
  onFootballStyleChange,
}) => {
  const [commentaries, setCommentaries] = useState<CommentaryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlySidhuism, setOnlySidhuism] = useState(false);

  // Subscribe to live commentary documents for this match in real-time
  useEffect(() => {
    setLoading(true);
    const commRef = collection(db, 'commentary');
    const q = query(
      commRef,
      where('matchId', '==', matchId),
      limit(60)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CommentaryLog[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as CommentaryLog);
        });
        // Sort descending by timestamp
        list.sort((a, b) => b.timestamp - a.timestamp);
        setCommentaries(list);
        setLoading(false);
      },
      (err) => {
        console.error('Commentary listener error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [matchId]);

  // Filtered commentary
  const displayed = commentaries.filter((c) => {
    if (onlySidhuism && !c.isSidhuism) return false;
    return true;
  });

  return (
    <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-xl space-y-4">
      {/* Top Controls: Language Switcher, Sidhu Special Filter, Football Style Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
          <h4 className="font-black text-sm uppercase tracking-wide text-white">
            Live Commentary Feed
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400">
            {commentaries.length} Events
          </span>
        </div>

        {/* Right Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language Switcher (EN | HI | BN) stored in localStorage */}
          <div className="p-1 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center text-xs font-black">
            {(['en', 'hi', 'bn'] as CommentaryLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-2.5 py-1 rounded-lg uppercase tracking-wider transition ${
                  currentLanguage === lang
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'HI हिन्दी' : 'BN বাংলা'}
              </button>
            ))}
          </div>

          {/* Sidhu Special Filter Toggle */}
          <button
            onClick={() => setOnlySidhuism(!onlySidhuism)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              onlySidhuism
                ? 'bg-amber-500 text-black border border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-zinc-850'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${onlySidhuism ? 'fill-black' : 'text-amber-500'}`} />
            <span>Sidhu Special</span>
          </button>

          {/* Football Style Selector */}
          {sport === 'football' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-zinc-500 text-[10px] font-bold uppercase">Style:</span>
              <select
                value={footballStyle}
                onChange={(e) => onFootballStyleChange(e.target.value as FootballCommentaryStyle)}
                className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-200"
              >
                <option value="worldcup">World Cup</option>
                <option value="epl">Premier League</option>
                <option value="laliga">La Liga (Golazo)</option>
                <option value="sidhu">🔥 Sidhu Comedy</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Live Commentary Timeline Feed */}
      {loading ? (
        <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">
          Connecting to real-time commentary stream...
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-xs">
          {onlySidhuism
            ? 'No Sidhu Special lines recorded yet. Keep watching every 4th delivery or 5th incident!'
            : 'No live commentary events logged for this fixture yet. Deliver a ball or log an event to start!'}
        </div>
      ) : (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin">
          {displayed.map((c) => {
            // Select active language text
            const activeText =
              currentLanguage === 'hi'
                ? c.textHi || c.textEn
                : currentLanguage === 'bn'
                ? c.textBn || c.textEn
                : c.textEn;

            return (
              <div
                key={c.id}
                className={`p-3.5 rounded-2xl border transition ${
                  c.isSidhuism
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : c.eventType.includes('wicket') || c.eventType.includes('goal')
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-zinc-900/60 border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800">
                      {c.periodOrOver}
                    </span>

                    {c.bowlerSpeedKmph && (
                      <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">
                        ⚡ {c.bowlerSpeedKmph} km/h ({c.bowlerSpeedMph} mph)
                      </span>
                    )}

                    {c.isSidhuism && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <Flame className="w-3 h-3 fill-amber-400" /> SIDHU SPECIAL
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  {activeText}
                </p>

                {c.scoreSnapshot && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                    <span>Score Snapshot: {c.scoreSnapshot}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
