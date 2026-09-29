import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import {
  AppUser,
  MatchItem,
  UserRole,
  AdminAuditLog,
} from '../types/models';
import { EmptyState } from './EmptyState';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  Edit3,
  Search,
  Lock,
  History,
  Activity,
  Sliders,
  Database,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'score_correction' | 'data_integrity' | 'audit_trail'>('users');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // User search & filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');

  // Match score correction modal state
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [correctionTeamAScore, setCorrectionTeamAScore] = useState('');
  const [correctionTeamBScore, setCorrectionTeamBScore] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState<MatchItem['status']>('completed');
  const [correctionWinnerId, setCorrectionWinnerId] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [correctionSuccess, setCorrectionSuccess] = useState('');

  // Self-elevation state for test/review convenience
  const [elevating, setElevating] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  // Listen to Users
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list: AppUser[] = [];
      snap.docs.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setUsers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Listen to Matches
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'matches'), (snap) => {
      const list: MatchItem[] = [];
      snap.docs.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setMatches(list);
    });
    return () => unsub();
  }, []);

  // Listen to Audit Logs (if admin)
  useEffect(() => {
    if (!isAdmin) return;
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        const list: AdminAuditLog[] = [];
        snap.docs.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setAuditLogs(list);
      }, (err) => {
        console.warn('Audit logs listener note:', err.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Audit logs read init:', e);
    }
  }, [isAdmin]);

  // Log an admin action to immutable audit_logs collection
  const logAdminAction = async (
    action: AdminAuditLog['action'],
    targetType: AdminAuditLog['targetType'],
    targetId: string,
    targetTitle: string,
    previousValue: any,
    newValue: any,
    reason: string
  ) => {
    try {
      const logEntry: Omit<AdminAuditLog, 'id'> = {
        adminId: currentUser?.uid || 'unknown_admin',
        adminEmail: currentUser?.email || 'admin@ascend.sports',
        adminName: userProfile?.name || 'Administrator',
        action,
        targetType,
        targetId,
        targetTitle,
        previousValue,
        newValue,
        reason: reason.trim() || 'Official administrator action',
        timestamp: Date.now(),
      };
      await addDoc(collection(db, 'audit_logs'), logEntry);
    } catch (err) {
      console.error('Error recording audit log:', err);
    }
  };

  // Elevate current user to Admin for demonstration / review
  const handleElevateToAdmin = async () => {
    if (!currentUser) return;
    setElevating(true);
    try {
      await updateUserProfile({ role: 'admin' });
      await logAdminAction(
        'user_role_change',
        'user',
        currentUser.uid,
        userProfile?.name || 'Current User',
        userProfile?.role || 'player',
        'admin',
        'Demonstration role elevation to Admin'
      );
    } catch (err) {
      console.error('Error elevating role:', err);
    } finally {
      setElevating(false);
    }
  };

  // Toggle user suspension
  const handleToggleSuspension = async (user: AppUser) => {
    const nextSuspended = !user.isSuspended;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { isSuspended: nextSuspended });
      await logAdminAction(
        'user_suspension',
        'user',
        user.id,
        user.name,
        { isSuspended: !!user.isSuspended },
        { isSuspended: nextSuspended },
        nextSuspended ? 'Account suspended by administrator' : 'Account suspension revoked'
      );
    } catch (err) {
      console.error('Error toggling suspension:', err);
    }
  };

  // Change user role
  const handleChangeRole = async (user: AppUser, newRole: UserRole) => {
    if (user.role === newRole) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { role: newRole });
      await logAdminAction(
        'user_role_change',
        'user',
        user.id,
        user.name,
        { role: user.role },
        { role: newRole },
        `Role adjusted to ${newRole}`
      );
    } catch (err) {
      console.error('Error changing role:', err);
    }
  };

  // Toggle user verification status
  const handleToggleVerification = async (user: AppUser) => {
    const nextVerified = !user.isVerified;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { isVerified: nextVerified });
      await logAdminAction(
        'verification_change',
        'user',
        user.id,
        user.name,
        { isVerified: !!user.isVerified },
        { isVerified: nextVerified },
        nextVerified ? 'Official verification seal granted' : 'Verification badge revoked'
      );
    } catch (err) {
      console.error('Error toggling verification:', err);
    }
  };

  // Open Score Correction Modal
  const openCorrectionModal = (match: MatchItem) => {
    setSelectedMatch(match);
    setCorrectionTeamAScore(match.teamAScore || '');
    setCorrectionTeamBScore(match.teamBScore || '');
    setCorrectionStatus(match.status);
    setCorrectionWinnerId(match.winnerId || '');
    setCorrectionReason('');
    setCorrectionSuccess('');
  };

  // Save Score Correction with Audit Log
  const handleSaveScoreCorrection = async () => {
    if (!selectedMatch || !correctionReason.trim()) return;
    setSavingCorrection(true);
    setCorrectionSuccess('');

    try {
      const prevData = {
        teamAScore: selectedMatch.teamAScore,
        teamBScore: selectedMatch.teamBScore,
        status: selectedMatch.status,
        winnerId: selectedMatch.winnerId,
      };

      const newData = {
        teamAScore: correctionTeamAScore,
        teamBScore: correctionTeamBScore,
        status: correctionStatus,
        winnerId: correctionWinnerId || null,
        winnerName:
          correctionWinnerId === selectedMatch.teamAId
            ? selectedMatch.teamAName
            : correctionWinnerId === selectedMatch.teamBId
            ? selectedMatch.teamBName
            : null,
      };

      const matchRef = doc(db, 'matches', selectedMatch.id);
      await updateDoc(matchRef, newData);

      await logAdminAction(
        'score_correction',
        'match',
        selectedMatch.id,
        `${selectedMatch.teamAName} vs ${selectedMatch.teamBName}`,
        prevData,
        newData,
        correctionReason
      );

      setCorrectionSuccess('Match score and record successfully corrected with immutable audit trail.');
      setTimeout(() => {
        setSelectedMatch(null);
      }, 1500);
    } catch (err) {
      console.error('Error saving match correction:', err);
    } finally {
      setSavingCorrection(false);
    }
  };

  // Toggle Official Status for Data Integrity
  const handleToggleOfficial = async (match: MatchItem) => {
    const nextOfficial = match.isOfficial === false ? true : false;
    try {
      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, { isOfficial: nextOfficial });
      await logAdminAction(
        'data_integrity_check',
        'match',
        match.id,
        `${match.teamAName} vs ${match.teamBName}`,
        { isOfficial: match.isOfficial },
        { isOfficial: nextOfficial },
        nextOfficial
          ? 'Match marked as Official (included in Ranking & Tournament stats)'
          : 'Match marked Unofficial / Casual (isolated from Ranking calculations)'
      );
    } catch (err) {
      console.error('Error toggling official integrity flag:', err);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Data Integrity Metrics
  const officialMatches = matches.filter((m) => m.isOfficial !== false && !m.isSimulated);
  const unofficialMatches = matches.filter((m) => m.isOfficial === false || m.isSimulated);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-rose-500">
              Governance & Integrity Engine
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-1">
            Admin Control Center
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            User access management, official match corrections, audit logs, and data integrity monitoring.
          </p>
        </div>

        {/* Elevate to Admin Button (if not already admin) */}
        {!isAdmin && (
          <button
            onClick={handleElevateToAdmin}
            disabled={elevating || !currentUser}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20 transition self-start sm:self-auto disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{elevating ? 'Elevating...' : 'Elevate to Admin for Testing'}</span>
          </button>
        )}
      </div>

      {/* Admin Privilege Banner */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 dark:text-amber-300">
            <strong className="font-bold uppercase tracking-wider block">Observer Mode Active</strong>
            You are currently signed in as a <span className="font-bold underline">{userProfile?.role || 'Guest / Player'}</span>. Click the <strong>"Elevate to Admin for Testing"</strong> button above to grant admin rights to this account and test user management, official score editing, and audit logging.
          </div>
        </div>
      )}

      {/* Navigation Sub-tabs */}
      <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition ${
            activeTab === 'users'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('score_correction')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition ${
            activeTab === 'score_correction'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Score Correction ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('data_integrity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition ${
            activeTab === 'data_integrity'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Data Integrity Monitor</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_trail')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition ${
            activeTab === 'audit_trail'
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Search athletes or organizers by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 uppercase">Role:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="player">Players</option>
                <option value="organizer">Organizers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          {/* User List Table */}
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="w-8 h-8 text-rose-500" />}
              title="No users matching current criteria"
              description="Registered users across Cricket and Football disciplines will be listed here with administrative controls."
            />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 text-xs font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-4 px-6">User</th>
                    <th className="py-4 px-4 text-center">Current Role</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-center">Verification</th>
                    <th className="py-4 px-6 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.uid;
                    return (
                      <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-800 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-zinc-400">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                            className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 focus:outline-none"
                          >
                            <option value="player">Player</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-center">
                          {u.isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <XCircle className="w-3 h-3" />
                              <span>Suspended</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleToggleVerification(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                              u.isVerified
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-zinc-100'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{u.isVerified ? 'Verified' : 'Unverified'}</span>
                          </button>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleToggleSuspension(u)}
                            disabled={isSelf}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              u.isSuspended
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                          >
                            {u.isSuspended ? 'Reinstate User' : 'Suspend Account'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OFFICIAL MATCH SCORE CORRECTION */}
      {activeTab === 'score_correction' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-bold uppercase">
              Click "Correct Official Score" on any match to adjust scores with audit logging:
            </span>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              icon={<Edit3 className="w-8 h-8 text-rose-500" />}
              title="No matches found in database"
              description="Schedule or generate fixtures to utilize official match score correction tools."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
                      {m.sport === 'cricket' ? '🏏 Cricket' : '⚽ Football'} • {m.status}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      {m.isOfficial !== false ? 'Official' : 'Casual'}
                    </span>
                  </div>

                  <h4 className="font-black text-lg text-zinc-900 dark:text-white">
                    {m.teamAName} vs {m.teamBName}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl font-mono">
                    <div>
                      <span>{m.teamAName}: </span>
                      <strong className="text-zinc-900 dark:text-white">{m.teamAScore || '0'}</strong>
                    </div>
                    <div>
                      <span>{m.teamBName}: </span>
                      <strong className="text-zinc-900 dark:text-white">{m.teamBScore || '0'}</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">
                      Winner: <strong>{m.winnerName || 'Pending'}</strong>
                    </span>
                    <button
                      onClick={() => openCorrectionModal(m)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Correct Official Score</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SCORE CORRECTION MODAL */}
          {selectedMatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-lg p-6 rounded-3xl bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-rose-500" />
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">
                      Official Score Correction Tool
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs">
                  <span className="text-zinc-400 block font-bold uppercase">Target Fixture</span>
                  <span className="text-sm font-black text-white">
                    {selectedMatch.teamAName} vs {selectedMatch.teamBName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      {selectedMatch.teamAName} Score
                    </label>
                    <input
                      type="text"
                      value={correctionTeamAScore}
                      onChange={(e) => setCorrectionTeamAScore(e.target.value)}
                      placeholder="e.g. 182/4 or 3"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      {selectedMatch.teamBName} Score
                    </label>
                    <input
                      type="text"
                      value={correctionTeamBScore}
                      onChange={(e) => setCorrectionTeamBScore(e.target.value)}
                      placeholder="e.g. 175/8 or 1"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Match Status
                    </label>
                    <select
                      value={correctionStatus}
                      onChange={(e) => setCorrectionStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                      Official Winner
                    </label>
                    <select
                      value={correctionWinnerId}
                      onChange={(e) => setCorrectionWinnerId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="">No Winner / Draw / In Progress</option>
                      <option value={selectedMatch.teamAId}>{selectedMatch.teamAName}</option>
                      <option value={selectedMatch.teamBId}>{selectedMatch.teamBName}</option>
                    </select>
                  </div>
                </div>

                {/* Mandatory Justification */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                    Administrative Reason / Justification <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Provide official rationale (e.g., Umpire DLS adjustment, scoring software typo correction)..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {correctionSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{correctionSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveScoreCorrection}
                    disabled={savingCorrection || !correctionReason.trim()}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 transition shadow-lg shadow-rose-600/20"
                  >
                    {savingCorrection ? 'Recording...' : 'Commit Correction & Audit Log'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DATA INTEGRITY MONITORING */}
      {activeTab === 'data_integrity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold uppercase text-zinc-400">Total Scanned Matches</span>
              <div className="text-3xl font-black font-mono text-zinc-900 dark:text-white mt-1">
                {matches.length}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-emerald-500/20">
              <span className="text-xs font-bold uppercase text-emerald-500">Verified Official Matches</span>
              <div className="text-3xl font-black font-mono text-emerald-500 mt-1">
                {officialMatches.length}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Included in Dynamic Rankings & Points Tables
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-amber-500/20">
              <span className="text-xs font-bold uppercase text-amber-500">Casual / Isolated Fixtures</span>
              <div className="text-3xl font-black font-mono text-amber-500 mt-1">
                {unofficialMatches.length}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Isolated from dynamic player ranking points
              </span>
            </div>
          </div>

          {/* Integrity Rules Overview */}
          <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 text-white space-y-3">
            <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Data Integrity Isolation Rules Active</span>
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ASCEND enforces strict separation between official tournament/league matches and casual or simulated sessions.
              Simulated or unofficial encounters are tagged with <code className="text-amber-400 font-mono">isOfficial: false</code>, preventing synthetic metrics from polluting athlete rankings or tournament standings.
            </p>
          </div>

          {/* Fixture Integrity Control Table */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 text-xs font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-4 px-6">Fixture</th>
                  <th className="py-4 px-4 text-center">Sport</th>
                  <th className="py-4 px-4 text-center">Simulated Tag</th>
                  <th className="py-4 px-4 text-center">Ranking Inclusion</th>
                  <th className="py-4 px-6 text-right">Integrity Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {matches.map((m) => {
                  const isOfficial = m.isOfficial !== false && !m.isSimulated;
                  return (
                    <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white">
                        {m.teamAName} vs {m.teamBName}
                      </td>
                      <td className="py-4 px-4 text-center text-xs font-bold text-zinc-500 uppercase">
                        {m.sport}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {m.isSimulated ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-500">
                            Simulated
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                            Real Pitch
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isOfficial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-3 h-3" />
                            <span>Included in Rankings</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            <XCircle className="w-3 h-3" />
                            <span>Isolated / Casual</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleToggleOfficial(m)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                            isOfficial
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {isOfficial ? 'Mark as Casual (Exclude)' : 'Mark as Official (Include)'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit_trail' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span className="font-bold uppercase tracking-wider">
              Immutable Governance Log: Records all score alterations, role escalations, and suspensions.
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <EmptyState
              icon={<History className="w-8 h-8 text-rose-500" />}
              title="No audit entries logged yet"
              description="Actions taken by platform administrators automatically create tamper-proof logs in Firestore."
            />
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {log.action.replace('_', ' ')}
                      </span>
                      <strong className="text-zinc-900 dark:text-white font-bold">{log.targetTitle}</strong>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Reason: <span className="italic text-zinc-700 dark:text-zinc-300">"{log.reason}"</span>
                    </p>
                    <div className="text-[11px] text-zinc-400">
                      Executed by: <strong className="text-zinc-300">{log.adminName}</strong> ({log.adminEmail})
                    </div>
                  </div>

                  <div className="text-right text-zinc-400 font-mono text-[11px] flex-shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
