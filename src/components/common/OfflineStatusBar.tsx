import React, { useState, useEffect } from 'react';
import { mockDb } from '../../data/mockDatabase';
import { OfflineQueuedAction } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const OfflineStatusBar: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState<boolean>(mockDb.isOnline());
  const [queue, setQueue] = useState<OfflineQueuedAction[]>(mockDb.getOfflineQueue());
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    const unsub = mockDb.subscribe(() => {
      setIsOnline(mockDb.isOnline());
      setQueue(mockDb.getOfflineQueue());
    });
    return unsub;
  }, []);

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    mockDb.setOnline(nextState);
    setIsOnline(nextState);
    if (nextState) {
      // Auto-sync when returning online
      const res = mockDb.syncOfflineQueue();
      setSyncFeedback(
        `Reconnected to central dispatch. Synchronized: ${res.synchronized}, Conflicts: ${res.conflicts}.`
      );
    } else {
      setSyncFeedback('Low-connectivity mode enabled. Eligible field actions will be queued locally.');
    }
  };

  const handleSyncNow = () => {
    const res = mockDb.syncOfflineQueue();
    setSyncFeedback(
      `Synchronized ${res.synchronized} queued action(s). Conflicting/Rejected: ${res.conflicts}.`
    );
  };

  const pendingCount = queue.filter((q) => q.status === 'pending').length;

  return (
    <div className="bg-stone-900 text-stone-100 text-xs border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Status Indicator */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
              <Wifi className="w-3.5 h-3.5" />
              <span>Online</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
              <span>Offline Mode (Saved Locally)</span>
            </span>
          )}

          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono text-[10px]">
              {pendingCount} Queued Action(s)
            </span>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="text-stone-300 hover:text-white flex items-center gap-1 text-[11px] hover:underline"
          >
            <PhoneCall className="w-3 h-3 text-stone-400" />
            <span>Outage Hotline & Queue Details</span>
            {showDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isOnline && pendingCount > 0 && (
            <button
              onClick={handleSyncNow}
              className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-700 hover:bg-emerald-600 rounded text-white text-[11px] font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sync Queue</span>
            </button>
          )}

          <button
            onClick={handleToggleOnline}
            className={`px-2 py-0.5 rounded font-mono text-[11px] font-medium border transition-colors ${
              isOnline
                ? 'border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-500'
                : 'border-amber-500 text-amber-300 bg-amber-950/40 hover:bg-amber-900/50'
            }`}
          >
            {isOnline ? 'Simulate Offline' : 'Restore Online'}
          </button>
        </div>
      </div>

      {/* Sync feedback notification */}
      {syncFeedback && (
        <div className="bg-stone-800 text-stone-200 px-4 py-1 text-[11px] flex items-center justify-between border-t border-stone-700">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-stone-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Outage Protocol & Offline Queue Details Drawer */}
      {showDrawer && (
        <div className="bg-stone-800 border-t border-stone-700 p-4 text-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fallback Contacts */}
            <div className="space-y-1">
              <h4 className="font-bold text-stone-200 flex items-center gap-1.5 text-xs">
                <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                <span>Manual Coordination Outage Protocol</span>
              </h4>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                If cellular mobile data fails, field couriers and shelters may communicate directly via the central civic dispatch desk:
              </p>
              <div className="pt-1 font-mono text-[11px] text-stone-300 space-y-0.5">
                <div>Central Ops Hotline: <strong>+91 98200 99001</strong></div>
                <div>Emergency Courier Dispatch: <strong>+91 98190 77654</strong></div>
                <div>Asha Sadan Intake Gate: <strong>+91 98332 11987</strong></div>
              </div>
            </div>

            {/* Offline Action Queue Status */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-bold text-stone-200 text-xs">Offline Queued Operations ({queue.length})</h4>
                {queue.length > 0 && (
                  <button
                    onClick={() => mockDb.clearOfflineQueue()}
                    className="text-[10px] text-stone-400 hover:text-red-400 hover:underline"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="text-stone-500 text-[11px] italic">No queued operations.</div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {queue.map((op) => (
                    <div
                      key={op.operationId}
                      className="p-1.5 bg-stone-900 rounded border border-stone-700 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-mono text-stone-300">
                          {op.type.toUpperCase()} ({op.deliveryId})
                        </span>
                        {op.errorMessage && (
                          <div className="text-[10px] text-red-400">{op.errorMessage}</div>
                        )}
                      </div>
                      <span
                        className={`font-mono font-bold text-[10px] px-1.5 py-0.2 rounded ${
                          op.status === 'synchronized'
                            ? 'bg-emerald-950 text-emerald-400'
                            : op.status === 'conflict' || op.status === 'rejected'
                            ? 'bg-red-950 text-red-400'
                            : 'bg-amber-950 text-amber-400'
                        }`}
                      >
                        {op.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
