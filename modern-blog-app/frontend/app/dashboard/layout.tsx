import { AdminSidebar } from '@/components/AdminSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="author">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.11),_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)] dark:bg-slate-950">
        <AdminSidebar />
        <main className="relative z-10 min-h-screen lg:ml-72">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
