import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppUser, SportType } from '../types/models';
import { EmptyState } from './EmptyState';
import { Search, MapPin, Award, User, Filter } from 'lucide-react';

interface PlayersViewProps {
  selectedSport: SportType;
  onOpenAuth: () => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({ selectedSport, onOpenAuth }) => {
  const [players, setPlayers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    // Listen to real Firestore users collection
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('role', '==', 'player'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: AppUser[] = [];
        snapshot.forEach((doc) => {
          fetched.push(doc.data() as AppUser);
        });
        setPlayers(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching players:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedSport]);

  const filtered = players.filter((player) => {
    const matchesSearch =
      player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = !cityFilter || player.location?.city?.toLowerCase().includes(cityFilter.toLowerCase());

    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <span>{selectedSport === 'cricket' ? '🏏' : '⚽'}</span>
            <span>Registered Players</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real registered athlete profiles verified via Firestore database
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search athlete by name, skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs w-48 sm:w-64 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter by city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs w-36 sm:w-44 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
          Loading player records from Firestore...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No registered players found yet"
          description={
            searchTerm || cityFilter
              ? 'No players matched your active search filters.'
              : 'There are currently no registered player records in the Firestore database. Be the first athlete to join!'
          }
          actionText="Register Your Player Profile"
          onAction={onOpenAuth}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((player) => (
            <div
              key={player.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-black text-emerald-600 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-700">
                    {player.name ? player.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                      {player.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {player.location?.city || 'Unspecified'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                  {player.experienceLevel}
                </span>
              </div>

              {/* Sport Specific Badges */}
              {selectedSport === 'cricket' && player.cricketProfile && (
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs space-y-1">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Batting:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">
                      {player.cricketProfile.battingStyle} ({player.cricketProfile.battingPosition})
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Bowling:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">
                      {player.cricketProfile.bowlingStyle}
                    </span>
                  </div>
                  {player.cricketProfile.isWicketKeeper && (
                    <div className="text-[10px] text-amber-500 font-bold uppercase mt-1">
                      🧤 Wicket Keeper
                    </div>
                  )}
                </div>
              )}

              {selectedSport === 'football' && player.footballProfile && (
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs space-y-1">
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Position:</span>
                    <span className="font-bold text-emerald-500">
                      {player.footballProfile.primaryPosition}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Foot:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">
                      {player.footballProfile.preferredFoot} Footed
                    </span>
                  </div>
                  {player.footballProfile.characteristics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {player.footballProfile.characteristics.map((char, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold"
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {player.bio && (
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
                  "{player.bio}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
