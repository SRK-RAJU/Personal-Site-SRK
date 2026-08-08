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
    { href: '/learning-images', label: 'Learning Images', icon: FaImages, description: 'Tool-wise architecture learning visuals', priority: 'High' },
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
            className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors"
          >
            <FaArrowLeft className="text-sm" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants} className="page-hero">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600">
            Site Map
          </h1>
          <p className="text-lg text-slate-800 dark:text-slate-200">
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
            { label: 'Last Updated', value: new Date().toLocaleDateString(), icon: FaHome },
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
                  <Icon className="text-violet-600 dark:text-violet-400 text-xl" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{stat.label}</p>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
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
              'Low': 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
            };

            return (
              <motion.div
                key={link.href}
                variants={itemVariants}
              >
                <Link href={link.href}>
                  <motion.div
                    className="card-hover border-2 border-violet-200 dark:border-violet-800/50 hover:border-violet-500 dark:hover:border-violet-500 p-6 h-full cursor-pointer group"
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <Icon className="text-3xl text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform" />
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColors[link.priority as keyof typeof priorityColors]}`}>
                        {link.priority}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {link.label}
                    </h3>
                    <p className="text-slate-800 dark:text-slate-200 text-sm">
                      {link.description}
                    </p>
                    <div className="mt-4 text-violet-600 dark:text-violet-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Visit page →
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* XML Sitemap Link */}
        <motion.div variants={itemVariants} className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700/50 rounded-xl">
          <p className="text-sm text-slate-800 dark:text-slate-200 mb-2">For search engines:</p>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
          >
            <FaFileAlt /> View XML Sitemap
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
