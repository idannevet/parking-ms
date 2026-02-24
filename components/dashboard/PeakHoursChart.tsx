'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props { data: { hour: number; sessions: number }[] }

export default function PeakHoursChart({ data }: Props) {
  const maxSessions = Math.max(...data.map(d => d.sessions), 1);
  const chartData = Array.from({ length: 24 }, (_, h) => {
    const found = data.find(d => d.hour === h);
    return { hour: h, sessions: found?.sessions ?? 0 };
  });
  const fmt = (h: number) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barSize={10}>
        <XAxis dataKey="hour" tick={{ fill: '#6B7280', fontSize: 9 }} axisLine={false} tickLine={false}
          tickFormatter={h => [0,6,12,18,23].includes(h) ? fmt(h) : ''} />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="bg-[#1F2937] border border-[#374151] rounded-lg px-3 py-2 text-xs">
                <p className="text-white font-semibold">{fmt(payload[0].payload.hour)}</p>
                <p className="text-blue-400">{payload[0].value} sessions</p>
              </div>
            ) : null
          }
        />
        <Bar dataKey="sessions" radius={[2, 2, 0, 0]}>
          {chartData.map((d, i) => {
            const intensity = d.sessions / maxSessions;
            const color = intensity > 0.75 ? '#EF4444' : intensity > 0.5 ? '#F59E0B' : intensity > 0.25 ? '#3B82F6' : '#1F2937';
            return <Cell key={i} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
