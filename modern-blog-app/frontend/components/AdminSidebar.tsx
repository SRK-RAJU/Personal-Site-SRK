'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import {
  FaHome,
  FaBook,
  FaImage,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from 'react-icons/fa';

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, userRole } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <FaHome />,
      roles: ['admin', 'author'],
    },
    {
      label: 'Posts',
      href: '/dashboard/posts',
      icon: <FaBook />,
      roles: ['admin', 'author'],
    },
    {
      label: 'Images',
      href: '/dashboard/images',
      icon: <FaImage />,
      roles: ['admin', 'author'],
    },
    {
      label: 'Users',
      href: '/dashboard/users',
      icon: <FaUsers />,
      roles: ['admin'],
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: <FaCog />,
      roles: ['admin'],
    },
  ];

  const allowedNavItems = navItems.filter((item) =>
    item.roles.includes(userRole || 'user')
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 bg-blue-600 text-white p-2 rounded-lg"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 transform lg:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } z-40`}
      >
        <div className="p-6 border-b border-slate-700">
          <Link href="/dashboard" className="text-2xl font-bold text-blue-400">
            Admin Panel
          </Link>
        </div>

        <nav className="p-6 space-y-4 flex-1">
          {allowedNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-6 border-t border-slate-700 space-y-4">
          <div className="text-sm">
            <p className="text-slate-400">Logged in as:</p>
            <p className="font-semibold">{user?.email}</p>
            <p className="text-blue-400 capitalize text-xs">{userRole}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <FaSignOutAlt />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
