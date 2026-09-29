import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { TeamItem, TeamJoinRequest, SportType, AppUser, TeamMember } from '../types/models';
import { EmptyState } from './EmptyState';
import {
  Users,
  Plus,
  Shield,
  MapPin,
  UserCheck,
  UserPlus,
  Crown,
  Award,
  CheckCircle2,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';

interface TeamManagementViewProps {
  selectedSport: SportType;
  onOpenAuth: () => void;
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  selectedSport,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);

  // Form fields for creating a team
  const [teamName, setTeamName] = useState('');
  const [shortName, setShortName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [city, setCity] = useState(userProfile?.location?.city || 'Mumbai');
  const [viceCaptainName, setViceCaptainName] = useState('');
  const [isRecruiting, setIsRecruiting] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Join Requests
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequest[]>([]);
  const [requestMsg, setRequestMsg] = useState('');
  const [requestSentMap, setRequestSentMap] = useState<Record<string, boolean>>({});

  // 1. Fetch real teams from Firestore
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

    // Fetch team join requests if authenticated
    let unsubscribeRequests: (() => void) | null = null;
    if (currentUser) {
      const reqRef = collection(db, 'team_join_requests');
      unsubscribeRequests = onSnapshot(reqRef, (snapshot) => {
        const rList: TeamJoinRequest[] = [];
        snapshot.forEach((d) => {
          rList.push({ id: d.id, ...d.data() } as TeamJoinRequest);
        });
        setJoinRequests(rList);
      });
    }

    return () => {
      unsubscribe();
      if (unsubscribeRequests) unsubscribeRequests();
    };
  }, [selectedSport, currentUser]);

  // 2. Handle Team Creation
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setCreateLoading(true);
    setFormError(null);

    try {
      const initialMember: TeamMember = {
        userId: currentUser.uid,
        name: userProfile?.name || 'Captain',
        role: 'captain',
        joinedAt: Date.now(),
        photoUrl: userProfile?.photoUrl,
      };

      const newTeam: Omit<TeamItem, 'id'> = {
        sport: selectedSport,
        name: teamName.trim(),
        shortName: shortName.trim().toUpperCase(),
        logoUrl: logoUrl.trim() || undefined,
        city: city.trim(),
        captainId: currentUser.uid,
        captainName: userProfile?.name || 'Captain',
        viceCaptainName: viceCaptainName.trim() || undefined,
        membersCount: 1,
        playerIds: [currentUser.uid],
        members: [initialMember],
        isLookingForPlayers: isRecruiting,
        isVerified: false,
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'teams'), newTeam);
      setCreateModalOpen(false);
      setTeamName('');
      setShortName('');
      setLogoUrl('');
    } catch (err: any) {
      console.error('Error creating team:', err);
      setFormError(err.message || 'Failed to create team');
    } finally {
      setCreateLoading(false);
    }
  };

  // 3. Handle Send Join Request
  const handleSendJoinRequest = async (team: TeamItem) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    try {
      await addDoc(collection(db, 'team_join_requests'), {
        teamId: team.id,
        teamName: team.name,
        sport: team.sport,
        userId: currentUser.uid,
        userName: userProfile?.name || 'Athlete',
        status: 'pending',
        message: requestMsg || 'Interested in joining your squad roster!',
        createdAt: Date.now(),
      });
      setRequestSentMap((prev) => ({ ...prev, [team.id]: true }));
    } catch (err) {
      console.error('Join request error:', err);
    }
  };

  // 4. Handle Captain Approving Join Request
  const handleApproveRequest = async (req: TeamJoinRequest) => {
    try {
      const teamRef = doc(db, 'teams', req.teamId);
      const newMember: TeamMember = {
        userId: req.userId,
        name: req.userName,
        role: 'player',
        joinedAt: Date.now(),
      };

      await updateDoc(teamRef, {
        playerIds: arrayUnion(req.userId),
        members: arrayUnion(newMember),
      });

      // Update request status
      const reqRef = doc(db, 'team_join_requests', req.id);
      await updateDoc(reqRef, { status: 'approved' });
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Creation Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            <span>{selectedSport.toUpperCase()} Squads & Club Management</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Create sports franchises, recruit athletes, inspect rosters, and process club join applications
          </p>
        </div>

        <button
          onClick={() => (currentUser ? setCreateModalOpen(true) : onOpenAuth())}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Register New Squad</span>
        </button>
      </div>

      {/* Pending Join Requests Bar (For Captains) */}
      {currentUser && (
        (() => {
          const captainRequests = joinRequests.filter((r) => {
            const myTeam = teams.find((t) => t.id === r.teamId && t.captainId === currentUser.uid);
            return !!myTeam && r.status === 'pending';
          });

          if (captainRequests.length === 0) return null;

          return (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-zinc-100 space-y-3">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-black uppercase">
                <Shield className="w-4 h-4" />
                <span>Pending Squad Join Applications ({captainRequests.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {captainRequests.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{r.userName}</p>
                      <p className="text-[11px] text-zinc-400">Applying for: {r.teamName}</p>
                      {r.message && <p className="text-[10px] text-zinc-500 italic">"{r.message}"</p>}
                    </div>
                    <button
                      onClick={() => handleApproveRequest(r)}
                      className="px-3 py-1.5 bg-emerald-500 text-black font-bold text-[11px] rounded-lg hover:bg-emerald-400 transition"
                    >
                      Approve & Add to Roster
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()
      )}

      {/* Teams Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
          Loading verified sports clubs and rosters from Firestore...
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-6 h-6 text-zinc-400" />}
          title={`No ${selectedSport} teams registered in Firestore yet`}
          description="Form your sports club, appoint your Captain and Vice-Captain, and start inviting players to compete in upcoming tournaments."
          actionText="Register the First Squad"
          onAction={() => (currentUser ? setCreateModalOpen(true) : onOpenAuth())}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((t) => {
            const isMyTeam = currentUser && t.captainId === currentUser.uid;
            const isMember = currentUser && t.playerIds?.includes(currentUser.uid);
            const requestPending = requestSentMap[t.id];

            return (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-purple-400 font-black text-lg flex items-center justify-center border border-purple-500/30 overflow-hidden">
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          t.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                            {t.name}
                          </h3>
                          {t.shortName && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-500">
                              {t.shortName}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {t.city}
                        </p>
                      </div>
                    </div>

                    {t.isLookingForPlayers && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-tight">
                        Recruiting
                      </span>
                    )}
                  </div>

                  <div className="my-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-500" /> Captain:
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-200">
                        {t.captainName}
                      </span>
                    </div>
                    {t.viceCaptainName && (
                      <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-indigo-400" /> Vice-Captain:
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-200">
                          {t.viceCaptainName}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                      <span>Roster Size:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">
                        {t.playerIds?.length || 1} Athletes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTeam(t);
                      setRosterModalOpen(true);
                    }}
                    className="flex-1 py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition"
                  >
                    View Roster
                  </button>

                  {!isMember && (
                    <button
                      disabled={requestPending}
                      onClick={() => handleSendJoinRequest(t)}
                      className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-black uppercase rounded-xl transition flex items-center gap-1 shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{requestPending ? 'Applied' : 'Request to Join'}</span>
                    </button>
                  )}
                  {isMember && (
                    <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isMyTeam ? 'Captain' : 'Enlisted'}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TEAM MODAL */}
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
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base uppercase">Register Sports Club</h3>
                <p className="text-xs text-zinc-400">Establish a new squad on Firestore</p>
              </div>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold uppercase text-zinc-400 mb-1">Squad Name</label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Thunderbolts Cricket Club"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-zinc-400 mb-1">Short Code</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="TCC"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-zinc-400 mb-1">Home City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-zinc-400 mb-1">Vice-Captain (Optional)</label>
                  <input
                    type="text"
                    value={viceCaptainName}
                    onChange={(e) => setViceCaptainName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-zinc-400 mb-1">Logo URL (Optional)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="recruiting"
                  checked={isRecruiting}
                  onChange={(e) => setIsRecruiting(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="recruiting" className="font-bold uppercase text-zinc-300 cursor-pointer">
                  Open for Player Recruitment (Show Recruiting Badge)
                </label>
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
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider rounded-xl transition"
                >
                  {createLoading ? 'Registering...' : 'Register Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROSTER MODAL */}
      {rosterModalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-zinc-100 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setRosterModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 font-black flex items-center justify-center text-lg">
                {selectedTeam.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-extrabold text-base uppercase">{selectedTeam.name} Roster</h3>
                <p className="text-xs text-zinc-400">{selectedTeam.city} • {selectedTeam.sport.toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Active Enlisted Athletes ({selectedTeam.playerIds?.length || 1})
              </div>

              {selectedTeam.members && selectedTeam.members.length > 0 ? (
                <div className="space-y-2">
                  {selectedTeam.members.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-tight">{m.name}</p>
                          <p className="text-[10px] text-zinc-400 capitalize">
                            {m.role.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      {m.role === 'captain' && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase">
                          Captain
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{selectedTeam.captainName}</p>
                    <p className="text-[10px] text-zinc-400">Captain & Founder</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase">
                    Captain
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setRosterModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
