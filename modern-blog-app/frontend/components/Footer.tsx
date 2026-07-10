'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaEnvelope,
  FaCopyright,
  FaShieldAlt,
  FaLock,
  FaArrowRight,
  FaRocket,
  FaEye,
} from 'react-icons/fa';
import { useState } from 'react';
import VisitorCounter from './VisitorCounter';

export default function Footer() {
  const [copyrightTooltip, setCopyrightTooltip] = useState(false);
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Navigation',
      links: [
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Sitemap', href: '/sitemap-page' },
      ],
    },
    {
      title: 'Get in Touch',
      links: [
        { label: 'Email', href: 'mailto:contact@rjexa.com' },
        { label: 'Contact Form', href: '/contact' },
      ],
    },
  ];

  const socialLinks = [
    { icon: FaEnvelope, href: 'mailto:contact@rjexa.com', label: 'Email', color: 'hover:text-red-600' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <footer className="relative border-t border-cyan-200/50 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_32%),linear-gradient(135deg,_rgba(248,250,252,0.98),_rgba(239,246,255,0.92))] dark:border-cyan-900/30 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.2),_transparent_36%),linear-gradient(135deg,_rgba(2,6,23,0.98),_rgba(15,23,42,0.95))]">
      {/* Decorative elements */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-fuchsia-200/25 rounded-full blur-3xl -z-10"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/10 to-orange-500/10 rounded-full blur-3xl -z-10"
        animate={{ x: [0, -30, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="container-max py-12 sm:py-16">
        {/* Main Footer Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Brand Section */}
          <motion.div className="col-span-1 space-y-4 futurist-card" variants={itemVariants}>
            <Link href="/" className="group cursor-pointer inline-block">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 to-fuchsia-100 rounded-lg blur opacity-70 group-hover:opacity-100 transition duration-300" />
                <div className="relative px-4 py-3 bg-white dark:bg-slate-950 rounded-lg shadow-md shadow-cyan-300/30">
                  <h3 className="text-3xl font-serif text-slate-900 dark:text-white">Rj</h3>
                </div>
              </div>
              <p className="text-sm text-slate-900 dark:text-slate-100 mt-3 font-semibold group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">Tech Blog</p>
            </Link>
            <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-semibold">
              Cloud & DevOps specialist. Full-stack development, security engineering, and modern infrastructure solutions. Building secure, scalable applications.
            </p>
            <motion.div
              className="flex gap-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {socialLinks.map((social, idx) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    title={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 ${social.color} transition-all duration-200 hover:scale-110`}
                    variants={itemVariants}
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * idx }}
                  >
                    <Icon className="text-lg" />
                  </motion.a>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Links Columns */}
          {footerLinks.map((section) => (
            <motion.div key={section.title} variants={itemVariants}>
              <h4 className="mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {section.title}
                <FaArrowRight className="text-cyan-600 dark:text-cyan-300 text-sm" />
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <motion.li
                    key={link.href}
                    whileHover={{ x: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Link
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-slate-800 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors text-sm font-medium inline-flex items-center gap-2"
                    >
                      {link.label}
                      {link.href.startsWith('http') && <FaArrowRight className="text-xs opacity-0 group-hover:opacity-100" />}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent my-12"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        />

        {/* Features/Trust Boxes */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Copyright */}
          <motion.div
            className="group cursor-help futurist-card p-5"
            variants={itemVariants}
            onMouseEnter={() => setCopyrightTooltip(true)}
            onMouseLeave={() => setCopyrightTooltip(false)}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl text-cyan-600 dark:text-cyan-300">
                <FaCopyright />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Copyright Protection
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">
                  © {currentYear} Raju SRK. All rights reserved.
                </p>
              </div>
            </div>
            {copyrightTooltip && (
              <motion.div
                className="absolute top-0 left-0 -translate-y-full mb-2 p-3 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg shadow-lg z-10 whitespace-nowrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                © {currentYear - (new Date().getFullYear() - 2024)} - {currentYear} Raju SRK Personal Tech Blog.
              </motion.div>
            )}
          </motion.div>

          {/* Content Protection */}
          <motion.div
            className="futurist-card p-5"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl text-cyan-600 dark:text-cyan-300">
                <FaShieldAlt />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Content Protection
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">
                  Security controls are applied to reduce unauthorized use.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Privacy Notice */}
          <motion.div
            className="futurist-card p-5"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl text-cyan-600 dark:text-cyan-300">
                <FaLock />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Privacy & Security
                </p>
                <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">
                  Data is handled securely with minimal third-party services.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          className="bg-gradient-to-r from-cyan-50/50 to-fuchsia-50/50 dark:from-cyan-900/10 dark:to-fuchsia-900/10 border border-cyan-200/50 dark:border-cyan-800/30 rounded-xl p-6 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm text-slate-800 dark:text-slate-200 text-center">
            <span className="font-bold text-cyan-700 dark:text-cyan-300">📢 Disclaimer:</span> All content is for educational purposes. Always verify with official documentation and test in a safe environment before production use.
          </p>
        </motion.div>

        {/* Copyright Note */}
        <motion.div
          className="text-center text-xs text-slate-800 dark:text-slate-200 mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p>
            © {currentYear} Raju{' '}
            <Link href="/" className="text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 font-bold transition-colors">
              [Tech Blog]
            </Link>
            {' '} — This is my personal blog. All content reflects my own interests and experiences. Unauthorized copying is prohibited.
          </p>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-800 dark:text-slate-200"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="flex items-center gap-1">
            Made with{' '}
            <span className="text-red-600 dark:text-red-400 animate-pulse">❤️</span> by
            <Link href="/" className="font-semibold text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 transition-colors">
              Raju
            </Link>
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <VisitorCounter />
            <span className="text-xs text-slate-800 dark:text-slate-100">
              Tracks total visits in real time via analytics.
            </span>
          </div>

          <p className="flex flex-wrap items-center gap-2 justify-center">
            Powered by
            <Link href="/" className="font-semibold text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors">
              Raju
            </Link>
            {/* <span>•</span>
            <span className="font-semibold text-slate-900 dark:text-white">Supabase</span>
            <span>•</span>
            <span className="font-semibold text-slate-900 dark:text-white">Vercel</span> */}
          </p>

          <p className="flex items-center gap-1">
            Updated:{' '}
            <span className="font-semibold">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
