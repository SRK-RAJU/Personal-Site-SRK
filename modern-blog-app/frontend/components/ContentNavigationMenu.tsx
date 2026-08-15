'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChevronDown, FaBook, FaRocket } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContentNavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isOnBlog = pathname === '/blog';
  const isOnTools = pathname === '/tools';

  const menuItems = [
    {
      href: '/blog',
      label: 'Posts',
      icon: FaBook,
      description: 'Latest blog articles',
      active: isOnBlog,
    },
    {
      href: '/tools',
      label: 'Tools List',
      icon: FaRocket,
      description: 'Industry tools catalog',
      active: isOnTools,
    },
  ];

  const currentPage = menuItems.find((item) => item.active);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 font-semibold transition-all border border-cyan-300 dark:border-cyan-700"
      >
        {currentPage && (
          <>
            {currentPage.icon && <currentPage.icon className="text-lg" />}
            <span>{currentPage.label}</span>
          </>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown className="text-sm" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-56"
            onMouseLeave={() => setIsOpen(false)}
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                    item.active
                      ? 'bg-cyan-50 dark:bg-cyan-900/30 border-l-4 border-cyan-500 text-cyan-700 dark:text-cyan-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon className="text-lg flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs opacity-75">{item.description}</p>
                  </div>
                  {item.active && (
                    <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0 mt-1"></div>
                  )}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
