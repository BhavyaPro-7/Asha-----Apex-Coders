import React, { useState, useEffect } from 'react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { mockDb } from '../../data/mockDatabase';
import {
  AidBatch,
  Delivery,
  AidCategory,
  StorageCondition,
  DeliveryStatus,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { getDonorScore, getDeliveryMatchScore } from '../../data/scoringSystem';
import { RoleRegistrationModal } from '../common/RoleRegistrationModal';
import {
  Package,
  PlusCircle,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bike,
  Sparkles,
  ArrowRight,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';

interface DonorDashboardProps {
  onViewAudit: (delivery: Delivery) => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({ onViewAudit }) => {
  const { activeIdentity } = useAuthRole();
  const { t } = useTranslation();

  const [batches, setBatches] = useState<AidBatch[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regDefaultRole, setRegDefaultRole] = useState<'shelter' | 'rider' | 'coordinator'>('shelter');
  const [cancelModalBatch, setCancelModalBatch] = useState<AidBatch | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'in_transit' | 'completed' | 'cancelled'>('all');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const defaultPrepTime = new Date().toISOString().slice(0, 16);
  const defaultDeadline = new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    title: '',
    category: 'cooked_meals' as AidCategory,
    quantityValue: 50,
    quantityUnit: 'meals',
    prepTime: defaultPrepTime,
    safeUseDeadline: defaultDeadline,
    storageCondition: 'hot_holding' as StorageCondition,
    pickupAddress: 'Annapurna Community Kitchen, Senapati Bapat Marg, Dadar West, Mumbai 400028',
    pickupLandmark: 'Gate #2, Kitchen Loading Bay',
    specialInstructions: 'Packed fresh in food-grade thermal containers.',
    dietaryType: 'pure_veg' as 'pure_veg' | 'non_veg' | 'universal' | 'halal',
  });

  const loadData = () => {
    if (!activeIdentity) return;
    const allBatches = mockDb.getBatches().filter((b) => b.donorId === activeIdentity.associatedId);
    setBatches(allBatches);
    const allDeliveries = mockDb.getDeliveries().filter((d) => d.donorId === activeIdentity.associatedId);
    setDeliveries(allDeliveries);
  };

  useEffect(() => {
    loadData();
    const unsub = mockDb.subscribe(loadData);
    return unsub;
  }, [activeIdentity]);

  const donorScore = getDonorScore(batches, deliveries);

  // Handle Create Form Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIdentity) return;

    if (!formData.title.trim()) {
      setActionFeedback({ type: 'error', message: 'Please enter a food title.' });
      return;
    }

    if (new Date(formData.safeUseDeadline) <= new Date(formData.prepTime)) {
      setActionFeedback({
        type: 'error',
        message: 'Safe-use deadline must be later than preparation time.',
      });
      return;
    }

    try {
      const created = mockDb.createBatch(
        {
          ...formData,
          prepTime: new Date(formData.prepTime).toISOString(),
          safeUseDeadline: new Date(formData.safeUseDeadline).toISOString(),
          donorId: activeIdentity.associatedId,
          donorName: activeIdentity.name,
          donorOrganization: activeIdentity.organization || 'Community Kitchen',
          donorPhone: activeIdentity.phone,
        },
        activeIdentity
      );

      setShowCreateModal(false);
      setActionFeedback({
        type: 'success',
        message: `Food batch ${created.batchCode} posted successfully! Volunteer riders have been notified.`,
      });
      setFormData((prev) => ({ ...prev, title: '' }));
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to post food.' });
    }
  };

  // Handle Cancel
  const handleConfirmCancel = () => {
    if (!cancelModalBatch || !activeIdentity) return;
    if (!cancelReason.trim()) {
      setActionFeedback({ type: 'error', message: 'Please provide a reason to cancel.' });
      return;
    }

    try {
      mockDb.cancelBatchByDonor(cancelModalBatch.id, cancelReason, activeIdentity);
      setCancelModalBatch(null);
      setCancelReason('');
      setActionFeedback({
        type: 'success',
        message: `Batch ${cancelModalBatch.batchCode} has been cancelled.`,
      });
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to cancel batch.' });
    }
  };

  // Filter batches
  const filteredBatches = batches.filter((b) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return b.status === 'AVAILABLE' || b.status === 'RESERVED' || b.status === 'ASSIGNED';
    if (activeTab === 'in_transit') return b.status === 'PICKED_UP' || b.status === 'IN_TRANSIT';
    if (activeTab === 'completed') return b.status === 'DELIVERED' || b.status === 'PARTIALLY_DELIVERED';
    if (activeTab === 'cancelled') return b.status === 'CANCELLED' || b.status === 'FAILED';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Cross-Role Onboarding Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-950 font-medium">
          <UserPlus className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Need food for a shelter, or want to deliver meals as a rider?</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRegDefaultRole('shelter');
              setShowRegModal(true);
            }}
            className="px-2.5 py-1 text-purple-800 bg-white border border-purple-200 hover:bg-purple-50 rounded font-semibold transition-colors"
          >
            + Register Shelter
          </button>
          <button
            onClick={() => {
              setRegDefaultRole('rider');
              setShowRegModal(true);
            }}
            className="px-2.5 py-1 text-blue-800 bg-white border border-blue-200 hover:bg-blue-50 rounded font-semibold transition-colors"
          >
            + Register Rider
          </button>
          <button
            onClick={() => {
              setRegDefaultRole('coordinator');
              setShowRegModal(true);
            }}
            className="px-2.5 py-1 text-stone-800 bg-white border border-stone-300 hover:bg-stone-50 rounded font-semibold transition-colors"
          >
            + Coordinator
          </button>
        </div>
      </div>

      {/* Donor Header & Score Strip */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <Package className="w-4 h-4" />
            <span>Donor Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">
            {activeIdentity?.organization || activeIdentity?.name}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Pickup Point: {activeIdentity?.phone}
          </p>
        </div>

        {/* Donor Impact Score Box */}
        <div className="flex items-center gap-4 bg-stone-50 border border-stone-200 rounded-lg p-3">
          <div className="text-center pr-3 border-r border-stone-200">
            <div className="text-[10px] uppercase font-bold text-stone-400">Impact Score</div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {donorScore.score}<span className="text-xs text-stone-400 font-normal">/100</span>
            </div>
            <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-900 rounded">
              {donorScore.grade} Tier
            </span>
          </div>
          <div className="space-y-1 text-xs">
            {donorScore.subMetrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-stone-600">
                <span className="text-stone-500">{m.label}:</span>
                <span className="font-bold text-stone-900 font-mono">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setActionFeedback(null);
            setShowCreateModal(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Food</span>
        </button>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-stone-400 hover:text-stone-700 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Simple Status Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          All ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
            activeTab === 'active'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab('in_transit')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
            activeTab === 'in_transit'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          On The Way
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
            activeTab === 'completed'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          Delivered
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
            activeTab === 'cancelled'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:text-stone-900 bg-stone-100'
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Batches List */}
      <div className="space-y-4">
        {filteredBatches.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-xl p-10 text-center">
            <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-stone-700">No Food Batches</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Post fresh surplus meals to connect with nearby volunteer couriers and shelters.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs"
            >
              Post Food
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredBatches.map((batch) => {
              const isCancellable =
                batch.status === 'AVAILABLE' ||
                batch.status === 'RESERVED' ||
                batch.status === 'ASSIGNED';
              const safeUseDate = new Date(batch.safeUseDeadline);
              const match = getDeliveryMatchScore(batch);

              return (
                <div
                  key={batch.id}
                  className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs hover:border-stone-300 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-stone-900">{batch.batchCode}</span>
                        <span className="text-stone-300">·</span>
                        <span className="text-stone-600">{t[batch.category] || batch.category}</span>
                        <span className="text-stone-300">·</span>
                        <StatusBadge status={batch.status} size="sm" />
                        <span className="text-stone-300">·</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900">
                          Score {match.score}/100
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-stone-900">{batch.title}</h3>

                      {/* Clean Inventory Numbers */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-stone-50 border border-stone-100 rounded-lg p-2.5 text-xs">
                        <div>
                          <span className="text-[10px] text-stone-400 block font-medium">Total</span>
                          <span className="font-mono font-bold text-stone-900">
                            {batch.quantityValue} {batch.quantityUnit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block font-medium">Assigned</span>
                          <span className="font-mono font-bold text-blue-700">
                            {batch.allocatedQuantity} {batch.quantityUnit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block font-medium">Delivered</span>
                          <span className="font-mono font-bold text-emerald-700">
                            {batch.deliveredQuantity} {batch.quantityUnit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block font-medium">Available</span>
                          <span className="font-mono font-bold text-stone-800">
                            {batch.remainingQuantity} {batch.quantityUnit}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                        <div>
                          <span className="text-stone-400">Storage:</span>{' '}
                          <span className="font-medium text-stone-800">{t[batch.storageCondition] || batch.storageCondition}</span>
                        </div>
                        <div>
                          <span className="text-stone-400">Expires:</span>{' '}
                          <span className="font-mono font-medium text-stone-800">
                            {safeUseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Active courier legs */}
                      {deliveries.filter((d) => batch.linkedDeliveryIds.includes(d.id)).length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {deliveries
                            .filter((d) => batch.linkedDeliveryIds.includes(d.id))
                            .map((leg) => (
                              <div
                                key={leg.id}
                                className="p-2 bg-stone-50 border border-stone-200 rounded-md text-xs flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Bike className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                  <span className="font-mono font-bold text-stone-800">{leg.deliveryCode}</span>
                                  <span>({leg.quantityValue} {leg.quantityUnit})</span>
                                  <span>→</span>
                                  <span className="text-stone-700">{leg.shelterName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={leg.status} size="sm" />
                                  <button
                                    onClick={() => onViewAudit(leg)}
                                    className="text-[11px] text-stone-500 hover:text-stone-900 underline"
                                  >
                                    History
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center md:items-end flex-col gap-2 shrink-0">
                      {isCancellable && (
                        <button
                          onClick={() => {
                            setCancelModalBatch(batch);
                            setCancelReason('');
                          }}
                          className="px-3 py-1.5 text-xs text-red-700 hover:text-red-900 hover:bg-red-50 border border-red-200 rounded font-semibold transition-colors"
                        >
                          Cancel Batch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Food Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">Post Surplus Food</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Food Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon Dal Khichdi & Sabzi"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AidCategory })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="cooked_meals">Cooked Meals</option>
                    <option value="dry_rations">Dry Grains & Rice</option>
                    <option value="fresh_produce">Fresh Fruits & Veg</option>
                    <option value="packaged_food">Packaged Food</option>
                    <option value="baby_essentials">Baby Essentials</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Food Type</label>
                  <select
                    value={formData.dietaryType}
                    onChange={(e) => setFormData({ ...formData, dietaryType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="pure_veg">Pure Vegetarian</option>
                    <option value="non_veg">Non-Vegetarian</option>
                    <option value="universal">Universal / Packaged</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantityValue}
                    onChange={(e) => setFormData({ ...formData, quantityValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Unit</label>
                  <select
                    value={formData.quantityUnit}
                    onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="meals">meals</option>
                    <option value="kg">kg</option>
                    <option value="boxes">boxes</option>
                    <option value="packets">packets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Storage</label>
                  <select
                    value={formData.storageCondition}
                    onChange={(e) => setFormData({ ...formData, storageCondition: e.target.value as StorageCondition })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="hot_holding">Keep Hot (&gt;60°C)</option>
                    <option value="cold_refrigerated">Keep Cold (&lt;5°C)</option>
                    <option value="ambient">Room Temp</option>
                    <option value="dry_ventilated">Keep Dry</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Expires In (Deadline) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.safeUseDeadline}
                    onChange={(e) => setFormData({ ...formData, safeUseDeadline: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Pickup Address</label>
                <input
                  type="text"
                  required
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-md text-stone-700 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-md shadow-2xs"
                >
                  Post Food Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-md w-full p-6 text-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900">Cancel Food Batch</h3>
            <p className="text-stone-600">
              Are you sure you want to cancel batch <span className="font-mono font-bold">{cancelModalBatch.batchCode}</span>?
            </p>
            <div>
              <label className="block font-medium text-stone-800 mb-1">Reason for cancellation *</label>
              <textarea
                required
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Consumed on-site or kitchen closed"
                className="w-full px-3 py-2 border border-stone-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBatch(null)}
                className="px-3 py-1.5 border border-stone-300 rounded text-stone-700 hover:bg-stone-50 font-medium"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Role Registration Modal */}
      <RoleRegistrationModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        defaultRole={regDefaultRole}
      />
    </div>
  );
};
