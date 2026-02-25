'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Car, Clock, CreditCard, AlertTriangle, TicketCheck, Sparkles, Settings } from 'lucide-react';

const NAV = [
  { href: '/dashboard',     icon: LayoutDashboard, label: 'לוח בקרה' },
  { href: '/lots',          icon: Building2,        label: 'חניונים' },
  { href: '/vehicles',      icon: Car,              label: 'כלי רכב' },
  { href: '/sessions',      icon: Clock,            label: 'חניות' },
  { href: '/payments',      icon: CreditCard,       label: 'תשלומים' },
  { href: '/violations',    icon: AlertTriangle,    label: 'הפרות' },
  { href: '/subscriptions', icon: TicketCheck,      label: 'מנויים' },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed right-0 top-0 h-full w-60 bg-[#0A0F1A] border-l border-[#1F2937] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1F2937]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">ParkingMS</p>
            <p className="text-gray-500 text-[10px]">חניה חכמה בעיר</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + '/');
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-600/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}

        {/* AI Console — special */}
        <div className="pt-3 mt-2 border-t border-[#1F2937]">
          <Link href="/ai-console"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              path === '/ai-console'
                ? 'bg-purple-600/15 text-purple-400 border border-purple-600/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            <Sparkles size={17} />
            קונסול AI
            <span className="mr-auto text-[9px] font-bold bg-purple-600/20 text-purple-400 px-1.5 py-0.5 rounded-full">AI</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1F2937]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">מ</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">מנהל</p>
            <p className="text-gray-500 text-[10px] truncate">admin@parkingms.co.il</p>
          </div>
          <Settings size={14} className="text-gray-600 cursor-pointer hover:text-gray-400" />
        </div>
      </div>
    </aside>
  );
}
