'use client';
import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { Violation } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const VIOLATION_LABELS: Record<string, string> = {
  overtime: 'חריגת זמן', no_permit: 'ללא היתר', disabled_zone: 'אזור נגישות',
  fire_lane: 'נתיב חירום', wrong_spot: 'מקום שגוי', expired_meter: 'מונה פג תוקף',
  double_parked: 'חנייה כפולה', unpaid_session: 'חנייה שלא שולמה',
};

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [paid, setPaid]             = useState('');
  const [type, setType]             = useState('');
  const [loading, setLoading]       = useState(true);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (paid !== '') p.set('paid', paid);
    if (type)        p.set('type', type);
    const res = await fetch(`/api/violations?${p}`);
    const { data, total: t } = await res.json();
    setViolations(data ?? []);
    setTotal(t ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, paid, type]);

  const markPaid = async (id: string) => {
    await fetch(`/api/violations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: true, paid_at: new Date().toISOString() }),
    });
    load();
  };

  const totalFines  = violations.reduce((s, v) => s + Number(v.fine_amount), 0);
  const unpaidFines = violations.filter(v => !v.paid).reduce((s, v) => s + Number(v.fine_amount), 0);

  return (
    <div className="space-y-5">
      <Header title="הפרות וקנסות" subtitle={`${total.toLocaleString()} הפרות רשומות`}
        actions={
          <div className="flex gap-3">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-gray-400">קנסות שלא שולמו: </span>
              <span className="text-red-400 font-bold">{formatCurrency(unpaidFines)}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-gray-400">סה״כ בעמוד: </span>
              <span className="text-emerald-400 font-bold">{formatCurrency(totalFines)}</span>
            </div>
          </div>
        }
      />

      <div className="flex gap-3">
        <select className="input-field max-w-[160px]" value={paid} onChange={e => { setPaid(e.target.value); setPage(1); }}>
          <option value="">כל הסטטוסים</option>
          <option value="false">לא שולם</option>
          <option value="true">שולם</option>
        </select>
        <select className="input-field max-w-[200px]" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
          <option value="">כל הסוגים</option>
          {Object.entries(VIOLATION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {['רכב', 'בעלים', 'חניון', 'הפרה', 'קנס', 'הונפק', 'תאריך פירעון', 'סטטוס', 'פעולה'].map(h => (
                <th key={h} className="px-4 py-3 text-right text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-16"><Spinner size={24} className="text-blue-400 mx-auto" /></td></tr>
            ) : violations.map(v => {
              const isOverdue = !v.paid && v.due_date && new Date(v.due_date) < new Date();
              return (
                <tr key={v.id} className={`border-b border-gray-200 hover:bg-gray-50 ${isOverdue ? 'bg-red-500/5' : ''}`}>
                  <td className="px-4 py-3 font-mono text-blue-400 text-sm font-semibold">{v.vehicle?.license_plate ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{v.vehicle?.owner_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{v.lot?.name ?? '—'}</td>
                  <td className="px-4 py-3"><span className="text-gray-200 text-xs">{VIOLATION_LABELS[v.violation_type] ?? v.violation_type}</span></td>
                  <td className="px-4 py-3 text-red-400 font-bold">{formatCurrency(v.fine_amount)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(v.issued_at)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={isOverdue ? 'text-red-400 font-medium' : v.due_date ? 'text-gray-400' : 'text-gray-600'}>
                      {v.due_date ? formatDate(v.due_date) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={v.paid ? 'שולם' : 'לא שולם'} preset={v.paid ? 'paid' : 'unpaid'} />
                  </td>
                  <td className="px-4 py-3">
                    {!v.paid && (
                      <button onClick={() => markPaid(v.id)} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                        <CheckCircle size={13} /> סמן כשולם
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && violations.length === 0 && <div className="text-center py-16 text-gray-600">לא נמצאו הפרות</div>}
      </div>

      {total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">{total.toLocaleString()} הפרות · עמוד {page}</p>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>→ הקודם</button>
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>הבא ←</button>
          </div>
        </div>
      )}
    </div>
  );
}
