'use client';

import { useState } from 'react';
import { FaMoneyCheck } from 'react-icons/fa';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, you'd send this to a backend endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-max py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold mb-8">Get In Touch</h1>

        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          Have a project in mind or just want to say hi? Feel free to reach out using the form below.
          I'll get back to you as soon as possible!
        </p>

        {submitted && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-800 dark:text-green-200 p-4 rounded-lg mb-6">
            ✓ Thanks for your message! I'll get back to you soon.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Your name"
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
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="your.email@example.com"
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
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="What is this about?"
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
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Tell me more..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Message'}
            {!loading && <FaMoneyCheck />}
          </button>
        </form>

        {/* Alternative Contact Methods */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6">Other Ways to Reach Me</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-lg mb-2">Email</h3>
              <a href="mailto:your-email@example.com" className="text-blue-600 hover:underline">
                your-email@example.com
              </a>
            </div>
            <div className="card">
              <h3 className="font-bold text-lg mb-2">GitHub</h3>
              <a href="https://github.com/yourusername" target="https://github.com/SRK-RAJU" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                @yourusername
              </a>
            </div>
            <div className="card">
              <h3 className="font-bold text-lg mb-2">LinkedIn</h3>
              <a href="https://linkedin.com" target="https://www.linkedin.com/in/srajukumargoud" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Your LinkedIn Profile
              </a>
            </div>
            <div className="card">
              <h3 className="font-bold text-lg mb-2">Twitter</h3>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                @yourhandle
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
