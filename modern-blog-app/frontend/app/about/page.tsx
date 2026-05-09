'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaGithub, 
  FaLinkedin, 
  FaAward, 
  FaCloud, 
  FaTools, 
  FaCode, 
  FaDatabase, 
  FaRocket 
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
    <div className="container-max py-12">
      <motion.div 
        className="max-w-4xl mx-auto" 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
      >
        {/* Header - Combined Names */}
        <motion.div variants={itemVariants} className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Raju
          </h1>
          <h2 className="text-2xl text-slate-700 dark:text-slate-300 font-semibold mb-2">
            Full-Stack Developer, DevOps, Security & Cloud Engineer
          </h2>
          <p className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-4">
            @ rjexa inc
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Building modern web applications and cloud solutions with a focus on performance and security.
          </p>
        </motion.div>

        {/* About & Journey Section */}
        <motion.section variants={itemVariants} className="mb-12 p-8 bg-blue-50 dark:bg-slate-800/50 rounded-2xl border border-blue-100 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FaRocket className="text-blue-600" /> My Story
          </h2>
          <div className="space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
            <p className="text-lg">
              Hi! I'm <strong>Raju</strong>, a full-stack developer, security, DevOps and cloud engineer passionate about building efficient, scalable web applications. 
              I specialize in React, Next.js, Node.js, k8, Terraform, Docker, Ansible and cloud technologies like AWS and Azure.
            </p>
            <p>
              I started my journey with curiosity and a strong desire to build things. Over the years, I've developed expertise in frontend development, 
              backend systems, and cloud infrastructure. I focus on writing clean, maintainable code and creating user-friendly applications.
            </p>
            <p>
              I've built several projects including this personal portfolio, a local e-commerce store for a kirana shop, and a facilities management system. 
              Each project taught me valuable lessons about full-stack development, DevOps practices, and user experience design.
            </p>
            {/* Personal Note */}
            <p className="italic text-slate-600 dark:text-slate-400">
              These sites are designed and built by me based on client requirements and my learning journey. I often work on these projects during weekends and holidays 
              out of genuine interest in supporting clients and continuously improving my skills. My goal is to build impactful solutions, improve my expertise, 
              and deliver high-quality applications. If you find any issues or have suggestions, please reach out!
            </p>
          </div>
        </motion.section>

        {/* Skills Grid - Merged Technical & Creative */}
        <motion.section variants={itemVariants} className="mb-12">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <FaTools className="text-blue-600" /> Skills & Expertise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Cloud & DevOps */}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <FaCloud className="text-blue-500" /> Cloud & Infrastructure
              </h3>
              <ul className="grid grid-cols-1 gap-2 text-slate-600 dark:text-slate-400">
                <li>• AWS & Azure Architecture</li>
                <li>• Terraform (Infrastructure as Code)</li>
                <li>• Kubernetes & Docker Orchestration</li>
                <li>• CI/CD (Jenkins, GitLab, GitHub Actions)</li>
              </ul>
            </div>

            {/* Development */}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <FaCode className="text-purple-500" /> Full-Stack Development
              </h3>
              <ul className="grid grid-cols-1 gap-2 text-slate-600 dark:text-slate-400">
                <li>• React & Next.js Frontend</li>
                <li>• Node.js & Express Backend</li>
                <li>• PostgreSQL & Database Optimization</li>
                <li>• Responsive & Modern Web Design</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Certifications */}
        <motion.section variants={itemVariants} className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FaAward className="text-yellow-600" /> Certifications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border-l-4 border-blue-600 bg-slate-50 dark:bg-slate-800/30">
              <h3 className="font-semibold dark:text-white">AWS Certified</h3>
              <p className="text-sm text-slate-500">Solutions Architect & DevOps Professional</p>
            </div>
            <div className="p-4 border-l-4 border-blue-400 bg-slate-50 dark:bg-slate-800/30">
              <h3 className="font-semibold dark:text-white">Azure Certified</h3>
              <p className="text-sm text-slate-500">Solutions Architect & DevOps Engineer</p>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          variants={itemVariants} 
          className="mb-12 bg-gradient-to-r from-blue-600 to-purple-700 p-10 rounded-3xl text-white text-center sm:text-left"
        >
          <h2 className="text-3xl font-bold mb-4">Let's Connect</h2>
          <p className="mb-8 text-blue-100 max-w-2xl">
            Feel free to reach out if you want to discuss web development, collaborate on a project, or 
            just chat about tech. I'm always open to technical discussions and new opportunities.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4">
            <Link 
              href="/contact" 
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Send an Email
            </Link>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <FaGithub size={24} />
              </a>
              <a href="https://linkedin.com" target="_blank" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <FaLinkedin size={24} />
              </a>
            </div>
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
            <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-700/30 hover:scale-105 transition-transform">
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
            <div className="flex flex-col items-center p-4 bg-orange-50 dark:bg-slate-800 rounded-xl border border-orange-200 dark:border-orange-700/30 hover:scale-105 transition-transform">
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
            <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-700/30 hover:scale-105 transition-transform">
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
            <div className="flex flex-col items-center p-4 bg-purple-50 dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-700/30 hover:scale-105 transition-transform">
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

          {/* Complete Tech Stack Image */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-8 border border-slate-700 overflow-hidden">
            <img 
              src="/images/tech-stack.svg" 
              alt="Complete Tech Stack - Cloud, DevOps, Security, Development" 
              className="w-full h-auto"
            />
          </div>
        </motion.section>

        
        {/* Final Note Section */}
        <motion.section variants={itemVariants} className="mb-12 p-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Our Commitment</h2>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            At <strong>rjexa inc</strong>, we design and deliver sites from scratch, based on client requirements. 
            All code is maintained carefully, and we continuously update to improve security, user experience, and performance. 
            If anything feels misconfigured, we sincerely apologize and work to correct it quickly.
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-4">
            Our vision is client satisfaction and User Satisfaction — to grow business, attract projects, and through hard work. 
            We learn, adapt, and deliver with confidence, ensuring every project reflects our dedication and values.
          </p>
        </motion.section>

      </motion.div>
    </div>
  );
}