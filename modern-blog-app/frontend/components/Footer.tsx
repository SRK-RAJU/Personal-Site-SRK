'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
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
    {
      title: 'Connect',
      links: [
        { label: 'GitHub', href: 'https://github.com/SRK-RAJU' },
        { label: 'LinkedIn', href: 'https://linkedin.com/in/srajukumargoud' },
        { label: 'Twitter', href: 'https://twitter.com' },
        { label: 'Email', href: 'mailto:contact@example.com' },
      ],
    },
  ];

  const socialLinks = [
    { icon: FaGithub, href: 'https://github.com/SRK-RAJU', label: 'GitHub', color: 'hover:text-slate-900 dark:hover:text-white' },
    { icon: FaLinkedin, href: 'https://linkedin.com/in/srajukumargoud', label: 'LinkedIn', color: 'hover:text-blue-600' },
    { icon: FaTwitter, href: 'https://twitter.com', label: 'Twitter', color: 'hover:text-blue-400' },
    { icon: FaEnvelope, href: 'mailto:contact@example.com', label: 'Email', color: 'hover:text-red-600' },
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
    <footer className="relative bg-gradient-to-br from-slate-50 via-white to-emerald-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30 border-t border-slate-200 dark:border-slate-800">
      {/* Decorative elements */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl -z-10"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="container-max py-16">
        {/* Main Footer Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Brand Section */}
          <motion.div className="col-span-1 space-y-4" variants={itemVariants}>
            <div className="group cursor-pointer">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300" />
                <div className="relative px-4 py-3 bg-white dark:bg-slate-950 rounded-lg">
                  <FaRocket className="text-2xl text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold gradient-text mt-3">SRK Tech</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Building the future of technology, one blog post at a time. Explore cloud, DevOps, and modern development practices.
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
                    className={`w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ${social.color} transition-all duration-200 hover:scale-110`}
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
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-lg flex items-center gap-2">
                {section.title}
                <FaArrowRight className="text-emerald-600 dark:text-emerald-400 text-sm" />
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
                      className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-medium inline-flex items-center gap-2"
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
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Copyright */}
          <motion.div
            className="card-glass border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-500 group cursor-help"
            variants={itemVariants}
            onMouseEnter={() => setCopyrightTooltip(true)}
            onMouseLeave={() => setCopyrightTooltip(false)}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl text-emerald-600 dark:text-emerald-400">
                <FaCopyright />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Copyright Protection
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
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
                © 2024 - {currentYear} Raju SRK
              </motion.div>
            )}
          </motion.div>

          {/* Content Protection */}
          <motion.div
            className="card-glass border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-500"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl text-emerald-600 dark:text-emerald-400">
                <FaShieldAlt />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Content Protection
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Advanced security prevents unauthorized copying.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Privacy Notice */}
          <motion.div
            className="card-glass border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-500"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl text-emerald-600 dark:text-emerald-400">
                <FaLock />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Privacy & Security
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Encrypted data with no third-party tracking.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl p-6 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm text-slate-700 dark:text-slate-300 text-center">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">📢 Disclaimer:</span> All content is for educational purposes. Always verify with official documentation and test in a safe environment before production use.
          </p>
        </motion.div>

        {/* Copyright Note */}
        <motion.div
          className="text-center text-xs text-slate-500 dark:text-slate-500 mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p>
            &copy; {currentYear} Raju SRK — This is my personal blog. All content reflects my own interests and experiences. Unauthorized copying is prohibited.
          </p>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600 dark:text-slate-400"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="flex items-center gap-1">
            Made with{' '}
            <span className="text-red-600 dark:text-red-400 animate-pulse">❤️</span> by
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Raju SRK</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <VisitorCounter />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Tracks total visits in real time via analytics.
            </span>
          </div>

          <p className="flex flex-wrap items-center gap-2 justify-center">
            Powered by
            <span className="font-semibold text-slate-900 dark:text-white">Raju</span>
            <span>•</span>
            {/* <span className="font-semibold text-slate-900 dark:text-white">Supabase</span>
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
