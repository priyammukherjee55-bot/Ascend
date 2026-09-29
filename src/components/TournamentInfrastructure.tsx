import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  TournamentItem,
  MatchItem,
  SportType,
  TeamItem,
  TournamentFormat,
  KnockoutBracketSize,
  CricketPointsRow,
  FootballPointsRow,
} from '../types/models';
import {
  generateRoundRobinFixtures,
  generateKnockoutFixtures,
  calculateCricketPointsTable,
  calculateFootballPointsTable,
} from '../lib/tournamentEngine';
import { CircularCoinTossModal } from './CircularCoinTossModal';
import { EmptyState } from './EmptyState';
import {
  Trophy,
  Plus,
  Play,
  Calendar,
  Shield,
  Layers,
  Award,
  Clock,
  CheckCircle2,
  X,
  Compass,
  AlertCircle,
  Radio,
} from 'lucide-react';

interface TournamentInfrastructureProps {
  selectedSport: SportType;
  onOpenAuth: () => void;
}

export const TournamentInfrastructure: React.FC<TournamentInfrastructureProps> = ({
  selectedSport,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();

  // Data states
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [activeTournament, setActiveTournament] = useState<TournamentItem | null>(null);
  const [tournamentMatches, setTournamentMatches] = useState<MatchItem[]>([]);
  const [availableTeams, setAvailableTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tossModalMatch, setTossModalMatch] = useState<MatchItem | null>(null);

  // Create Form State
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('round_robin');
  const [bracketSize, setBracketSize] = useState<KnockoutBracketSize>(8);
  const [city, setCity] = useState(userProfile?.location?.city || 'Mumbai');
  const [prizePool, setPrizePool] = useState('₹50,000 / Trophy');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Tab inside selected tournament view
  const [activeSubTab, setActiveSubTab] = useState<'fixtures' | 'points' | 'bracket'>('fixtures');

  const isOrganizer =
    userProfile?.role === 'organizer' || userProfile?.role === 'admin';

  // 1. Fetch tournaments from Firestore
  useEffect(() => {
    setLoading(true);
    const tourneysRef = collection(db, 'tournaments');
    const q = query(tourneysRef, where('sport', '==', selectedSport));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: TournamentItem[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as TournamentItem);
        });
        setTournaments(fetched);
        if (fetched.length > 0 && !activeTournament) {
          setActiveTournament(fetched[0]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tournaments:', err);
        setLoading(false);
      }
    );

    // Fetch teams for registration
    const teamsRef = collection(db, 'teams');
    const qTeams = query(teamsRef, where('sport', '==', selectedSport));
    const unsubscribeTeams = onSnapshot(qTeams, (snapshot) => {
      const tList: TeamItem[] = [];
      snapshot.forEach((doc) => {
        tList.push({ id: doc.id, ...doc.data() } as TeamItem);
      });
      setAvailableTeams(tList);
    });

    return () => {
      unsubscribe();
      unsubscribeTeams();
    };
  }, [selectedSport]);

  // 2. Fetch matches for selected active tournament
  useEffect(() => {
    if (!activeTournament) {
      setTournamentMatches([]);
      return;
    }

    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('tournamentId', '==', activeTournament.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mList: MatchItem[] = [];
      snapshot.forEach((doc) => {
        mList.push({ id: doc.id, ...doc.data() } as MatchItem);
      });
      // Sort by matchNumber
      mList.sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));
      setTournamentMatches(mList);
    });

    return () => unsubscribe();
  }, [activeTournament]);

  // 3. Handle Create Tournament Container
  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setCreateLoading(true);
    setFormError(null);

    try {
      const enrolled = availableTeams.filter((t) => selectedTeamIds.includes(t.id));
      if (enrolled.length < 2) {
        throw new Error('Please select at least 2 teams to register in the tournament.');
      }

      const newTournament: Omit<TournamentItem, 'id'> = {
        sport: selectedSport,
        name: name.trim(),
        city: city.trim(),
        format,
        bracketSize: format === 'knockout' ? bracketSize : undefined,
        startDate: Date.now(),
        endDate: Date.now() + 14 * 24 * 3600 * 1000,
        teamsCount: enrolled.length,
        maxTeams: format === 'knockout' ? bracketSize : 16,
        registeredTeamIds: enrolled.map((t) => t.id),
        registeredTeams: enrolled.map((t) => ({ id: t.id, name: t.name, logoUrl: t.logoUrl })),
        prizePool: prizePool.trim(),
        organizerId: currentUser.uid,
        organizerName: userProfile?.name || 'Tournament Director',
        status: 'open',
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'tournaments'), newTournament);
      setCreateModalOpen(false);
      setName('');
      setSelectedTeamIds([]);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create tournament');
    } finally {
      setCreateLoading(false);
    }
  };

  // 4. Algorithmic Fixture Generator Trigger
  const handleGenerateFixtures = async () => {
    if (!activeTournament || !currentUser) return;
    setLoading(true);

    try {
      const teams = activeTournament.registeredTeams || [];
      if (teams.length < 2) {
        alert('Need at least 2 registered teams to generate schedule.');
        return;
      }

      let generatedFixtures: Omit<MatchItem, 'id'>[] = [];

      if (activeTournament.format === 'round_robin') {
        generatedFixtures = generateRoundRobinFixtures(
          activeTournament.id,
          activeTournament.name,
          activeTournament.sport,
          teams,
          activeTournament.city,
          currentUser.uid
        );
      } else if (activeTournament.format === 'knockout') {
        generatedFixtures = generateKnockoutFixtures(
          activeTournament.id,
          activeTournament.name,
          activeTournament.sport,
          teams,
          activeTournament.bracketSize || 8,
          activeTournament.city,
          currentUser.uid
        );
      } else {
        // Group + Knockout fallback
        generatedFixtures = generateRoundRobinFixtures(
          activeTournament.id,
          activeTournament.name,
          activeTournament.sport,
          teams,
          activeTournament.city,
          currentUser.uid
        );
      }

      // Batch write fixtures to Firestore matches collection
      const batch = writeBatch(db);
      generatedFixtures.forEach((fix) => {
        const newDocRef = doc(collection(db, 'matches'));
        batch.set(newDocRef, fix);
      });

      // Update tournament status
      const tourneyRef = doc(db, 'tournaments', activeTournament.id);
      batch.update(tourneyRef, { status: 'fixtures_generated' });

      await batch.commit();
      setActiveTournament((prev) => (prev ? { ...prev, status: 'fixtures_generated' } : null));
    } catch (err) {
      console.error('Error generating fixtures:', err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Points Table Engine Calculations
  const enrolledTeams = activeTournament?.registeredTeams || [];
  const cricketPoints =
    activeTournament?.sport === 'cricket'
      ? calculateCricketPointsTable(enrolledTeams, tournamentMatches)
      : [];
  const footballPoints =
    activeTournament?.sport === 'football'
      ? calculateFootballPointsTable(enrolledTeams, tournamentMatches)
      : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-purple-500" />
            <span>Tournament & Championship Infrastructure</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Algorithmic Round-Robin & Knockout engines, automated ICC/FIFA points tables, and coin toss
          </p>
        </div>

        {isOrganizer && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Tournament</span>
          </button>
        )}
      </div>

      {/* Tournament Selector Pill Bar */}
      {tournaments.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTournament(t)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase whitespace-nowrap transition flex items-center gap-2 ${
                activeTournament?.id === t.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{t.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
                {t.format.replace('_', ' ')}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
          Loading tournament infrastructure and fixtures...
        </div>
      ) : !activeTournament ? (
        <EmptyState
          icon={<Trophy className="w-6 h-6 text-zinc-400" />}
          title={`No ${selectedSport} tournaments established yet`}
          description="League organizers can create round-robin leagues, knockout cups, or group stage tournaments."
          actionText={isOrganizer ? 'Create Tournament' : 'Sign In as Organizer'}
          onAction={() => (isOrganizer ? setCreateModalOpen(true) : onOpenAuth())}
          roleRequired="Organizer"
        />
      ) : (
        /* Active Tournament Container Details */
        <div className="space-y-6">
          {/* Tournament Overview Card */}
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                  {activeTournament.format.replace('_', ' ')}
                </span>
                <span className="text-xs text-zinc-400">• {activeTournament.city}</span>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">
                {activeTournament.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Prize Pool: <strong className="text-amber-400">{activeTournament.prizePool || 'Championship Cup'}</strong> | Enrolled:{' '}
                <strong>{activeTournament.registeredTeams?.length || 0} Squads</strong>
              </p>
            </div>

            {/* Fixture Generation Trigger for Organizer */}
            <div className="flex items-center gap-3">
              {activeTournament.status === 'open' && isOrganizer && (
                <button
                  onClick={handleGenerateFixtures}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/30"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Generate Match Tree (Algorithm)</span>
                </button>
              )}

              {activeTournament.status === 'fixtures_generated' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" /> Fixtures Live
                </span>
              )}
            </div>
          </div>

          {/* Sub Navigation Bar: Fixtures | Points Table | Bracket */}
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <button
              onClick={() => setActiveSubTab('fixtures')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeSubTab === 'fixtures'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Fixtures & Coin Toss ({tournamentMatches.length})
            </button>

            {activeTournament.format !== 'knockout' && (
              <button
                onClick={() => setActiveSubTab('points')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  activeSubTab === 'points'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Points Standings (Auto-Calculated)
              </button>
            )}

            {activeTournament.format === 'knockout' && (
              <button
                onClick={() => setActiveSubTab('bracket')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  activeSubTab === 'bracket'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                Knockout Tree
              </button>
            )}
          </div>

          {/* TAB 1: FIXTURES WITH INTERACTIVE COIN TOSS ENGINE */}
          {activeSubTab === 'fixtures' && (
            <div className="space-y-4">
              {tournamentMatches.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="w-6 h-6 text-zinc-400" />}
                  title="No fixtures scheduled yet"
                  description="Click 'Generate Match Tree' to execute the polygon round-robin or knockout seeding algorithm."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tournamentMatches.map((m) => {
                    const tossLocked = !!m.toss?.executed;

                    return (
                      <div
                        key={m.id}
                        className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className="font-extrabold text-zinc-500 uppercase">
                              {m.stageName || `Match #${m.matchNumber}`}
                            </span>
                            {m.status === 'live' ? (
                              <span className="text-rose-500 font-bold flex items-center gap-1 text-[11px] animate-pulse">
                                <Radio className="w-3.5 h-3.5" /> LIVE
                              </span>
                            ) : (
                              <span className="text-zinc-500 capitalize">{m.status.replace('_', ' ')}</span>
                            )}
                          </div>

                          {/* Teams Row */}
                          <div className="py-2.5 border-y border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <span className="font-bold text-sm text-zinc-900 dark:text-white">
                              {m.teamAName}
                            </span>
                            <span className="text-xs font-mono font-bold text-zinc-400 px-3">
                              VS
                            </span>
                            <span className="font-bold text-sm text-zinc-900 dark:text-white">
                              {m.teamBName}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span>{m.venue}</span>
                            <span>{new Date(m.scheduledAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Toss Section */}
                        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                          {tossLocked ? (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                Toss: {m.toss?.winnerTeamName} elected to {m.toss?.choice}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-zinc-400">
                              Coin toss pending execution
                            </div>
                          )}

                          <button
                            onClick={() => setTossModalMatch(m)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                              tossLocked
                                ? 'border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20'
                            }`}
                          >
                            {tossLocked ? 'Inspect Toss Record' : 'Execute Coin Toss'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTOMATIC POINTS TABLE ENGINE */}
          {activeSubTab === 'points' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto shadow-sm">
              <h4 className="text-base font-black uppercase text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>
                  {activeTournament.sport === 'cricket'
                    ? 'Official Cricket Standings (ICC Net Run Rate Engine)'
                    : 'Official Football League Standings (FIFA Standard)'}
                </span>
              </h4>

              {activeTournament.sport === 'cricket' ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-extrabold text-[10px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Squad</th>
                      <th className="py-2.5 px-3 text-center">Played</th>
                      <th className="py-2.5 px-3 text-center">Won</th>
                      <th className="py-2.5 px-3 text-center">Lost</th>
                      <th className="py-2.5 px-3 text-center">Tied</th>
                      <th className="py-2.5 px-3 text-center font-mono">NRR</th>
                      <th className="py-2.5 px-3 text-right font-black text-amber-500">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {cricketPoints.map((row, idx) => (
                      <tr key={row.teamId} className="hover:bg-zinc-50 dark:hover:bg-zinc-850">
                        <td className="py-3 px-3 font-mono font-bold text-zinc-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-zinc-900 dark:text-white">
                          {row.teamName}
                        </td>
                        <td className="py-3 px-3 text-center">{row.played}</td>
                        <td className="py-3 px-3 text-center text-emerald-500 font-bold">{row.won}</td>
                        <td className="py-3 px-3 text-center text-rose-500">{row.lost}</td>
                        <td className="py-3 px-3 text-center text-zinc-400">{row.tied}</td>
                        <td className="py-3 px-3 text-center font-mono">
                          {row.netRunRate > 0 ? `+${row.netRunRate}` : row.netRunRate}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-amber-500 text-sm">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-extrabold text-[10px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Club</th>
                      <th className="py-2.5 px-3 text-center">Played</th>
                      <th className="py-2.5 px-3 text-center">Won</th>
                      <th className="py-2.5 px-3 text-center">Draw</th>
                      <th className="py-2.5 px-3 text-center">Lost</th>
                      <th className="py-2.5 px-3 text-center font-mono">GD</th>
                      <th className="py-2.5 px-3 text-right font-black text-emerald-500">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {footballPoints.map((row, idx) => (
                      <tr key={row.teamId} className="hover:bg-zinc-50 dark:hover:bg-zinc-850">
                        <td className="py-3 px-3 font-mono font-bold text-zinc-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-zinc-900 dark:text-white">
                          {row.teamName}
                        </td>
                        <td className="py-3 px-3 text-center">{row.played}</td>
                        <td className="py-3 px-3 text-center text-emerald-500 font-bold">{row.won}</td>
                        <td className="py-3 px-3 text-center text-zinc-400">{row.draw}</td>
                        <td className="py-3 px-3 text-center text-rose-500">{row.lost}</td>
                        <td className="py-3 px-3 text-center font-mono">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-500 text-sm">
                          {row.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 3: KNOCKOUT BRACKET VIEW */}
          {activeSubTab === 'bracket' && (
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-100 overflow-x-auto space-y-4">
              <h4 className="text-sm font-black uppercase text-purple-400 tracking-wider">
                Single-Elimination Knockout Ladder ({activeTournament.bracketSize || 8} Teams)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 min-w-[700px]">
                {/* Round 1 Column */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-zinc-400 uppercase">Quarter Finals</h5>
                  {tournamentMatches.filter((m) => m.roundNumber === 1).map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                      <p className="font-bold">{m.teamAName}</p>
                      <p className="font-bold text-zinc-400">vs {m.teamBName}</p>
                    </div>
                  ))}
                </div>

                {/* Round 2 Column */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-zinc-400 uppercase">Semi Finals</h5>
                  {tournamentMatches.filter((m) => m.roundNumber === 2).map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                      <p className="font-bold">{m.teamAName}</p>
                      <p className="font-bold text-zinc-400">vs {m.teamBName}</p>
                    </div>
                  ))}
                </div>

                {/* Championship Final */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-amber-400 uppercase">🏆 Championship Final</h5>
                  {tournamentMatches.filter((m) => m.stageName?.includes('Final') && m.roundNumber === 3).map((m) => (
                    <div key={m.id} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                      <p className="font-black text-amber-400">{m.teamAName}</p>
                      <p className="font-bold text-zinc-400">vs {m.teamBName}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE TOURNAMENT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-800">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base uppercase">Create Tournament</h3>
                <p className="text-xs text-zinc-400">Algorithmic League & Knockout Engine</p>
              </div>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTournament} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-zinc-400 mb-1">Tournament Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Premier League Cup 2026"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-zinc-400 mb-1">Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs"
                  >
                    <option value="round_robin">Round Robin (League)</option>
                    <option value="knockout">Knockout (Cup Tree)</option>
                    <option value="group_knockout">Group + Knockout</option>
                  </select>
                </div>

                {format === 'knockout' ? (
                  <div>
                    <label className="block font-bold uppercase text-zinc-400 mb-1">Bracket Size</label>
                    <select
                      value={bracketSize}
                      onChange={(e) => setBracketSize(parseInt(e.target.value) as any)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs"
                    >
                      <option value={4}>4 Teams (SF + Final)</option>
                      <option value={8}>8 Teams (Quarter Finals)</option>
                      <option value={16}>16 Teams (Round of 16)</option>
                      <option value={32}>32 Teams (Round of 32)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold uppercase text-zinc-400 mb-1">Prize Pool / Trophy</label>
                    <input
                      type="text"
                      value={prizePool}
                      onChange={(e) => setPrizePool(e.target.value)}
                      placeholder="e.g. Trophy & Medals"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold uppercase text-zinc-400 mb-1">Host City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs"
                />
              </div>

              {/* Select Enrolled Teams */}
              <div>
                <label className="block font-bold uppercase text-zinc-400 mb-1.5">
                  Select Registered Squads to Enlist ({selectedTeamIds.length} chosen)
                </label>
                {availableTeams.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    No registered squads found for {selectedSport.toUpperCase()}. Please register squads under "Teams" view first.
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
                    {availableTeams.map((t) => {
                      const isChecked = selectedTeamIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-900 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTeamIds([...selectedTeamIds, t.id]);
                              } else {
                                setSelectedTeamIds(selectedTeamIds.filter((id) => id !== t.id));
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-600 w-4 h-4"
                          />
                          <span className="font-bold text-zinc-200">{t.name}</span>
                          <span className="text-[10px] text-zinc-500">({t.city})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider rounded-xl transition"
                >
                  {createLoading ? 'Building...' : 'Establish Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CIRCULAR COIN TOSS MODAL */}
      {tossModalMatch && (
        <CircularCoinTossModal
          match={tossModalMatch}
          isOpen={!!tossModalMatch}
          onClose={() => setTossModalMatch(null)}
          onTossCompleted={(updated) => {
            setTournamentMatches((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
          }}
        />
      )}
    </div>
  );
};
