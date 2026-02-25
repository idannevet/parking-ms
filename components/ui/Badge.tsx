import { cn } from '@/lib/utils';

const PRESETS: Record<string, string> = {
  // payment status
  paid:         'bg-emerald-50 text-emerald-700 border border-emerald-200',
  unpaid:       'bg-red-50 text-red-700 border border-red-200',
  pending:      'bg-yellow-50 text-yellow-700 border border-yellow-200',
  subscription: 'bg-purple-50 text-purple-700 border border-purple-200',
  waived:       'bg-gray-100 text-gray-600 border border-gray-200',
  // payment status
  completed:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  failed:       'bg-red-50 text-red-700 border border-red-200',
  refunded:     'bg-orange-50 text-orange-700 border border-orange-200',
  // sensor
  active:       'bg-emerald-50 text-emerald-700 border border-emerald-200',
  faulty:       'bg-yellow-50 text-yellow-700 border border-yellow-200',
  offline:      'bg-red-50 text-red-700 border border-red-200',
  // lot type
  city:         'bg-blue-50 text-blue-700 border border-blue-200',
  airport:      'bg-purple-50 text-purple-700 border border-purple-200',
  mall:         'bg-amber-50 text-amber-700 border border-amber-200',
  residential:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  corporate:    'bg-cyan-50 text-cyan-700 border border-cyan-200',
  hospital:     'bg-red-50 text-red-700 border border-red-200',
  stadium:      'bg-orange-50 text-orange-700 border border-orange-200',
  // bool
  true:         'bg-emerald-50 text-emerald-700 border border-emerald-200',
  false:        'bg-gray-100 text-gray-600 border border-gray-200',
};

interface Props { label: string; preset?: string; className?: string; }
export default function Badge({ label, preset, className }: Props) {
  const key = preset ?? label.toLowerCase();
  return (
    <span className={cn('badge', PRESETS[key] ?? 'bg-gray-100 text-gray-600 border border-gray-200', className)}>
      {label}
    </span>
  );
}
