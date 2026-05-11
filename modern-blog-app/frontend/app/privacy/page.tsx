'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

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
    { title: '1. Introduction', content: `Your privacy matters. By using this personal tech blog, you agree to this policy.` },
    { title: '2. Information We Collect', content: `We collect details you provide (like name, email) and basic usage data (like IP, pages visited).` },
    { title: '3. Use of Information', content: `We use your data to reply, improve our site, and keep it secure.` },
    { title: '4. Data Security', content: `We store data securely, but no online service is 100% safe. but even protection from Cloudflare` },
    { title: '5. Third-Party Services', content: `We use services like Supabase and Vercel, each with their own policies.` },
    { title: '6. Cookies', content: `We use cookies to improve your experience; you can manage them in your browser.` },
    { title: '7. Children’s Privacy', content: `Our site is not for children under 13, and we don’t collect their data.` },
    { title: '8. Your Rights', content: `You can ask us to see, correct, or delete your data by emailing contact@rjexa.com.` },
    { title: '9. Policy Updates', content: `We may update this policy anytime; check the “Last Updated” date.` },
    { title: '10. Contact', content: `Email us at contact@rjexa.com for privacy questions.` },
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
          <h1 className="text-5xl sm:text-6xl font-bold mb-4">Privacy Policy</h1>
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
