'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaEnvelope, FaShieldAlt, FaLock, FaCopyright, FaExternalLinkAlt } from 'react-icons/fa';
import VisitorCounter from './VisitorCounter';

const footerLinks = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Posts', href: '/blog' },
      { label: 'Tools', href: '/tools' },
      { label: 'Architecture images', href: '/images' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Sitemap', href: '/sitemap-page' },
      { label: 'RSS feed', href: '/feed.xml' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Email', href: 'mailto:contact@rjexa.com' },
    ],
  },
];

const trustItems = [
  { icon: FaCopyright, label: 'Copyright protected' },
  { icon: FaShieldAlt, label: 'Content protection' },
  { icon: FaLock, label: 'Privacy & security' },
];

export default function Footer() {
  const pathname = usePathname() || '/';
  const currentYear = new Date().getFullYear();

  // The dashboard has its own chrome.
  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <footer className="relative mt-16 border-t border-[var(--line)]">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[rgb(var(--accent-rgb)/0.6)] to-transparent" />

      <div className="container-max py-12 sm:py-16">
        <motion.div
          className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Raju Tech home">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 via-sky-400 to-indigo-500 font-display text-base font-bold shadow-[0_8px_24px_-8px_var(--glow)]">
                <span className="absolute inset-[1.5px] rounded-[0.7rem] bg-[rgb(var(--bg-rgb))]" />
                <span className="relative bg-gradient-to-br from-cyan-300 to-indigo-400 bg-clip-text text-transparent">RJ</span>
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">Raju Tech</span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--fg-muted)]">
              Cloud &amp; DevOps specialist. Full-stack development, security engineering and modern infrastructure — building secure, scalable systems and writing about them weekly.
            </p>
            <a
              href="mailto:contact@rjexa.com"
              className="btn-secondary !rounded-xl !px-3.5 !py-2 !text-sm"
              aria-label="Send an email"
            >
              <FaEnvelope className="text-xs" />
              contact@rjexa.com
            </a>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-[var(--fg-subtle)]">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => {
                  const external = link.href.startsWith('mailto:') || link.href.startsWith('http');
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="group inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] transition-colors hover:text-[rgb(var(--accent-rgb))]"
                      >
                        {link.label}
                        {external && <FaExternalLinkAlt className="text-[0.6rem] opacity-60" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </motion.div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
          {trustItems.map(({ icon: Icon, label }) => (
            <span key={label} className="badge-secondary gap-2 !px-3.5 !py-1.5 !text-xs">
              <Icon className="text-[rgb(var(--accent-rgb))]" />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-5 border-t border-[var(--line)] pt-8 text-xs text-[var(--fg-subtle)] md:flex-row">
          <div className="space-y-1.5 text-center md:text-left">
            <p>
              © {currentYear} Raju SRK. All rights reserved. This is a personal blog; unauthorized copying is prohibited.
            </p>
            <p className="max-w-3xl">
              Content is for educational purposes. Verify with official documentation and test in a safe environment before production use.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <VisitorCounter />
            <p className="flex items-center gap-1">
              Made with <span className="text-rose-400">♥</span> by
              <Link href="/" className="font-semibold text-[rgb(var(--fg-rgb))] transition-colors hover:text-[rgb(var(--accent-rgb))]">
                Raju
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
