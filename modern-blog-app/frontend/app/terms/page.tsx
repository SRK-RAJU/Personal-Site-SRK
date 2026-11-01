'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

const lastUpdated = 'November 1, 2026';

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
      content: `Content is shared for learning and personal reference. Some reports use AI assistance and may contain errors or omissions; they are not security, legal, financial, medical, or other professional advice. Verify product setup and security details against current official sources before acting. External links are provided for convenience only. Product and company names belong to their respective owners and are used only to identify products; this site is independent and does not imply vendor sponsorship or endorsement. We do not reproduce vendor documentation, logos, screenshots, or other artwork as our own; any quotations or third-party material remain subject to their own notices and terms.`,
    },
    {
      title: 'Tool guides',
      content: `Tool and category guides are original editorial explanations intended for education. They are not vendor manuals or a promise that a feature is available in every product edition or version. Links identify sources used for checking; always verify current setup, pricing, licenses, and limitations in the vendor's official documentation. Contact the respective rights holder before reproducing vendor documentation, logos, screenshots, or other protected material.`,
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
