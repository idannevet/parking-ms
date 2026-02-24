import { Building2, Car, DollarSign, Activity, AlertTriangle, TicketCheck, ParkingSquare, Users } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Header from '@/components/layout/Header';
import RevenueChart from '@/components/dashboard/RevenueChart';
import OccupancyChart from '@/components/dashboard/OccupancyChart';
import PeakHoursChart from '@/components/dashboard/PeakHoursChart';
import ViolationsDonut from '@/components/dashboard/ViolationsDonut';
import { DashboardStats } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase';

async function getStats(): Promise<DashboardStats | null> {
  const { data, error } = await supabaseAdmin.rpc('get_dashboard_stats');
  if (error) { console.error(error); return null; }
  return data as DashboardStats;
}

export const revalidate = 60;

export default async function DashboardPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-2">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm">Check your Supabase connection and run the schema + seed SQL.</p>
        </div>
      </div>
    );
  }

  const occupancyPct = stats.total_spots > 0
    ? Math.round((stats.occupied_spots / stats.total_spots) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Header
        title="Dashboard"
        subtitle="Smart city parking overview"
        actions={
          <span className="text-gray-500 text-xs bg-[#1F2937] px-3 py-1.5 rounded-lg">
            {new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </span>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Active Lots"       value={stats.total_lots}        icon={Building2}    iconColor="text-blue-400"   iconBg="bg-blue-500/10"   subtitle={`${stats.total_spots.toLocaleString()} total spots`} />
        <StatCard title="Occupancy Rate"    value={`${occupancyPct}%`}      icon={ParkingSquare} iconColor="text-cyan-400"   iconBg="bg-cyan-500/10"   subtitle={`${stats.occupied_spots} / ${stats.total_spots} spots`} />
        <StatCard title="Today's Revenue"   value={formatCurrency(stats.revenue_today)}   icon={DollarSign} iconColor="text-emerald-400" iconBg="bg-emerald-500/10" />
        <StatCard title="Monthly Revenue"   value={formatCurrency(stats.revenue_this_month)} icon={DollarSign} iconColor="text-green-400" iconBg="bg-green-500/10"  subtitle="This calendar month" />
        <StatCard title="Total Vehicles"    value={stats.total_vehicles.toLocaleString()} icon={Car}        iconColor="text-purple-400" iconBg="bg-purple-500/10" />
        <StatCard title="Active Sessions"   value={stats.active_sessions}   icon={Activity}    iconColor="text-orange-400"  iconBg="bg-orange-500/10"  subtitle="Currently parked" />
        <StatCard title="Unpaid Violations" value={stats.unpaid_violations}  icon={AlertTriangle} iconColor="text-red-400"    iconBg="bg-red-500/10"     subtitle="Require attention" />
        <StatCard title="Active Subscriptions" value={stats.active_subscriptions.toLocaleString()} icon={TicketCheck} iconColor="text-amber-400" iconBg="bg-amber-500/10" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Revenue — Last 30 Days</h3>
            <span className="text-emerald-400 text-xs font-semibold">{formatCurrency(stats.revenue_this_month)} this month</span>
          </div>
          {stats.revenue_last_30_days?.length > 0
            ? <RevenueChart data={stats.revenue_last_30_days} />
            : <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">No revenue data yet — run seed.sql</div>
          }
        </div>

        <div className="card p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Revenue by Lot Type</h3>
          <div className="space-y-3">
            {(stats.revenue_by_lot_type ?? []).slice(0,6).map((lt, i) => {
              const colors = ['#3B82F6','#8B5CF6','#F59E0B','#10B981','#06B6D4','#EF4444'];
              const max = stats.revenue_by_lot_type?.[0]?.revenue ?? 1;
              return (
                <div key={lt.lot_type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 capitalize">{lt.lot_type}</span>
                    <span className="text-white font-medium">{formatCurrency(lt.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(lt.revenue / max) * 100}%`, background: colors[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Lot Occupancy</h3>
          {stats.occupancy_by_lot?.length > 0
            ? <OccupancyChart data={stats.occupancy_by_lot} />
            : <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">No data</div>
          }
        </div>

        <div className="card p-5">
          <h3 className="text-white font-semibold text-sm mb-2">Peak Hours (last 30 days)</h3>
          <p className="text-gray-500 text-xs mb-3">Sessions by hour of day — red = peak traffic</p>
          {stats.peak_hours?.length > 0
            ? <PeakHoursChart data={stats.peak_hours} />
            : <div className="h-[140px] flex items-center justify-center text-gray-600 text-sm">No data</div>
          }
        </div>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Violations Breakdown</h3>
          {stats.violations_by_type?.length > 0
            ? <ViolationsDonut data={stats.violations_by_type} />
            : <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">No violations data</div>
          }
        </div>

        <div className="card p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Top Lots by Occupancy</h3>
          <div className="space-y-2">
            {(stats.occupancy_by_lot ?? []).slice(0, 8).map((lot) => (
              <div key={lot.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300 truncate">{lot.name}</span>
                    <span className="text-gray-500 flex-shrink-0 ml-2">{lot.occupied}/{lot.total_spots}</span>
                  </div>
                  <div className="h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${lot.pct}%`,
                      background: lot.pct >= 90 ? '#EF4444' : lot.pct >= 70 ? '#F59E0B' : '#10B981'
                    }} />
                  </div>
                </div>
                <span className="text-xs font-semibold flex-shrink-0" style={{ color: lot.pct >= 90 ? '#EF4444' : lot.pct >= 70 ? '#F59E0B' : '#10B981' }}>
                  {lot.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
