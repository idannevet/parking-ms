'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { occupancyColor } from '@/lib/utils';

interface Props { data: { name: string; total_spots: number; occupied: number; pct: number }[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-900 text-xs font-semibold mb-1 truncate max-w-[160px]">{label}</p>
        <p className="text-gray-400 text-xs">{d.occupied} / {d.total_spots} spots</p>
        <p className="font-bold" style={{ color: occupancyColor(d.pct) }}>{d.pct}% occupied</p>
      </div>
    );
  }
  return null;
};

export default function OccupancyChart({ data }: Props) {
  const chartData = data.slice(0, 8).map(d => ({
    ...d,
    name: d.name.length > 14 ? d.name.slice(0, 14) + '…' : d.name,
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 9 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
          {chartData.map((d, i) => <Cell key={i} fill={occupancyColor(d.pct)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
