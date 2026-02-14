'use client';

import Link from 'next/link';
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaEnvelope,
  FaCopyright,
  FaShieldAlt,
  FaLock,
} from 'react-icons/fa';
import { useState } from 'react';

export default function Footer() {
  const [copyrightTooltip, setCopyrightTooltip] = useState(false);

  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Navigation',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: 'Portfolio', href: '/portfolio' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Sitemap', href: '/sitemap.xml' },
      ],
    },
  ];

  const socialLinks = [
    { icon: FaGithub, href: 'https://github.com/SRK-RAJU', label: 'GitHub' },
    { icon: FaLinkedin, href: 'https://linkedin.com/in/srajukumargoud', label: 'LinkedIn' },
    { icon: FaTwitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: FaEnvelope, href: 'mailto:contact@example.com', label: 'Email' },
  ];

  return (
    <footer className="bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
      <div className="container-max">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🚀</span>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Raju SRK
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              A modern tech blog exploring software development, architecture, and
              design patterns.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    title={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 hover:dark:text-white transition-all duration-200"
                  >
                    <Icon className="text-lg" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright & Protection Notice */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Copyright */}
            <div
              className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-help relative group"
              onMouseEnter={() => setCopyrightTooltip(true)}
              onMouseLeave={() => setCopyrightTooltip(false)}
            >
              <FaCopyright className="text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Copyright © {currentYear} Raju SRK
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  All rights reserved. All content, code, and intellectual property
                  rights belong to the author.
                </p>
              </div>

              {/* Tooltip */}
              {copyrightTooltip && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                  © 2024 - {currentYear} Raju SRK
                </div>
              )}
            </div>

            {/* Content Protection */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <FaShieldAlt className="text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Content Protection
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Content is protected from unauthorized copying and use. Right-click
                  and developer tools are disabled.
                </p>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <FaLock className="text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Privacy & Security
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Your data is secure and encrypted. No third-party tracking or data
                  selling.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notices */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-8">
          <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
            <span className="font-semibold">Disclaimer:</span> All blog posts and
            tutorials are provided as-is for educational purposes. The author is not
            responsible for any damages or issues arising from the use of this content.
            Always refer to official documentation and test in a safe environment.
          </p>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <p>
            Made with{' '}
            <span className="text-emerald-600 dark:text-emerald-400">❤️</span> by
            Raju SRK
          </p>

          <p>
            Powered by{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              Next.js
            </span>{' '}
            +{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              Supabase
            </span>{' '}
            +{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              Vercel
            </span>
          </p>

          <p>
            Last updated:{' '}
            <span className="font-semibold">
              {new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
