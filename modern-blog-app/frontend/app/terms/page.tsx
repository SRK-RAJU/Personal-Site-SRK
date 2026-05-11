'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

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
    { title: '1. Agreement', content: `By using this personal tech blog, you accept these terms.` },
    { title: '2. Use', content: `Content is for personal use only — don’t copy, sell, or misuse.` },
    { title: '3. Disclaimer', content: `We provide content “as is” without guarantees.` },
    { title: '4. Limitations', content: `We’re not responsible for damages from using our site.` },
    { title: '5. Accuracy', content: `Content may have errors; we can update anytime.` },
    { title: '6. Links', content: `External links aren’t endorsed; use at your own risk.` },
    { title: '7. Changes', content: `We may update these terms anytime.` },
    { title: '8. Law', content: `These terms follow applicable law.` },
    { title: '9. User Conduct', content: `Don’t break laws, disrupt the site, or post harmful content.` },
    { title: '10. Contact', content: `Email us at contact@rjexa.com for questions.` },
  ];

  return (
    <div className="container-max py-12">
      <motion.div
        className="max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Back Button */}
        <motion.div variants={itemVariants} className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold transition-colors"
          >
            <FaArrowLeft className="text-sm" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants} className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants} className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                {section.title}
              </h2>
              <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {section.content}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          variants={itemVariants}
          className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 text-center"
        >
          <p className="text-slate-600 dark:text-slate-400 mb-4">
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
