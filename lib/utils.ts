import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number | null | undefined, currency = '₪') {
  if (amount == null) return '—';
  return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDuration(minutes: number | null | undefined) {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(dateStr: string | null | undefined, includeTime = false) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (includeTime) {
    return d.toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const LOT_TYPE_COLORS: Record<string, string> = {
  city: '#3B82F6', airport: '#8B5CF6', mall: '#F59E0B',
  residential: '#10B981', corporate: '#06B6D4', hospital: '#EF4444', stadium: '#F97316',
};

export const LOT_TYPE_LABELS: Record<string, string> = {
  city: 'City', airport: 'Airport', mall: 'Mall',
  residential: 'Residential', corporate: 'Corporate', hospital: 'Hospital', stadium: 'Stadium',
};

export const SPOT_TYPE_COLORS: Record<string, string> = {
  regular: '#6B7280', disabled: '#3B82F6', ev: '#10B981',
  vip: '#F59E0B', reserved: '#8B5CF6', motorcycle: '#F97316',
};

export const STATUS_COLORS: Record<string, string> = {
  paid: '#10B981', unpaid: '#EF4444', pending: '#F59E0B',
  subscription: '#8B5CF6', waived: '#6B7280',
  completed: '#10B981', failed: '#EF4444', refunded: '#F59E0B',
};

export function occupancyColor(pct: number) {
  if (pct >= 90) return '#EF4444';
  if (pct >= 70) return '#F59E0B';
  return '#10B981';
}
