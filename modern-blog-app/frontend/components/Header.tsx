'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  FaBars,
  FaTimes,
  FaUser,
  FaHome,
  FaFileAlt,
  FaBriefcase,
  FaAbout,
  FaEnvelope,
  FaDashboard,
  FaSignOutAlt,
  FaSignInAlt,
} from 'react-icons/fa';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, userRole, signOut, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Home', icon: FaHome },
    { href: '/blog', label: 'Blog', icon: FaFileAlt },
    { href: '/portfolio', label: 'Portfolio', icon: FaBriefcase },
    { href: '/about', label: 'About', icon: FaAbout },
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
          ? 'bg-white dark:bg-slate-900 shadow-lg'
          : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800'
      }`}
    >
      <nav className="container-max flex items-center justify-between h-20">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          <span className="text-emerald-600 text-3xl">🚀</span>
          <span>Raju SRK</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <Icon className="text-sm" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Auth Buttons - Desktop */}
        <div className="hidden lg:flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          ) : user ? (
            <>
              {(userRole === 'admin' || userRole === 'author') && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors font-semibold"
                >
                  <FaDashboard className="text-sm" />
                  Dashboard
                </Link>
              )}
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                <FaUser className="text-sm text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {user.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors font-semibold"
              >
                <FaSignOutAlt className="text-sm" />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all font-semibold"
              >
                <FaSignInAlt className="text-sm" />
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <FaUser className="text-sm" />
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-300 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="absolute top-20 left-0 right-0 bg-white dark:bg-slate-900 shadow-lg lg:hidden">
            <div className="container-max py-6 space-y-3">
              {/* Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all font-medium"
                  >
                    <Icon className="text-lg" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3" />

              {/* Auth Section */}
              {loading ? (
                <p className="text-center text-slate-600 dark:text-slate-400 py-3">
                  Loading...
                </p>
              ) : user ? (
                <>
                  {(userRole === 'admin' || userRole === 'author') && (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold"
                    >
                      <FaDashboard className="text-lg" />
                      Dashboard
                    </Link>
                  )}
                  <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Logged in as:
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {user.email}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 capitalize">
                      {userRole}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                    }}
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
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 font-semibold transition-colors"
                  >
                    <FaSignInAlt />
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold transition-all"
                  >
                    <FaUser />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Scroll indicator */}
      <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-600 transform scale-x-0 origin-left" />
    </header>
  );
}
