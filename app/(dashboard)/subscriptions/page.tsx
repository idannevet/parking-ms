'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { Subscription } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const TYPE_ICONS: Record<string, string> = {
  monthly: '📅', yearly: '🗓️', corporate: '🏢', daily_pass: '🎫', student: '🎓',
};

const TYPE_LABELS: Record<string, string> = {
  monthly: 'חודשי', yearly: 'שנתי', corporate: 'עסקי', daily_pass: 'כרטיס יומי', student: 'סטודנט',
};

export default function SubscriptionsPage() {
  const [subs, setSubs]       = useState<Subscription[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [active, setActive]   = useState('');
  const [type, setType]       = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (active) p.set('active', active);
    if (type)   p.set('type', type);
    const res = await fetch(`/api/subscriptions?${p}`);
    const { data, total: t } = await res.json();
    setSubs(data ?? []);
    setTotal(t ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, active, type]);

  const totalMrr = subs.filter(s => s.is_active && s.subscription_type === 'monthly').reduce((acc, s) => acc + Number(s.price), 0);

  return (
    <div className="space-y-5">
      <Header title="מנויים" subtitle={`${total.toLocaleString()} מנויים`}
        actions={
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-gray-400">MRR חודשי: </span>
            <span className="text-purple-400 font-bold">{formatCurrency(totalMrr)}</span>
          </div>
        }
      />

      <div className="flex gap-3">
        <select className="input-field max-w-[160px]" value={active} onChange={e => { setActive(e.target.value); setPage(1); }}>
          <option value="">הכל</option>
          <option value="true">פעיל</option>
          <option value="false">פג תוקף</option>
        </select>
        <select className="input-field max-w-[180px]" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
          <option value="">כל הסוגים</option>
          {Object.keys(TYPE_ICONS).map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1F2937]">
              {['רכב', 'בעלים', 'חניון', 'סוג', 'מחיר', 'התחלה', 'סיום', 'חידוש אוטומטי', 'סטטוס'].map(h => (
                <th key={h} className="px-4 py-3 text-right text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-16"><Spinner size={24} className="text-blue-400 mx-auto" /></td></tr>
            ) : subs.map(s => {
              const daysLeft = s.end_date ? Math.ceil((new Date(s.end_date).getTime() - Date.now()) / 86400000) : 0;
              const expiringSoon = s.is_active && daysLeft > 0 && daysLeft <= 14;
              return (
                <tr key={s.id} className={`border-b border-[#1F2937] hover:bg-white/[0.02] ${expiringSoon ? 'bg-yellow-500/5' : ''}`}>
                  <td className="px-4 py-3 font-mono text-blue-400 text-sm font-semibold">{s.vehicle?.license_plate ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    <p>{s.vehicle?.owner_name ?? '—'}</p>
                    {s.vehicle?.is_corporate && <p className="text-gray-600 text-[10px]">{s.vehicle?.company_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{s.lot?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-300 text-sm">
                      {TYPE_ICONS[s.subscription_type]} <span className="text-xs">{TYPE_LABELS[s.subscription_type] ?? s.subscription_type}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">{formatCurrency(s.price)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.start_date)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={expiringSoon ? 'text-yellow-400 font-medium' : 'text-gray-400'}>{formatDate(s.end_date)}</span>
                    {expiringSoon && <p className="text-yellow-600 text-[10px]">{daysLeft} ימים נותרו</p>}
                  </td>
                  <td className="px-4 py-3 text-center"><span className={s.auto_renew ? 'text-emerald-400' : 'text-gray-600'}>{s.auto_renew ? '✓' : '—'}</span></td>
                  <td className="px-4 py-3"><Badge label={s.is_active ? 'פעיל' : 'פג תוקף'} preset={s.is_active ? 'paid' : 'unpaid'} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && subs.length === 0 && <div className="text-center py-16 text-gray-600">לא נמצאו מנויים</div>}
      </div>

      {total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">{total.toLocaleString()} מנויים · עמוד {page}</p>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>→ הקודם</button>
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>הבא ←</button>
          </div>
        </div>
      )}
    </div>
  );
}
