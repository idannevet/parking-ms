'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { ParkingSession } from '@/types';
import { formatCurrency, formatDate, formatDuration } from '@/lib/utils';

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
      <Header title="Parking Sessions" subtitle={`${total.toLocaleString()} sessions total`} />

      <div className="flex gap-3">
        <select className="input-field max-w-[180px]" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}>
          <option value="">All Statuses</option>
          {['paid','unpaid','pending','subscription','waived'].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input-field max-w-[160px]" value={active} onChange={e=>{setActive(e.target.value);setPage(1);}}>
          <option value="">All Sessions</option>
          <option value="true">Active (no exit)</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1F2937]">
              {['Vehicle','Owner','Lot','Entry','Exit','Duration','Charge','Status','Type'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-16"><Spinner size={24} className="text-blue-400 mx-auto" /></td></tr>
            ) : sessions.map(s=>(
              <tr key={s.id} className="border-b border-[#1F2937] hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-blue-400 text-sm font-semibold">{s.vehicle?.license_plate??'—'}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{s.vehicle?.owner_name??'—'}</td>
                <td className="px-4 py-3 text-gray-300 text-xs">{s.lot?.name??'—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(s.entry_time, true)}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {s.exit_time ? formatDate(s.exit_time, true) : <span className="text-green-400 font-medium">Active ●</span>}
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs">{formatDuration(s.duration_minutes)}</td>
                <td className="px-4 py-3 text-white font-semibold text-sm">{formatCurrency(s.total_charge)}</td>
                <td className="px-4 py-3"><Badge label={s.payment_status} preset={s.payment_status} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs capitalize">{s.session_type}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && sessions.length === 0 && <div className="text-center py-16 text-gray-600">No sessions found</div>}
      </div>

      {total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">{total.toLocaleString()} sessions · page {page}</p>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page*50>=total} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
