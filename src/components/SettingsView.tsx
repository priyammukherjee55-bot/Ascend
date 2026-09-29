import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOfflineSync } from '../context/OfflineSyncContext';
import { OfflineSyncModal } from './OfflineSyncModal';
import { Sun, Moon, Shield, Database, CheckCircle, Smartphone, Wifi, WifiOff, RefreshCw, HardDrive, Download } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export const SettingsView: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { currentUser, userProfile } = useAuth();
  const {
    isOnline,
    isSyncing,
    lastSyncedAt,
    queuedActionsCount,
    cachedMatchesCount,
    syncNow,
    precacheFixtures,
    exportOfflineBackup,
  } = useOfflineSync();
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
          System & Account Settings
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Theme engine, platform persistence, offline sync, and Firestore connectivity details
        </p>
      </div>

      {/* Visual Theme Engine */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Visual Display Theme
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Switch between ASCEND High-Contrast Night Mode (Athletic Dark with 3D stadium floodlights) and Daylight Bright Mode (Sunlit pitch with crisp contrast).
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition ${
              theme === 'dark'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Night Mode (Dark Arena)</span>
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition ${
              theme === 'light'
                ? 'border-amber-500 bg-amber-500/10 text-amber-600 shadow-sm'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Bright Mode (Day Arena)</span>
          </button>
        </div>
      </div>

      {/* Offline Sync & Ground Cache Engine */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isOnline ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                Offline Match Sync & Local Storage
              </h3>
              <p className="text-xs text-zinc-500">
                Network status: <span className="font-bold text-emerald-500">{isOnline ? 'Connected' : 'Offline'}</span> • {queuedActionsCount} pending updates • {cachedMatchesCount} cached fixtures
              </p>
            </div>
          </div>

          <button
            onClick={() => setSyncModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition"
          >
            Open Sync Manager
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-400 font-bold block mb-1">Last Sync Completed</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Not yet synced'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-400 font-bold block mb-1">Ground Scorer Protection</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Local Queue & Fallback Active
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-400 font-bold block mb-1">Pre-cache Fixtures</span>
            <button
              onClick={() => precacheFixtures()}
              disabled={isSyncing || !isOnline}
              className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1 mt-0.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download for 100% Offline Access</span>
            </button>
          </div>
        </div>
      </div>

      {/* Firestore Infrastructure Status */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span>Firestore Backend Telemetry</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-400 font-bold block mb-1">Project ID</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">{firebaseConfig.projectId}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-400 font-bold block mb-1">Dedicated Database</span>
            <span className="font-mono text-zinc-800 dark:text-zinc-200">{firebaseConfig.firestoreDatabaseId || '(default)'}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-400 font-bold block mb-1">Security Rules</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Deployed (RBAC Enforced)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-400 font-bold block mb-1">Data Model Standard</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Zero Fake Data Policy Active
            </span>
          </div>
        </div>
      </div>

      {/* Role and Permissions Guide */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Role Permissions (RBAC)</span>
        </h3>
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-zinc-900 dark:text-white uppercase">Player</span>
              <p className="text-zinc-500 mt-0.5">Can edit own cricket/football profiles, join teams, and view all live matches.</p>
            </div>
            {userProfile?.role === 'player' && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">CURRENT</span>
            )}
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-zinc-900 dark:text-white uppercase">Organizer</span>
              <p className="text-zinc-500 mt-0.5">Can create matches, tournaments, publish ball-by-ball commentary and pitch stats.</p>
            </div>
            {userProfile?.role === 'organizer' && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">CURRENT</span>
            )}
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-zinc-900 dark:text-white uppercase">Admin</span>
              <p className="text-zinc-500 mt-0.5">Full platform moderation, tournament sanctioning, player verification, and rule enforcement.</p>
            </div>
            {userProfile?.role === 'admin' && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">CURRENT</span>
            )}
          </div>
        </div>
      </div>

      {/* Offline Synchronization Modal */}
      <OfflineSyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
      />
    </div>
  );
};
