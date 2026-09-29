import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MatchItem, SportType } from '../types/models';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface QueuedAction {
  id: string;
  type: 'score_update' | 'match_create' | 'toss_record' | 'commentary_add';
  collection: string;
  docId: string;
  data: any;
  timestamp: number;
  retries: number;
}

interface OfflineSyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  queuedActionsCount: number;
  queuedActions: QueuedAction[];
  cachedMatchesCount: number;
  syncNow: () => Promise<{ success: boolean; syncedCount: number; error?: string }>;
  queueAction: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) => void;
  precacheFixtures: (sport?: SportType) => Promise<number>;
  clearLocalCache: () => void;
  exportOfflineBackup: () => void;
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined);

const QUEUE_STORAGE_KEY = 'ascend_offline_queue_v1';
const CACHE_MATCHES_KEY = 'ascend_offline_matches_v1';
const LAST_SYNC_KEY = 'ascend_last_sync_timestamp';

export const OfflineSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => {
    const saved = localStorage.getItem(LAST_SYNC_KEY);
    return saved ? parseInt(saved, 10) : null;
  });
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cachedMatchesCount, setCachedMatchesCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(CACHE_MATCHES_KEY);
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  });

  // Save queue updates
  useEffect(() => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queuedActions));
  }, [queuedActions]);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when back online
      triggerAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueAction = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) => {
    const newAction: QueuedAction = {
      ...action,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    setQueuedActions((prev) => [...prev, newAction]);
  }, []);

  const syncNow = useCallback(async (): Promise<{ success: boolean; syncedCount: number; error?: string }> => {
    if (!navigator.onLine) {
      return { success: false, syncedCount: 0, error: 'Cannot sync while offline. Network is disconnected.' };
    }

    const currentQueue = [...queuedActions];
    if (currentQueue.length === 0) {
      const now = Date.now();
      setLastSyncedAt(now);
      localStorage.setItem(LAST_SYNC_KEY, now.toString());
      return { success: true, syncedCount: 0 };
    }

    setIsSyncing(true);
    let syncedCount = 0;
    const remainingQueue: QueuedAction[] = [];

    for (const item of currentQueue) {
      try {
        const targetDocRef = doc(db, item.collection, item.docId);
        await setDoc(targetDocRef, item.data, { merge: true });
        syncedCount++;
      } catch (err: any) {
        console.error('Failed to sync item:', item, err);
        if (item.retries < 5) {
          remainingQueue.push({ ...item, retries: item.retries + 1 });
        }
      }
    }

    setQueuedActions(remainingQueue);
    const now = Date.now();
    setLastSyncedAt(now);
    localStorage.setItem(LAST_SYNC_KEY, now.toString());
    setIsSyncing(false);

    return {
      success: remainingQueue.length === 0,
      syncedCount,
      error: remainingQueue.length > 0 ? `${remainingQueue.length} actions failed to sync.` : undefined,
    };
  }, [queuedActions]);

  const triggerAutoSync = () => {
    setTimeout(() => {
      syncNow().catch(console.error);
    }, 1500);
  };

  const precacheFixtures = useCallback(async (sport?: SportType): Promise<number> => {
    if (!navigator.onLine) {
      throw new Error('Need an active internet connection to download offline cache');
    }

    setIsSyncing(true);
    try {
      const matchesRef = collection(db, 'matches');
      const snap = await getDocs(matchesRef);
      const fetched: MatchItem[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as MatchItem;
        if (!sport || data.sport === sport) {
          fetched.push({ ...data, id: doc.id });
        }
      });

      localStorage.setItem(CACHE_MATCHES_KEY, JSON.stringify(fetched));
      setCachedMatchesCount(fetched.length);
      const now = Date.now();
      setLastSyncedAt(now);
      localStorage.setItem(LAST_SYNC_KEY, now.toString());
      setIsSyncing(false);
      return fetched.length;
    } catch (err) {
      setIsSyncing(false);
      console.error('Failed to pre-cache fixtures:', err);
      throw err;
    }
  }, []);

  const clearLocalCache = useCallback(() => {
    localStorage.removeItem(CACHE_MATCHES_KEY);
    localStorage.removeItem(QUEUE_STORAGE_KEY);
    setQueuedActions([]);
    setCachedMatchesCount(0);
  }, []);

  const exportOfflineBackup = useCallback(() => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      queuedActions,
      cachedMatches: JSON.parse(localStorage.getItem(CACHE_MATCHES_KEY) || '[]'),
      lastSyncedAt,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascend_offline_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [queuedActions, lastSyncedAt]);

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        lastSyncedAt,
        queuedActionsCount: queuedActions.length,
        queuedActions,
        cachedMatchesCount,
        syncNow,
        queueAction,
        precacheFixtures,
        clearLocalCache,
        exportOfflineBackup,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
};
