'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate } from '@/lib/utils';

interface Props { data: { date: string; revenue: number }[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-blue-400 font-semibold">₪{Number(payload[0].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data }: Props) {
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    revenue: Number(d.revenue),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₪${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: '#3B82F6' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
