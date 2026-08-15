'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBook, FaRocket } from 'react-icons/fa';

interface ToggleItem {
  href: string;
  label: string;
  icon?: typeof FaBook;
}

export default function PageToggleNav() {
  const pathname = usePathname();

  const items: ToggleItem[] = [
    { href: '/blog', label: 'Posts', icon: FaBook },
    { href: '/tools', label: 'Tools', icon: FaRocket },
  ];

  const isActive = (href: string) => {
    if (href === '/blog') return pathname === '/blog' || pathname.startsWith('/blog/');
    if (href === '/tools') return pathname === '/tools' || pathname.startsWith('/tools/');
    return pathname === href;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {items.map((item) => {
        const Icon = item.icon || FaBook;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={[
              'group inline-flex items-center gap-2 rounded-lg border-2 px-5 py-3 text-sm font-bold transition-all duration-200 sm:text-base',
              active
                ? 'border-cyan-500 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white shadow-lg shadow-cyan-500/20'
                : 'border-cyan-400 text-cyan-700 hover:scale-[1.02] hover:bg-cyan-50 dark:border-cyan-600 dark:text-cyan-300 dark:hover:bg-cyan-900/20',
            ].join(' ')}
          >
            <Icon className="text-base" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
