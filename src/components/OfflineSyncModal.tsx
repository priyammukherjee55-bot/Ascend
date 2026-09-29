import React, { useState } from 'react';
import { useOfflineSync } from '../context/OfflineSyncContext';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  HardDrive,
  Trash2,
  Clock,
} from 'lucide-react';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    isOnline,
    isSyncing,
    lastSyncedAt,
    queuedActionsCount,
    queuedActions,
    cachedMatchesCount,
    syncNow,
    precacheFixtures,
    clearLocalCache,
    exportOfflineBackup,
  } = useOfflineSync();

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSync = async () => {
    setMessage(null);
    const res = await syncNow();
    if (res.success) {
      setMessage({
        text: res.syncedCount > 0 ? `Successfully synchronized ${res.syncedCount} offline action(s)!` : 'All records are up to date.',
        type: 'success',
      });
    } else {
      setMessage({
        text: res.error || 'Sync failed. Ensure internet connection is active.',
        type: 'error',
      });
    }
  };

  const handlePrecache = async () => {
    setMessage(null);
    try {
      const count = await precacheFixtures();
      setMessage({
        text: `Successfully cached ${count} fixtures into offline local storage!`,
        type: 'success',
      });
    } catch (err: any) {
      setMessage({
        text: err?.message || 'Failed to pre-cache fixtures.',
        type: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isOnline ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-500'
            }`}
          >
            {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black uppercase text-zinc-900 dark:text-white tracking-tight">
                Offline Sync Engine
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isOnline
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/20 text-amber-500'
                }`}
              >
                {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Zero match data loss guarantee on remote grounds without cell coverage
            </p>
          </div>
        </div>

        {/* Notification feedback */}
        {message && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Sync Telemetry Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
            <Clock className="w-4 h-4 mx-auto mb-1 text-zinc-400" />
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Last Sync</div>
            <div className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-0.5">
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
            <Database className="w-4 h-4 mx-auto mb-1 text-amber-500" />
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Pending Queue</div>
            <div className="text-xs font-black text-amber-500 mt-0.5">
              {queuedActionsCount} item{queuedActionsCount === 1 ? '' : 's'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center">
            <HardDrive className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            <div className="text-[10px] text-zinc-400 font-bold uppercase">Cached Fixtures</div>
            <div className="text-xs font-black text-emerald-500 mt-0.5">
              {cachedMatchesCount} stored
            </div>
          </div>
        </div>

        {/* Queued Action Details Preview */}
        {queuedActions.length > 0 && (
          <div className="mb-5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 mb-2 flex items-center justify-between">
              <span>Offline Action Queue</span>
              <span className="text-[10px]">{queuedActions.length} awaiting sync</span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              {queuedActions.slice(0, 5).map((q, idx) => (
                <div key={q.id} className="flex items-center justify-between py-1 border-b border-amber-500/10 last:border-0">
                  <span className="truncate">{idx + 1}. {q.type.replace('_', ' ').toUpperCase()}</span>
                  <span className="text-[10px] opacity-75">{new Date(q.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
              {queuedActions.length > 5 && (
                <div className="text-[10px] text-zinc-400 italic text-center pt-1">
                  +{queuedActions.length - 5} more queued updates
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-2.5">
          <button
            onClick={handleSync}
            disabled={isSyncing || !isOnline}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              isSyncing || !isOnline
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing with Firestore...' : 'Synchronize Now'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrecache}
              disabled={isSyncing || !isOnline}
              className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Pre-cache Fixtures</span>
            </button>

            <button
              onClick={exportOfflineBackup}
              className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 transition"
            >
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span>Export Local Backup</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Clear all locally cached fixtures and queue? Any unsynced items will be discarded.')) {
                clearLocalCache();
                setMessage({ text: 'Local cache cleared successfully.', type: 'success' });
              }
            }}
            className="w-full py-2 px-3 rounded-xl text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 flex items-center justify-center gap-1.5 transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Local Storage Cache</span>
          </button>
        </div>
      </div>
    </div>
  );
};
