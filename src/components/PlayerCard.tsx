import React, { useState } from 'react';
import { AppUser, TeamItem, SportType } from '../types/models';
import {
  MapPin,
  Shield,
  Award,
  UserCheck,
  UserPlus,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  Zap,
  Sparkles,
  TrendingUp,
  Target,
  Flame,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PlayerAbilityTestModal } from './PlayerAbilityTestModal';

interface PlayerCardProps {
  player: AppUser;
  distanceKm?: number;
  selectedSport: SportType;
  onViewProfile?: (player: AppUser) => void;
  isFollowing?: boolean;
  onToggleFollow?: (playerId: string) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  distanceKm,
  selectedSport,
  onViewProfile,
  isFollowing,
  onToggleFollow,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [abilityModalOpen, setAbilityModalOpen] = useState(false);
  const [inviteTeamName, setInviteTeamName] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setInviteLoading(true);
    try {
      await addDoc(collection(db, 'team_invites'), {
        teamId: 'custom-team-' + Date.now(),
        teamName: inviteTeamName.trim() || 'My Team',
        sport: selectedSport,
        senderId: currentUser.uid,
        senderName: userProfile?.name || 'Manager',
        receiverId: player.id,
        status: 'pending',
        message: inviteMsg.trim(),
        createdAt: Date.now(),
      });
      setInviteSent(true);
      setTimeout(() => {
        setInviteSent(false);
        setInviteModalOpen(false);
      }, 1800);
    } catch (err) {
      console.error('Invite error:', err);
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <>
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition flex flex-col justify-between group">
        {/* Top Header: Avatar, Name, Verification, Distance badge */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 font-black text-base flex items-center justify-center border border-emerald-500/30">
                  {player.photoUrl ? (
                    <img
                      src={player.photoUrl}
                      alt={player.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    player.name?.charAt(0).toUpperCase() || 'P'
                  )}
                </div>
                {player.isVerified && (
                  <div
                    title="Verified Athlete"
                    className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-0.5 rounded-full border-2 border-white dark:border-zinc-900"
                  >
                    <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                    {player.name}
                  </h3>
                  {player.teamStatus === 'looking_for_team' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-extrabold uppercase tracking-tight">
                      Free Agent
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                    {player.location?.locality || player.location?.city || 'Locality unlisted'}
                  </span>
                  {distanceKm !== undefined && (
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      ~{distanceKm} km away
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight">
              {player.experienceLevel}
            </span>
          </div>

          {/* Technical Specs for Selected Sport */}
          {selectedSport === 'cricket' && player.cricketProfile && (
            <div className="my-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Batting Role:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {player.cricketProfile.battingStyle} • {player.cricketProfile.battingPosition}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Bowling Style:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {player.cricketProfile.bowlingStyle}
                </span>
              </div>
              {player.cricketProfile.isWicketKeeper && (
                <div className="text-amber-500 font-bold text-[10px] uppercase">
                  🧤 Wicket Keeper Certified
                </div>
              )}
            </div>
          )}

          {selectedSport === 'football' && player.footballProfile && (
            <div className="my-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Position / Pitch:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {player.footballProfile.primaryPosition}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Foot Dominance:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {player.footballProfile.preferredFoot} Foot
                </span>
              </div>
              {player.footballProfile.characteristics && player.footballProfile.characteristics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
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

          {/* Real-time Detailed Stats & Skill Ratings */}
          {selectedSport === 'cricket' && (
            <div className="my-2.5 p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-[10px] space-y-1.5">
              <div className="flex items-center justify-between text-amber-500 font-extrabold uppercase tracking-wider text-[9px]">
                <span className="flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Batting Metrics
                </span>
                <span>SR: {player.customStats?.cricket?.strikeRate || 138.5}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center font-mono">
                <div className="bg-white/60 dark:bg-zinc-900/60 p-1 rounded-lg">
                  <span className="block text-[8px] text-zinc-400">Runs</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{player.customStats?.cricket?.totalRuns || 1240}</span>
                </div>
                <div className="bg-white/60 dark:bg-zinc-900/60 p-1 rounded-lg">
                  <span className="block text-[8px] text-zinc-400">Avg</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{player.customStats?.cricket?.battingAvg || 41.3}</span>
                </div>
                <div className="bg-white/60 dark:bg-zinc-900/60 p-1 rounded-lg">
                  <span className="block text-[8px] text-zinc-400">HS</span>
                  <span className="font-bold text-emerald-500">{player.customStats?.cricket?.highestScore || '94*'}</span>
                </div>
                <div className="bg-white/60 dark:bg-zinc-900/60 p-1 rounded-lg">
                  <span className="block text-[8px] text-zinc-400">50s/100s</span>
                  <span className="font-bold text-amber-500">{player.customStats?.cricket?.fifties || 8}/{player.customStats?.cricket?.centuries || 2}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono pt-0.5 border-t border-amber-500/15">
                <span>4s: <strong className="text-zinc-800 dark:text-zinc-200">{player.customStats?.cricket?.fours || 112}</strong> • 6s: <strong className="text-zinc-800 dark:text-zinc-200">{player.customStats?.cricket?.sixes || 34}</strong></span>
                <span>Wkts: <strong className="text-zinc-800 dark:text-zinc-200">{player.customStats?.cricket?.totalWickets || 28}</strong> • Econ: <strong className="text-zinc-800 dark:text-zinc-200">{player.customStats?.cricket?.economyRate || 6.8}</strong></span>
              </div>
            </div>
          )}

          {selectedSport === 'football' && (
            <div className="my-2.5 p-2.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-[10px] space-y-1.5">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider text-[9px]">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Physical & Skill Ratings
                </span>
                <span className="text-[9px]">OVR: {player.abilityRatings?.overallScore || 86}</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center font-mono">
                <div className="bg-white/60 dark:bg-zinc-900/60 p-1 rounded-lg">
                  <span className="block text-[8px] text-zinc-400">SPD</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{player.abilityRatings?.speedScore || 88}</span>
                </div>
                <div className="bg-white/60 dark:bg-zinc-900/60 p-1 rounded-lg">
                  <span className="block text-[8px] text-zinc-400">DEF</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{player.abilityRatings?.defenseScore || 79}</span>
                </div>
                <div className="bg-white/60 dark:bg-zinc-900/60 p-1 rounded-lg">
                  <span className="block text-[8px] text-zinc-400">ATK</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{player.abilityRatings?.attackScore || 89}</span>
                </div>
                <div className="bg-white/60 dark:bg-zinc-900/60 p-1 rounded-lg">
                  <span className="block text-[8px] text-zinc-400">PAS</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{player.abilityRatings?.passingScore || 85}</span>
                </div>
                <div className="bg-white/60 dark:bg-zinc-900/60 p-1 rounded-lg">
                  <span className="block text-[8px] text-zinc-400">DRI</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{player.abilityRatings?.dribblingScore || 87}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono pt-0.5 border-t border-emerald-500/15">
                <span>Goals: <strong className="text-zinc-800 dark:text-zinc-200">{player.customStats?.football?.goals || 18}</strong> • Ast: <strong className="text-zinc-800 dark:text-zinc-200">{player.customStats?.football?.assists || 12}</strong></span>
                <span>CS: <strong className="text-zinc-800 dark:text-zinc-200">{player.customStats?.football?.cleanSheets || 5}</strong> • Tackles: <strong className="text-zinc-800 dark:text-zinc-200">{player.customStats?.football?.successfulTackles || 32}</strong></span>
              </div>
            </div>
          )}

          {player.bio && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic mb-3">
              "{player.bio}"
            </p>
          )}

          {/* Availability and Team Seeking tags */}
          <div className="flex items-center gap-2 mb-4 text-[10px] font-bold">
            {player.availability && (
              <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                <Clock className="w-3 h-3 text-emerald-500" />
                <span className="capitalize">{player.availability.replace('_', ' ')}</span>
              </span>
            )}
            {player.age && (
              <span className="text-zinc-400">
                Age {player.age}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions Row: View Profile, Test Ability, Follow, Invite */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onViewProfile && onViewProfile(player)}
            className="flex-1 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setAbilityModalOpen(true)}
            className="py-1.5 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            title="Test / Log Standardized Ability Metrics"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-500/20" />
            <span>Test Ability</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleFollow && onToggleFollow(player.id)}
            className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              isFollowing
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                : 'border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="py-1.5 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
        </div>
      </div>

      {/* Interactive Speed & Ability Test Modal */}
      {abilityModalOpen && (
        <PlayerAbilityTestModal
          isOpen={abilityModalOpen}
          onClose={() => setAbilityModalOpen(false)}
          player={player}
        />
      )}

      {/* Invite to Team Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-zinc-100 shadow-2xl relative">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base uppercase">Invite to Squad</h3>
                <p className="text-xs text-zinc-400">Send an invitation to {player.name}</p>
              </div>
            </div>

            {inviteSent ? (
              <div className="py-6 text-center text-emerald-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto animate-bounce" />
                <p className="text-sm font-bold">Invitation Dispatched!</p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Squad / Team Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteTeamName}
                    onChange={(e) => setInviteTeamName(e.target.value)}
                    placeholder="e.g. Thunderbolts XI / Metro FC"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Message / Match Details (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={inviteMsg}
                    onChange={(e) => setInviteMsg(e.target.value)}
                    placeholder="Upcoming league match this Saturday. Need an opening batsman / midfielder!"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="px-4 py-2 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-xl transition"
                  >
                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const TeamCard: React.FC<{
  team: TeamItem;
  distanceKm?: number;
  onViewTeam?: (team: TeamItem) => void;
}> = ({ team, distanceKm, onViewTeam }) => {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 font-black text-base flex items-center justify-center border border-purple-500/30">
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                {team.name}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {team.city}
              </p>
            </div>
          </div>
          {team.isLookingForPlayers && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
              Recruiting
            </span>
          )}
        </div>

        <div className="mt-3 py-2 border-t border-zinc-100 dark:border-zinc-800 text-xs flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>Captain: {team.captainName}</span>
          <span>{team.membersCount || 1} Squad Members</span>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
        {distanceKm !== undefined && (
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            ~{distanceKm} km away
          </span>
        )}
        <button
          type="button"
          onClick={() => onViewTeam && onViewTeam(team)}
          className="ml-auto py-1 px-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 font-bold rounded-lg text-xs"
        >
          View Squad
        </button>
      </div>
    </div>
  );
};
