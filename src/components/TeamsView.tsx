import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TeamItem, SportType } from '../types/models';
import { EmptyState } from './EmptyState';
import { Users, Plus, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TeamsView: React.FC<{ selectedSport: SportType }> = ({ selectedSport }) => {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, where('sport', '==', selectedSport));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: TeamItem[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as TeamItem);
        });
        setTeams(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching teams:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedSport]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            <span>{selectedSport.toUpperCase()} Squads & Clubs</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real rosters, clubs, and sports teams configured in Firestore
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
          Loading clubs and teams from Firestore...
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-6 h-6 text-zinc-400" />}
          title={`No ${selectedSport} teams registered yet`}
          description="Athletes and organizers can create squads, draft players, and register for tournaments once teams are established."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">{t.name}</h3>
              <p className="text-xs text-zinc-400 mt-1">Captain: {t.captainName}</p>
              <div className="mt-3 text-xs text-zinc-500 flex justify-between">
                <span>City: {t.city}</span>
                <span>{t.membersCount || 0} Members</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
