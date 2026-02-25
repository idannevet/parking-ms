'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props { data: { violation_type: string; count: number; total_fines: number }[] }

const COLORS = ['#EF4444','#F59E0B','#3B82F6','#8B5CF6','#10B981','#F97316','#06B6D4','#EC4899'];
const fmt = (s: string) => s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

export default function ViolationsDonut({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="40%" cy="50%" innerRadius={55} outerRadius={85}
          dataKey="count" nameKey="violation_type" paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.length ? (
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                <p className="text-gray-900 font-semibold">{fmt(payload[0].name as string)}</p>
                <p className="text-gray-400">{payload[0].value} violations</p>
                <p className="text-red-400">₪{Number(payload[0].payload.total_fines).toLocaleString()} fines</p>
              </div>
            ) : null
          }
        />
        <Legend
          layout="vertical" align="right" verticalAlign="middle"
          formatter={(value) => <span style={{color:'#6B7280',fontSize:10}}>{fmt(value)}</span>}
          iconSize={8} iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
