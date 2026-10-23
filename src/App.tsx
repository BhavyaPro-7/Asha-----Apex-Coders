/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthRoleProvider, useAuthRole } from './context/AuthRoleContext';
import { Header } from './components/common/Header';
import { OfflineStatusBar } from './components/common/OfflineStatusBar';
import { RoleSelectionLanding } from './components/landing/RoleSelectionLanding';
import { DonorDashboard } from './components/donor/DonorDashboard';
import { RiderDashboard } from './components/rider/RiderDashboard';
import { ShelterDashboard } from './components/shelter/ShelterDashboard';
import { CoordinatorDashboard } from './components/coordinator/CoordinatorDashboard';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { GuidedTestWalkthrough } from './components/common/GuidedTestWalkthrough';
import { AutomatedTestSuiteModal } from './components/common/AutomatedTestSuiteModal';
import { AuditHistoryModal } from './components/common/AuditHistoryModal';
import { Delivery } from './types';
import { ShieldAlert } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeRole, activeIdentity, logout } = useAuthRole();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isTestFlowOpen, setIsTestFlowOpen] = useState(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);
  const [auditDelivery, setAuditDelivery] = useState<Delivery | null>(null);

  const handleViewAudit = (delivery: Delivery) => {
    setAuditDelivery(delivery);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900">
      {/* Offline Connectivity & Outage Banner */}
      <OfflineStatusBar />

      {/* Top Bar Header */}
      <Header
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenTestFlow={() => setIsTestFlowOpen(true)}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
      />

      {/* Main View Area with Mandatory Role Isolation & Route Guards */}
      <main className="flex-1">
        {activeRole === null && (
          <RoleSelectionLanding onOpenTestFlow={() => setIsTestFlowOpen(true)} />
        )}

        {activeRole === 'donor' && (
          <DonorDashboard onViewAudit={handleViewAudit} />
        )}

        {activeRole === 'rider' && (
          <RiderDashboard onViewAudit={handleViewAudit} />
        )}

        {activeRole === 'shelter' && (
          <ShelterDashboard onViewAudit={handleViewAudit} />
        )}

        {activeRole === 'coordinator' && (
          <CoordinatorDashboard onViewAudit={handleViewAudit} />
        )}

        {/* Rogue / Invalid State Guard */}
        {activeRole &&
          activeRole !== 'donor' &&
          activeRole !== 'rider' &&
          activeRole !== 'shelter' &&
          activeRole !== 'coordinator' && (
            <div className="max-w-md mx-auto my-16 p-6 bg-white border border-red-200 rounded-lg text-center shadow-xs">
              <ShieldAlert className="w-10 h-10 text-red-600 mx-auto mb-3" />
              <h2 className="text-base font-bold text-stone-900">Unauthorized Access Violation</h2>
              <p className="text-xs text-stone-600 mt-1">
                Your credentials do not grant access to this role interface.
              </p>
              <button
                onClick={logout}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded hover:bg-stone-800"
              >
                Return to Persona Selection
              </button>
            </div>
          )}
      </main>

      {/* Reusable Modals & Drawers */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onSelectDelivery={(delId) => {
          // Can inspect
        }}
      />

      <GuidedTestWalkthrough
        isOpen={isTestFlowOpen}
        onClose={() => setIsTestFlowOpen(false)}
        onViewAudit={handleViewAudit}
      />

      <AutomatedTestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
      />

      <AuditHistoryModal
        delivery={auditDelivery}
        onClose={() => setAuditDelivery(null)}
      />

      {/* Clean Civic Tech Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">AIDFLOW Civic Network</span>
            <span>·</span>
            <span>Surplus Redistribution & Shelter Logistics</span>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            <span>Mumbai Metropolitan Cluster</span>
            <span>·</span>
            <span>Capacity-Aware Allocation & Safety Scoring Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthRoleProvider>
        <MainAppContent />
      </AuthRoleProvider>
    </LanguageProvider>
  );
}
