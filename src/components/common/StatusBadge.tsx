import React from 'react';
import { DeliveryStatus } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

interface StatusBadgeProps {
  status: DeliveryStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { t } = useTranslation();

  // Color & icon mapping adhering to Zero-Pill anti-slop rules
  // Clean typography with subtle indicator icon, no heavy capsule borders
  let colorStyles = 'text-stone-600 bg-stone-100';
  let IconComponent = Clock;

  switch (status) {
    case 'AVAILABLE':
      colorStyles = 'text-sky-700 bg-sky-50';
      IconComponent = Package;
      break;
    case 'RESERVED':
      colorStyles = 'text-indigo-700 bg-indigo-50';
      IconComponent = Clock;
      break;
    case 'ASSIGNED':
      colorStyles = 'text-blue-700 bg-blue-50';
      IconComponent = Clock;
      break;
    case 'ACKNOWLEDGED':
      colorStyles = 'text-teal-700 bg-teal-50';
      IconComponent = CheckCircle2;
      break;
    case 'PICKED_UP':
      colorStyles = 'text-emerald-700 bg-emerald-50';
      IconComponent = Package;
      break;
    case 'IN_TRANSIT':
      colorStyles = 'text-amber-700 bg-amber-50';
      IconComponent = Truck;
      break;
    case 'DELIVERED':
      colorStyles = 'text-emerald-800 bg-emerald-100/70 font-semibold';
      IconComponent = CheckCircle2;
      break;
    case 'PARTIALLY_DELIVERED':
      colorStyles = 'text-amber-800 bg-amber-100/70';
      IconComponent = AlertTriangle;
      break;
    case 'BLOCKED':
      colorStyles = 'text-red-700 bg-red-50 font-semibold';
      IconComponent = ShieldAlert;
      break;
    case 'REDIRECT_PENDING':
      colorStyles = 'text-purple-700 bg-purple-50';
      IconComponent = RotateCcw;
      break;
    case 'CANCELLED':
      colorStyles = 'text-stone-500 bg-stone-100 line-through';
      IconComponent = XCircle;
      break;
    case 'RESERVATION_EXPIRED':
    case 'FAILED':
      colorStyles = 'text-red-700 bg-red-100';
      IconComponent = XCircle;
      break;
    default:
      IconComponent = HelpCircle;
  }

  const textLabel = t[status] || status;
  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-2 py-0.5 gap-1.5'
      : size === 'lg'
      ? 'text-sm px-3 py-1 gap-2'
      : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-sm font-medium whitespace-nowrap tracking-tight ${sizeClasses} ${colorStyles}`}
    >
      <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{textLabel}</span>
    </span>
  );
};
