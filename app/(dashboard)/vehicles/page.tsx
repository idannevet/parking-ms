'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Car, Building2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { Vehicle } from '@/types';
import { formatDate } from '@/lib/utils';

const EMPTY: Partial<Vehicle> = {
  license_plate:'', owner_name:'', vehicle_type:'car',
  make:'', model:'', color:'', is_corporate:false,
};

export default function VehiclesPage() {
  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [corpFilter, setCorpFilter] = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Partial<Vehicle>|null>(null);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page) });
    if (search)     p.set('search', search);
    if (typeFilter) p.set('type', typeFilter);
    if (corpFilter) p.set('corporate', corpFilter);
    const res = await fetch(`/api/vehicles?${p}`);
    const { data, total: t } = await res.json();
    setVehicles(data ?? []);
    setTotal(t ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, search, typeFilter, corpFilter]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url    = editing.id ? `/api/vehicles/${editing.id}` : '/api/vehicles';
      const res    = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(editing) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setShowModal(false); load();
    } catch (e:any) { alert(e.message); } finally { setSaving(false); }
  };

  const VTYPES = ['car','motorcycle','truck','ev','van','suv'];
  const typeIcons: Record<string, string> = { car:'🚗', motorcycle:'🏍️', truck:'🚛', ev:'⚡', van:'🚐', suv:'🚙' };

  return (
    <div className="space-y-5">
      <Header title="Vehicles" subtitle={`${total.toLocaleString()} registered`}
        actions={<button className="btn-primary flex items-center gap-2" onClick={()=>{setEditing({...EMPTY});setShowModal(true);}}><Plus size={15}/>Register Vehicle</button>} />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input-field pl-9 w-64" placeholder="Search plate or owner…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} />
        </div>
        <select className="input-field max-w-[140px]" value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1);}}>
          <option value="">All Types</option>
          {VTYPES.map(t=><option key={t} value={t}>{typeIcons[t]} {t}</option>)}
        </select>
        <select className="input-field max-w-[160px]" value={corpFilter} onChange={e=>{setCorpFilter(e.target.value);setPage(1);}}>
          <option value="">All Accounts</option>
          <option value="true">Corporate</option>
          <option value="false">Personal</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1F2937]">
              {['Plate','Owner','Type','Make / Model','Color','Year','Account','Registered'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-gray-500 text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16"><Spinner size={24} className="text-blue-400 mx-auto" /></td></tr>
            ) : vehicles.map(v=>(
              <tr key={v.id} className="border-b border-[#1F2937] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-mono text-blue-400 font-semibold text-sm">{v.license_plate}</td>
                <td className="px-4 py-3 text-white font-medium">{v.owner_name}</td>
                <td className="px-4 py-3"><span className="text-lg">{typeIcons[v.vehicle_type]??'🚗'}</span></td>
                <td className="px-4 py-3 text-gray-300">{v.make}{v.model ? ` ${v.model}` : ''}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-[#374151]" style={{ background: v.color?.toLowerCase() ?? '#6B7280' }} />
                    <span className="text-gray-400 text-xs">{v.color}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{v.year ?? '—'}</td>
                <td className="px-4 py-3">
                  {v.is_corporate
                    ? <div><Badge label="Corporate" preset="corporate" /><p className="text-gray-600 text-[10px] mt-0.5 truncate max-w-[100px]">{v.company_name}</p></div>
                    : <Badge label="Personal" preset="residential" />
                  }
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(v.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && vehicles.length === 0 && (
          <div className="text-center py-16 text-gray-600">No vehicles found</div>
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">{total.toLocaleString()} vehicles total · page {page}</p>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            <button className="btn-ghost text-sm py-1.5 px-3" disabled={page*50>=total} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title={editing?.id?'Edit Vehicle':'Register Vehicle'}>
        {editing && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">License Plate *</label>
                <input className="input-field font-mono" value={editing.license_plate??''} onChange={e=>setEditing({...editing,license_plate:e.target.value.toUpperCase()})} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type *</label>
                <select className="input-field" value={editing.vehicle_type??'car'} onChange={e=>setEditing({...editing,vehicle_type:e.target.value as any})}>
                  {VTYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Owner Name *</label>
                <input className="input-field" value={editing.owner_name??''} onChange={e=>setEditing({...editing,owner_name:e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Owner Email</label>
                <input type="email" className="input-field" value={editing.owner_email??''} onChange={e=>setEditing({...editing,owner_email:e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Owner Phone</label>
                <input className="input-field" value={editing.owner_phone??''} onChange={e=>setEditing({...editing,owner_phone:e.target.value})} />
              </div>
              <div><label className="text-xs text-gray-400 mb-1 block">Make</label><input className="input-field" value={editing.make??''} onChange={e=>setEditing({...editing,make:e.target.value})} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Model</label><input className="input-field" value={editing.model??''} onChange={e=>setEditing({...editing,model:e.target.value})} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Color</label><input className="input-field" value={editing.color??''} onChange={e=>setEditing({...editing,color:e.target.value})} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Year</label><input type="number" className="input-field" value={editing.year??''} onChange={e=>setEditing({...editing,year:+e.target.value})} /></div>
              <div className="col-span-2 flex items-center gap-3 p-3 bg-[#0C1220] rounded-lg">
                <input type="checkbox" id="corp" checked={!!editing.is_corporate} onChange={e=>setEditing({...editing,is_corporate:e.target.checked})} className="w-4 h-4 accent-blue-500" />
                <label htmlFor="corp" className="text-gray-300 text-sm">Corporate account</label>
              </div>
              {editing.is_corporate && (
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Company Name</label>
                  <input className="input-field" value={editing.company_name??''} onChange={e=>setEditing({...editing,company_name:e.target.value})} />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving?'Saving…':(editing.id?'Update':'Register')}</button>
              <button className="btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
