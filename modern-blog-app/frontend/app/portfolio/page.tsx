'use client';

import { FaGithub, FaExternalLinkAlt, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string[];
  link?: string;
  github?: string;
  image?: string;
}

// Fallback projects if API fails
const FALLBACK_PROJECTS: Project[] = [
  {
    id: 1,
    title: 'Personal Tech Blog Platform',
    description: 'Modern full-stack blog platform with real-time analytics, content management, and advanced security. Features SEO optimization, responsive design, and secure authentication.',
    technologies: ['Next.js 13+', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Cloudflare', 'Vercel'],
    link: 'https://rjexa.com',
    github: 'https://github.com/SRK-RAJU/Personal-Site-SRK',
    image: '/projects/blog.svg',
  },
  {
    id: 2,
    title: 'Local Kirana Shop - E-commerce Platform',
    description: 'Full-featured e-commerce solution with shopping cart, product management, inventory tracking, and secure payment integration. Mobile-responsive design for better UX.',
    technologies: ['React', 'Next.js', 'TypeScript', 'PostgreSQL', 'Supabase', 'Tailwind CSS', 'Payment Integration'],
    link: 'https://jayalakshmikiranashop.vercel.app',
    github: 'https://github.com/SRK-RAJU',
    image: '/projects/ecommerce.svg',
  },
  {
    id: 3,
    title: 'Facility Management System (ZiSpark)',
    description: 'Enterprise-grade facility management system for maintenance operations, scheduling, resource allocation, and team management. Built for professional service providers with real-time tracking.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Real-time Updates'],
    link: 'https://zispark-services.vercel.app/',
    github: 'https://github.com/SRK-RAJU',
    image: '/projects/tasks.svg',
  },
];

export default function Portfolio() {
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PROJECTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Try to fetch from API first
        const response = await axios.get('/api/projects?limit=20', {
          timeout: 5000
        });
        
        if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          setProjects(response.data.data);
        } else {
          // Use fallback if no API data
          setProjects(FALLBACK_PROJECTS);
        }
      } catch (err) {
        console.warn('Could not fetch projects from API, using defaults:', err);
        // Use fallback projects
        setProjects(FALLBACK_PROJECTS);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <div className="container-max py-12">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 mb-8 font-semibold transition-colors"
      >
        <FaArrowLeft className="text-sm" />
        Back to Home
      </Link>

      {/* Heading */}
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
          My Projects
        </h1>
        <p className="text-xl text-slate-900 dark:text-slate-200 font-semibold">
          Selected projects showcasing my skills in full-stack development and cloud engineering. All projects are actively maintained and regularly updated. Check them out and share your feedback!
        </p>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading projects...</p>
        </div>
      ) : projects.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {projects.map((project: Project, idx: number) => (
            <motion.div 
              key={project.id} 
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
            >
              {project.image && (
                <div className="w-full h-48 bg-gradient-to-br from-violet-500/20 to-pink-500/20 rounded-lg mb-4 overflow-hidden border-2 border-violet-500/30 hover:border-violet-500/60 transition-all relative">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    unoptimized
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                    }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}

              <h2 className="text-2xl font-bold mb-2">{project.title}</h2>

              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {project.description}
              </p>

              {/* Technologies */}
              {project.technologies?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Tech Stack
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech: string) => (
                      <span
                        key={tech}
                        className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="flex gap-3 mt-auto pt-4">
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors flex-1"
                  >
                    <FaExternalLinkAlt className="text-sm" />
                    View Live
                  </a>
                )}
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1"
                  >
                    <FaGithub className="text-sm" />
                    GitHub
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <p className="text-slate-600 dark:text-slate-400">No projects available yet.</p>
        </div>
      )}
    </div>
  );
}
