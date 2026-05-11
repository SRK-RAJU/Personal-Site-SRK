'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaGithub, FaLinkedin, FaTwitter, FaCode, FaServer, FaDatabase, FaClock, FaEye, FaFire, FaRocket, FaStar, FaUsers } from 'react-icons/fa';
import TrendingPosts from '@/components/TrendingPosts';
import RealtimeActivity from '@/components/RealtimeActivity';
import { useWebsiteStats } from '@/lib/useAnalytics';
import { useEffect, useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
    },
  },
};

export default function Home() {
  const { stats: fetchedStats } = useWebsiteStats();
  const [animatedStats, setAnimatedStats] = useState([
    { icon: FaClock, label: 'Articles', value: 0 },
    { icon: FaEye, label: 'Monthly Views', value: 0 },
    { icon: FaFire, label: 'Topics', value: 0 },
    { icon: FaRocket, label: 'Projects', value: 0 },
    { icon: FaUsers, label: 'Total Visits', value: 0 },
  ]);

  useEffect(() => {
    // Animate numbers increment
    const timer = setTimeout(() => {
      setAnimatedStats([
        { icon: FaClock, label: 'Articles', value: fetchedStats.articles },
        { icon: FaEye, label: 'Monthly Views', value: fetchedStats.monthly_views },
        { icon: FaFire, label: 'Topics', value: fetchedStats.topics },
        { icon: FaRocket, label: 'Projects', value: fetchedStats.projects },
        { icon: FaUsers, label: 'Total Visits', value: fetchedStats.total_visits },
      ]);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchedStats]);

  const skills = [
    {
      icon: FaServer,
      title: 'Cloud & Infrastructure',
      description: 'Cloud platforms, containerization, and infrastructure as code',
      skills: ['AWS (EC2, S3, RDS, Lambda)', 'Azure (VMs, App Service, DevOps)', 'Google Cloud Platform', 'Terraform', 'Kubernetes', 'Docker', 'Ansible', 'CI/CD (Jenkins, GitHub Actions, GitLab CI, Azure DevOps)', 'Git & Version Control', 'Infrastructure as Code', 'Linux/Unix Administration', 'Networking (TCP/IP, HTTP/HTTPS)'],
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: FaCode,
      title: 'Full-Stack Development',
      description: 'Modern web development with focus on scalability and performance',
      skills: ['React', 'Next.js 13+', 'Node.js & Express.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'Supabase', 'REST APIs', 'GraphQL', 'Tailwind CSS', 'Python', 'JavaScript/ES6+', 'Web Design (Responsive)', 'Vercel Deployment'],
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FaDatabase,
      title: 'Security & DevOps',
      description: 'Security practices, monitoring, and operational excellence',
      skills: ['Zscaler', 'Cloudflare', 'Networking (DNS, SMTP, HTTP)', 'VPN & OpenVPN', 'Microsoft Entra ID', 'Active Directory (AD/AAD)', 'Monitoring (Grafana, Prometheus)', 'Logging & Analytics', 'VS Code', 'Terminal/Bash', 'System Administration', 'Data Protection', 'Cybersecurity Best Practices'],
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section with animated background */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 dark:from-slate-950 dark:via-emerald-950/10 dark:to-slate-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full blur-3xl"
            animate={{ y: [0, -30, 0], x: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl"
            animate={{ y: [0, 30, 0], x: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-emerald-600/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Additional floating elements */}
          <motion.div
            className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"
            animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.div
            className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-tr from-orange-500/20 to-yellow-500/20 rounded-full blur-2xl"
            animate={{ y: [0, 20, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          />
        </div>

        <div className="container-max py-12">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              className="mb-8 inline-block px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-400/50 dark:border-emerald-500/50 backdrop-blur-sm hover:border-emerald-400 transition-colors"
              variants={itemVariants}
            >
              <p className="text-sm font-semibold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-2">
                <FaStar className="text-emerald-400" /> Welcome to the Next-Gen Tech Universe
              </p>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
              variants={itemVariants}
            >
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Architecting the Future
              </span>
              <span className="block text-slate-900 dark:text-white mt-4 text-5xl sm:text-6xl font-bold">
                of Cloud & DevOps
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-lg sm:text-xl text-slate-700 dark:text-slate-200 mb-12 leading-relaxed max-w-3xl mx-auto font-semibold"
              variants={itemVariants}
            >
              Dive deep into cloud technologies, security practices, DevOps workflows, and cutting-edge software development. 
              Explore real-world solutions to modern challenges with practical examples and in-depth analysis.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex gap-4 justify-center flex-wrap mb-12"
              variants={itemVariants}
            >
              <Link
                href="/blog"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold transition-all shadow-lg hover:shadow-2xl hover:scale-105 transform duration-200"
              >
                <FaCode className="text-lg" />
                Explore Articles
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/portfolio"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl border-2 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-bold transition-all hover:scale-105 transform duration-200"
              >
                <FaRocket className="text-lg" />
                View Projects
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20 font-bold transition-all hover:scale-105 transform duration-200"
              >
                <FaUsers className="text-lg" />
                Get in Touch
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 section-gap-tight"
              variants={containerVariants}
            >
              {animatedStats.map((stat) => {
                const Icon = stat.icon;
                const formatValue = (value: number) => {
                  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                  return value.toString();
                };
                return (
                  <motion.div
                    key={stat.label}
                    className="card-glass text-center py-6 sm:py-8 hover:bg-gradient-to-br hover:from-emerald-50/50 hover:to-teal-50/50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 transition-all duration-300 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Icon className="text-2xl sm:text-3xl text-emerald-500 mx-auto mb-3 group-hover:text-emerald-600 transition-colors" />
                    <motion.p 
                      className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white"
                      key={stat.value}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {formatValue(stat.value)}
                    </motion.p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">{stat.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Trending Posts */}
      <motion.section
        className="bg-gradient-to-b from-slate-50 via-emerald-50/50 to-slate-50 dark:from-slate-900 dark:via-emerald-900/10 dark:to-slate-900 border-y border-slate-200 dark:border-slate-800 section-padding-tight"
        initial="hidden"
        whileInView="visible"
        variants={sectionVariants}
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="container-max">
          <TrendingPosts />
        </div>
      </motion.section>

      {/* Real-time Activity Panel */}
      <motion.section
        className="container-max section-padding-tight"
        initial="hidden"
        whileInView="visible"
        variants={sectionVariants}
        viewport={{ once: true, margin: '-100px' }}
      >
        <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Live Site Activity</h2>
        <RealtimeActivity />
      </motion.section>

      {/* Skills Section */}
      <motion.section
        className="container-max section-padding-tight"
        initial="hidden"
        whileInView="visible"
        variants={sectionVariants}
        viewport={{ once: true, margin: '-100px' }}
      >
        {/* Certifications Subsection */}
        <motion.div
          className="mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h3
            className="text-3xl md:text-4xl font-bold mb-8 text-slate-900 dark:text-white text-center"
            variants={itemVariants}
          >
            Certifications & Credentials
          </motion.h3>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { title: 'AWS Certified', subtitle: 'Solutions Architect', color: 'from-yellow-500 to-orange-500' },
              { title: 'Azure Certified', subtitle: 'AZ-900, AZ-104', color: 'from-blue-500 to-cyan-500' },
              { title: 'GCP Certified', subtitle: 'Associate Cloud Engineer & DevOps Engineer', color: 'from-red-500 to-pink-500' },
              { title: 'GitHub', subtitle: 'Foundations Certified', color: 'from-gray-600 to-gray-800' },
            ].map((cert, idx) => (
              <motion.div
                key={cert.title}
                className="card-glass border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-500 text-center py-6"
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${cert.color} text-white mb-3`}>
                  <span className="text-2xl font-bold">✓</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">{cert.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">{cert.subtitle}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="mb-16 text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white"
            variants={itemVariants}
          >
            Skills & Expertise
          </motion.h2>
          <motion.p
            className="text-lg text-slate-600 dark:text-slate-300"
            variants={itemVariants}
          >
            Comprehensive technical knowledge across multiple domains
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {skills.map((category) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.title}
                className="group card-hover border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-500"
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <div className={`inline-flex p-4 rounded-lg bg-gradient-to-r ${category.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="text-3xl" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                  {category.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {category.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <span
                      key={skill}
                      className="badge"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* Complete DevSecOps Stack Section */}
      <motion.section
        className="container-max section-padding-tight"
        initial="hidden"
        whileInView="visible"
        variants={sectionVariants}
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div
          className="mb-16 text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white"
            variants={itemVariants}
          >
            Complete DevSecOps Stack
          </motion.h2>
          <motion.p
            className="text-lg text-slate-600 dark:text-slate-300"
            variants={itemVariants}
          >
            Integrated technologies and tools for secure, scalable deployments
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Stack Component 1: CI/CD Pipeline */}
          <motion.div
            className="card-glass border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-500 overflow-hidden"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="w-full h-48 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-600/40 dark:to-cyan-600/40 flex items-center justify-center rounded-lg mb-4 border-2 border-blue-500/30 dark:border-blue-500/50">
              <div className="text-6xl">🔄</div>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">CI/CD Pipeline</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Automated build, test, and deployment workflows with GitHub Actions, GitLab CI, Azure DevOps and Jenkins for continuous integration.</p>
            <div className="flex flex-wrap gap-2">
              {['GitHub Actions', 'Jenkins', 'GitLab CI', 'Docker'].map(tech => (
                <span key={tech} className="badge">{tech}</span>
              ))}
            </div>
          </motion.div>

          {/* Stack Component 2: Container Orchestration */}
          <motion.div
            className="card-glass border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-500 overflow-hidden"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-600/40 dark:to-pink-600/40 flex items-center justify-center rounded-lg mb-4 border-2 border-purple-500/30 dark:border-purple-500/50">
              <div className="text-6xl">🐳</div>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Container Orchestration</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Kubernetes and Docker for container management, scaling, and orchestration in production environments.</p>
            <div className="flex flex-wrap gap-2">
              {['Kubernetes', 'Docker', 'Container Registry', 'Helm'].map(tech => (
                <span key={tech} className="badge">{tech}</span>
              ))}
            </div>
          </motion.div>

          {/* Stack Component 3: Infrastructure as Code */}
          <motion.div
            className="card-glass border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-500 overflow-hidden"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="w-full h-48 bg-gradient-to-br from-green-500/20 to-emerald-500/20 dark:from-green-600/40 dark:to-emerald-600/40 flex items-center justify-center rounded-lg mb-4 border-2 border-green-500/30 dark:border-green-500/50">
              <div className="text-6xl">🏗️</div>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Infrastructure as Code</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Terraform and Ansible for declarative infrastructure management, ensuring consistency and reproducibility.</p>
            <div className="flex flex-wrap gap-2">
              {['Terraform', 'Ansible', 'CloudFormation', 'Pulumi'].map(tech => (
                <span key={tech} className="badge">{tech}</span>
              ))}
            </div>
          </motion.div>

          {/* Stack Component 4: Security & Monitoring */}
          <motion.div
            className="card-glass border-2 border-transparent hover:border-emerald-500 dark:hover:border-emerald-500 overflow-hidden"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="w-full h-48 bg-gradient-to-br from-red-500/20 to-orange-500/20 dark:from-red-600/40 dark:to-orange-600/40 flex items-center justify-center rounded-lg mb-4 border-2 border-red-500/30 dark:border-red-500/50">
              <div className="text-6xl">🔒</div>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Security & Monitoring</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Comprehensive security scanning, threat detection, and real-time monitoring with Grafana and Prometheus.</p>
            <div className="flex flex-wrap gap-2">
              {['Grafana', 'Prometheus', 'Zscaler', 'Security Scanning'].map(tech => (
                <span key={tech} className="badge">{tech}</span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* About Section */}
      <motion.section
        className="container-max section-padding-tight"
        initial="hidden"
        whileInView="visible"
        variants={sectionVariants}
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-8 md:p-16 border border-emerald-200 dark:border-emerald-800/50 backdrop-blur-sm">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-4xl font-bold mb-6 text-slate-900 dark:text-white"
              variants={itemVariants}
            >
              About Me
            </motion.h2>
            <div className="space-y-4 text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
              <motion.p variants={itemVariants}>
                Hi! I'm <span className="font-bold gradient-text">Raju SRK</span>, a <span className="font-bold text-cyan-400">DevSecOps specialist and cloud engineer</span> passionate about building scalable, secure, and efficient systems. With expertise spanning cloud architecture, 
                containerization, infrastructure automation, security practices, and modern web development, I help teams and fellow developers transform ideas into secure reality.
              </motion.p>
              <motion.p variants={itemVariants}>
                This platform is my personal tech blog and knowledge hub where I share deep dives into cloud technologies, security best practices, 
                DevSecOps patterns, and innovative software solutions. Whether you're exploring containerization strategies, CI/CD pipelines,
                security scanning, or cloud-native architectures, you'll find actionable insights and real-world examples from industry practice.
              </motion.p>
              <motion.p variants={itemVariants}>
                Beyond coding, I'm passionate about mentoring, open-source contributions, and building communities. 
                Let's collaborate and create something extraordinary together!
              </motion.p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Social Links */}
      <motion.section
        className="container-max section-padding-tight"
        initial="hidden"
        whileInView="visible"
        variants={sectionVariants}
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div
          className="text-center mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            className="text-4xl font-bold mb-4 text-slate-900 dark:text-white"
            variants={itemVariants}
          >
            Connect & Follow
          </motion.h2>
          <motion.p
            className="text-lg text-slate-600 dark:text-slate-400"
            variants={itemVariants}
          >
            Join me on various platforms for updates and networking
          </motion.p>
        </motion.div>

        <motion.div
          className="flex justify-center gap-4 flex-wrap"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
            { href: 'https://github.com/SRK-RAJU', icon: FaGithub, label: 'GitHub', color: 'hover:text-slate-800 dark:hover:text-white' },
            { href: 'https://www.linkedin.com/in/srajukumargoud', icon: FaLinkedin, label: 'LinkedIn', color: 'hover:text-blue-500' },
            { href: 'https://twitter.com', icon: FaTwitter, label: 'Twitter', color: 'hover:text-blue-400' },
          ].map((social) => {
            const Icon = social.icon;
            return (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 ${social.color} text-slate-700 dark:text-slate-300 transition-all font-semibold`}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Icon className="text-xl group-hover:scale-125 transition-transform" />
                {social.label}
              </motion.a>
            );
          })}
        </motion.div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="container-max section-padding-tight"
        initial="hidden"
        whileInView="visible"
        variants={sectionVariants}
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div
          className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-700 rounded-2xl p-12 md:p-20 text-center shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent"
            animate={{ x: [0, 100, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />

          <motion.div
            className="relative z-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-3xl md:text-5xl font-bold text-white mb-4"
              variants={itemVariants}
            >
              Ready to Build Something Extraordinary?
            </motion.h2>
            <motion.p
              className="text-lg text-emerald-50 mb-8 max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Whether you have a project in mind, want to collaborate, or just want to chat about cloud and DevOps, 
              I'd love to hear from you!
            </motion.p>
            <motion.div variants={itemVariants}>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-emerald-600 hover:bg-emerald-50 font-bold transition-all shadow-lg hover:shadow-2xl hover:scale-105"
              >
                Start a Conversation
                <FaArrowRight />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>
    </div>
  );
}
