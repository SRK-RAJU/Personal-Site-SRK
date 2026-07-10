'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaArrowLeft } from 'react-icons/fa';

export default function Contact() {
  const questions = [
    { question: 'What is 7 + 2?' },
    { question: 'What is 5 + 4?' },
    { question: 'What is 3 + 6?' },
    { question: 'What is 8 + 1?' },
    { question: 'What is 4 + 5?' },
    { question: 'What is 6 - 2?' },
    { question: 'What is 4 - 1?' },
    { question: 'What is 3 * 2?' },
    { question: 'What is 2 × 4?' },
  ];

  const [captchaQuestion, setCaptchaQuestion] = useState(() => {
    const item = questions[Math.floor(Math.random() * questions.length)];
    return item.question.trim();
  });

  const chooseCaptchaQuestion = () => {
    const item = questions[Math.floor(Math.random() * questions.length)];
    setCaptchaQuestion(item.question.trim());
    setFormData((prev) => ({ ...prev, captchaAnswer: '' }));
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '',
    captchaAnswer: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, captchaQuestion }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to send message. Please try again.');
        return;
      }

      const result = await response.json();
      if (result.message) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '', website: '', captchaAnswer: '' });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="page-wrapper">
      <motion.div 
        className="page-frame max-w-6xl" 
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
          <h1 className="mb-4 text-5xl font-bold text-slate-900 dark:text-white sm:text-6xl">Get In Touch</h1>
          <p className="text-lg text-slate-800 dark:text-slate-200">
            Have a project, question, or just want to discuss Anything? I'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="page-panel space-y-6 sm:p-8">
              {submitted && (
                <div role="status" aria-live="polite" className="bg-violet-100 dark:bg-violet-900 border border-violet-400 dark:border-violet-700 text-violet-800 dark:text-violet-200 p-4 rounded-lg flex items-center gap-2">
                  <span className="text-xl">✓</span>
                  <span>Thanks for your message! I'll get back to you shortly.</span>
                </div>
              )}

              {error && (
                <div role="status" aria-live="polite" className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 p-4 rounded-lg">
                  {error}
                </div>
              )}

              <input
                type="hidden"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                autoComplete="off"
                aria-hidden="true"
                style={{ display: 'none' }}
              />
              <input
                type="hidden"
                id="captchaQuestion"
                name="captchaQuestion"
                value={captchaQuestion}
              />

              {/* Name */}
              <div>
                <label htmlFor="name" className="block font-semibold text-slate-900 dark:text-white mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block font-semibold text-slate-900 dark:text-white mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="john@example.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block font-semibold text-slate-900 dark:text-white mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Technical discussion, feedback, or question"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block font-semibold text-slate-900 dark:text-white mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  placeholder="Tell me about your question, idea, or feedback..."
                />
              </div>

              {/* Human verification */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <label htmlFor="captchaAnswer" className="block font-semibold text-slate-900 dark:text-white">
                    <span>{captchaQuestion}</span>{' '}
                    <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={chooseCaptchaQuestion}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    Try another one
                  </button>
                </div>
                <input
                  type="text"
                  id="captchaAnswer"
                  name="captchaAnswer"
                  value={formData.captchaAnswer}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Enter the answer"
                  aria-label="Human verification answer"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <FaPaperPlane />
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="page-panel">
              <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Contact Information</h3>

              {/* Email */}
              <div className="mb-6 flex gap-3">
                <div className="text-blue-600 flex-shrink-0 mt-1">
                  <FaEnvelope size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Email</p>
                  <a href="mailto:contact@rjexa.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                    contact@rjexa.com
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="mb-6 flex gap-3">
                <div className="text-blue-600 flex-shrink-0 mt-1">
                  <FaMapMarkerAlt size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Location</p>
                  <p className="text-slate-800 dark:text-slate-200">Hyderabad, India</p>
                </div>
              </div>
            </div>

            {/* FAQ Box */}
            <div className="page-panel">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Quick Facts</h3>
              <ul className="space-y-2 text-sm text-slate-800 dark:text-slate-200">
                <li>✓ Response time: 24-48 hours</li>
                <li>✓ Open to technical discussions</li>
                <li>✓ Happy to connect on open-source ideas</li>
                <li>✓ Cloud, DevOps & security topics</li>
                <li>✓ AWS certified</li>
                <li>✓ Based in India (IST)</li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Personal Topics */}
        <motion.section variants={itemVariants} className="page-panel mt-10 sm:p-8">
          <h2 className="text-2xl font-bold mb-6">Topics I Explore</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Infrastructure as Code (IaC)',
              'CI/CD Pipeline Design',
              'Kubernetes & Containerization',
              'Cloud Architecture Patterns',
              'Performance Optimization',
              'Monitoring & Observability',
              'Security Best Practices',
              'Cost Optimization',
              'Automation Workflows',
              'Developer Tooling',
              'Open-source collaboration',
              'Technical writing',
              'Cloud migration learnings',
            ].map((topic, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-slate-900 dark:text-white font-medium">• {topic}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}