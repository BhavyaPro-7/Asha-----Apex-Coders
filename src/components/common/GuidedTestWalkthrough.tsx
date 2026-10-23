import React, { useState } from 'react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { mockDb, DEMO_IDENTITIES } from '../../data/mockDatabase';
import { Delivery, DeliveryStatus, RoleType } from '../../types';
import { StatusBadge } from './StatusBadge';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  X,
  UserCheck,
  PackagePlus,
  Bike,
  Building2,
  Radio,
} from 'lucide-react';

interface GuidedTestWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAudit?: (delivery: Delivery) => void;
}

export const GuidedTestWalkthrough: React.FC<GuidedTestWalkthroughProps> = ({
  isOpen,
  onClose,
  onViewAudit,
}) => {
  const { activeRole, selectRole } = useAuthRole();
  const { t } = useTranslation();
  const [createdDeliveryId, setCreatedDeliveryId] = useState<string | null>('del-101');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  if (!isOpen) return null;

  const currentDelivery = createdDeliveryId
    ? mockDb.getDeliveryById(createdDeliveryId)
    : undefined;

  const addLog = (msg: string) => {
    setLogMessages((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 8),
    ]);
  };

  // Step 1: Donor creates donation
  const handleStep1_CreateDonation = () => {
    selectRole('donor');
    const donorUser = DEMO_IDENTITIES.donor;
    const batch = mockDb.createBatch(
      {
        donorId: donorUser.associatedId,
        donorName: donorUser.name,
        donorOrganization: donorUser.organization || '',
        donorPhone: donorUser.phone,
        title: 'Emergency Lunch Relief Khichdi & Sabzi',
        category: 'cooked_meals',
        quantityValue: 150,
        quantityUnit: 'meals',
        prepTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        safeUseDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        storageCondition: 'hot_holding',
        pickupAddress: 'Annapurna Community Kitchen, Dadar West, Mumbai 400028',
        pickupLandmark: 'Loading Dock A',
        specialInstructions: 'Pure veg hot meals, 10 food-grade insulated canisters.',
        dietaryType: 'pure_veg',
      },
      donorUser
    );

    addLog(`Donor created batch: ${batch.batchCode} (${batch.title})`);
    setCurrentStep(1);
  };

  // Step 2: Coordinator assigns Rider Rajesh & Shelter Asha Sadan
  const handleStep2_AssignRiderAndShelter = () => {
    selectRole('coordinator');
    const coordUser = DEMO_IDENTITIES.coordinator;
    const batches = mockDb.getBatches();
    const availableBatch = batches.find((b) => b.status === 'AVAILABLE') || batches[0];

    try {
      const { delivery } = mockDb.allocateDelivery(
        availableBatch.id,
        'rider-01',
        'shelter-01',
        Math.min(availableBatch.remainingQuantity, 40),
        coordUser
      );
      setCreatedDeliveryId(delivery.id);
      addLog(`Coordinator assigned ${delivery.deliveryCode} to Rider Rajesh Kumar -> Asha Sadan Shelter`);
      setCurrentStep(2);
    } catch (err: any) {
      addLog(`Error assigning: ${err.message}`);
    }
  };

  // Step 3: Rider Rajesh acknowledges assignment
  const handleStep3_RiderAcknowledge = () => {
    selectRole('rider');
    const riderUser = DEMO_IDENTITIES.rider;
    const targetId = createdDeliveryId || 'del-101';
    try {
      mockDb.acknowledgeAssignment(targetId, riderUser);
      addLog(`Rider Rajesh Kumar acknowledged assignment`);
      setCurrentStep(3);
    } catch (err: any) {
      addLog(`Error acknowledging: ${err.message}`);
    }
  };

  // Step 4: Rider Rajesh confirms pickup
  const handleStep4_RiderPickup = () => {
    selectRole('rider');
    const riderUser = DEMO_IDENTITIES.rider;
    const targetId = createdDeliveryId || 'del-101';
    try {
      mockDb.confirmPickup(
        targetId,
        'Collected from Annapurna Kitchen staff. Temp: 68°C. Seals verified.',
        riderUser
      );
      addLog(`Rider confirmed pickup -> status automatically transitioned to IN_TRANSIT`);
      setCurrentStep(4);
    } catch (err: any) {
      addLog(`Error confirming pickup: ${err.message}`);
    }
  };

  // Step 5: Shelter confirms receipt and records inspection
  const handleStep5_ShelterReceipt = () => {
    selectRole('shelter');
    const shelterUser = DEMO_IDENTITIES.shelter;
    const targetId = createdDeliveryId || 'del-101';
    const del = mockDb.getDeliveryById(targetId);
    const qty = del ? del.quantityValue : 120;

    try {
      mockDb.confirmReceiptByShelter(
        targetId,
        qty,
        0,
        'passed',
        'Dr. Suresh Patil',
        'All containers received hot, seal intact. Verified by Shelter intake superintendent.',
        shelterUser
      );
      addLog(`Shelter Dr. Suresh Patil accepted ${qty} units. Status DELIVERED!`);
      setCurrentStep(5);
    } catch (err: any) {
      addLog(`Error confirming receipt: ${err.message}`);
    }
  };

  const handleResetData = () => {
    mockDb.resetToDefaults();
    setCreatedDeliveryId('del-101');
    setCurrentStep(0);
    addLog('Reset database to clean seed state.');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-3xl bg-white border border-stone-200 shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="text-base font-semibold text-stone-900">
                {t.testFlowTitle}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">{t.testFlowDesc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-200/60"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Current Target Delivery Info */}
          {currentDelivery && (
            <div className="bg-stone-50 border border-stone-200 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-stone-800">
                  {currentDelivery.deliveryCode}
                </span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-700 font-medium">{currentDelivery.batchTitle}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-stone-500">
                  {currentDelivery.quantityValue} {currentDelivery.quantityUnit}
                </span>
                <StatusBadge status={currentDelivery.status} size="sm" />
                {onViewAudit && (
                  <button
                    onClick={() => {
                      onViewAudit(currentDelivery);
                    }}
                    className="text-xs text-emerald-800 hover:underline font-medium"
                  >
                    View Audit Logs
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stepper Cards */}
          <div className="space-y-3">
            {/* Step 1 */}
            <div
              className={`p-4 border rounded-md transition-all ${
                currentStep >= 1 ? 'border-emerald-200 bg-emerald-50/20' : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep >= 1
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {currentStep >= 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <PackagePlus className="w-4 h-4 text-stone-500" />
                      <span>Step 1: Donor Publishes Aid Batch</span>
                    </h4>
                    <p className="text-xs text-stone-600 mt-1">
                      Annapurna Community Kitchen publishes surplus cooked khichdi batch with safe-use deadline.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStep1_CreateDonation}
                  className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors shrink-0"
                >
                  Simulate Step 1
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className={`p-4 border rounded-md transition-all ${
                currentStep >= 2 ? 'border-emerald-200 bg-emerald-50/20' : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep >= 2
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {currentStep >= 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-stone-500" />
                      <span>Step 2: Coordinator Assigns Rider & Shelter</span>
                    </h4>
                    <p className="text-xs text-stone-600 mt-1">
                      Central Dispatch allocates Rider Rajesh Kumar (#R-102) and sets destination to Asha Sadan Shelter.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStep2_AssignRiderAndShelter}
                  className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors shrink-0"
                >
                  Simulate Step 2
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className={`p-4 border rounded-md transition-all ${
                currentStep >= 3 ? 'border-emerald-200 bg-emerald-50/20' : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep >= 3
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {currentStep >= 3 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <Bike className="w-4 h-4 text-stone-500" />
                      <span>Step 3: Rider Rajesh Acknowledges Task</span>
                    </h4>
                    <p className="text-xs text-stone-600 mt-1">
                      Rider receives assignment alert on phone, acknowledges route and commits to safe pickup window.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStep3_RiderAcknowledge}
                  className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors shrink-0"
                >
                  Simulate Step 3
                </button>
              </div>
            </div>

            {/* Step 4 */}
            <div
              className={`p-4 border rounded-md transition-all ${
                currentStep >= 4 ? 'border-emerald-200 bg-emerald-50/20' : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep >= 4
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {currentStep >= 4 ? <CheckCircle2 className="w-4 h-4" /> : '4'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <Bike className="w-4 h-4 text-stone-500" />
                      <span>Step 4: Rider Confirms Pickup & En Route</span>
                    </h4>
                    <p className="text-xs text-stone-600 mt-1">
                      Courier inspects canisters, confirms temperature holding, marks collected, status becomes IN_TRANSIT.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStep4_RiderPickup}
                  className="px-3 py-1.5 text-xs font-medium bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors shrink-0"
                >
                  Simulate Step 4
                </button>
              </div>
            </div>

            {/* Step 5 */}
            <div
              className={`p-4 border rounded-md transition-all ${
                currentStep >= 5 ? 'border-emerald-200 bg-emerald-50/20' : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep >= 5
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {currentStep >= 5 ? <CheckCircle2 className="w-4 h-4" /> : '5'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-stone-500" />
                      <span>Step 5: Shelter Confirms Receipt & Inspection</span>
                    </h4>
                    <p className="text-xs text-stone-600 mt-1">
                      Asha Sadan Superintendent inspects shipment, confirms count, and logs verified intake into records.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleStep5_ShelterReceipt}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-700 text-white rounded hover:bg-emerald-800 transition-colors shrink-0"
                >
                  Simulate Step 5
                </button>
              </div>
            </div>
          </div>

          {/* Quick Switch to Role view buttons */}
          <div className="border-t border-stone-200 pt-4">
            <h4 className="text-xs font-semibold uppercase text-stone-500 mb-2">
              Verify Role Isolation: Switch to Persona
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['donor', 'rider', 'shelter', 'coordinator'] as RoleType[]).map((r) => (
                <button
                  key={r}
                  onClick={() => selectRole(r)}
                  className={`px-3 py-2 text-xs font-medium rounded border transition-colors ${
                    activeRole === r
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {t[r]} View {activeRole === r && '✓'}
                </button>
              ))}
            </div>
          </div>

          {/* Live Action Logs */}
          {logMessages.length > 0 && (
            <div className="border-t border-stone-200 pt-4">
              <h4 className="text-xs font-semibold uppercase text-stone-500 mb-2">
                Simulation Execution Log
              </h4>
              <div className="bg-stone-900 text-stone-100 p-3 rounded font-mono text-[11px] space-y-1">
                {logMessages.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetDemoData}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-800 bg-white border border-stone-300 rounded hover:bg-stone-100 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
