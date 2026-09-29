import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MatchItem, SportType } from '../types/models';
import { EmptyState } from './EmptyState';
import { Radio, Calendar, MapPin, Plus, CheckCircle2, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CircularCoinTossModal } from './CircularCoinTossModal';
import { MatchDownloadModal } from './MatchDownloadModal';
import { exportAllMatchesAsCSV, exportAllMatchesAsJSON } from '../lib/exportUtils';

interface MatchesViewProps {
  selectedSport: SportType;
  filterStatus?: 'live' | 'upcoming' | 'completed' | 'all';
}

export const MatchesView: React.FC<MatchesViewProps> = ({ selectedSport, filterStatus = 'all' }) => {
  const { userProfile, currentUser } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tossModalMatch, setTossModalMatch] = useState<MatchItem | null>(null);
  const [downloadModalMatch, setDownloadModalMatch] = useState<MatchItem | null>(null);

  const canCreate = userProfile?.role === 'organizer' || userProfile?.role === 'admin';

  useEffect(() => {
    setLoading(true);
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('sport', '==', selectedSport));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: MatchItem[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as MatchItem);
        });
        setMatches(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching matches:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedSport]);

  const displayedMatches = matches.filter((m) => {
    if (filterStatus === 'all') return true;
    return m.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <span>{selectedSport === 'cricket' ? '🏏' : '⚽'}</span>
            <span>
              {filterStatus === 'live'
                ? 'Live Arena Matches'
                : `${selectedSport.toUpperCase()} Fixtures & Results`}
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real matches loaded from Firestore with interactive coin toss engine & scorecard state
          </p>
        </div>

        {/* Bulk Download Options */}
        {matches.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAllMatchesAsCSV(displayedMatches, selectedSport)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition"
              title="Download all fixtures as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => exportAllMatchesAsJSON(displayedMatches, selectedSport)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition"
              title="Download all fixtures as JSON data"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Export JSON</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
          Querying Firestore matches...
        </div>
      ) : displayedMatches.length === 0 ? (
        <EmptyState
          icon={filterStatus === 'live' ? <Radio className="w-6 h-6 text-rose-500" /> : <Calendar className="w-6 h-6" />}
          title={filterStatus === 'live' ? "No live matches in progress right now" : `No registered ${selectedSport} matches found`}
          description={
            filterStatus === 'live'
              ? 'When an organizer kicks off a match or ball-by-ball scoring session, it will show up here in real time.'
              : 'Generate tournament fixtures or register competitive games under Tournaments.'
          }
          roleRequired="Organizer or Admin"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedMatches.map((m) => {
            const tossLocked = !!m.toss?.executed;

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-bold text-zinc-400 uppercase">{m.tournamentName || m.stageName || 'Friendly'}</span>
                    {m.status === 'live' ? (
                      <span className="flex items-center gap-1 text-rose-500 font-bold animate-pulse text-[11px]">
                        <Radio className="w-3.5 h-3.5" /> LIVE
                      </span>
                    ) : (
                      <span className="text-zinc-500 capitalize">{m.status.replace('_', ' ')}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-zinc-100 dark:border-zinc-800">
                    <div className="text-left font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {m.teamAName}
                    </div>
                    <div className="text-center px-4 font-mono font-black text-sm">
                      {m.teamAScore || '-'} : {m.teamBScore || '-'}
                    </div>
                    <div className="text-right font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {m.teamBName}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {m.venue || m.city}
                    </span>
                    <span>{m.currentOverOrMinute || new Date(m.scheduledAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Card Footer: Toss, Download & Action Console */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  {tossLocked ? (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">
                        Toss: {m.toss?.winnerTeamName}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-400">
                      Coin toss pending
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    {/* Download / Export Match Record Button */}
                    <button
                      onClick={() => setDownloadModalMatch(m)}
                      className="p-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
                      title="Download Scorecard / Match Record (PDF, CSV, JSON)"
                    >
                      <Download className="w-4 h-4 text-emerald-500" />
                    </button>

                    <button
                      onClick={() => setTossModalMatch(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                        tossLocked
                          ? 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20'
                      }`}
                    >
                      {tossLocked ? 'Inspect Toss' : 'Coin Toss'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COIN TOSS MODAL */}
      {tossModalMatch && (
        <CircularCoinTossModal
          match={tossModalMatch}
          isOpen={!!tossModalMatch}
          onClose={() => setTossModalMatch(null)}
          onTossCompleted={(updated) => {
            setMatches((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
          }}
        />
      )}

      {/* MATCH RECORDS DOWNLOAD MODAL */}
      {downloadModalMatch && (
        <MatchDownloadModal
          match={downloadModalMatch}
          isOpen={!!downloadModalMatch}
          onClose={() => setDownloadModalMatch(null)}
        />
      )}
    </div>
  );
};
