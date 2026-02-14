import { AdminSidebar } from '@/components/AdminSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage your blog posts, images, and users.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="author">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 min-h-screen bg-slate-50 dark:bg-slate-900">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
