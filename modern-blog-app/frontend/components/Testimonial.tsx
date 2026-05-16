'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaStar } from 'react-icons/fa';

interface TestimonialProps {
  text: string;
  author: string;
  role: string;
  avatar?: string;
  rating?: number;
  company?: string;
}

export default function Testimonial({
  text,
  author,
  role,
  avatar,
  rating = 5,
  company,
}: TestimonialProps) {
  return (
    <motion.div
      className="card-glass card-gradient h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <FaStar className="text-yellow-400" />
          </motion.div>
        ))}
      </div>

      {/* Text */}
      <p className="text-slate-800 dark:text-slate-200 mb-6 flex-1 text-sm leading-relaxed italic">
        "{text}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        {avatar && (
          <Image
            src={avatar}
            alt={author}
            width={40}
            height={40}
            className="rounded-full object-cover border-2 border-violet-500"
          />
        )}
        <div className="flex-1">
          <p className="font-bold text-slate-900 dark:text-white text-sm">{author}</p>
          <p className="text-xs text-slate-800 dark:text-slate-200">
            {role}
            {company && ` @ ${company}`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
