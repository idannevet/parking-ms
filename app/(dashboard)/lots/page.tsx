'use client';
import { useEffect, useState } from 'react';
import { Plus, MapPin, Clock, Car, DollarSign, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { ParkingLot } from '@/types';
import { formatCurrency, LOT_TYPE_COLORS, LOT_TYPE_LABELS, occupancyColor } from '@/lib/utils';
import toast from 'react-hot-toast';

type LotWithStats = ParkingLot & { occupied_spots: number; spot_count: number };

const EMPTY: Partial<ParkingLot> = {
  name: '', location: '', city: 'תל אביב', lot_type: 'city',
  total_spots: 100, hourly_rate: 8, daily_rate: 55, monthly_rate: 650,
  opening_time: '06:00', closing_time: '23:00', is_active: true,
};

export default function LotsPage() {
  const [lots, setLots] = useState<LotWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Partial<ParkingLot> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    const res = await fetch(`/api/lots?${params}`);
    const data = await res.json();
    setLots(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [typeFilter]);

  const filtered = lots.filter(l =>
    !filter || l.name.toLowerCase().includes(filter.toLowerCase()) || l.city.toLowerCase().includes(filter.toLowerCase())
  );

  const openCreate = () => { setEditing({ ...EMPTY }); setShowModal(true); };
  const openEdit   = (l: LotWithStats) => { setEditing({ ...l }); setShowModal(true); };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const method = editing.id ? 'PUT' : 'POST';
      const url    = editing.id ? `/api/lots/${editing.id}` : '/api/lots';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setShowModal(false);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את החניון?')) return;
    await fetch(`/api/lots/${id}`, { method: 'DELETE' });
    load();
  };

  const handleToggle = async (lot: LotWithStats) => {
    await fetch(`/api/lots/${lot.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !lot.is_active }) });
    load();
  };

  return (
    <div className="space-y-5">
      <Header title="חניונים" subtitle={`${lots.length} חניונים מנוהלים`}
        actions={<button className="btn-primary flex items-center gap-2" onClick={openCreate}><Plus size={15} />הוסף חניון</button>} />

      {/* Filters */}
      <div className="flex gap-3">
        <input className="input-field max-w-xs" placeholder="חפש שם או עיר…" value={filter} onChange={e => setFilter(e.target.value)} />
        <select className="input-field max-w-xs" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">כל הסוגים</option>
          {['city', 'airport', 'mall', 'residential', 'corporate', 'hospital', 'stadium'].map(t => (
            <option key={t} value={t}>{LOT_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} className="text-blue-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(lot => {
            const occ = lot.spot_count > 0 ? Math.round((lot.occupied_spots / lot.spot_count) * 100) : 0;
            return (
              <div key={lot.id} className="card-hover p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: LOT_TYPE_COLORS[lot.lot_type] }} />
                      <h3 className="text-white font-semibold text-sm truncate">{lot.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <MapPin size={11} />
                      <span className="truncate">{lot.city} · {lot.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mr-2">
                    <Badge label={LOT_TYPE_LABELS[lot.lot_type] ?? lot.lot_type} preset={lot.lot_type} />
                    {!lot.is_active && <Badge label="לא פעיל" preset="unpaid" />}
                  </div>
                </div>

                {/* Occupancy bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">תפוסה</span>
                    <span className="font-medium" style={{ color: occupancyColor(occ) }}>{occ}%</span>
                  </div>
                  <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${occ}%`, background: occupancyColor(occ) }} />
                  </div>
                  <p className="text-gray-600 text-[10px] mt-1">{lot.occupied_spots} / {lot.spot_count} מקומות תפוסים</p>
                </div>

                {/* Rates */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'שעתי', value: formatCurrency(lot.hourly_rate) },
                    { label: 'יומי',  value: formatCurrency(lot.daily_rate) },
                    { label: 'חודשי', value: formatCurrency(lot.monthly_rate) },
                  ].map(r => (
                    <div key={r.label} className="bg-[#0C1220] rounded-lg p-2 text-center">
                      <p className="text-gray-600 text-[10px]">{r.label}</p>
                      <p className="text-white text-xs font-semibold">{r.value}</p>
                    </div>
                  ))}
                </div>

                {/* Hours & actions */}
                <div className="flex items-center justify-between pt-1 border-t border-[#1F2937]">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Clock size={11} />
                    <span>{lot.opening_time} – {lot.closing_time}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleToggle(lot)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                      {lot.is_active ? <ToggleRight size={15} className="text-emerald-400" /> : <ToggleLeft size={15} />}
                    </button>
                    <button onClick={() => openEdit(lot)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(lot.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing?.id ? 'ערוך חניון' : 'הוסף חניון'} width="max-w-xl">
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">שם חניון *</label>
                <input className="input-field" value={editing.name ?? ''} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">עיר *</label>
                <input className="input-field" value={editing.city ?? ''} onChange={e => setEditing({ ...editing, city: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">סוג *</label>
                <select className="input-field" value={editing.lot_type ?? 'city'} onChange={e => setEditing({ ...editing, lot_type: e.target.value as any })}>
                  {Object.entries(LOT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">כתובת</label>
                <input className="input-field" value={editing.location ?? ''} onChange={e => setEditing({ ...editing, location: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">סה״כ מקומות</label>
                <input type="number" className="input-field" value={editing.total_spots ?? 0} onChange={e => setEditing({ ...editing, total_spots: +e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">תעריף שעתי (₪)</label>
                <input type="number" step="0.5" className="input-field" value={editing.hourly_rate ?? 0} onChange={e => setEditing({ ...editing, hourly_rate: +e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">תעריף יומי (₪)</label>
                <input type="number" step="1" className="input-field" value={editing.daily_rate ?? 0} onChange={e => setEditing({ ...editing, daily_rate: +e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">תעריף חודשי (₪)</label>
                <input type="number" step="10" className="input-field" value={editing.monthly_rate ?? 0} onChange={e => setEditing({ ...editing, monthly_rate: +e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">שעת פתיחה</label>
                <input type="time" className="input-field" value={editing.opening_time ?? '06:00'} onChange={e => setEditing({ ...editing, opening_time: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">שעת סגירה</label>
                <input type="time" className="input-field" value={editing.closing_time ?? '23:00'} onChange={e => setEditing({ ...editing, closing_time: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'שומר…' : (editing.id ? 'עדכן חניון' : 'צור חניון')}
              </button>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>ביטול</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
