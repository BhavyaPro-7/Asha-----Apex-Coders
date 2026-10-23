import React, { useState } from 'react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { RoleType } from '../../types';
import { DEMO_IDENTITIES } from '../../data/mockDatabase';
import { RoleRegistrationModal } from '../common/RoleRegistrationModal';
import {
  Package,
  Bike,
  Building2,
  ShieldCheck,
  ArrowRight,
  HeartHandshake,
  UserPlus,
  Sparkles,
} from 'lucide-react';

interface RoleSelectionLandingProps {
  onOpenTestFlow: () => void;
}

export const RoleSelectionLanding: React.FC<RoleSelectionLandingProps> = ({
  onOpenTestFlow,
}) => {
  const { selectRole } = useAuthRole();
  const { t } = useTranslation();
  const [showRegModal, setShowRegModal] = useState(false);
  const [regDefaultRole, setRegDefaultRole] = useState<'shelter' | 'rider' | 'coordinator'>('shelter');

  const openRegister = (role: 'shelter' | 'rider' | 'coordinator', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRegDefaultRole(role);
    setShowRegModal(true);
  };

  const roleCards: {
    role: RoleType;
    title: string;
    description: string;
    demoUser: string;
    organization: string;
    icon: React.ReactNode;
    colorClasses: string;
    tagline: string;
    quickActionText?: string;
  }[] = [
    {
      role: 'donor',
      title: t.donor,
      description: 'Donate surplus hot meals, dry grains, and essential supplies.',
      tagline: 'Kitchens & Caterers',
      demoUser: DEMO_IDENTITIES.donor.name,
      organization: DEMO_IDENTITIES.donor.organization || 'Annapurna Kitchen',
      icon: <Package className="w-6 h-6 text-emerald-700" />,
      colorClasses: 'border-emerald-200 hover:border-emerald-600 bg-white',
    },
    {
      role: 'rider',
      title: t.rider,
      description: 'Accept nearby food pickups, deliver with thermal care, and map your route.',
      tagline: 'Volunteer Couriers',
      demoUser: DEMO_IDENTITIES.rider.name,
      organization: DEMO_IDENTITIES.rider.organization || 'Volunteer Fleet',
      icon: <Bike className="w-6 h-6 text-blue-700" />,
      colorClasses: 'border-blue-200 hover:border-blue-600 bg-white',
    },
    {
      role: 'shelter',
      title: t.shelter,
      description: 'Receive fresh meals, publish bed availability, and log verified intake.',
      tagline: 'Refuges & Night Shelters',
      demoUser: DEMO_IDENTITIES.shelter.name,
      organization: DEMO_IDENTITIES.shelter.organization || 'Asha Sadan Shelter',
      icon: <Building2 className="w-6 h-6 text-purple-700" />,
      colorClasses: 'border-purple-200 hover:border-purple-600 bg-white',
    },
    {
      role: 'coordinator',
      title: t.coordinator,
      description: 'Coordinate live city dispatch, assign riders, and monitor active routes.',
      tagline: 'Central Dispatch Team',
      demoUser: DEMO_IDENTITIES.coordinator.name,
      organization: DEMO_IDENTITIES.coordinator.organization || 'Dispatch Command',
      icon: <ShieldCheck className="w-6 h-6 text-stone-800" />,
      colorClasses: 'border-stone-300 hover:border-stone-800 bg-white',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-8 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-medium mb-3">
          <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
          <span>Surplus Food & Essential Aid Network</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          AIDFLOW
        </h1>
        <p className="mt-2 text-sm text-stone-600 max-w-xl mx-auto">
          {t.appTagline}. Simple, fast redistribution for communities in need.
        </p>

        {/* Cross-role Registration Banner */}
        <div className="mt-5 p-3 bg-stone-50 border border-stone-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-700">
            <UserPlus className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">Need food for a shelter, or want to deliver?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openRegister('shelter')}
              className="px-2.5 py-1 text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded font-semibold transition-colors"
            >
              + Register Shelter
            </button>
            <button
              onClick={() => openRegister('rider')}
              className="px-2.5 py-1 text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded font-semibold transition-colors"
            >
              + Register Rider
            </button>
            <button
              onClick={() => openRegister('coordinator')}
              className="px-2.5 py-1 text-stone-800 bg-stone-200 hover:bg-stone-300 rounded font-semibold transition-colors"
            >
              + Coordinator
            </button>
          </div>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {roleCards.map((card) => (
          <div
            key={card.role}
            onClick={() => selectRole(card.role)}
            className={`border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between group ${card.colorClasses}`}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                  {card.icon}
                </div>
                <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
                  {card.tagline}
                </span>
              </div>

              <h2 className="text-lg font-bold text-stone-900">{card.title}</h2>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {card.description}
              </p>

              {/* Demo Account Preview */}
              <div className="mt-4 p-2.5 bg-stone-50 rounded-lg text-xs flex items-center justify-between border border-stone-100">
                <span className="text-stone-500">Account:</span>
                <span className="font-semibold text-stone-900">{card.demoUser} ({card.organization.split(',')[0]})</span>
              </div>

              {/* Special options for Donor card: Direct Register as Shelter, Rider, or Coordinator */}
              {card.role === 'donor' && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <div className="text-[11px] font-semibold text-stone-500 mb-1.5">
                    Not a donor? Register your organization:
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={(e) => openRegister('shelter', e)}
                      className="py-1 px-2 text-center bg-purple-50 text-purple-700 hover:bg-purple-100 rounded font-medium border border-purple-100"
                    >
                      As Shelter
                    </button>
                    <button
                      type="button"
                      onClick={(e) => openRegister('rider', e)}
                      className="py-1 px-2 text-center bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-medium border border-blue-100"
                    >
                      As Rider
                    </button>
                    <button
                      type="button"
                      onClick={(e) => openRegister('coordinator', e)}
                      className="py-1 px-2 text-center bg-stone-100 text-stone-700 hover:bg-stone-200 rounded font-medium"
                    >
                      As Dispatch
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Launch Button */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
              <span>Open {card.title} Console</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Test Demo Flow Footer */}
      <div className="bg-stone-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          <div className="font-bold text-white text-sm">Want to test the full delivery flow?</div>
          <p className="text-stone-400 text-xs mt-0.5">
            Test how Donor posts food → Coordinator dispatches → Rider accepts & delivers → Shelter confirms.
          </p>
        </div>
        <button
          onClick={onOpenTestFlow}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          {t.quickTestFlow} →
        </button>
      </div>

      {/* Role Registration Modal */}
      <RoleRegistrationModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        defaultRole={regDefaultRole}
      />
    </div>
  );
};
