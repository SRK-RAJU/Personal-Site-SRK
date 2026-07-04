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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.11),_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)] dark:bg-slate-950 lg:pl-72">
        <AdminSidebar />
        <main className="min-h-screen">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
