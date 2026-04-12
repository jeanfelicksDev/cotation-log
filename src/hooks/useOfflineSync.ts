"use client";

import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/db';
import { saveQuotation, updateQuotation, deleteQuotation } from '@/lib/actions';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processSyncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      processSyncQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processSyncQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    const queue = await db.syncQueue.orderBy('timestamp').toArray();
    if (queue.length === 0) return;

    setIsSyncing(true);
    
    for (const action of queue) {
      try {
        if (action.type === 'CREATE') {
          // Note: for CREATE, action.data contains the whole quote
          await saveQuotation(action.data);
        } else if (action.type === 'UPDATE') {
          await updateQuotation(action.entityId, action.data);
        } else if (action.type === 'DELETE') {
          await deleteQuotation(action.entityId);
        }
        
        // Remove from queue on success
        await db.syncQueue.delete(action.id!);
        
        // Mark local quotation as synced
        if (action.type !== 'DELETE') {
          await db.quotations.update(action.entityId, { isSynced: true });
        }
      } catch (err) {
        console.error("Sync failed for action", action, err);
        // If it's a server error (not network), we might want to skip or handle it
        // For now, we stop to avoid out-of-order execution if network dropped again
        break; 
      }
    }
    
    setLastSync(new Date());
    setIsSyncing(false);
  }, [isSyncing]);

  return { isOnline, isSyncing, lastSync, processSyncQueue };
}
