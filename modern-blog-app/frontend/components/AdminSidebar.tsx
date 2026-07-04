'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [isDesktop, setIsDesktop] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, signOut, userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const updateLayout = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      setIsOpen(desktop);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);

    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setIsOpen(false);
    }
  }, [pathname, isDesktop]);

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
      <button
        onClick={() => {
          if (isDesktop) {
            setIsCollapsed((prev) => !prev);
          } else {
            setIsOpen(!isOpen);
          }
        }}
        className="fixed right-4 top-4 z-[60] rounded-xl border border-white/10 bg-slate-900/90 p-2.5 text-white shadow-lg backdrop-blur transition hover:scale-105 lg:hidden"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-slate-950/95 text-white shadow-2xl shadow-slate-950/40 backdrop-blur-xl transition-all duration-300 ${
          isDesktop ? (isCollapsed ? 'w-20' : 'w-72') : 'w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="border-b border-white/10 px-4 py-5 lg:px-3">
          <Link href="/dashboard" className={`flex items-center ${isCollapsed && isDesktop ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-lg font-semibold text-white shadow-lg shadow-violet-500/20">
              A
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-lg font-semibold text-white">Admin Panel</p>
                <p className="text-sm text-slate-400">Control center</p>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-2 p-3">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (!isDesktop) {
                    setIsOpen(false);
                  }
                }}
                className={`flex items-center rounded-2xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                  isCollapsed && isDesktop ? 'justify-center' : 'gap-3'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/90 to-blue-600/90 text-white shadow-lg shadow-violet-500/20'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
                title={isCollapsed && isDesktop ? item.label : undefined}
              >
                <span className="text-base">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-4 border-t border-white/10 p-3">
          {!isCollapsed && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-slate-400">Signed in as</p>
              <p className="mt-1 truncate font-semibold text-white">{user?.email}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-violet-300">{userRole}</p>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className={`flex w-full items-center justify-center rounded-2xl bg-red-600/90 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 ${isCollapsed && isDesktop ? 'px-2' : 'gap-2'}`}
            title={isCollapsed && isDesktop ? 'Sign out' : undefined}
          >
            <FaSignOutAlt />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {isOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
