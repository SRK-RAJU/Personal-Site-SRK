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
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[rgb(var(--accent-rgb))] border-t-transparent"></div>
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
