'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'author' | 'user';
}

export function ProtectedRoute({
  children,
  requiredRole = 'user',
}: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Role checking
    const roleHierarchy: { [key: string]: number } = {
      admin: 3,
      author: 2,
      user: 1,
    };

    const userRoleValue = roleHierarchy[userRole || 'user'] || 1;
    const requiredRoleValue = roleHierarchy[requiredRole] || 1;

    if (userRoleValue < requiredRoleValue) {
      router.push('/unauthorized');
      return;
    }
  }, [user, loading, userRole, requiredRole, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
