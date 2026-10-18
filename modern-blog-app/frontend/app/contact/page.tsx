'use client';

import { useEffect, useState } from 'react';
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

  // Start with a fixed question so the server and client render the same HTML; the random one is picked after mount.
  const [captchaQuestion, setCaptchaQuestion] = useState(questions[0].question.trim());

  useEffect(() => {
    const item = questions[Math.floor(Math.random() * questions.length)];
    setCaptchaQuestion(item.question.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            className="inline-flex items-center gap-2 font-semibold text-[rgb(var(--accent-rgb))] transition-opacity hover:opacity-80"
          >
            <FaArrowLeft className="text-sm" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants} className="page-hero">
          <h1 className="gradient-text mb-4 text-5xl font-bold sm:text-6xl">Get In Touch</h1>
          <p className="text-lg text-[var(--fg-muted)]">
            Have a project, question, or just want to discuss Anything? I'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="page-panel space-y-6 sm:p-8">
              {submitted && (
                <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
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
                <label htmlFor="name" className="mb-2 block font-semibold text-[rgb(var(--fg-rgb))]">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="field"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 block font-semibold text-[rgb(var(--fg-rgb))]">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="field"
                  placeholder="john@example.com"
                />
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="mb-2 block font-semibold text-[rgb(var(--fg-rgb))]">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="field"
                  placeholder="Technical discussion, feedback, or question"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="mb-2 block font-semibold text-[rgb(var(--fg-rgb))]">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="field min-h-36 resize-y"
                  placeholder="Tell me about your question, idea, or feedback..."
                />
              </div>

              {/* Human verification */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <label htmlFor="captchaAnswer" className="block font-semibold text-[rgb(var(--fg-rgb))]">
                    <span>{captchaQuestion}</span>{' '}
                    <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={chooseCaptchaQuestion}
                    className="rounded text-sm text-[rgb(var(--accent-rgb))] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-rgb))]"
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
                  className="field"
                  placeholder="Enter the answer"
                  aria-label="Human verification answer"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaPaperPlane />
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.div>

          {/* Contact Information */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="page-panel">
              <h3 className="mb-6 text-xl font-bold text-[rgb(var(--fg-rgb))]">Contact Information</h3>

              {/* Email */}
              <div className="mb-6 flex gap-3">
                <div className="mt-1 flex-shrink-0 text-[rgb(var(--accent-rgb))]">
                  <FaEnvelope size={20} />
                </div>
                <div>
                  <p className="font-semibold text-[rgb(var(--fg-rgb))]">Email</p>
                  <a href="mailto:contact@rjexa.com" className="text-[rgb(var(--accent-rgb))] hover:underline">
                    contact@rjexa.com
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="mb-6 flex gap-3">
                <div className="mt-1 flex-shrink-0 text-[rgb(var(--accent-rgb))]">
                  <FaMapMarkerAlt size={20} />
                </div>
                <div>
                  <p className="font-semibold text-[rgb(var(--fg-rgb))]">Location</p>
                  <p className="text-[var(--fg-muted)]">Hyderabad, India</p>
                </div>
              </div>
            </div>

            {/* FAQ Box */}
            <div className="page-panel">
              <h3 className="mb-4 text-lg font-bold text-[rgb(var(--fg-rgb))]">Quick Facts</h3>
              <ul className="space-y-2 text-sm text-[var(--fg-muted)]">
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
          <h2 className="mb-6 text-2xl font-bold text-[rgb(var(--fg-rgb))]">Topics I Explore</h2>
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
              <div key={idx} className="page-panel !p-3">
                <p className="font-medium text-[rgb(var(--fg-rgb))]">• {topic}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}