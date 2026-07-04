'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

const lastUpdated = 'May 17, 2026';

export default function Privacy() {
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
      title: 'About this site',
      content: `This website is a personal tech blog built to share AI-generated content, cloud engineering insights, and production-ready development practices.`,
    },
    {
      title: 'What I collect',
      content: `I only collect information you choose to share. If you use the contact form, I receive your name, email, subject, and message. I may also collect anonymous site usage data to improve performance and stability.`,
    },
    {
      title: 'Why I use it',
      content: `Contact form details are used only to reply to your message. Anonymous usage data helps improve the site experience and keep the site secure. I do not sell or use your data for advertising.`,
    },
    {
      title: 'Third-party services',
      content: `This site runs on platforms like Vercel and Supabase. These providers have their own privacy policies. This site does not use advertising trackers or third-party marketing tools.`,
    },
    {
      title: 'Your choices',
      content: `If you want your information removed or corrected, email contact@rjexa.com. I will respond to reasonable requests as quickly as possible.`,
    },
    {
      title: 'Children',
      content: `This site is not intended for children under 13. I do not knowingly collect information from minors.`,
    },
  ];

  return (
    <div className="container-max py-10 sm:py-12 lg:py-16">
      <motion.div
        className="mx-auto max-w-5xl rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70 sm:p-8 lg:p-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors"
          >
            <FaArrowLeft className="text-sm" />
            Back to Home
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-10 rounded-[1.5rem] border border-violet-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.15),_transparent_34%),linear-gradient(135deg,_rgba(248,250,252,0.95),_rgba(239,246,255,0.92))] p-8 shadow-lg shadow-violet-500/10 dark:border-violet-800/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.2),_transparent_34%),linear-gradient(135deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.92))] sm:p-10">
          <h1 className="mb-4 text-5xl font-bold text-slate-900 dark:text-white sm:text-6xl">Privacy Policy</h1>
          <p className="text-lg text-slate-800 dark:text-slate-200">Last Updated: {lastUpdated}</p>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="rounded-[1.25rem] border border-violet-200/70 bg-white/80 p-6 shadow-lg shadow-violet-500/10 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70"
            >
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                {section.title}
              </h2>
              <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {section.content}
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-10 rounded-[1.5rem] border border-white/70 bg-white/70 p-8 text-center shadow-lg shadow-violet-500/10 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70"
        >
          <p className="text-slate-800 dark:text-slate-200 mb-4">
            Have questions about our privacy practices?
          </p>
          <Link
            href="/contact"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            Get in Touch
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
