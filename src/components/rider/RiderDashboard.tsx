import React, { useState, useEffect } from 'react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { mockDb } from '../../data/mockDatabase';
import { Delivery, DeliveryStatus, RiderProfile } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { getRiderScore, getDeliveryMatchScore } from '../../data/scoringSystem';
import { RiderMapView } from './RiderMapView';
import {
  Bike,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Navigation,
  FileText,
  User,
  ArrowRight,
  WifiOff,
  Sparkles,
  Map,
} from 'lucide-react';

interface RiderDashboardProps {
  onViewAudit: (delivery: Delivery) => void;
}

export const RiderDashboard: React.FC<RiderDashboardProps> = ({ onViewAudit }) => {
  const { activeIdentity } = useAuthRole();
  const { t } = useTranslation();

  const [assignments, setAssignments] = useState<Delivery[]>([]);
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'current' | 'history'>('map');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(mockDb.isOnline());

  // Dialog modals
  const [declineModalDel, setDeclineModalDel] = useState<Delivery | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const [delayModalDel, setDelayModalDel] = useState<Delivery | null>(null);
  const [delayMinutes, setDelayMinutes] = useState(15);
  const [delayReason, setDelayReason] = useState('');

  const [blockedModalDel, setBlockedModalDel] = useState<Delivery | null>(null);
  const [blockedReason, setBlockedReason] = useState('');

  const [handoffModalDel, setHandoffModalDel] = useState<Delivery | null>(null);
  const [staffName, setStaffName] = useState('');
  const [handoffNotes, setHandoffNotes] = useState('');

  const loadAssignments = () => {
    if (!activeIdentity) return;
    const myDeliveries = mockDb
      .getDeliveries()
      .filter((d) => d.riderId === activeIdentity.associatedId);
    setAssignments(myDeliveries);

    const profile = mockDb.getRiderById(activeIdentity.associatedId);
    if (profile) setRiderProfile(profile);

    setIsOnline(mockDb.isOnline());
  };

  useEffect(() => {
    loadAssignments();
    const unsub = mockDb.subscribe(loadAssignments);
    return unsub;
  }, [activeIdentity]);

  const riderScore = getRiderScore(riderProfile, assignments);

  // Action: Acknowledge (supports online and offline queuing)
  const handleAcknowledge = (delId: string) => {
    if (!activeIdentity) return;
    if (!isOnline) {
      mockDb.queueOfflineAction({
        type: 'acknowledge',
        deliveryId: delId,
        payload: { note: 'Offline courier acknowledgement' },
        performedBy: activeIdentity,
      });
      setFeedback({
        type: 'success',
        message: 'Offline mode: Acknowledgement queued locally. Will sync when reconnected.',
      });
      return;
    }

    try {
      mockDb.acknowledgeAssignment(delId, activeIdentity);
      setFeedback({ type: 'success', message: 'Delivery accepted! Head to pickup point.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error accepting delivery' });
    }
  };

  // Action: Decline
  const handleConfirmDecline = () => {
    if (!declineModalDel || !activeIdentity) return;
    if (!declineReason.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a reason to decline.' });
      return;
    }
    try {
      mockDb.declineAssignment(declineModalDel.id, declineReason, activeIdentity);
      setDeclineModalDel(null);
      setDeclineReason('');
      setFeedback({ type: 'success', message: 'Delivery returned to dispatch pool.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error declining delivery' });
    }
  };

  // Action: Confirm Pickup
  const handleConfirmPickup = (delId: string) => {
    if (!activeIdentity) return;
    if (!isOnline) {
      mockDb.queueOfflineAction({
        type: 'pickup',
        deliveryId: delId,
        payload: { notes: 'Offline courier pickup' },
        performedBy: activeIdentity,
      });
      setFeedback({
        type: 'success',
        message: 'Offline mode: Pickup confirmation queued locally.',
      });
      return;
    }

    try {
      mockDb.confirmPickup(delId, 'Collected safely in insulated container.', activeIdentity);
      setFeedback({
        type: 'success',
        message: 'Food picked up! Status updated to On The Way.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error confirming pickup' });
    }
  };

  // Action: Report Delay
  const handleConfirmDelay = () => {
    if (!delayModalDel || !activeIdentity) return;
    if (!delayReason.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a reason for the delay.' });
      return;
    }
    try {
      mockDb.reportDelay(delayModalDel.id, Number(delayMinutes), delayReason, activeIdentity);
      setDelayModalDel(null);
      setDelayReason('');
      setFeedback({
        type: 'success',
        message: `Delay notice (+${delayMinutes}m) sent to shelter.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error reporting delay' });
    }
  };

  // Action: Flag Blocked
  const handleConfirmBlocked = () => {
    if (!blockedModalDel || !activeIdentity) return;
    if (!blockedReason.trim()) {
      setFeedback({ type: 'error', message: 'Please describe what assistance you need.' });
      return;
    }
    try {
      mockDb.flagBlocked(blockedModalDel.id, blockedReason, activeIdentity);
      setBlockedModalDel(null);
      setBlockedReason('');
      setFeedback({
        type: 'success',
        message: 'Assistance alert sent! Dispatcher has been alerted.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error requesting help' });
    }
  };

  // Action: Complete Handoff at Shelter
  const handleConfirmHandoff = () => {
    if (!handoffModalDel || !activeIdentity) return;
    if (!staffName.trim()) {
      setFeedback({ type: 'error', message: 'Staff name is required for handoff confirmation.' });
      return;
    }

    if (!isOnline) {
      mockDb.queueOfflineAction({
        type: 'handoff',
        deliveryId: handoffModalDel.id,
        payload: { staffName, notes: handoffNotes },
        performedBy: activeIdentity,
      });
      setHandoffModalDel(null);
      setFeedback({
        type: 'success',
        message: 'Offline mode: Handoff queued locally. Will sync when online.',
      });
      return;
    }

    try {
      mockDb.completeHandoff(
        handoffModalDel.id,
        staffName,
        handoffNotes || 'Delivered safely at destination.',
        activeIdentity
      );
      setHandoffModalDel(null);
      setStaffName('');
      setHandoffNotes('');
      setFeedback({
        type: 'success',
        message: 'Delivery complete! Cargo safely handed to shelter staff.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error completing delivery' });
    }
  };

  const activeAssignments = assignments.filter(
    (d) =>
      d.status === 'ASSIGNED' ||
      d.status === 'ACKNOWLEDGED' ||
      d.status === 'PICKED_UP' ||
      d.status === 'IN_TRANSIT' ||
      d.status === 'BLOCKED' ||
      d.status === 'REDIRECT_PENDING'
  );

  const pastAssignments = assignments.filter(
    (d) =>
      d.status === 'DELIVERED' ||
      d.status === 'PARTIALLY_DELIVERED' ||
      d.status === 'CANCELLED' ||
      d.status === 'RESERVATION_EXPIRED' ||
      d.status === 'FAILED'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Score Strip */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
            <Bike className="w-4 h-4" />
            <span>Rider Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
            {riderProfile?.name || activeIdentity?.name}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {riderProfile?.vehicleType || 'Two-Wheeler'} · {riderProfile?.zone || 'Mumbai'}
          </p>
        </div>

        {/* Rider Performance Score Box */}
        <div className="flex items-center gap-4 bg-stone-50 border border-stone-200 rounded-lg p-3">
          <div className="text-center pr-3 border-r border-stone-200">
            <div className="text-[10px] uppercase font-bold text-stone-400">Rider Score</div>
            <div className="text-2xl font-black text-blue-700 font-mono">
              {riderScore.score}<span className="text-xs text-stone-400 font-normal">/100</span>
            </div>
            <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold bg-blue-100 text-blue-900 rounded">
              {riderScore.label}
            </span>
          </div>
          <div className="space-y-1 text-xs">
            {riderScore.subMetrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-stone-600">
                <span className="text-stone-500">{m.label}:</span>
                <span className="font-bold text-stone-900 font-mono">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Load Status Badge */}
        <div className="text-right">
          <span className="text-[11px] text-stone-500 block">Current Cargo Load:</span>
          <span className="text-sm font-bold text-stone-900 font-mono">
            {riderProfile?.currentCommittedLoad || 0} / {riderProfile?.carryingCapacity || 40} meals
          </span>
        </div>
      </div>

      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Offline mode: You can still confirm pickups and deliveries. Actions will sync automatically when back online.</span>
        </div>
      )}

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-700 font-bold ml-4">
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'map'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Nearby Deliveries & Map</span>
        </button>

        <button
          onClick={() => setActiveTab('current')}
          className={`px-3.5 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'current'
              ? 'bg-stone-900 text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          <span>My Tasks</span>
          {activeAssignments.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500 text-white font-mono">
              {activeAssignments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          History ({pastAssignments.length})
        </button>
      </div>

      {/* TAB 1: Nearby Deliveries & Map View */}
      {activeTab === 'map' && (
        <RiderMapView
          rider={riderProfile}
          onDeliveryClaimed={(claimedDel) => {
            loadAssignments();
            setActiveTab('current');
            setFeedback({
              type: 'success',
              message: `Accepted delivery ${claimedDel.deliveryCode}! Ready for pickup at ${claimedDel.donorOrganization}.`,
            });
          }}
        />
      )}

      {/* TAB 2: My Tasks (Active Assignments) */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          {activeAssignments.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
              <Bike className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-stone-700">No Active Deliveries</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Check the Nearby Deliveries Map to find and accept food batches near you.
              </p>
              <button
                onClick={() => setActiveTab('map')}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs"
              >
                Browse Map
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAssignments.map((assignment) => {
                const match = getDeliveryMatchScore(assignment);
                const safeUseDate = new Date(assignment.safeUseDeadline);

                return (
                  <div
                    key={assignment.id}
                    className="bg-white border-2 border-stone-200 rounded-xl p-5 shadow-2xs hover:border-stone-400 transition-colors space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">{assignment.deliveryCode}</span>
                        <span className="text-stone-300">·</span>
                        <StatusBadge status={assignment.status} size="sm" />
                        <span className="text-stone-300">·</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900">
                          Score {match.score}/100
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>Expires: {safeUseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Food Info */}
                    <div>
                      <h3 className="text-base font-bold text-stone-900">{assignment.batchTitle}</h3>
                      <div className="text-xs text-stone-600 mt-0.5">
                        Allocated: <strong className="text-stone-900 font-mono">{assignment.quantityValue} {assignment.quantityUnit}</strong> · {t[assignment.storageCondition] || assignment.storageCondition}
                      </div>
                    </div>

                    {/* Pickup & Destination Boxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-lg border border-stone-100 text-xs">
                      {/* Pickup */}
                      <div className="space-y-1">
                        <div className="font-bold text-emerald-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PICKUP</span>
                        </div>
                        <div className="font-semibold text-stone-900">{assignment.donorOrganization}</div>
                        <div className="text-stone-600 text-[11px] leading-snug">{assignment.pickupAddress}</div>
                        <div className="pt-1 text-stone-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{assignment.donorPhone}</span>
                        </div>
                      </div>

                      {/* Dropoff */}
                      <div className="space-y-1 border-t md:border-t-0 md:border-l md:border-stone-200 pt-2.5 md:pt-0 md:pl-3">
                        <div className="font-bold text-purple-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-purple-600" />
                          <span>DESTINATION SHELTER</span>
                        </div>
                        <div className="font-semibold text-stone-900">{assignment.shelterName}</div>
                        <div className="text-stone-600 text-[11px] leading-snug">{assignment.destinationAddress}</div>
                        <div className="pt-1 text-stone-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{assignment.shelterPhone} ({assignment.shelterContactPerson})</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                      <div className="flex items-center gap-2">
                        {/* Acknowledge Action */}
                        {assignment.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleAcknowledge(assignment.id)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
                          >
                            Accept Task
                          </button>
                        )}

                        {/* Pickup Action */}
                        {(assignment.status === 'ACKNOWLEDGED' || assignment.status === 'ASSIGNED') && (
                          <button
                            onClick={() => handleConfirmPickup(assignment.id)}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs"
                          >
                            Food Picked Up
                          </button>
                        )}

                        {/* Complete Delivery Action */}
                        {(assignment.status === 'PICKED_UP' || assignment.status === 'IN_TRANSIT') && (
                          <button
                            onClick={() => {
                              setHandoffModalDel(assignment);
                              setStaffName(assignment.shelterContactPerson || '');
                            }}
                            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs"
                          >
                            Delivered to Shelter
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setDelayModalDel(assignment);
                            setDelayReason('');
                          }}
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
                        >
                          Report Delay
                        </button>

                        <button
                          onClick={() => {
                            setBlockedModalDel(assignment);
                            setBlockedReason('');
                          }}
                          className="px-3 py-2 bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 rounded-lg text-xs font-semibold"
                        >
                          Need Help
                        </button>
                      </div>

                      <button
                        onClick={() => onViewAudit(assignment)}
                        className="text-xs text-stone-500 hover:text-stone-900 underline"
                      >
                        Activity History
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {pastAssignments.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-xs text-stone-500">
              No completed deliveries yet.
            </div>
          ) : (
            pastAssignments.map((d) => (
              <div
                key={d.id}
                className="bg-white border border-stone-200 rounded-lg p-4 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900">{d.deliveryCode}</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-bold text-stone-800">{d.batchTitle}</span>
                  </div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    {d.quantityValue} {d.quantityUnit} · Delivered to {d.shelterName}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.status} size="sm" />
                  <button
                    onClick={() => onViewAudit(d)}
                    className="text-stone-600 hover:text-stone-900 underline"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Handoff Modal */}
      {handoffModalDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-md w-full p-6 text-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900">Delivered to Shelter</h3>
            <p className="text-stone-600">
              Confirm handover for delivery <span className="font-mono font-bold">{handoffModalDel.deliveryCode}</span> at {handoffModalDel.shelterName}.
            </p>
            <div>
              <label className="block font-medium text-stone-800 mb-1">Staff Member Who Received *</label>
              <input
                type="text"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Suresh Patil"
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-800 mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={handoffNotes}
                onChange={(e) => setHandoffNotes(e.target.value)}
                placeholder="e.g. Sealed and hot upon handoff"
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHandoffModalDel(null)}
                className="px-3 py-1.5 border border-stone-300 rounded text-stone-700 hover:bg-stone-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmHandoff}
                className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded"
              >
                Confirm Handoff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delay Modal */}
      {delayModalDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-md w-full p-6 text-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900">Report Transit Delay</h3>
            <div>
              <label className="block font-medium text-stone-800 mb-1">Estimated Delay (Minutes)</label>
              <select
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
              >
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={25}>25 minutes</option>
                <option value={45}>45 minutes</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-stone-800 mb-1">Reason *</label>
              <input
                type="text"
                required
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="e.g. Heavy traffic or rain"
                className="w-full px-3 py-2 border border-stone-300 rounded-md"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDelayModalDel(null)}
                className="px-3 py-1.5 border border-stone-300 rounded text-stone-700 hover:bg-stone-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelay}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded"
              >
                Submit Delay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Need Help Modal */}
      {blockedModalDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-md w-full p-6 text-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900">Need Assistance</h3>
            <div>
              <label className="block font-medium text-stone-800 mb-1">What happened? *</label>
              <textarea
                required
                rows={2}
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="e.g. Vehicle breakdown or roadblock"
                className="w-full px-3 py-2 border border-stone-300 rounded-md"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlockedModalDel(null)}
                className="px-3 py-1.5 border border-stone-300 rounded text-stone-700 hover:bg-stone-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlocked}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded"
              >
                Alert Dispatcher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
