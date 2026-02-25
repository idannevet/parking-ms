import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0C1220] flex">
      <Sidebar />
      <main className="flex-1 mr-60 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
