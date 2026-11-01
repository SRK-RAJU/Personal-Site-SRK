'use client';

import { FaGlobe } from 'react-icons/fa';

// Translation is handed to Google Translate, so no translated copies are stored (they would not fit the 500 MB
// database limit) and nothing is sent to Google until the visitor chooses a language.
const LANGUAGES: Array<[code: string, label: string]> = [
  ['hi', 'हिन्दी · Hindi'],
  ['te', 'తెలుగు · Telugu'],
  ['ta', 'தமிழ் · Tamil'],
  ['bn', 'বাংলা · Bengali'],
  ['es', 'Español · Spanish'],
  ['fr', 'Français · French'],
  ['de', 'Deutsch · German'],
  ['pt', 'Português · Portuguese'],
  ['it', 'Italiano · Italian'],
  ['ru', 'Русский · Russian'],
  ['tr', 'Türkçe · Turkish'],
  ['ar', 'العربية · Arabic'],
  ['id', 'Bahasa Indonesia'],
  ['zh-CN', '中文 · Chinese (Simplified)'],
  ['ja', '日本語 · Japanese'],
  ['ko', '한국어 · Korean'],
];

interface TranslateMenuProps {
  /** "icon" is a compact globe button for the header; "labeled" is a visible select for the footer. */
  variant?: 'icon' | 'labeled';
  className?: string;
}

export default function TranslateMenu({ variant = 'icon', className = '' }: TranslateMenuProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const code = event.target.value;
    event.target.value = '';
    if (!code) return;

    const target = `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(code)}&u=${encodeURIComponent(window.location.href)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  const options = (
    <>
      <option value="">Translate this page…</option>
      {LANGUAGES.map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </>
  );

  if (variant === 'labeled') {
    return (
      <label className={`inline-flex items-center gap-2 text-xs text-[var(--fg-subtle)] ${className}`}>
        <FaGlobe aria-hidden="true" className="text-[rgb(var(--accent-rgb))]" />
        <span className="sr-only">Translate this page</span>
        <select onChange={handleChange} defaultValue="" className="field !w-auto !rounded-lg !py-1.5 !pr-8 !text-xs" aria-label="Translate this page">
          {options}
        </select>
      </label>
    );
  }

  return (
    <span className={`relative ${className}`} title="Translate this page">
      <FaGlobe aria-hidden="true" className="pointer-events-none text-sm" />
      <select
        onChange={handleChange}
        defaultValue=""
        aria-label="Translate this page"
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
      >
        {options}
      </select>
    </span>
  );
}
