'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { ParkingSession } from '@/types';
import { formatCurrency, formatDate, formatDuration } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  paid: 'שולם', unpaid: 'לא שולם', pending: 'ממתין', subscription: 'מנוי', waived: 'מחול',
};

const TYPE_LABELS: Record<string, string> = {
  regular: 'רגיל', subscription: 'מנוי', guest: 'אורח', vip: 'VIP',
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState('');
  const [active, setActive]     = useState('');
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (status) p.set('status', status);
    if (active) p.set('active', active);
    const res = await fetch(`/api/sessions?${p}`);
    const { data, total: t } = await res.json();
    setSessions(data ?? []);
    setTotal(t ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, status, active]);

  return (
    <div className="space-y-5">
      <Header title="חניות" subtitle={`${total.toLocaleString()} חניות בסה״כ`} />

      <div className="flex gap-3">
        <select className="input-field max-w-[180px]" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">כל הסטטוסים</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input-field max-w-[160px]" value={active} onChange={e => { setActive(e.target.value); setPage(1); }}>
          <option value="">כל החניות</option>
          <option value="true">פעיל (ללא יציאה)</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1F2937]">
              {['רכב', 'בעלים', 'חניון', 'כניסה', 'יציאה', 'משך', 'חיוב', 'סטטוס', 'סוג'].map(h => (
                <th key={h} className="px-4 py-3 text-right text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-16"><Spinner size={24} className="text-blue-400 mx-auto" /></td></tr>
            ) : sessions.map(s => (
              <tr key={s.id} className="border-b border-[#1F2937] hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-blue-400 text-sm font-semibold">{s.vehicle?.license_plate ?? '—'}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{s.vehicle?.owner_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{s.lot?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.entry_time, true)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {s.exit_time ? formatDate(s.exit_time, true) : <span className="text-green-400 font-medium">פעיל ●</span>}
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs">{formatDuration(s.duration_minutes)}</td>
                <td className="px-4 py-3 text-white font-semibold text-sm">{formatCurrency(s.total_charge)}</td>
                <td className="px-4 py-3"><Badge label={STATUS_LABELS[s.payment_status] ?? s.payment_status} preset={s.payment_status} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{TYPE_LABELS[s.session_type] ?? s.session_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && sessions.length === 0 && <div className="text-center py-16 text-gray-600">לא נמצאו חניות</div>}
      </div>

      {total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">{total.toLocaleString()} חניות · עמוד {page}</p>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>→ הקודם</button>
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>הבא ←</button>
          </div>
        </div>
      )}
    </div>
  );
}
