import React, { useState, useEffect } from 'react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { mockDb } from '../../data/mockDatabase';
import { ShelterProfile, Delivery, DeliveryStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { getShelterScore, getDeliveryMatchScore } from '../../data/scoringSystem';
import {
  Building2,
  Users,
  Utensils,
  Droplets,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  Save,
  PauseCircle,
  PlayCircle,
  Bike,
  Sparkles,
} from 'lucide-react';

interface ShelterDashboardProps {
  onViewAudit: (delivery: Delivery) => void;
}

export const ShelterDashboard: React.FC<ShelterDashboardProps> = ({ onViewAudit }) => {
  const { activeIdentity } = useAuthRole();
  const { t } = useTranslation();

  const [shelter, setShelter] = useState<ShelterProfile | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [activeTab, setActiveTab] = useState<'incoming' | 'history' | 'settings'>('incoming');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Receipt Inspection Modal
  const [inspectDelivery, setInspectDelivery] = useState<Delivery | null>(null);
  const [acceptedQty, setAcceptedQty] = useState<number>(0);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [qualityCheck, setQualityCheck] = useState<'passed' | 'minor_discrepancy' | 'rejected'>('passed');
  const [staffName, setStaffName] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');

  // Editable Shelter Profile Form State
  const [editProfile, setEditProfile] = useState<Partial<ShelterProfile>>({});

  const loadData = () => {
    if (!activeIdentity) return;
    const currentShelter = mockDb.getShelterById(activeIdentity.associatedId);
    if (currentShelter) {
      setShelter(currentShelter);
      setEditProfile(currentShelter);
    }

    const myDeliveries = mockDb
      .getDeliveries()
      .filter((d) => d.shelterId === activeIdentity.associatedId);
    setDeliveries(myDeliveries);
  };

  useEffect(() => {
    loadData();
    const unsub = mockDb.subscribe(loadData);
    return unsub;
  }, [activeIdentity]);

  const shelterScore = getShelterScore(shelter, deliveries);

  // Open inspection modal
  const handleOpenInspect = (del: Delivery) => {
    setInspectDelivery(del);
    setAcceptedQty(del.quantityValue);
    setRejectedQty(0);
    setQualityCheck('passed');
    setStaffName(activeIdentity?.name || 'Duty Staff');
    setReceiptNotes('');
  };

  // Submit Receipt Inspection
  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectDelivery || !activeIdentity) return;

    if (acceptedQty + rejectedQty <= 0) {
      setFeedback({ type: 'error', message: 'Accepted quantity must be greater than zero.' });
      return;
    }

    if (!staffName.trim()) {
      setFeedback({ type: 'error', message: 'Staff name is required for verification.' });
      return;
    }

    try {
      mockDb.confirmReceiptByShelter(
        inspectDelivery.id,
        Number(acceptedQty),
        Number(rejectedQty),
        qualityCheck,
        staffName,
        receiptNotes,
        activeIdentity
      );

      setInspectDelivery(null);
      setFeedback({
        type: 'success',
        message: `Delivery ${inspectDelivery.deliveryCode} verified! Accepted ${acceptedQty} ${inspectDelivery.quantityUnit}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error recording receipt.' });
    }
  };

  // Save Shelter Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelter || !activeIdentity) return;

    try {
      mockDb.updateShelterProfile(shelter.id, editProfile, activeIdentity);
      setFeedback({ type: 'success', message: 'Shelter capacity settings updated.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update settings.' });
    }
  };

  // Toggle Temporary Closure
  const handleToggleClosure = () => {
    if (!shelter || !activeIdentity) return;
    const newStatus = !shelter.isTemporarilyClosed;
    try {
      mockDb.updateShelterProfile(
        shelter.id,
        {
          isTemporarilyClosed: newStatus,
          closureReason: newStatus ? 'Intake capacity full / Maintenance' : undefined,
        },
        activeIdentity
      );
      setFeedback({
        type: 'success',
        message: newStatus ? 'Shelter intake paused.' : 'Shelter intake resumed.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  if (!shelter) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-stone-500 text-sm">
        Loading shelter details...
      </div>
    );
  }

  const incomingDeliveries = deliveries.filter(
    (d) =>
      d.status === 'ASSIGNED' ||
      d.status === 'ACKNOWLEDGED' ||
      d.status === 'PICKED_UP' ||
      d.status === 'IN_TRANSIT' ||
      d.status === 'BLOCKED' ||
      d.status === 'REDIRECT_PENDING'
  );

  const completedDeliveries = deliveries.filter(
    (d) => d.status === 'DELIVERED' || d.status === 'PARTIALLY_DELIVERED'
  );

  const openBeds = Math.max(0, shelter.totalBedCapacity - shelter.currentOccupants);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Score Strip */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700">
            <Building2 className="w-4 h-4" />
            <span>Shelter Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">{shelter.name}</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {shelter.address} · {shelter.phone}
          </p>
        </div>

        {/* Shelter Score Box */}
        <div className="flex items-center gap-4 bg-stone-50 border border-stone-200 rounded-lg p-3">
          <div className="text-center pr-3 border-r border-stone-200">
            <div className="text-[10px] uppercase font-bold text-stone-400">Shelter Score</div>
            <div className="text-2xl font-black text-purple-700 font-mono">
              {shelterScore.score}<span className="text-xs text-stone-400 font-normal">/100</span>
            </div>
            <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold bg-purple-100 text-purple-900 rounded">
              Verified Refuge
            </span>
          </div>
          <div className="space-y-1 text-xs">
            {shelterScore.subMetrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-stone-600">
                <span className="text-stone-500">{m.label}:</span>
                <span className="font-bold text-stone-900 font-mono">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleToggleClosure}
          className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 shrink-0 ${
            shelter.isTemporarilyClosed
              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              : 'bg-stone-100 text-stone-800 border-stone-200 hover:bg-stone-200'
          }`}
        >
          {shelter.isTemporarilyClosed ? (
            <>
              <PlayCircle className="w-4 h-4 text-red-600" />
              <span>Resume Intake</span>
            </>
          ) : (
            <>
              <PauseCircle className="w-4 h-4 text-amber-600" />
              <span>Pause Intake</span>
            </>
          )}
        </button>
      </div>

      {/* Paused Notice */}
      {shelter.isTemporarilyClosed && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
          <span>Intake is currently paused. Incoming couriers will be rerouted by dispatch.</span>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
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

      {/* Clean Capacity Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-stone-500">Bed Occupancy</span>
          <div className="text-2xl font-bold text-stone-900 mt-1 font-mono">
            {shelter.currentOccupants} / {shelter.totalBedCapacity}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium block mt-1">
            {openBeds} Open Beds Available
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-stone-500">Daily Meals Limit</span>
          <div className="text-2xl font-bold text-stone-900 mt-1 font-mono">
            {shelter.mealIntakeCapacity} meals
          </div>
          <span className="text-[11px] text-stone-500 font-medium block mt-1">
            {shelter.vegOnly ? 'Pure Veg Only' : 'Veg & Non-Veg'}
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-stone-500">Drinking Water</span>
          <div className="text-sm font-bold mt-2 flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Operational
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Potable source active</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <span className="text-xs text-stone-500">Cooking Fuel</span>
          <div className="text-sm font-bold mt-2 text-stone-900">
            {shelter.cookingFuelAvailable ? 'Ready (LPG / Gas)' : 'No Fuel'}
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Hours: {shelter.receivingHours}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-3.5 py-1.5 font-bold rounded-md transition-colors ${
            activeTab === 'incoming'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          Incoming Food ({incomingDeliveries.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-1.5 font-bold rounded-md transition-colors ${
            activeTab === 'history'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          Received History ({completedDeliveries.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-1.5 font-bold rounded-md transition-colors ${
            activeTab === 'settings'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          Shelter Settings
        </button>
      </div>

      {/* Tab 1: Incoming Deliveries */}
      {activeTab === 'incoming' && (
        <div className="space-y-3">
          {incomingDeliveries.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-10 text-center text-xs text-stone-500">
              No deliveries en route right now.
            </div>
          ) : (
            incomingDeliveries.map((del) => {
              const match = getDeliveryMatchScore(del);
              return (
                <div
                  key={del.id}
                  className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs hover:border-stone-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-stone-900">{del.deliveryCode}</span>
                      <span className="text-stone-300">·</span>
                      <StatusBadge status={del.status} size="sm" />
                      <span className="text-stone-300">·</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900">
                        Score {match.score}/100
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-stone-900">{del.batchTitle}</h4>

                    <div className="text-xs text-stone-600 flex flex-wrap items-center gap-3">
                      <span>
                        Quantity: <strong className="text-stone-900 font-mono">{del.quantityValue} {del.quantityUnit}</strong>
                      </span>
                      <span>·</span>
                      <span>From: {del.donorOrganization}</span>
                      <span>·</span>
                      <span>Rider: {del.riderName || 'Assigning...'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenInspect(del)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs"
                    >
                      Verify & Receive
                    </button>
                    <button
                      onClick={() => onViewAudit(del)}
                      className="px-3 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-lg"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Received History */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {completedDeliveries.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-10 text-center text-xs text-stone-500">
              No received delivery records yet.
            </div>
          ) : (
            completedDeliveries.map((del) => (
              <div
                key={del.id}
                className="bg-white border border-stone-200 rounded-lg p-4 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-900">{del.deliveryCode}</span>
                    <span className="text-stone-300">·</span>
                    <span className="font-bold text-stone-800">{del.batchTitle}</span>
                  </div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    Accepted {del.acceptedQuantity || del.quantityValue} {del.quantityUnit} · Received by {del.receivedByStaffName || 'Staff'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={del.status} size="sm" />
                  <button onClick={() => onViewAudit(del)} className="text-stone-600 hover:text-stone-900 underline">
                    History
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-stone-900">Shelter Capacity Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-stone-800 mb-1">Total Beds</label>
              <input
                type="number"
                value={editProfile.totalBedCapacity || ''}
                onChange={(e) => setEditProfile({ ...editProfile, totalBedCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-stone-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-800 mb-1">Current Occupants</label>
              <input
                type="number"
                value={editProfile.currentOccupants || ''}
                onChange={(e) => setEditProfile({ ...editProfile, currentOccupants: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-stone-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editProfile.coldStorageAvailable || false}
                onChange={(e) => setEditProfile({ ...editProfile, coldStorageAvailable: e.target.checked })}
                className="rounded text-purple-600 w-4 h-4"
              />
              <span>Has Cold Storage / Refrigerator</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editProfile.vegOnly || false}
                onChange={(e) => setEditProfile({ ...editProfile, vegOnly: e.target.checked })}
                className="rounded text-purple-600 w-4 h-4"
              />
              <span>Pure Veg Only</span>
            </label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-2xs"
          >
            Save Settings
          </button>
        </form>
      )}

      {/* Verify & Receive Modal */}
      {inspectDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-md w-full p-6 text-xs space-y-4">
            <h3 className="text-base font-bold text-stone-900">Verify & Receive Delivery</h3>
            <p className="text-stone-600">
              Delivery <span className="font-mono font-bold">{inspectDelivery.deliveryCode}</span> ({inspectDelivery.quantityValue} {inspectDelivery.quantityUnit})
            </p>
            <form onSubmit={handleSubmitReceipt} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-800 mb-1">Accepted Qty *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={acceptedQty}
                    onChange={(e) => setAcceptedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-800 mb-1">Rejected / Spoiled</label>
                  <input
                    type="number"
                    min="0"
                    value={rejectedQty}
                    onChange={(e) => setRejectedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-stone-800 mb-1">Staff Member Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectDelivery(null)}
                  className="px-3 py-1.5 border border-stone-300 rounded text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded"
                >
                  Confirm Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
