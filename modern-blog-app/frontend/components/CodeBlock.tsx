'use client';

import { motion } from 'framer-motion';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export default function CodeBlock({
  code,
  language = 'code',
  title = 'Code Example',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <motion.div
      className="card-glass border border-cyan-500/30 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20">
        <div>
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {title}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{language}</p>
        </div>
        <motion.button
          onClick={handleCopy}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <FaCheck className="text-sm text-green-600" />
          ) : (
            <FaCopy className="text-sm" />
          )}
        </motion.button>
      </div>

      {/* Code */}
      <pre className="overflow-x-auto p-4 sm:p-6 text-xs sm:text-sm text-slate-100 bg-slate-950 dark:bg-slate-900">
        <code className="font-mono">{code}</code>
      </pre>
    </motion.div>
  );
}
