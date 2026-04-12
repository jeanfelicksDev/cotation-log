"use client";

import React from 'react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { WifiOff, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineStatus() {
  const { isOnline, isSyncing } = useOfflineSync();

  return (
    <AnimatePresence>
      {!isOnline || isSyncing ? (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="offline-status-container"
        >
          <div className="status-pill">
            {isSyncing ? (
              <>
                <RefreshCcw size={14} className="icon-spin" />
                <span>Sync en cours...</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="icon-offline" />
                <span>Hors-Ligne</span>
              </>
            )}
          </div>
          
          <style jsx>{`
            .offline-status-container {
              position: fixed;
              top: 80px;
              left: 50%;
              transform: translateX(-50%);
              z-index: 9999;
              pointer-events: none;
            }
            
            .status-pill {
              display: flex;
              align-items: center;
              gap: 8px;
              background: rgba(15, 15, 15, 0.85);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 6px 16px;
              border-radius: 100px;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: white;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
              pointer-events: auto;
            }

            :global(.icon-spin) {
              animation: spin 2s linear infinite;
              color: #10b981;
            }

            .icon-offline {
              color: #ef4444;
            }

            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
