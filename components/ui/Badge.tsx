import { cn } from '@/lib/utils';

const PRESETS: Record<string, string> = {
  // payment status
  paid:         'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  unpaid:       'bg-red-500/10 text-red-400 border border-red-500/20',
  pending:      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  subscription: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  waived:       'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  // payment status
  completed:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  failed:       'bg-red-500/10 text-red-400 border border-red-500/20',
  refunded:     'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  // sensor
  active:       'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  faulty:       'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  offline:      'bg-red-500/10 text-red-400 border border-red-500/20',
  // lot type
  city:         'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  airport:      'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  mall:         'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  residential:  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  corporate:    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  hospital:     'bg-red-500/10 text-red-400 border border-red-500/20',
  stadium:      'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  // bool
  true:         'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  false:        'bg-gray-500/10 text-gray-400 border border-gray-500/20',
};

interface Props { label: string; preset?: string; className?: string; }
export default function Badge({ label, preset, className }: Props) {
  const key = preset ?? label.toLowerCase();
  return (
    <span className={cn('badge', PRESETS[key] ?? 'bg-gray-500/10 text-gray-400 border border-gray-500/20', className)}>
      {label}
    </span>
  );
}
