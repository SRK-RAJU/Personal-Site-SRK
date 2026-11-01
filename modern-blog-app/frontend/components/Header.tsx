'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaBars,
  FaTimes,
  FaSearch,
  FaMoon,
  FaSun,
  FaTachometerAlt,
  FaSignOutAlt,
  FaSignInAlt,
  FaArrowRight,
} from 'react-icons/fa';
import { useAuth } from '@/lib/authContext';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import TranslateMenu from './TranslateMenu';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Posts' },
  { href: '/docs', label: 'Docs' },
  { href: '/tools', label: 'Tools' },
  { href: '/images', label: 'Images' },
  { href: '/developers', label: 'API' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

function LogoMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-sky-400 to-indigo-500 font-display text-sm font-bold tracking-tight text-slate-950 shadow-[0_8px_24px_-8px_var(--glow)] ${className}`}
    >
      <span className="absolute inset-[1.5px] rounded-[0.65rem] bg-[rgb(var(--bg-rgb))]" />
      <span className="relative bg-gradient-to-br from-cyan-300 to-indigo-400 bg-clip-text text-transparent">RJ</span>
    </span>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const { user, userRole, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/blog?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    setIsOpen(false);
  };

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  const isDark = mounted && resolvedTheme === 'dark';

  // The dashboard has its own sidebar and chrome.
  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  const iconButton =
    'flex h-9 w-9 items-center justify-center rounded-xl text-[var(--fg-muted)] transition hover:bg-[rgb(var(--fg-rgb)/0.08)] hover:text-[rgb(var(--fg-rgb))]';

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav
        aria-label="Primary navigation"
        className={`mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl px-3 transition-all duration-300 sm:h-16 sm:px-4 ${
          scrolled ? 'glass-strong shadow-2xl shadow-black/20' : 'glass'
        }`}
      >
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Raju Tech home">
          <LogoMark className="h-9 w-9 transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105" />
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-[0.95rem] font-semibold tracking-tight">Raju Tech</span>
            <span className="block font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--fg-subtle)]">AI · Cloud · Sec</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                  active ? 'text-[rgb(var(--fg-rgb))]' : 'text-[var(--fg-muted)] hover:text-[rgb(var(--fg-rgb))]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 -z-10 rounded-xl border border-[var(--line-strong)] bg-[rgb(var(--fg-rgb)/0.08)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                {item.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-transparent via-[rgb(var(--accent-rgb))] to-transparent" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-1.5 xl:flex">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Search posts…"
                aria-label="Search blog posts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="field !w-44 !rounded-xl !py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className={iconButton}
                aria-label="Close search"
              >
                <FaTimes className="text-sm" />
              </button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className={iconButton} title="Search" aria-label="Open search">
              <FaSearch className="text-sm" />
            </button>
          )}

          <button onClick={toggleTheme} className={iconButton} title="Toggle theme" aria-label="Toggle theme">
            {isDark ? <FaSun className="text-sm" /> : <FaMoon className="text-sm" />}
          </button>

          <TranslateMenu className={iconButton} />

          <span className="mx-1 h-5 w-px bg-[var(--line-strong)]" aria-hidden="true" />

          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[rgb(var(--accent-rgb))] border-t-transparent" />
          ) : user ? (
            <>
              {userRole === 'admin' && (
                <Link href="/dashboard" className="btn-secondary !rounded-xl !px-3 !py-1.5 !text-sm">
                  <FaTachometerAlt className="text-xs" />
                  Dashboard
                </Link>
              )}
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-strong)] bg-gradient-to-br from-cyan-400/25 to-indigo-500/25 text-sm font-semibold uppercase"
                title={user.email || undefined}
              >
                {(user.email || '?').charAt(0)}
              </span>
              <button onClick={handleSignOut} className={iconButton} title="Sign out" aria-label="Sign out">
                <FaSignOutAlt className="text-sm" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost !px-3 !py-1.5 !text-sm">
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-primary !rounded-xl !px-3.5 !py-1.5 !text-sm">
                Get started
                <FaArrowRight className="text-[0.65rem]" />
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 xl:hidden">
          <TranslateMenu className={iconButton} />
          <button onClick={toggleTheme} className={iconButton} aria-label="Toggle theme">
            {isDark ? <FaSun size={15} /> : <FaMoon size={15} />}
          </button>
          <button
            onClick={() => setIsOpen((open) => !open)}
            className={iconButton}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass-strong mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl p-3 shadow-2xl shadow-black/30 xl:hidden"
          >
            <form onSubmit={handleSearch} className="mb-2">
              <div className="field flex items-center gap-2 !py-2">
                <FaSearch className="text-sm text-[var(--fg-subtle)]" />
                <input
                  type="text"
                  placeholder="Search posts…"
                  aria-label="Search blog posts"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-none bg-transparent text-sm outline-none"
                />
              </div>
            </form>

            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? 'border border-[rgb(var(--accent-rgb)/0.4)] bg-[rgb(var(--accent-rgb)/0.12)] text-[rgb(var(--accent-rgb))]'
                        : 'border border-transparent bg-[rgb(var(--fg-rgb)/0.04)] text-[var(--fg-muted)] hover:text-[rgb(var(--fg-rgb))]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 space-y-2 border-t border-[var(--line)] pt-3">
              {loading ? (
                <p className="py-2 text-center text-sm text-[var(--fg-subtle)]">Loading…</p>
              ) : user ? (
                <>
                  {userRole === 'admin' && (
                    <Link href="/dashboard" onClick={() => setIsOpen(false)} className="btn-secondary w-full">
                      <FaTachometerAlt />
                      Dashboard
                    </Link>
                  )}
                  <div className="rounded-xl border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.04)] px-4 py-3">
                    <p className="text-[0.7rem] uppercase tracking-wider text-[var(--fg-subtle)]">Signed in as</p>
                    <p className="break-all text-sm font-semibold">{user.email}</p>
                    <p className="text-xs capitalize text-[rgb(var(--accent-rgb))]">{userRole}</p>
                  </div>
                  <button onClick={handleSignOut} className="btn-danger w-full">
                    <FaSignOutAlt />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/auth/login" onClick={() => setIsOpen(false)} className="btn-secondary">
                    <FaSignInAlt />
                    Sign in
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsOpen(false)} className="btn-primary">
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
