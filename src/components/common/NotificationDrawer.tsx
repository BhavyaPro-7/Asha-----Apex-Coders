import React from 'react';
import { InAppNotification } from '../../types';
import { useAuthRole } from '../../context/AuthRoleContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { mockDb } from '../../data/mockDatabase';
import { X, CheckCheck, Bell, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDelivery?: (deliveryId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectDelivery,
}) => {
  const { activeRole, activeIdentity } = useAuthRole();
  const { t } = useTranslation();
  const [notifications, setNotifications] = React.useState<InAppNotification[]>(() =>
    mockDb.getNotifications()
  );

  React.useEffect(() => {
    const unsub = mockDb.subscribe(() => {
      setNotifications(mockDb.getNotifications());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  // Filter notifications strictly for this active role and persona
  const roleNotifs = notifications.filter((n) => {
    if (activeRole === 'coordinator') return n.recipientRole === 'coordinator';
    if (!activeIdentity) return false;
    if (n.recipientRole !== activeRole) return false;
    // Check specific entity targeting
    if (n.recipientEntityId && n.recipientEntityId !== activeIdentity.associatedId) {
      return false;
    }
    return true;
  });

  const unreadCount = roleNotifs.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    if (activeRole) {
      mockDb.markAllNotificationsAsRead(activeRole, activeIdentity?.associatedId);
    }
  };

  const handleItemClick = (notif: InAppNotification) => {
    mockDb.markNotificationAsRead(notif.id);
    if (notif.deliveryId && onSelectDelivery) {
      onSelectDelivery(notif.deliveryId);
      onClose();
    }
  };

  const renderIcon = (severity: InAppNotification['severity']) => {
    switch (severity) {
      case 'alert':
        return <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-600 shrink-0" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-stone-900/30 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md bg-white border-l border-stone-200 shadow-2xl h-full flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-stone-700" />
            <h3 className="text-sm font-semibold text-stone-900">{t.notifications}</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t.markAllRead}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-200/50"
              aria-label={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {roleNotifs.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">
              No notifications for your role at this time.
            </div>
          ) : (
            roleNotifs.map((notif) => {
              const timeString = new Date(notif.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-stone-50 ${
                    !notif.read ? 'bg-amber-50/30' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {renderIcon(notif.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs ${
                            !notif.read ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'
                          } truncate`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-[11px] text-stone-400 font-mono tabular-nums shrink-0">
                          {timeString}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">{notif.message}</p>
                      {notif.deliveryCode && (
                        <div className="mt-2 text-[11px] font-mono text-emerald-700">
                          {notif.deliveryCode} · Click to inspect
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 text-[11px] text-stone-500 text-center">
          In-app notifications strictly filtered for {activeRole?.toUpperCase()} persona.
        </div>
      </div>
    </div>
  );
};
