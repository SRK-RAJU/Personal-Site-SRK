'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaAward, 
  FaCloud, 
  FaTools, 
  FaCode, 
  FaDatabase, 
  FaRocket,
  FaArrowLeft
} from 'react-icons/fa';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function About() {
  return (
    <div className="container-max py-10 sm:py-12 lg:py-16">
      <motion.div 
        className="mx-auto max-w-6xl rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70 sm:p-8 lg:p-12" 
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

        {/* Header - Combined Names */}
        <motion.div variants={itemVariants} className="mb-10 rounded-[1.5rem] border border-violet-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.15),_transparent_34%),linear-gradient(135deg,_rgba(248,250,252,0.95),_rgba(239,246,255,0.92))] p-8 shadow-lg shadow-violet-500/10 dark:border-violet-800/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.2),_transparent_34%),linear-gradient(135deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.92))] sm:p-10">
          <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-purple-600 bg-clip-text text-transparent sm:text-6xl">
            Raju
          </h1>
          <h2 className="mb-2 text-2xl font-semibold text-slate-800 dark:text-slate-200">
            Full-Stack Developer, DevOps, Security & Cloud Engineer
          </h2>
          <p className="mb-4 text-lg font-semibold text-violet-600 dark:text-violet-400">
            Personal Tech Blog & AI Content Platform
          </p>
          <p className="text-lg text-slate-800 dark:text-slate-200">
            Building modern web applications and cloud solutions with a focus on performance and security.
          </p>
        </motion.div>

        {/* About & Journey Section */}
        <motion.section variants={itemVariants} className="mb-10 rounded-[1.5rem] border border-white/70 bg-white/80 p-8 shadow-lg shadow-violet-500/10 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FaRocket className="text-blue-600" /> My Story
          </h2>
          <div className="space-y-4 text-slate-800 dark:text-slate-200 leading-relaxed">
            <p className="text-lg">
              Hi! I'm <strong>Raju</strong>. I build practical web apps, cloud systems, and secure DevOps solutions that help people get work done.
            </p>
            <p>
              I started out real-world problems, focusing on performance, optimization, security and scalability to create simple tools that actually worked. Since then, I’ve grown into cloud, automation, and security work while keeping them easy to use.
            </p>
            <p>
              My work now focuses on AI-generated posts, cloud engineering, and practical production-grade technology solutions.
            </p>
            <p className="italic text-slate-800 dark:text-slate-200">
              This page shares what I learned and what I build and why I build it. If you have a project idea or need a technical conversation, I’d love to hear from you.
            </p>
          </div>
        </motion.section>

        {/* Skills Grid - Comprehensive Tech Stack */}
        <motion.section variants={itemVariants} className="mb-12">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <FaTools className="text-blue-600" /> Skills & Expertise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Cloud & DevOps */}
            <div className="rounded-[1.25rem] border border-violet-200/70 bg-[linear-gradient(135deg,_rgba(248,250,252,0.95),_rgba(239,246,255,0.92))] p-6 shadow-lg shadow-violet-500/10 dark:border-violet-800/40 dark:bg-[linear-gradient(135deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.92))]">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <FaCloud className="text-blue-500" /> Cloud & Infrastructure
              </h3>
              <ul className="grid grid-cols-1 gap-2 text-slate-800 dark:text-slate-200 text-sm">
                <li>• AWS (EC2, S3, RDS, Lambda, Route53)</li>
                <li>• Azure (VMs, App Service, DevOps, AKS)</li>
                <li>• Google Cloud Platform (GCP)</li>
                <li>• Terraform (Infrastructure as Code)</li>
                <li>• Kubernetes & Container Orchestration</li>
                <li>• Docker & Docker Compose</li>
                <li>• Ansible Configuration Management</li>
                <li>• CI/CD (Jenkins, GitLab, GitHub Actions, Azure DevOps)</li>
                <li>• Git & Version Control</li>
                <li>• Linux/Unix System Administration</li>
              </ul>
            </div>

            {/* Full-Stack Development */}
            <div className="rounded-[1.25rem] border border-violet-200/70 bg-[linear-gradient(135deg,_rgba(248,250,252,0.95),_rgba(239,246,255,0.92))] p-6 shadow-lg shadow-violet-500/10 dark:border-violet-800/40 dark:bg-[linear-gradient(135deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.92))]">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <FaCode className="text-purple-500" /> Full-Stack Development
              </h3>
              <ul className="grid grid-cols-1 gap-2 text-slate-800 dark:text-slate-200 text-sm">
                <li>• React & Next.js 13+ Frontend</li>
                <li>• Node.js & Express.js Backend</li>
                <li>• TypeScript (Frontend & Backend)</li>
                <li>• PostgreSQL & Database Optimization</li>
                <li>• MongoDB & NoSQL Databases</li>
                <li>• Supabase & Real-time APIs</li>
                <li>• REST APIs & GraphQL</li>
                <li>• Tailwind CSS & UI Design</li>
                <li>• Python (Backend & Scripting)</li>
                <li>• Vercel & Cloud Deployment</li>
              </ul>
            </div>

            {/* Security & DevOps */}
            <div className="rounded-[1.25rem] border border-violet-200/70 bg-[linear-gradient(135deg,_rgba(248,250,252,0.95),_rgba(239,246,255,0.92))] p-6 shadow-lg shadow-violet-500/10 dark:border-violet-800/40 dark:bg-[linear-gradient(135deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.92))]">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <FaDatabase className="text-red-500" /> Security & DevOps
              </h3>
              <ul className="grid grid-cols-1 gap-2 text-slate-800 dark:text-slate-200 text-sm">
                <li>• Zscaler Zero Trust Security</li>
                <li>• Cloudflare CDN & Security</li>
                <li>• Networking (DNS, SMTP, HTTP/HTTPS)</li>
                <li>• VPN & OpenVPN Configuration</li>
                <li>• Microsoft Entra ID (formerly AAD)</li>
                <li>• Active Directory Management</li>
                <li>• Monitoring (Grafana & Prometheus)</li>
                <li>• Logging & Analytics</li>
                <li>• Data Protection & Encryption</li>
                <li>• VS Code & Development Tools</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Certifications */}
        <motion.section variants={itemVariants} className="mb-10 rounded-[1.5rem] border border-white/70 bg-white/80 p-8 shadow-lg shadow-violet-500/10 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-900/70">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
            <FaAward className="text-yellow-600" /> Certifications & Credentials
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="border-l-4 border-yellow-600 bg-slate-50 p-4 dark:bg-slate-800/30">
              <h3 className="font-semibold dark:text-white">AWS Certified</h3>
              <p className="text-sm text-slate-800 dark:text-slate-200">Solutions Architect</p>
            </div>
            <div className="border-l-4 border-blue-500 bg-slate-50 p-4 dark:bg-slate-800/30">
              <h3 className="font-semibold dark:text-white">Azure Certified</h3>
              <p className="text-sm text-slate-800 dark:text-slate-200">AZ-900, AZ-104</p>
            </div>
            <div className="border-l-4 border-red-600 bg-slate-50 p-4 dark:bg-slate-800/30">
              <h3 className="font-semibold dark:text-white">GCP Certified</h3>
              <p className="text-sm text-slate-800 dark:text-slate-200">Associate Cloud Engineer & DevOps Professional</p>
            </div>
            <div className="border-l-4 border-gray-700 bg-slate-50 p-4 dark:bg-slate-800/30">
              <h3 className="font-semibold dark:text-white">GitHub Foundations</h3>
              <p className="text-sm text-slate-800 dark:text-slate-200">GitHub Certified Foundations</p>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          variants={itemVariants} 
          className="mb-10 rounded-[1.75rem] bg-[linear-gradient(135deg,_rgba(124,58,237,0.95),_rgba(59,130,246,0.95),_rgba(236,72,153,0.95))] p-8 text-center text-white shadow-2xl shadow-violet-500/20 sm:text-left lg:p-10"
        >
          <h2 className="text-3xl font-bold mb-4">Let's Connect</h2>
          <p className="mb-8 text-blue-100 max-w-2xl">
            Feel free to reach out if you want to discuss web development, share ideas, or just chat about tech. I'm always open to technical conversations and learning opportunities.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4">
            <Link 
              href="/contact" 
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Send an Email
            </Link>
          </div>
        </motion.section>

        {/* Complete Tech Stack Section */}
        <motion.section variants={itemVariants} className="mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Complete DevSecOps Stack
          </h2>

          {/* Logo Row - Cloud, DevOps, Security, Development */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {/* Cloud Logo */}
            <div className="flex flex-col items-center rounded-[1.25rem] border border-violet-200/70 bg-[linear-gradient(135deg,_rgba(248,250,252,0.95),_rgba(239,246,255,0.92))] p-4 shadow-lg shadow-violet-500/10 transition-transform hover:scale-105 dark:border-violet-800/40 dark:bg-[linear-gradient(135deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.92))]">
              <div className="w-20 h-20 mb-3">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <defs>
                    <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#87CEEB', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#4A90E2', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="95" fill="#1a1a2e" stroke="url(#cloudGrad)" strokeWidth="3"/>
                  <path d="M 60 110 Q 40 110 35 95 Q 30 80 45 70 Q 60 65 70 70 Q 80 60 95 65 Q 105 70 105 85 L 105 110 Z" fill="url(#cloudGrad)" stroke="#4A90E2" strokeWidth="2"/>
                  <text x="100" y="160" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#87CEEB" fontFamily="Arial, sans-serif">Cloud</text>
                </svg>
              </div>
              <p className="text-sm font-bold text-center text-slate-900 dark:text-white">AWS, Azure, GCP, Supabase</p>
            </div>

            {/* DevOps Logo */}
            <div className="flex flex-col items-center rounded-[1.25rem] border border-violet-200/70 bg-[linear-gradient(135deg,_rgba(248,250,252,0.95),_rgba(239,246,255,0.92))] p-4 shadow-lg shadow-violet-500/10 transition-transform hover:scale-105 dark:border-violet-800/40 dark:bg-[linear-gradient(135deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.92))]">
              <div className="w-20 h-20 mb-3">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <defs>
                    <linearGradient id="devopsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#FF6B6B', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#FF8C42', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="95" fill="#1a1a2e" stroke="url(#devopsGrad)" strokeWidth="3"/>
                  <circle cx="70" cy="80" r="18" fill="none" stroke="url(#devopsGrad)" strokeWidth="2"/>
                  <circle cx="70" cy="80" r="5" fill="url(#devopsGrad)"/>
                  <circle cx="130" cy="80" r="18" fill="none" stroke="url(#devopsGrad)" strokeWidth="2"/>
                  <circle cx="130" cy="80" r="5" fill="url(#devopsGrad)"/>
                  <path d="M 90 130 L 110 130 M 105 125 L 110 130 L 105 135" stroke="url(#devopsGrad)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <text x="100" y="160" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#FF8C42" fontFamily="Arial, sans-serif">DevOps</text>
                </svg>
              </div>
              <p className="text-sm font-bold text-center text-slate-900 dark:text-white">Docker, Kubernetes, Terraform, CI/CD</p>
            </div>

            {/* Security Logo */}
            <div className="flex flex-col items-center rounded-[1.25rem] border border-violet-200/70 bg-[linear-gradient(135deg,_rgba(248,250,252,0.95),_rgba(239,246,255,0.92))] p-4 shadow-lg shadow-violet-500/10 transition-transform hover:scale-105 dark:border-violet-800/40 dark:bg-[linear-gradient(135deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.92))]">
              <div className="w-20 h-20 mb-3">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <defs>
                    <linearGradient id="secGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#ff006e', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#e63946', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="95" fill="#1a1a2e" stroke="url(#secGrad)" strokeWidth="3"/>
                  <path d="M 100 50 L 120 60 L 120 90 Q 100 105 100 105 Q 80 90 80 60 Z" fill="none" stroke="url(#secGrad)" strokeWidth="3"/>
                  <path d="M 90 95 L 98 105 L 115 75" stroke="url(#secGrad)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <text x="100" y="160" fontSize="14" fontWeight="bold" textAnchor="middle" fill="#ff006e" fontFamily="Arial, sans-serif">Security</text>
                </svg>
              </div>
              <p className="text-sm font-bold text-center text-slate-900 dark:text-white">SonarQube, Snyk, SIEM, Compliance</p>
            </div>

            {/* Development Logo */}
            <div className="flex flex-col items-center rounded-[1.25rem] border border-violet-200/70 bg-[linear-gradient(135deg,_rgba(248,250,252,0.95),_rgba(239,246,255,0.92))] p-4 shadow-lg shadow-violet-500/10 transition-transform hover:scale-105 dark:border-violet-800/40 dark:bg-[linear-gradient(135deg,_rgba(2,6,23,0.95),_rgba(15,23,42,0.92))]">
              <div className="w-20 h-20 mb-3">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <defs>
                    <linearGradient id="devGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#00d4ff', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#0099ff', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r="95" fill="#1a1a2e" stroke="url(#devGrad)" strokeWidth="3"/>
                  <path d="M 75 75 L 85 85 L 75 95 M 125 75 L 115 85 L 125 95 M 100 60 L 100 120" stroke="url(#devGrad)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <text x="100" y="160" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#00d4ff" fontFamily="Arial, sans-serif">Full-Stack</text>
                </svg>
              </div>
              <p className="text-sm font-bold text-center text-slate-900 dark:text-white">React, Node.js, PostgreSQL, TypeScript</p>
            </div>
          </div>

          {/* Complete Tech Stack Visualization */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-950 dark:to-slate-900 rounded-2xl p-8 border border-slate-700 overflow-hidden">
            <div className="w-full h-auto min-h-96 flex items-center justify-center">
              {/* Fallback Grid instead of SVG - More visible and reliable */}
              <div className="w-full grid grid-cols-3 gap-4">
                {/* Row 1: Cloud Services */}
                <div className="p-4 bg-gradient-to-br from-blue-600/20 to-blue-700/30 rounded-lg border border-blue-500/40 text-center">
                  <div className="text-3xl mb-2">☁️</div>
                  <p className="text-sm font-bold text-white">AWS</p>
                  <p className="text-xs text-slate-100">EC2, S3, Lambda</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-violet-600/30 rounded-lg border border-violet-500/40 text-center">
                  <div className="text-3xl mb-2">☁️</div>
                  <p className="text-sm font-bold text-white">Azure</p>
                  <p className="text-xs text-slate-100">App Service, AKS</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-600/30 rounded-lg border border-red-500/40 text-center">
                  <div className="text-3xl mb-2">☁️</div>
                  <p className="text-sm font-bold text-white">GCP</p>
                  <p className="text-xs text-slate-100">Compute, Cloud Run</p>
                </div>

                {/* Row 2: DevOps Tools */}
                <div className="p-4 bg-gradient-to-br from-purple-600/20 to-purple-700/30 rounded-lg border border-purple-500/40 text-center">
                  <div className="text-3xl mb-2">🐳</div>
                  <p className="text-sm font-bold text-white">Docker</p>
                  <p className="text-xs text-slate-100">Containerization</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-600/20 to-orange-700/30 rounded-lg border border-orange-500/40 text-center">
                  <div className="text-3xl mb-2">⚙️</div>
                  <p className="text-sm font-bold text-white">Kubernetes</p>
                  <p className="text-xs text-slate-100">Orchestration</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-600/20 to-yellow-700/30 rounded-lg border border-yellow-500/40 text-center">
                  <div className="text-3xl mb-2">📦</div>
                  <p className="text-sm font-bold text-white">Terraform</p>
                  <p className="text-xs text-slate-100">IaC</p>
                </div>

                {/* Row 3: Security & Monitoring */}
                <div className="p-4 bg-gradient-to-br from-red-600/20 to-red-700/30 rounded-lg border border-red-500/40 text-center">
                  <div className="text-3xl mb-2">🔒</div>
                  <p className="text-sm font-bold text-white">Zscaler</p>
                  <p className="text-xs text-slate-100">Security</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-violet-600/20 to-violet-700/30 rounded-lg border border-violet-500/40 text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-sm font-bold text-white">Grafana</p>
                  <p className="text-xs text-slate-100">Monitoring</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-pink-600/20 to-pink-700/30 rounded-lg border border-pink-500/40 text-center">
                  <div className="text-3xl mb-2">💻</div>
                  <p className="text-sm font-bold text-white">Next.js</p>
                  <p className="text-xs text-slate-100">Full-Stack</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        
        {/* Final Note Section */}
        <motion.section variants={itemVariants} className="mb-12 p-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">My Commitment</h2>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
            This personal tech blog is where I share knowledge and insights. 
            All code is maintained carefully, and I continuously update to improve clarity, accuracy, and relevance. 
            If anything feels misconfigured or outdated, I appreciate feedback and work to correct it quickly.
          </p>
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed mt-4">
            My vision is to help developers and engineers grow through shared knowledge and best practices. Through consistent learning and sharing, 
            I aim to build a community focused on innovation, security, and operational excellence.
          </p>
        </motion.section>

      </motion.div>
    </div>
  );
}