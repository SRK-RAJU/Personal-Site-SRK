'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

const lastUpdated = 'May 17, 2026';

export default function Terms() {
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

  const sections = [
    {
      title: 'Welcome',
      content: `This is a personal tech blog. It exists to show my journey, experience, and technical learning.`,
    },
    {
      title: 'How to use the site',
      content: `You may use the site for browsing, learning, and contacting me. Please do not disrupt the site or use it in any harmful way.`,
    },
    {
      title: 'Contact messages',
      content: `When you send a message, I use it only to reply and manage communication. I do not send marketing from the contact form.`,
    },
    {
      title: 'Content and links',
      content: `Content is shared for learning and personal reference. I cannot guarantee it is always correct. External links are provided for convenience only.`,
    },
    {
      title: 'Updates',
      content: `I may update the site and these terms from time to time. Continued use after changes means you accept them.`,
    },
    {
      title: 'Questions',
      content: `If you have questions, email contact@rjexa.com.`,
    },
  ];

  return (
    <div className="page-wrapper">
      <motion.div
        className="page-frame max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80"
          >
            <FaArrowLeft className="text-sm" />
            Back to Home
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="page-hero">
          <h1 className="gradient-text mb-4 text-5xl font-bold sm:text-6xl">Terms of Service</h1>
          <p className="text-lg text-[var(--fg-muted)]">Last Updated: {lastUpdated}</p>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="page-panel">
              <h2 className="mb-4 text-2xl font-bold text-[rgb(var(--fg-rgb))]">
                {section.title}
              </h2>
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-[var(--fg-muted)]">
                {section.content}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="page-panel mt-10 text-center sm:p-8"
        >
          <p className="mb-4 text-[var(--fg-muted)]">
            Questions about these terms? Reach out.
          </p>
          <Link
            href="/contact"
            className="btn-primary"
          >
            Contact Us
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
