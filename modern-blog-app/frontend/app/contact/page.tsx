'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLinkedin, FaGithub, FaPhone, FaMapMarkerAlt, FaPaperPlane, FaArrowLeft } from 'react-icons/fa';
import { supabase } from '@/lib/supabaseClient';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Submit to Supabase just like existing code does
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
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
            className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition-colors"
          >
            <FaArrowLeft className="text-sm" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants} className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4">Get In Touch</h1>
          <p className="text-lg text-slate-800 dark:text-slate-200">
            Have a project, question, or just want to discuss Anything? I'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitted && (
                <div className="bg-violet-100 dark:bg-violet-900 border border-violet-400 dark:border-violet-700 text-violet-800 dark:text-violet-200 p-4 rounded-lg flex items-center gap-2">
                  <span className="text-xl">✓</span>
                  <span>Thanks for your message! I'll get back to you shortly.</span>
                </div>
              )}

              {error && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 p-4 rounded-lg">
                  {error}
                </div>
              )}

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
                  placeholder="DevOps consulting project"
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
                  placeholder="Tell me about your project or inquiry..."
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
            <div className="bg-blue-50 dark:bg-slate-800 p-6 rounded-lg border border-blue-200 dark:border-slate-700">
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

              {/* Social Links */}
              <div className="mt-8 pt-6 border-t border-blue-200 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-white mb-4">Connect With Me</p>
                <div className="flex gap-4">
                  <a 
                    href="https://github.com/SRK-RAJU" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-3 rounded-lg hover:scale-110 transition"
                  >
                    <FaGithub size={20} />
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/srajukumargoud/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-blue-700 text-white p-3 rounded-lg hover:scale-110 transition"
                  >
                    <FaLinkedin size={20} />
                  </a>
                  <a 
                    href="mailto:contact@rjexa.com"
                    className="bg-red-600 text-white p-3 rounded-lg hover:scale-110 transition"
                  >
                    <FaEnvelope size={20} />
                  </a>
                </div>
              </div>
            </div>

            {/* FAQ Box */}
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Quick Facts</h3>
              <ul className="space-y-2 text-sm text-slate-800 dark:text-slate-200">
                <li>✓ Response time: 24-48 hours</li>
                <li>✓ Available for consulting</li>
                <li>✓ Open to freelance projects</li>
                <li>✓ DevOps expertise</li>
                <li>✓ AWS certified</li>
                <li>✓ Based in India (IST)</li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Additional Services */}
        <motion.section variants={itemVariants} className="mt-12 pt-12 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6">What I Can Help With</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Infrastructure as Code (IaC)',
              'CI/CD Pipeline Setup',
              'Kubernetes Deployment',
              'Cloud Architecture Review',
              'Performance Optimization',
              'Monitoring & Observability',
              'Security Hardening',
              'Cost Optimization',
              'DevOps Consulting',
              'Automation Scripting',
              'Operations Support',
              'Testing',
              'Cloud Migration',
            ].map((service, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-slate-900 dark:text-white font-medium">• {service}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}