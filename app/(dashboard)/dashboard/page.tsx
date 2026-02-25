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
          <p className="text-red-400 font-semibold mb-2">שגיאה בטעינת לוח הבקרה</p>
          <p className="text-gray-500 text-sm">בדוק את החיבור ל-Supabase והרץ את קבצי SQL.</p>
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
        title="לוח בקרה"
        subtitle="סקירת מערכת חניה חכמה"
        actions={
          <span className="text-gray-500 text-xs bg-gray-100 px-3 py-1.5 rounded-lg">
            {new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="חניונים פעילים"       value={stats.total_lots}        icon={Building2}    iconColor="text-blue-600"   iconBg="bg-blue-50"   subtitle={`${stats.total_spots.toLocaleString()} מקומות`} />
        <StatCard title="תפוסה"                value={`${occupancyPct}%`}      icon={ParkingSquare} iconColor="text-cyan-600"   iconBg="bg-cyan-50"   subtitle={`${stats.occupied_spots} / ${stats.total_spots} מקומות`} />
        <StatCard title="הכנסות היום"          value={formatCurrency(stats.revenue_today)}   icon={DollarSign} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="הכנסות חודשיות"       value={formatCurrency(stats.revenue_this_month)} icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-50" subtitle="החודש הנוכחי" />
        <StatCard title="סה״כ כלי רכב"         value={stats.total_vehicles.toLocaleString()} icon={Car}        iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard title="חניות פעילות"         value={stats.active_sessions}   icon={Activity}    iconColor="text-orange-600"  iconBg="bg-orange-50"  subtitle="חונים כרגע" />
        <StatCard title="הפרות שלא שולמו"      value={stats.unpaid_violations}  icon={AlertTriangle} iconColor="text-red-600"    iconBg="bg-red-50"     subtitle="דורשות טיפול" />
        <StatCard title="מנויים פעילים"        value={stats.active_subscriptions.toLocaleString()} icon={TicketCheck} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold text-sm">הכנסות — 30 ימים אחרונים</h3>
            <span className="text-emerald-400 text-xs font-semibold">{formatCurrency(stats.revenue_this_month)} החודש</span>
          </div>
          {stats.revenue_last_30_days?.length > 0
            ? <RevenueChart data={stats.revenue_last_30_days} />
            : <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">אין נתוני הכנסות — הרץ seed.sql</div>
          }
        </div>

        <div className="card p-5">
          <h3 className="text-gray-900 font-semibold text-sm mb-4">הכנסות לפי סוג חניון</h3>
          <div className="space-y-3">
            {(stats.revenue_by_lot_type ?? []).slice(0, 6).map((lt, i) => {
              const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#06B6D4', '#EF4444'];
              const max = stats.revenue_by_lot_type?.[0]?.revenue ?? 1;
              return (
                <div key={lt.lot_type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 capitalize">{lt.lot_type}</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(lt.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
          <h3 className="text-gray-900 font-semibold text-sm mb-4">תפוסת חניונים</h3>
          {stats.occupancy_by_lot?.length > 0
            ? <OccupancyChart data={stats.occupancy_by_lot} />
            : <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">אין נתונים</div>
          }
        </div>

        <div className="card p-5">
          <h3 className="text-gray-900 font-semibold text-sm mb-2">שעות עומס (30 ימים אחרונים)</h3>
          <p className="text-gray-500 text-xs mb-3">חניות לפי שעה — אדום = עומס שיא</p>
          {stats.peak_hours?.length > 0
            ? <PeakHoursChart data={stats.peak_hours} />
            : <div className="h-[140px] flex items-center justify-center text-gray-600 text-sm">אין נתונים</div>
          }
        </div>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-gray-900 font-semibold text-sm mb-4">פירוט הפרות</h3>
          {stats.violations_by_type?.length > 0
            ? <ViolationsDonut data={stats.violations_by_type} />
            : <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">אין נתוני הפרות</div>
          }
        </div>

        <div className="card p-5">
          <h3 className="text-gray-900 font-semibold text-sm mb-4">חניונים עם תפוסה גבוהה</h3>
          <div className="space-y-2">
            {(stats.occupancy_by_lot ?? []).slice(0, 8).map((lot) => (
              <div key={lot.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700 truncate">{lot.name}</span>
                    <span className="text-gray-500 flex-shrink-0 mr-2">{lot.occupied}/{lot.total_spots}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
