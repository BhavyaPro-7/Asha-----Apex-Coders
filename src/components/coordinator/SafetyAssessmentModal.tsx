import React from 'react';
import { DispatchSafetyAssessment, Delivery } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  X,
  Gauge,
} from 'lucide-react';

interface SafetyAssessmentModalProps {
  assessment?: DispatchSafetyAssessment;
  delivery?: Delivery;
  onClose: () => void;
}

export const SafetyAssessmentModal: React.FC<SafetyAssessmentModalProps> = ({
  assessment,
  delivery,
  onClose,
}) => {
  const { t } = useTranslation();

  const data = assessment || delivery?.safetyAssessment;
  if (!data) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-2xl bg-white border border-stone-200 shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            {data.isEligible ? (
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-700" />
            )}
            <div>
              <h3 className="text-base font-semibold text-stone-900">
                Dispatch Safety Assessment & Prioritization Breakdown
              </h3>
              {delivery && (
                <p className="text-xs text-stone-500 font-mono">
                  {delivery.deliveryCode} · {delivery.batchTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-200/50"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-md border flex items-center justify-between gap-4 ${
              data.isEligible
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-red-50 border-red-200 text-red-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {data.isEligible ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold text-sm">
                  {data.isEligible
                    ? 'HARD SAFETY REQUIREMENTS SATISFIED'
                    : 'DISPATCH BLOCKED: HARD SAFETY FAILURE'}
                </div>
                <div className="mt-1 leading-relaxed text-xs">
                  {data.isEligible
                    ? 'All temperature holding, destination capacity, dietary restrictions, and safe-use deadlines verified.'
                    : data.hardBlockReason}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 border-l border-current/20 pl-4">
              <div className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                Dispatch Score
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums">
                {data.prioritizationScore}
                <span className="text-xs font-normal opacity-70">/100</span>
              </div>
            </div>
          </div>

          {/* Section A: Hard Safety Eligibility Invariants */}
          <div>
            <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stone-900 inline-block" />
              <span>A. Mandatory Hard Safety Eligibility Checks (No Score Overrides)</span>
            </h4>

            <div className="space-y-2 border border-stone-200 rounded-md divide-y divide-stone-100 bg-white">
              {data.hardChecks.map((check) => (
                <div key={check.id} className="p-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {check.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold text-stone-900 flex items-center gap-2">
                        <span>{check.name}</span>
                        {check.critical && (
                          <span className="text-[10px] font-mono uppercase bg-stone-100 px-1.5 py-0.2 rounded text-stone-600">
                            Critical Invariant
                          </span>
                        )}
                      </div>
                      <p className="text-stone-600 mt-0.5 text-xs">{check.reason}</p>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                      check.passed
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-red-700 bg-red-50'
                    }`}
                  >
                    {check.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Explainable Prioritization Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-stone-900 inline-block" />
                <span>B. Explainable Prioritization Factors (Weights & Breakdown)</span>
              </h4>
              <span className="text-stone-400 font-mono text-[11px]">Weights sum: 100%</span>
            </div>

            <div className="border border-stone-200 rounded-md overflow-hidden bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                  <tr>
                    <th className="px-3.5 py-2.5">Factor</th>
                    <th className="px-3.5 py-2.5 text-center">Score (0–100)</th>
                    <th className="px-3.5 py-2.5 text-center">Configured Weight</th>
                    <th className="px-3.5 py-2.5 text-right">Weighted Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.factors.map((f) => (
                    <tr key={f.id} className="hover:bg-stone-50/50">
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-stone-900">{f.name}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">{f.explanation}</div>
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono font-bold text-stone-800">
                        {f.score}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono text-stone-600">
                        {Math.round(f.weight * 100)}%
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-800">
                        +{f.weightedScore}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-stone-50 font-bold border-t border-stone-200">
                    <td colSpan={3} className="px-3.5 py-2.5 text-stone-900">
                      Aggregate Dispatch Score
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono text-stone-900 text-sm">
                      {data.prioritizationScore} / 100
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
          <span className="text-stone-500">
            Assessed: {new Date(data.assessedAt).toLocaleTimeString()} · Immutable compliance record
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded hover:bg-stone-800 font-semibold"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
