'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaBars,
  FaTimes,
  FaUser,
  FaHome,
  FaBook,
  FaInfoCircle,
  FaEnvelope,
  FaTachometerAlt,
  FaSignOutAlt,
  FaSignInAlt,
  FaSearch,
  FaMoon,
  FaSun,
  FaRocket,
  FaImages,
} from 'react-icons/fa';
import { useAuth } from '@/lib/authContext';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const { user, userRole, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/blog?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navItems = [
    { href: '/', label: 'Home', icon: FaHome },
    { href: '/blog', label: 'Posts', icon: FaBook },
    { href: '/tools', label: 'Tools List', icon: FaRocket },
    { href: '/images', label: 'Tool Images', icon: FaImages },
    { href: '/about', label: 'About', icon: FaInfoCircle },
    { href: '/contact', label: 'Contact', icon: FaEnvelope },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    setIsOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-cyan-200/60 bg-white/85 shadow-lg shadow-cyan-500/20 backdrop-blur-xl dark:border-cyan-900/30 dark:bg-slate-950/85'
          : 'border-b border-transparent bg-white/65 backdrop-blur-md dark:bg-slate-950/65'
      }`}
    >
      <nav aria-label="Primary navigation" className="container-max flex items-center justify-between h-16 sm:h-20">
        {/* Logo with animation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 group hover:scale-105 transition-transform"
          >
            {/* RJ Logo - Modern Design */}
            <div className="w-10 h-10 sm:w-12 sm:h-12">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                  <linearGradient id="rjLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#00f5ff', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#0099ff', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="95" fill="#1a1a2e" stroke="url(#rjLogoGrad)" strokeWidth="2"/>
                <text x="100" y="120" fontSize="56" fontWeight="bold" textAnchor="middle" fill="url(#rjLogoGrad)" fontFamily="Arial, sans-serif" letterSpacing="3">RJ</text>
              </svg>
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-bold bg-gradient-to-r from-cyan-500 to-fuchsia-500 bg-clip-text text-transparent">RJ</p>
              <p className="text-xs text-slate-800 dark:text-slate-200 -mt-1">Modern Personal Tech Blog</p>
            </div>
          </Link>
        </motion.div>

        {/* Desktop Menu - center */}
        <motion.div
          className="hidden lg:flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * idx }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-100/90 text-slate-900 ring-1 ring-slate-200 hover:bg-cyan-100 hover:text-cyan-700 dark:bg-slate-900/60 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-cyan-900/40 dark:hover:text-cyan-100'
                  }`}
                >
                  <Icon className="text-sm" />
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Right side - Search, Theme, Auth */}
        <motion.div
          className="hidden lg:flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search posts..."
                  aria-label="Search blog posts"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-cyan-300 dark:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {setSearchOpen(false); setSearchQuery('');}}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Close search"
                >
                  <FaTimes className="text-sm" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
                title="Search"
                aria-label="Open search"
              >
                <FaSearch className="text-sm" />
              </button>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === 'dark' ? <FaSun className="text-sm" /> : <FaMoon className="text-sm" />}
          </button>

          {/* Auth Section */}
          {loading ? (
            <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <>
              {userRole === 'admin' && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors font-semibold text-sm"
                >
                  <FaTachometerAlt className="text-sm" />
                  Dashboard
                </Link>
              )}
              <div className="flex items-center gap-2 px-2.5 py-2 sm:px-3 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                <FaUser className="text-sm text-cyan-600 dark:text-cyan-300" />
                <span className="text-sm text-slate-800 dark:text-slate-200 font-medium max-w-[100px] truncate">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors font-semibold text-sm"
              >
                <FaSignOutAlt className="text-sm" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-3 py-2 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-all font-semibold text-sm"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-700 hover:to-fuchsia-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl text-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </motion.div>

        {/* Mobile controls */}
        <motion.div
          className="lg:hidden flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === 'dark' ? <FaSun size={18} /> : <FaMoon size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 text-slate-800 dark:text-slate-200 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </motion.div>
      </nav>

      {/* Mobile Menu */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className={`lg:hidden overflow-hidden ${isOpen ? 'visible' : 'invisible'}`}
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
          <div className="container-max py-4 sm:py-6 space-y-2">
            {/* Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <FaSearch className="text-sm text-slate-800 dark:text-slate-200" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                />
              </div>
            </form>

            {/* Navigation */}
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 font-semibold transition-all ${
                    pathname === item.href
                      ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-100/90 text-slate-900 hover:bg-cyan-100 hover:text-cyan-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-cyan-900/40 dark:hover:text-cyan-100'
                  }`}
                >
                  <Icon className="text-lg" />
                  {item.label}
                </Link>
              );
            })}

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3" />

            {/* Mobile Auth */}
            {loading ? (
              <p className="text-center text-slate-800 dark:text-slate-200 py-3">Loading...</p>
            ) : user ? (
              <>
                {userRole === 'admin' && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-semibold"
                  >
                    <FaTachometerAlt className="text-lg" />
                    Dashboard
                  </Link>
                )}
                <div className="px-4 py-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <p className="text-xs text-slate-800 dark:text-slate-200 mb-1">Logged in as:</p>
                  <p className="font-semibold text-slate-900 dark:text-white break-all">{user.email}</p>
                  <p className="text-xs text-cyan-600 dark:text-cyan-300 capitalize">{userRole}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                >
                  <FaSignOutAlt />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 font-semibold transition-colors"
                >
                  <FaSignInAlt />
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-700 hover:to-fuchsia-700 text-white font-semibold transition-all"
                >
                  <FaUser />
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </header>
  );
}
