'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const METHOD_ICONS: Record<string, string> = {
  cash: '💵', credit_card: '💳', debit_card: '🏦', mobile_pay: '📱', corporate_account: '🏢', online: '🌐',
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'מזומן', credit_card: 'כרטיס אשראי', debit_card: 'כרטיס חיוב',
  mobile_pay: 'תשלום סלולרי', corporate_account: 'חשבון עסקי', online: 'אונליין',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'הושלם', pending: 'ממתין', failed: 'נכשל', refunded: 'הוחזר',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [method, setMethod]     = useState('');
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (method) p.set('method', method);
    if (status) p.set('status', status);
    const res = await fetch(`/api/payments?${p}`);
    const { data, total: t } = await res.json();
    setPayments(data ?? []);
    setTotal(t ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, method, status]);

  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="space-y-5">
      <Header title="תשלומים וחיובים" subtitle={`${total.toLocaleString()} עסקאות`}
        actions={<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-sm">
          <span className="text-gray-400">סה״כ בעמוד: </span>
          <span className="text-emerald-400 font-bold">{formatCurrency(totalRevenue)}</span>
        </div>} />

      <div className="flex gap-3">
        <select className="input-field max-w-[200px]" value={method} onChange={e => { setMethod(e.target.value); setPage(1); }}>
          <option value="">כל האמצעים</option>
          {Object.keys(METHOD_ICONS).map(m => <option key={m} value={m}>{METHOD_ICONS[m]} {METHOD_LABELS[m]}</option>)}
        </select>
        <select className="input-field max-w-[160px]" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">כל הסטטוסים</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1F2937]">
              {['עסקה', 'רכב', 'חניון', 'אמצעי תשלום', 'סכום', 'תאריך', 'סטטוס'].map(h => (
                <th key={h} className="px-4 py-3 text-right text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-16"><Spinner size={24} className="text-blue-400 mx-auto" /></td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="border-b border-[#1F2937] hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-gray-500 text-xs">{p.transaction_id ?? p.id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-blue-400 font-mono text-sm font-semibold">{p.session?.vehicle?.license_plate ?? '—'}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{p.session?.lot?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-gray-300 text-xs">
                    <span>{METHOD_ICONS[p.payment_method]}</span>
                    <span>{METHOD_LABELS[p.payment_method] ?? p.payment_method}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-white font-bold">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.payment_date, true)}</td>
                <td className="px-4 py-3"><Badge label={STATUS_LABELS[p.status] ?? p.status} preset={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && payments.length === 0 && <div className="text-center py-16 text-gray-600">לא נמצאו תשלומים</div>}
      </div>

      {total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">{total.toLocaleString()} תשלומים · עמוד {page}</p>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>→ הקודם</button>
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>הבא ←</button>
          </div>
        </div>
      )}
    </div>
  );
}
