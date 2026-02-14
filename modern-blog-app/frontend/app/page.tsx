import Link from 'next/link';
import { FaArrowRight, FaGithub, FaLinkedin, FaTwitter, FaCode, FaServer, FaDatabase } from 'react-icons/fa';
import TrendingPosts from '@/components/TrendingPosts';

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="container-max py-20 mt-0">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 inline-block px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              ✨ Welcome to my tech blog & portfolio
            </p>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Cloud, Security & DevOps Insights
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-2xl">
            Exploring cloud technologies, security practices, DevOps workflows, and software development best practices. 
            Join me on a journey through modern infrastructure and innovative solutions.
          </p>
          
          <div className="flex gap-4 justify-start flex-wrap">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Read Articles
              <FaArrowRight />
            </Link>
            <Link 
              href="/portfolio" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-semibold transition-all"
            >
              View My Work
            </Link>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/20 font-semibold transition-all"
            >
              Contact Me
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Posts Section */}
      <section className="bg-gradient-to-r from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-emerald-900/10 border-t border-b border-slate-200 dark:border-slate-800">
        <div className="container-max">
          <TrendingPosts />
        </div>
      </section>

      {/* Social Links */}
      <section className="container-max py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Connect with Me</h2>
          <p className="text-slate-600 dark:text-slate-400">Find me on social media and GitHub</p>
        </div>
        <div className="flex justify-center gap-4 flex-wrap">
          <a
            href="https://github.com/SRK-RAJU"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all font-semibold"
            title="GitHub"
          >
            <FaGithub className="text-xl" />
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/srajukumargoud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all font-semibold"
            title="LinkedIn"
          >
            <FaLinkedin className="text-xl" />
            LinkedIn
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all font-semibold"
            title="Twitter"
          >
            <FaTwitter className="text-xl" />
            Twitter
          </a>
        </div>
      </section>

      {/* About Section */}
      <section className="container-max py-20">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-xl p-8 md:p-12 border border-emerald-200 dark:border-emerald-800/50">
          <h2 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">About Me</h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
            Hi! I'm <span className="font-bold text-emerald-600 dark:text-emerald-400">Raju SRK</span>, a passionate full-stack developer specializing in Cloud technologies, Security, and DevOps. 
            With expertise in React, Node.js, Kubernetes, Terraform, Ansible, Python, and PostgreSQL, I help organizations build scalable, secure, and efficient infrastructure.
          </p>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
            This blog is where I share my insights on modern software development, cloud architecture, security best practices, 
            and interesting projects. Whether you're a beginner or an experienced developer, I hope you'll find valuable content here.
          </p>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            Feel free to explore, learn, and reach out if you'd like to collaborate!
          </p>
        </div>
      </section>

      {/* Skills Section */}
      <section className="container-max py-20">
        <h2 className="text-4xl font-bold mb-12 text-slate-900 dark:text-white">Skills & Expertise</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: FaCode,
              title: 'Frontend Development',
              skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vue.js'],
              color: 'from-blue-500 to-cyan-500',
            },
            {
              icon: FaServer,
              title: 'Backend & DevOps',
              skills: ['Node.js', 'Python', 'Kubernetes', 'Docker', 'Terraform', 'Ansible'],
              color: 'from-emerald-500 to-teal-500',
            },
            {
              icon: FaDatabase,
              title: 'Data & Cloud',
              skills: ['PostgreSQL', 'MongoDB', 'AWS', 'Google Cloud', 'Azure'],
              color: 'from-orange-500 to-red-500',
            },
          ].map((category) => {
            const Icon = category.icon;
            return (
              <div 
                key={category.title} 
                className="group rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 p-8 bg-white dark:bg-slate-800/50 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${category.color} text-white mb-4`}>
                  <Icon className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{category.title}</h3>
                <ul className="space-y-3">
                  {category.skills.map((skill) => (
                    <li key={skill} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full" />
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-max py-20">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 rounded-xl p-12 text-center shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Let's Build Something Amazing</h2>
          <p className="text-lg text-emerald-50 mb-8 max-w-2xl mx-auto">
            Have a project in mind or want to collaborate? I'd love to hear from you and discuss how we can work together.
          </p>
          <Link 
            href="/contact" 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-emerald-600 hover:bg-emerald-50 font-bold transition-all shadow-lg hover:shadow-xl"
          >
            Get In Touch
            <FaArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
