'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

const lastUpdated = 'May 16, 2026';

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
      title: '1. Introduction',
      content: `This website is a personal branding portfolio and technology blog operated by Raju SRK. It is intended to showcase experience, projects, and technical insights.`,
    },
    {
      title: '2. Information We Collect',
      content: `We do not collect personal information unless you voluntarily provide it. If you use the contact form, we collect your name, email address, subject, and message so we can respond. We may also record basic anonymous usage data, such as page views and browser metadata, to help improve the site experience.`,
    },
    {
      title: '3. How We Use Information',
      content: `We use contact form information to reply to your message and improve our site. We use anonymous usage data to monitor site performance and maintain a secure, stable experience. We do not sell or share personal data for marketing or advertising purposes.`,
    },
    {
      title: '4. Cookies and Tracking',
      content: `This site does not use advertising trackers. Browser cookies or local storage may be used only for essential site functionality and session behavior when logging in or using site features. You may manage cookies through your browser settings.`,
    },
    {
      title: '5. Third-Party Services',
      content: `This site relies on third-party services such as Supabase and Vercel to host and process data. These providers have their own privacy policies, and we recommend reviewing them independently. We do not use analytics services for advertising.`,
    },
    {
      title: '6. Data Retention',
      content: `Contact form messages are retained only as long as necessary to respond and maintain the site. Contact details are not used for unsolicited communications. If you request data deletion, we will handle it promptly upon receipt of a valid request.`,
    },
    {
      title: '7. Your Rights',
      content: `If you have questions about the information you provide, you may request access, correction, or deletion by emailing contact@rjexa.com. We will respond as quickly as possible to reasonable requests.`,
    },
    {
      title: '8. Children’s Privacy',
      content: `This site is not directed at children under 13. We do not knowingly collect information from minors. If you believe a child has provided information, please contact us and we will remove it.`,
    },
    {
      title: '9. Personal Branding Statement',
      content: `This website is a personal portfolio and blog. Content is shared for learning and branding purposes.`,
    },
    {
      title: '10. Contact',
      content: `For privacy questions or requests, email contact@rjexa.com.`,
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
          <h1 className="text-5xl sm:text-6xl font-bold mb-4">Privacy Policy</h1>
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
