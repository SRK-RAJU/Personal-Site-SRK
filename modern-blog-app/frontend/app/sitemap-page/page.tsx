'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaHome, FaBook, FaBriefcase, FaInfoCircle, FaEnvelope, FaShieldAlt, FaLock, FaFileAlt, FaImages } from 'react-icons/fa';

export default function SitemapPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const sitemapLinks = [
    { href: '/', label: 'Home', icon: FaHome, description: 'Welcome to the future of tech', priority: 'High' },
    { href: '/blog', label: 'Blog', icon: FaBook, description: 'Articles, tutorials, and insights', priority: 'High' },
    { href: '/images', label: 'Tool Images', icon: FaImages, description: 'Tool-wise architecture learning visuals', priority: 'High' },
    { href: '/about', label: 'About', icon: FaInfoCircle, description: 'Learn more about me', priority: 'Medium' },
    { href: '/contact', label: 'Contact', icon: FaEnvelope, description: 'Get in touch', priority: 'Medium' },
    { href: '/privacy', label: 'Privacy Policy', icon: FaShieldAlt, description: 'Your privacy matters', priority: 'Low' },
    { href: '/terms', label: 'Terms of Service', icon: FaLock, description: 'Legal terms and conditions', priority: 'Low' },
  ];

  return (
    <div className="page-wrapper">
      <motion.div
        className="page-frame max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Back Button */}
        <motion.div variants={itemVariants} className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80"
          >
            <FaArrowLeft className="text-sm" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants} className="page-hero">
          <h1 className="gradient-text mb-4 text-5xl font-bold sm:text-6xl">
            Site Map
          </h1>
          <p className="text-lg text-[var(--fg-muted)]">
            Explore all pages and resources available on Raju Tech. Find everything you need with ease.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
          variants={containerVariants}
        >
          {[
            { label: 'Total Pages', value: sitemapLinks.length, icon: FaFileAlt },
            { label: 'Last Updated', value: new Date().toISOString().slice(0, 10), icon: FaHome },
            { label: 'Crawlable', value: '100%', icon: FaBook },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                className="page-panel p-6"
                variants={itemVariants}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="text-xl text-[rgb(var(--accent-rgb))]" />
                  <p className="text-sm font-semibold text-[var(--fg-muted)]">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold text-[rgb(var(--fg-rgb))]">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Sitemap Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
        >
          {sitemapLinks.map((link, idx) => {
            const Icon = link.icon;
            const priorityColors = {
              'High': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
              'Medium': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
              'Low': 'border border-[rgb(var(--accent-rgb)/0.25)] bg-[rgb(var(--accent-rgb)/0.1)] text-[rgb(var(--accent-rgb))]',
            };

            return (
              <motion.div
                key={link.href}
                variants={itemVariants}
              >
                <Link href={link.href}>
                  <motion.div
                    className="futurist-card group h-full cursor-pointer p-6"
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <Icon className="text-3xl text-[rgb(var(--accent-rgb))] transition-transform group-hover:scale-110" />
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[link.priority as keyof typeof priorityColors]}`}>
                        {link.priority}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-[rgb(var(--fg-rgb))] transition-colors group-hover:text-[rgb(var(--accent-rgb))]">
                      {link.label}
                    </h3>
                    <p className="text-sm text-[var(--fg-muted)]">
                      {link.description}
                    </p>
                    <div className="mt-4 text-sm font-semibold text-[rgb(var(--accent-rgb))] opacity-0 transition-opacity group-hover:opacity-100">
                      Visit page →
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* XML Sitemap Link */}
        <motion.div variants={itemVariants} className="page-panel mt-12">
          <p className="mb-2 text-sm text-[var(--fg-muted)]">For search engines:</p>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80"
          >
            <FaFileAlt /> View XML Sitemap
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
