import React, { useState, useEffect } from 'react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { mockDb } from '../../data/mockDatabase';
import {
  Delivery,
  AidBatch,
  ShelterProfile,
  RiderProfile,
  WeatherCondition,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { CoordinatorMapAndWeather } from './CoordinatorMapAndWeather';
import { SafetyAssessmentModal } from './SafetyAssessmentModal';
import { evaluateHardSafetyAndScore } from '../../data/safetyEngine';
import {
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  RotateCcw,
  AlertTriangle,
  XCircle,
  Truck,
  Building2,
  Package,
  Clock,
  ArrowRight,
  ShieldAlert,
  Users,
  Droplets,
  Flame,
  CheckCircle,
  MapPin,
  Layers,
  Activity,
} from 'lucide-react';

interface CoordinatorDashboardProps {
  onViewAudit: (delivery: Delivery) => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
  onViewAudit,
}) => {
  const { activeIdentity } = useAuthRole();
  const { t } = useTranslation();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [batches, setBatches] = useState<AidBatch[]>([]);
  const [shelters, setShelters] = useState<ShelterProfile[]>([]);
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [weather, setWeather] = useState<WeatherCondition>(mockDb.getWeather());

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<
    'dispatch' | 'unassigned' | 'map_weather' | 'shelters' | 'riders'
  >('dispatch');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Safety Assessment Inspection Modal
  const [inspectSafetyDel, setInspectSafetyDel] = useState<Delivery | null>(null);

  // Manual Split Allocation Modal
  const [assignBatchModal, setAssignBatchModal] = useState<AidBatch | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [selectedShelterId, setSelectedShelterId] = useState('');
  const [allocateQty, setAllocateQty] = useState<number>(40);

  // Reassignment Modal
  const [reassignModalDel, setReassignModalDel] = useState<Delivery | null>(null);
  const [newRiderId, setNewRiderId] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  // Redirect Shelter Modal
  const [redirectModalDel, setRedirectModalDel] = useState<Delivery | null>(null);
  const [newShelterId, setNewShelterId] = useState('');
  const [redirectReason, setRedirectReason] = useState('');

  // Cancel Modal
  const [cancelModalDel, setCancelModalDel] = useState<Delivery | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadData = () => {
    setDeliveries(mockDb.getDeliveries());
    setBatches(mockDb.getBatches());
    setShelters(mockDb.getShelters());
    setRiders(mockDb.getRiders());
    setWeather(mockDb.getWeather());
  };

  useEffect(() => {
    loadData();
    const unsub = mockDb.subscribe(loadData);
    return unsub;
  }, []);

  // Filtered deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        d.deliveryCode.toLowerCase().includes(q) ||
        d.batchTitle.toLowerCase().includes(q) ||
        d.donorOrganization.toLowerCase().includes(q) ||
        d.shelterName.toLowerCase().includes(q) ||
        (d.riderName && d.riderName.toLowerCase().includes(q)) ||
        d.pickupAddress.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Batches with available quantity
  const unassignedBatches = batches.filter((b) => b.remainingQuantity > 0);

  // Stats calculation
  const totalActive = deliveries.filter(
    (d) =>
      d.status === 'ASSIGNED' ||
      d.status === 'ACKNOWLEDGED' ||
      d.status === 'PICKED_UP' ||
      d.status === 'IN_TRANSIT'
  ).length;

  const urgentDeadlines = deliveries.filter((d) => {
    if (d.status === 'DELIVERED' || d.status === 'CANCELLED') return false;
    const diffHours = (new Date(d.safeUseDeadline).getTime() - Date.now()) / (3600 * 1000);
    return diffHours > 0 && diffHours < 2;
  }).length;

  const blockedCount = deliveries.filter(
    (d) => d.status === 'BLOCKED' || d.status === 'REDIRECT_PENDING'
  ).length;

  const activeRidersOnField = riders.filter(
    (r) => r.status === 'active' && r.currentCommittedLoad > 0
  ).length;

  // Manual Trigger: Sweep & Expire Unacknowledged Reservations
  const handleTimeoutSweep = () => {
    const expiredCount = mockDb.checkAndExpireReservations();
    if (expiredCount > 0) {
      setFeedback({
        type: 'success',
        message: `Sweep complete: ${expiredCount} unacknowledged reservation(s) expired. Cargo safely reclaimed to donor batch balance.`,
      });
    } else {
      setFeedback({
        type: 'success',
        message: 'Sweep complete: No reservations currently exceed acknowledgement deadline.',
      });
    }
  };

  // Confirm Capacity-Aware Allocation with Split Support
  const handleConfirmAllocation = () => {
    if (!assignBatchModal || !activeIdentity) return;
    if (!selectedRiderId || !selectedShelterId) {
      setFeedback({ type: 'error', message: 'Please select both a courier and a destination shelter.' });
      return;
    }

    try {
      const res = mockDb.allocateDelivery(
        assignBatchModal.id,
        selectedRiderId,
        selectedShelterId,
        Number(allocateQty),
        activeIdentity
      );
      setAssignBatchModal(null);
      setFeedback({
        type: 'success',
        message: `Task ${res.delivery.deliveryCode} created! ${allocateQty} ${assignBatchModal.quantityUnit} allocated. Batch balance: ${mockDb.getBatchById(assignBatchModal.id)?.remainingQuantity} remaining.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to allocate task.' });
    }
  };

  // Reassign Rider
  const handleConfirmReassign = () => {
    if (!reassignModalDel || !activeIdentity) return;
    if (!newRiderId) {
      setFeedback({ type: 'error', message: 'Please select a replacement courier.' });
      return;
    }
    if (!reassignReason.trim() || reassignReason.trim().length < 4) {
      setFeedback({ type: 'error', message: 'Mandatory override justification required (min 4 chars).' });
      return;
    }

    try {
      mockDb.reassignRiderByCoordinator(
        reassignModalDel.id,
        newRiderId,
        reassignReason,
        activeIdentity
      );
      setReassignModalDel(null);
      setNewRiderId('');
      setReassignReason('');
      setFeedback({
        type: 'success',
        message: `Delivery ${reassignModalDel.deliveryCode} successfully reassigned.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reassign.' });
    }
  };

  // Redirect Shelter
  const handleConfirmRedirect = () => {
    if (!redirectModalDel || !activeIdentity) return;
    if (!newShelterId) {
      setFeedback({ type: 'error', message: 'Please select a new destination shelter.' });
      return;
    }
    if (!redirectReason.trim() || redirectReason.trim().length < 4) {
      setFeedback({ type: 'error', message: 'Mandatory override justification required (min 4 chars).' });
      return;
    }

    try {
      mockDb.redirectShelterByCoordinator(
        redirectModalDel.id,
        newShelterId,
        redirectReason,
        activeIdentity
      );
      setRedirectModalDel(null);
      setNewShelterId('');
      setRedirectReason('');
      setFeedback({
        type: 'success',
        message: `Route redirected for ${redirectModalDel.deliveryCode}. Courier and shelters notified.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to redirect.' });
    }
  };

  // Cancel Delivery
  const handleConfirmCancel = () => {
    if (!cancelModalDel || !activeIdentity) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 4) {
      setFeedback({ type: 'error', message: 'Mandatory cancellation justification required.' });
      return;
    }

    try {
      mockDb.cancelDeliveryByCoordinator(cancelModalDel.id, cancelReason, activeIdentity);
      setCancelModalDel(null);
      setCancelReason('');
      setFeedback({
        type: 'success',
        message: `Delivery ${cancelModalDel.deliveryCode} cancelled and audited.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to cancel delivery.' });
    }
  };

  // Dynamic Safety & Scoring Preview for Modal
  const previewBatch = assignBatchModal;
  const previewRider = riders.find((r) => r.id === selectedRiderId);
  const previewShelter = shelters.find((s) => s.id === selectedShelterId);
  const liveAssessment =
    previewBatch && previewRider && previewShelter
      ? evaluateHardSafetyAndScore(previewBatch, previewShelter, previewRider, allocateQty)
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Coordinator Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-stone-900 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>CENTRAL CIVIC DISPATCH COMMAND</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 mt-1">
            {t.overviewStats}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Operator: {activeIdentity?.name} · Authority: Capacity-Aware Allocation & Safety Scoring
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTimeoutSweep}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-stone-300 rounded hover:bg-stone-50 text-stone-800 shadow-xs"
            title="Checks and releases unacknowledged reservations past 5m timeout"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Run Timeout Recovery Sweep</span>
          </button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-md border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold text-stone-400">
            ×
          </button>
        </div>
      )}

      {/* KPI High Density Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-stone-200 rounded p-3.5">
          <div className="text-[11px] text-stone-500 font-medium">Active Legs</div>
          <div className="text-2xl font-bold text-stone-900 mt-1 font-mono tabular-nums">
            {totalActive}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded p-3.5">
          <div className="text-[11px] text-stone-500 font-medium">Batches with Balance</div>
          <div className="text-2xl font-bold text-blue-700 mt-1 font-mono tabular-nums">
            {unassignedBatches.length}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded p-3.5">
          <div className="text-[11px] text-stone-500 font-medium">Couriers Carrying Load</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono tabular-nums">
            {activeRidersOnField}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded p-3.5">
          <div className="text-[11px] text-stone-500 font-medium">Urgent Expiry (&lt;2h)</div>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono tabular-nums">
            {urgentDeadlines}
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded p-3.5">
          <div className="text-[11px] text-stone-500 font-medium">Blocked / Intervene</div>
          <div className="text-2xl font-bold text-red-700 mt-1 font-mono tabular-nums">
            {blockedCount}
          </div>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-4 py-2 font-semibold rounded transition-colors ${
              activeTab === 'dispatch'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            {t.dispatchQueue} ({deliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-4 py-2 font-semibold rounded transition-colors ${
              activeTab === 'unassigned'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            Aid Batches & Stock ({unassignedBatches.length})
          </button>
          <button
            onClick={() => setActiveTab('map_weather')}
            className={`px-4 py-2 font-semibold rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'map_weather'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Operations Map & Weather</span>
          </button>
          <button
            onClick={() => setActiveTab('shelters')}
            className={`px-4 py-2 font-semibold rounded transition-colors ${
              activeTab === 'shelters'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            {t.shelterCapacityMatrix} ({shelters.length})
          </button>
          <button
            onClick={() => setActiveTab('riders')}
            className={`px-4 py-2 font-semibold rounded transition-colors ${
              activeTab === 'riders'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900 bg-stone-100'
            }`}
          >
            Fleet Load Matrix ({riders.length})
          </button>
        </div>

        {/* Global Search input */}
        {activeTab === 'dispatch' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded bg-white outline-none focus:border-stone-800"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">Assigned (Awaiting Ack)</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="BLOCKED">Blocked</option>
              <option value="REDIRECT_PENDING">Redirect Pending</option>
              <option value="RESERVATION_EXPIRED">Expired Reservation</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Dispatch Queue Table */}
      {activeTab === 'dispatch' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Task ID</th>
                    <th className="px-4 py-3">Aid Cargo</th>
                    <th className="px-4 py-3">Pickup (Donor)</th>
                    <th className="px-4 py-3">Assigned Courier</th>
                    <th className="px-4 py-3">Destination Shelter</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Safety Score</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-stone-400">
                        No delivery tasks match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((del) => {
                      const isTerminal =
                        del.status === 'DELIVERED' ||
                        del.status === 'PARTIALLY_DELIVERED' ||
                        del.status === 'CANCELLED' ||
                        del.status === 'FAILED' ||
                        del.status === 'RESERVATION_EXPIRED';

                      return (
                        <tr
                          key={del.id}
                          className={`hover:bg-stone-50 transition-colors ${
                            del.status === 'BLOCKED' || del.status === 'REDIRECT_PENDING'
                              ? 'bg-red-50/30'
                              : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-stone-900 whitespace-nowrap">
                            {del.deliveryCode}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-stone-900 max-w-[180px] truncate">
                              {del.batchTitle}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono tabular-nums">
                              {del.quantityValue} {del.quantityUnit} · {t[del.category] || del.category}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-stone-800 max-w-[150px] truncate">
                              {del.donorOrganization}
                            </div>
                            <div className="text-[11px] text-stone-400 font-mono">{del.donorPhone}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-stone-800">
                              {del.riderName || <span className="text-amber-700 italic">Unassigned</span>}
                            </div>
                            {del.riderPhone && (
                              <div className="text-[11px] text-stone-400 font-mono">{del.riderPhone}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-stone-800 max-w-[150px] truncate">
                              {del.shelterName}
                            </div>
                            <div className="text-[11px] text-stone-400">
                              Contact: {del.shelterContactPerson}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={del.status} size="sm" />
                            {del.status === 'ASSIGNED' && (
                              <div className="text-[10px] text-amber-700 font-mono mt-0.5">
                                Timeout in 5m
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {del.safetyAssessment ? (
                              <button
                                onClick={() => setInspectSafetyDel(del)}
                                className="flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold"
                                title="Click to view explainable scoring breakdown"
                              >
                                <span>{del.safetyAssessment.prioritizationScore}/100</span>
                                <span className="text-emerald-700">✓</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-stone-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onViewAudit(del)}
                                className="px-2 py-1 text-stone-600 hover:text-stone-900 border border-stone-200 rounded hover:bg-stone-100 text-[11px]"
                                title="View Audit Logs"
                              >
                                Audit
                              </button>

                              {!isTerminal && (
                                <>
                                  <button
                                    onClick={() => {
                                      setReassignModalDel(del);
                                      setNewRiderId('');
                                      setReassignReason('');
                                    }}
                                    className="px-2 py-1 text-blue-700 hover:text-blue-900 border border-blue-200 rounded hover:bg-blue-50 text-[11px]"
                                  >
                                    Reassign
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRedirectModalDel(del);
                                      setNewShelterId('');
                                      setRedirectReason('');
                                    }}
                                    className="px-2 py-1 text-purple-700 hover:text-purple-900 border border-purple-200 rounded hover:bg-purple-50 text-[11px]"
                                  >
                                    Redirect
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCancelModalDel(del);
                                      setCancelReason('');
                                    }}
                                    className="px-2 py-1 text-red-700 hover:text-red-900 border border-red-200 rounded hover:bg-red-50 text-[11px]"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Unassigned Batches & Split Allocation */}
      {activeTab === 'unassigned' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center justify-between">
            <span>
              <strong>Capacity-Aware Splitting Active:</strong> You can allocate portions of large batches (e.g. 40, 60, or 80 meals) across multiple couriers without double-booking.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unassignedBatches.map((batch) => (
              <div
                key={batch.id}
                className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                  <span className="font-bold text-stone-900">{batch.batchCode}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                    {batch.remainingQuantity} {batch.quantityUnit} AVAILABLE
                  </span>
                </div>

                <h3 className="text-sm font-bold text-stone-900">{batch.title}</h3>

                <div className="grid grid-cols-3 gap-2 bg-stone-50 border border-stone-100 rounded p-2.5 text-xs text-stone-600">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Total Batch</span>
                    <strong className="font-mono text-stone-900">
                      {batch.quantityValue} {batch.quantityUnit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Committed</span>
                    <strong className="font-mono text-blue-700">
                      {batch.allocatedQuantity} {batch.quantityUnit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase">Unreserved</span>
                    <strong className="font-mono text-emerald-700">
                      {batch.remainingQuantity} {batch.quantityUnit}
                    </strong>
                  </div>
                </div>

                <div className="text-xs text-stone-600 space-y-1">
                  <div>
                    <strong>Origin:</strong> {batch.donorOrganization} ({batch.pickupAddress})
                  </div>
                  <div>
                    <strong>Safe Use By:</strong>{' '}
                    {new Date(batch.safeUseDeadline).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex justify-end">
                  <button
                    onClick={() => {
                      setAssignBatchModal(batch);
                      setSelectedRiderId(riders[0]?.id || '');
                      setSelectedShelterId(shelters[0]?.id || '');
                      setAllocateQty(Math.min(batch.remainingQuantity, riders[0]?.carryingCapacity || 40));
                    }}
                    className="px-3.5 py-2 text-xs font-semibold bg-stone-900 text-white rounded hover:bg-stone-800 shadow-xs"
                  >
                    Allocate Courier Leg (Split Supported) →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Operations Map & Weather */}
      {activeTab === 'map_weather' && (
        <CoordinatorMapAndWeather
          batches={batches}
          deliveries={deliveries}
          shelters={shelters}
          riders={riders}
          weather={weather}
          onSelectDelivery={(del) => {
            onViewAudit(del);
          }}
        />
      )}

      {/* TAB 4: Shelter Capacity Matrix */}
      {activeTab === 'shelters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shelters.map((shelter) => {
            const openBeds = Math.max(0, shelter.totalBedCapacity - shelter.currentOccupants);

            return (
              <div
                key={shelter.id}
                className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{shelter.name}</h3>
                    <p className="text-xs text-stone-500">{shelter.address}</p>
                  </div>
                  {shelter.isTemporarilyClosed ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 font-semibold">
                      PAUSED
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      OPEN
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-stone-50 border border-stone-100 rounded p-3 text-xs">
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase">Bed Capacity</div>
                    <div className="font-bold text-stone-800 font-mono">
                      {shelter.currentOccupants} / {shelter.totalBedCapacity}
                    </div>
                    <div className="text-[10px] text-emerald-700">{openBeds} open</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-stone-400 uppercase">Meal Intake</div>
                    <div className="font-bold text-stone-800 font-mono">
                      {shelter.mealIntakeCapacity} / day
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {shelter.vegOnly ? 'Veg Only' : 'Universal'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-stone-400 uppercase">Utilities</div>
                    <div className="text-[11px] text-stone-700">
                      Water: {shelter.cleanWaterAvailable ? '✓ OK' : '⚠ Off'}
                    </div>
                    <div className="text-[11px] text-stone-700">
                      Fuel: {shelter.cookingFuelAvailable ? '✓ OK' : '⚠ Off'}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-stone-600 flex items-center justify-between">
                  <span>Intake Hours: {shelter.receivingHours}</span>
                  <span className="font-mono text-stone-500">Contact: {shelter.phone}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 5: Courier Fleet Load Matrix */}
      {activeTab === 'riders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {riders.map((rider) => {
            const availableLoad = rider.carryingCapacity - rider.currentCommittedLoad;

            return (
              <div
                key={rider.id}
                className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900">{rider.name}</h3>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                      availableLoad === 0
                        ? 'bg-red-100 text-red-800'
                        : rider.currentCommittedLoad > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {availableLoad === 0
                      ? 'FULL LOAD'
                      : rider.currentCommittedLoad > 0
                      ? 'PARTIAL LOAD'
                      : 'AVAILABLE'}
                  </span>
                </div>

                {/* Capacity Gauge */}
                <div className="bg-stone-50 border border-stone-100 rounded p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Committed Load:</span>
                    <strong className="font-mono text-stone-900">
                      {rider.currentCommittedLoad} / {rider.carryingCapacity} units
                    </strong>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all"
                      style={{
                        width: `${Math.min(100, (rider.currentCommittedLoad / rider.carryingCapacity) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-stone-400 text-right">
                    {availableLoad} units open payload
                  </div>
                </div>

                <div className="text-xs text-stone-600 space-y-1">
                  <div>
                    <strong className="text-stone-800">Phone:</strong> {rider.phone}
                  </div>
                  <div>
                    <strong className="text-stone-800">Cluster:</strong> {rider.zone}
                  </div>
                  <div>
                    <strong className="text-stone-800">Vehicle:</strong> {rider.vehicleType}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CAPACITY-AWARE SPLIT ALLOCATION MODAL WITH SAFETY PREVIEW */}
      {assignBatchModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-stone-200 rounded-lg p-6 max-w-xl w-full text-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900">
              Capacity-Aware Allocation: {assignBatchModal.batchCode}
            </h3>
            <p className="text-stone-600">
              {assignBatchModal.title} · {assignBatchModal.remainingQuantity}{' '}
              {assignBatchModal.quantityUnit} remaining balance unreserved.
            </p>

            <div className="space-y-3">
              {/* Allocation quantity input */}
              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Leg Allocation Quantity ({assignBatchModal.quantityUnit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={assignBatchModal.remainingQuantity}
                  value={allocateQty}
                  onChange={(e) => setAllocateQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-stone-300 rounded font-mono font-bold text-sm text-stone-900"
                />
                <span className="text-[11px] text-stone-500 mt-0.5 block">
                  Remaining batch balance: {assignBatchModal.remainingQuantity}{' '}
                  {assignBatchModal.quantityUnit}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Select Courier (Carrying Capacity) *
                </label>
                <select
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-white text-xs"
                >
                  {riders.map((r) => {
                    const open = r.carryingCapacity - r.currentCommittedLoad;
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.zone}) — Open payload: {open}/{r.carryingCapacity} units
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">{t.selectShelter} *</label>
                <select
                  value={selectedShelterId}
                  onChange={(e) => setSelectedShelterId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-white text-xs"
                >
                  {shelters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.zone}) — {s.isTemporarilyClosed ? 'PAUSED' : 'Open'} (
                      {s.vegOnly ? 'Veg Only' : 'Universal'})
                    </option>
                  ))}
                </select>
              </div>

              {/* LIVE SAFETY & SCORING PREVIEW */}
              {liveAssessment && (
                <div
                  className={`p-3 rounded border space-y-1.5 ${
                    liveAssessment.isEligible
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-red-50/70 border-red-200 text-red-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {liveAssessment.isEligible ? '✓ Safety Assessment Passed' : '✗ Hard Safety Block'}
                    </span>
                    <span className="font-mono">{liveAssessment.prioritizationScore} / 100</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {liveAssessment.isEligible
                      ? 'Meets safe-use deadline, storage requirements, and courier payload limit.'
                      : liveAssessment.hardBlockReason}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignBatchModal(null)}
                className="px-3.5 py-2 border border-stone-300 rounded hover:bg-stone-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={liveAssessment !== null && !liveAssessment.isEligible}
                onClick={handleConfirmAllocation}
                className="px-4 py-2 bg-emerald-700 text-white rounded font-semibold hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                Dispatch Leg
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAFETY BREAKDOWN MODAL */}
      <SafetyAssessmentModal
        delivery={inspectSafetyDel || undefined}
        onClose={() => setInspectSafetyDel(null)}
      />

      {/* REASSIGN RIDER MODAL */}
      {reassignModalDel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-stone-200 rounded-lg p-6 max-w-lg w-full text-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900">
              Reassign Courier: {reassignModalDel.deliveryCode}
            </h3>
            <p className="text-stone-600">
              Current courier:{' '}
              <strong className="text-stone-900">{reassignModalDel.riderName || 'None'}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Select Replacement *</label>
                <select
                  value={newRiderId}
                  onChange={(e) => setNewRiderId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-white"
                >
                  <option value="">-- Choose Courier --</option>
                  {riders
                    .filter((r) => r.id !== reassignModalDel.riderId)
                    .map((r) => {
                      const open = r.carryingCapacity - r.currentCommittedLoad;
                      return (
                        <option key={r.id} value={r.id}>
                          {r.name} (Open payload: {open}/{r.carryingCapacity})
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Override Reason (Mandatory Compliance Log) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Previous rider vehicle breakdown; reallocating to nearby courier"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReassignModalDel(null)}
                className="px-3.5 py-2 border border-stone-300 rounded hover:bg-stone-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                className="px-4 py-2 bg-blue-700 text-white rounded font-semibold hover:bg-blue-800"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REDIRECT SHELTER MODAL */}
      {redirectModalDel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-stone-200 rounded-lg p-6 max-w-lg w-full text-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900">
              Redirect Destination: {redirectModalDel.deliveryCode}
            </h3>
            <p className="text-stone-600">
              Current destination:{' '}
              <strong className="text-stone-900">{redirectModalDel.shelterName}</strong>. Cargo is
              in courier custody and will be safely preserved.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Select Alternate Shelter *
                </label>
                <select
                  value={newShelterId}
                  onChange={(e) => setNewShelterId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-white"
                >
                  <option value="">-- Choose Alternate Shelter --</option>
                  {shelters
                    .filter((s) => s.id !== redirectModalDel.shelterId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.zone}) — {s.isTemporarilyClosed ? 'PAUSED' : 'Intake Ready'}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Redirection Reason (Mandatory Compliance Log) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Primary shelter flooded; rerouting to verified open shelter"
                  value={redirectReason}
                  onChange={(e) => setRedirectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRedirectModalDel(null)}
                className="px-3.5 py-2 border border-stone-300 rounded hover:bg-stone-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmRedirect}
                className="px-4 py-2 bg-purple-700 text-white rounded font-semibold hover:bg-purple-800"
              >
                Authorize Redirection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModalDel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
        >
          <div className="bg-white border border-stone-200 rounded-lg p-6 max-w-md w-full text-xs space-y-4">
            <h3 className="text-sm font-bold text-red-900">
              Coordinator Override: Cancel {cancelModalDel.deliveryCode}
            </h3>
            <p className="text-stone-600">
              Cancelling will abort this task and record an immutable cancellation audit record.
            </p>

            <div>
              <label className="block font-semibold text-stone-800 mb-1">Cancellation Reason *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Safety test failed / donor request"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalDel(null)}
                className="px-3.5 py-2 border border-stone-300 rounded hover:bg-stone-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-700 text-white rounded font-semibold hover:bg-red-800"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
