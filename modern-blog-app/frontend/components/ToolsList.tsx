'use client';

import { useState } from 'react';
import { FaThList } from 'react-icons/fa';
import ToolsCatalogModal, { TOTAL_CATALOG_TOOLS } from './ToolsCatalogModal';

export default function ToolsList() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <button onClick={() => setIsOpen(true)} className="btn-outline !rounded-full !px-4 !py-2 !text-sm" aria-haspopup="dialog">
        <FaThList className="text-xs" />
        Tools catalog
        <span className="rounded-full bg-[rgb(var(--accent-rgb)/0.15)] px-2 py-0.5 font-mono text-xs">{TOTAL_CATALOG_TOOLS}</span>
      </button>

      {isOpen && <ToolsCatalogModal onClose={() => setIsOpen(false)} />}
    </div>
  );
}
