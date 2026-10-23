import React from 'react';
import { Delivery } from '../../types';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from '../../i18n/LanguageContext';
import { X, ShieldCheck, Clock, User, FileText } from 'lucide-react';

interface AuditHistoryModalProps {
  delivery: Delivery | null;
  onClose: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({ delivery, onClose }) => {
  const { t } = useTranslation();

  if (!delivery) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-2xl bg-white border border-stone-200 shadow-xl rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-semibold text-stone-900">
                {t.auditTrail}: {delivery.deliveryCode}
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {delivery.batchTitle} · {delivery.quantityValue} {delivery.quantityUnit}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-200/60 transition-colors"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-stone-50 border border-stone-200 rounded p-3 text-xs text-stone-600 flex items-center justify-between">
            <span>
              <strong className="text-stone-800">Current Status:</strong>{' '}
              <StatusBadge status={delivery.status} size="sm" />
            </span>
            <span>
              <strong className="text-stone-800">Linked Batch:</strong> {delivery.batchId}
            </span>
            <span>
              <strong className="text-stone-800">Destination:</strong> {delivery.shelterName}
            </span>
          </div>

          <div className="flow-root mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
              Lifecycle Event Log ({delivery.auditLogs.length} Events)
            </h4>

            <div className="relative border-l-2 border-stone-200 ml-4 space-y-6 pb-2">
              {delivery.auditLogs.map((log, index) => {
                const dateObj = new Date(log.timestamp);
                const formattedTime = dateObj.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const formattedDate = dateObj.toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div key={log.id || index} className="relative pl-6">
                    {/* Event Marker */}
                    <span className="absolute -left-2 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-stone-700" />

                    <div className="bg-white border border-stone-200 rounded-md p-3 text-xs shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          {log.fromStatus ? (
                            <>
                              <StatusBadge status={log.fromStatus} size="sm" />
                              <span className="text-stone-400">→</span>
                            </>
                          ) : (
                            <span className="text-stone-500 font-mono text-[11px]">[Initial]</span>
                          )}
                          <StatusBadge status={log.toStatus} size="sm" />
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-500 font-mono tabular-nums">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {formattedDate} {formattedTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-stone-700 font-medium my-1">
                        <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          {log.changedByName}{' '}
                          <span className="text-stone-400 font-normal">
                            ({log.changedByRole.toUpperCase()})
                          </span>
                        </span>
                      </div>

                      {log.reason && (
                        <div className="mt-2 text-stone-600 bg-stone-50 border border-stone-100 rounded p-2 flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{log.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded hover:bg-stone-100 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
