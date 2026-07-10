import { AdminSidebar } from '@/components/AdminSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="dashboard-shell">
        <AdminSidebar />
        <main className="relative z-10 min-h-screen lg:ml-72">
          <div className="dashboard-main">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
