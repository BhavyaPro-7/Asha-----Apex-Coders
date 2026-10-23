import React from 'react';
import { useAuthRole } from '../../context/AuthRoleContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { SupportedLanguage, RoleType } from '../../types';
import { mockDb, DEMO_IDENTITIES } from '../../data/mockDatabase';
import {
  Bell,
  Globe,
  Radio,
  LogOut,
  ChevronDown,
  User,
  Shield,
  Bike,
  Building2,
  Package,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenTestFlow: () => void;
  onOpenTestSuite: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenTestFlow,
  onOpenTestSuite,
}) => {
  const { activeRole, activeIdentity, selectRole, logout } = useAuthRole();
  const { language, setLanguage, t } = useTranslation();
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = React.useState(0);

  React.useEffect(() => {
    const updateCount = () => {
      const all = mockDb.getNotifications();
      if (!activeRole) {
        setUnreadNotifsCount(0);
        return;
      }
      const filtered = all.filter((n) => {
        if (activeRole === 'coordinator') return n.recipientRole === 'coordinator' && !n.read;
        if (!activeIdentity) return false;
        if (n.recipientRole !== activeRole) return false;
        if (n.recipientEntityId && n.recipientEntityId !== activeIdentity.associatedId) return false;
        return !n.read;
      });
      setUnreadNotifsCount(filtered.length);
    };

    updateCount();
    const unsub = mockDb.subscribe(updateCount);
    return unsub;
  }, [activeRole, activeIdentity]);

  const getRoleIcon = (role: RoleType | null) => {
    switch (role) {
      case 'donor':
        return <Package className="w-4 h-4 text-emerald-700" />;
      case 'rider':
        return <Bike className="w-4 h-4 text-blue-700" />;
      case 'shelter':
        return <Building2 className="w-4 h-4 text-purple-700" />;
      case 'coordinator':
        return <Shield className="w-4 h-4 text-stone-900" />;
      default:
        return <User className="w-4 h-4 text-stone-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, one line wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
            }}
            className="text-lg font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>AIDFLOW</span>
          </a>
          <span className="hidden lg:inline text-xs text-stone-400 font-mono">
            / CIVIC LOGISTICS
          </span>
        </div>

        {/* Zone 2: Single-line controls & active role context */}
        <div className="hidden md:flex items-center gap-4 text-xs text-stone-600 whitespace-nowrap shrink-0">
          {activeRole && activeIdentity && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-stone-100 rounded text-stone-800">
              {getRoleIcon(activeRole)}
              <span className="font-semibold text-stone-900">{t[activeRole]}</span>
              <span className="text-stone-400">·</span>
              <span className="text-stone-600 max-w-[180px] truncate">
                {activeIdentity.organization || activeIdentity.name}
              </span>
            </div>
          )}

          {/* Automated Test Suite Button */}
          <button
            onClick={onOpenTestSuite}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 hover:bg-stone-200 rounded transition-colors whitespace-nowrap"
            title="Runs all 10 integration and reliability scenarios"
          >
            <Layers className="w-3.5 h-3.5 text-stone-600" />
            <span>10 Integration Scenarios</span>
          </button>

          {/* Quick Guided Walkthrough */}
          <button
            onClick={onOpenTestFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 rounded hover:bg-emerald-100/80 transition-colors whitespace-nowrap"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
            <span>{t.quickTestFlow}</span>
          </button>
        </div>

        {/* Zone 3: Language Selector + Notifications + Role Switcher / Exit */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Selector: EN / HI / MR */}
          <div className="flex items-center border border-stone-200 rounded p-0.5 bg-stone-50">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                language === 'en'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                language === 'hi'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="हिंदी (Hindi)"
            >
              हिं
            </button>
            <button
              onClick={() => setLanguage('mr')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                language === 'mr'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="मराठी (Marathi)"
            >
              मरा
            </button>
          </div>

          {/* Notification Bell */}
          {activeRole && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-stone-600 hover:text-stone-900 rounded hover:bg-stone-100 transition-colors"
              aria-label={t.notifications}
              title={t.notifications}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
              )}
            </button>
          )}

          {/* Persona Switcher Dropdown */}
          {activeRole ? (
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors whitespace-nowrap"
              >
                <span>{t[activeRole]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {roleMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setRoleMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-stone-200 rounded-md shadow-lg py-1 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-stone-100 text-stone-500">
                      <span className="font-semibold block text-stone-800">
                        {t.switchRole}
                      </span>
                      <span>{t.demoModeNotice}</span>
                    </div>

                    {(['donor', 'rider', 'shelter', 'coordinator'] as RoleType[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          selectRole(r);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone-50 transition-colors ${
                          activeRole === r ? 'font-semibold text-emerald-800 bg-emerald-50/50' : 'text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getRoleIcon(r)}
                          <span>{t[r]}</span>
                        </div>
                        {activeRole === r && <span className="text-emerald-700">✓</span>}
                      </button>
                    ))}

                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setRoleMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.logout}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenTestSuite}
              className="px-3.5 py-1.5 text-xs font-medium bg-stone-900 text-white rounded hover:bg-stone-800 transition-colors whitespace-nowrap"
            >
              Run Test Suite
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
