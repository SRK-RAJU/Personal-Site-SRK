'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
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
  FaGlobeAmericas,
  FaMoon,
  FaSun,
} from 'react-icons/fa';

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, signOut, userRole } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: <FaGlobeAmericas />,
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
        className="fixed right-4 top-4 z-[60] rounded-xl border border-[var(--line-strong)] bg-[rgb(var(--bg-rgb)/0.9)] p-2.5 text-[rgb(var(--fg-rgb))] shadow-lg backdrop-blur transition hover:scale-105 lg:hidden"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      <aside
        onMouseEnter={() => {
          if (isDesktop) setIsCollapsed(false);
        }}
        onMouseLeave={() => {
          if (isDesktop && !isOpen) setIsCollapsed(true);
        }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--line)] bg-[rgb(var(--bg-rgb)/0.9)] text-[rgb(var(--fg-rgb))] shadow-2xl shadow-black/30 backdrop-blur-2xl transition-all duration-300 ${
          isDesktop ? (isCollapsed ? 'w-20' : 'w-72') : 'w-72'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="border-b border-[var(--line)] px-4 py-5 lg:px-3">
          <Link href="/dashboard" className={`flex items-center ${isCollapsed && isDesktop ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-400 to-indigo-500 font-display text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/30">
              A
            </div>
            {!isCollapsed && (
              <div>
                <p className="font-display text-lg font-semibold">Admin Panel</p>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--fg-subtle)]">Control center</p>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1.5 p-3">
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
                className={`flex items-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isCollapsed && isDesktop ? 'justify-center' : 'gap-3'
                } ${
                  isActive
                    ? 'border-[rgb(var(--accent-rgb)/0.35)] bg-[rgb(var(--accent-rgb)/0.12)] text-[rgb(var(--accent-rgb))]'
                    : 'border-transparent text-[var(--fg-muted)] hover:bg-[rgb(var(--fg-rgb)/0.06)] hover:text-[rgb(var(--fg-rgb))]'
                }`}
                title={isCollapsed && isDesktop ? item.label : undefined}
              >
                <span className="text-base">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-[var(--line)] p-3">
          {!isCollapsed && (
            <div className="rounded-xl border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.04)] p-4 text-sm">
              <p className="text-[var(--fg-subtle)]">Signed in as</p>
              <p className="mt-1 truncate font-semibold">{user?.email}</p>
              <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[rgb(var(--accent-rgb))]">{userRole}</p>
            </div>
          )}

          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={`flex w-full items-center justify-center rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-medium text-[var(--fg-muted)] transition hover:bg-[rgb(var(--fg-rgb)/0.06)] hover:text-[rgb(var(--fg-rgb))] ${isCollapsed && isDesktop ? 'px-2' : 'gap-2'}`}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === 'dark' ? <FaSun /> : <FaMoon />}
            {!isCollapsed && <span>{mounted && resolvedTheme === 'dark' ? 'Light theme' : 'Dark theme'}</span>}
          </button>

          <button
            onClick={handleSignOut}
            className={`btn-danger w-full ${isCollapsed && isDesktop ? '!px-2' : ''}`}
            title={isCollapsed && isDesktop ? 'Sign out' : undefined}
          >
            <FaSignOutAlt />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {isOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
