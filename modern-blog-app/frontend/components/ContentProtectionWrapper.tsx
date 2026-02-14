'use client';

import { useEffect } from 'react';
import { disableRightClick, disableDeveloperTools } from '@/lib/contentProtection';

export default function ContentProtectionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    disableRightClick();
    disableDeveloperTools();

    // Prevent text selection on certain elements
    const style = document.createElement('style');
    style.innerHTML = `
      .no-select {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return <>{children}</>;
}
