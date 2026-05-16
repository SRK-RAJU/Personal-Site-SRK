'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

const lastUpdated = 'May 16, 2026';

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
      title: '1. Agreement',
      content: `By using this personal portfolio site, you agree to these terms. This website is operated for personal branding, project showcase, and technology blog purposes only.`,
    },
    {
      title: '2. Personal Branding Only',
      content: `This site is a personal branding and information platform.`,
    },
    {
      title: '3. Acceptable Use',
      content: `You may use this site for lawful, personal, and informational purposes. You may not disrupt, reverse engineer, scrape, or misuse the site, and you may not submit harmful or abusive content through contact forms or other features.`,
    },
    {
      title: '4. Contact Messages',
      content: `When you submit a contact message, we may use that information only to respond and manage communications. We do not use contact submissions for unsolicited marketing.`,
    },
    {
      title: '5. Intellectual Property',
      content: `All content, design, and code on this site are the property of the site owner unless otherwise noted. You may view and share links to the site, but you may not copy or reproduce content without permission.`,
    },
    {
      title: '6. Disclaimers',
      content: `Content is provided “as is” for educational and informational purposes only. We make no warranties about accuracy, completeness, or suitability. Visitors should verify any information independently before relying on it.`,
    },
    {
      title: '7. Limitation of Liability',
      content: `To the maximum extent permitted by law, the site owner is not responsible for direct, indirect, incidental, or consequential losses resulting from the use of this site.`,
    },
    {
      title: '8. External Links',
      content: `The site may include links to third-party websites. These links are provided for convenience and do not constitute an endorsement. Use external sites at your own risk.`,
    },
    {
      title: '9. Changes',
      content: `These terms may be updated at any time. Continued use of the site after changes indicates acceptance of the updated terms.`,
    },
    {
      title: '10. Governing Law',
      content: `These terms are governed by applicable law in India. If a court finds any provision invalid, the remaining provisions will continue to apply.`,
    },
    {
      title: '11. Contact',
      content: `For questions about these terms, email contact@rjexa.com.`,
    },
  ];

  return (
    <div className="container-max py-12">
      <motion.div
        className="max-w-4xl mx-auto"
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

        <motion.div variants={itemVariants} className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-slate-800 dark:text-slate-200">Last Updated: {lastUpdated}</p>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700"
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
          className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 text-center"
        >
          <p className="text-slate-800 dark:text-slate-200 mb-4">
            Questions about our terms? Let us know.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            Contact Us
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
