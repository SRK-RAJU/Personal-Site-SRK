'use client';

import { useState } from 'react';
import { FaThList } from 'react-icons/fa';
import ToolsCatalogModal from './ToolsCatalogModal';

export default function FloatingToolsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary fixed bottom-6 right-6 z-40 !h-14 !w-14 !rounded-full !p-0 shadow-2xl"
        title="Open Tools List"
        aria-label="Open Tools List"
        aria-haspopup="dialog"
      >
        <FaThList className="text-lg" />
      </button>

      {isOpen && <ToolsCatalogModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
