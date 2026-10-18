'use client';

import { usePathname } from 'next/navigation';

// The dashboard renders its own sidebar instead of the public header, so it must not reserve the header's space.
export default function SiteMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const bare = pathname.startsWith('/dashboard');

  return (
    <main id="main-content" className={`site-main w-full flex-1 ${bare ? '' : 'pt-20 sm:pt-24'}`}>
      {children}
    </main>
  );
}
