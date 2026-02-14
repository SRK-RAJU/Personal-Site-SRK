import Link from 'next/link';
import { FaArrowRight, FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

export default function Home() {
  return (
    <div className="container-max py-20">
      {/* Hero Section */}
      <section className="mb-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to My CloudGuard Tech Insights Blog
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Exploring web development, Cloud tech innovations, and best practices.
            Join me on my journey through the world of Cloud, Security and Programming.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/blog" className="btn btn-primary px-6 py-3">
              Read Blog Posts <FaArrowRight className="ml-2" />
            </Link>
            <Link href="/portfolio" className="btn btn-secondary px-6 py-3">
              View My Work
            </Link>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="mb-20">
        <div className="flex justify-center gap-6">
          <a
            href="https://github.com/SRK-RAJU"
            target="https://github.com/SRK-RAJU"
            rel="noopener noreferrer"
            className="text-3xl hover:text-blue-600 transition-colors"
            title="GitHub"
          >
            <FaGithub />
          </a>
          <a
            href="https://www.linkedin.com/in/srajukumargoud"
            target="https://www.linkedin.com/in/srajukumargoud"
            rel="noopener noreferrer"
            className="text-3xl hover:text-blue-600 transition-colors"
            title="LinkedIn"
          >
            <FaLinkedin />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-3xl hover:text-blue-600 transition-colors"
            title="Twitter"
          >
            <FaTwitter />
          </a>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-slate-50 dark:bg-slate-800 rounded-lg p-8 mb-20">
        <h2 className="text-3xl font-bold mb-4">About Me</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
          Hi! I'm Raju, a passionate full-stack Cloud, Security and DevOps developer with expertise in
          React, Node.js, Cloud, Security, DevOps, Terraform, Kubernetes, Ansible, Python and PostgreSQL. I love building scalable web
          applications and sharing knowledge with the community.
        </p>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          This blog is where I share my insights on web development, best
          practices, and interesting projects I'm working on personally.
        </p>
      </section>

      {/* Skills Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold mb-8">Skills & Technologies</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Frontend',
              skills: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript'],
            },
            {
              title: 'Backend',
              skills: ['Node.js', 'Express', 'Python', 'REST APIs'],
            },
            {
              title: 'Database',
              skills: ['PostgreSQL', 'MongoDB', 'Redis', 'Firebase'],
            },
          ].map((category) => (
            <div key={category.title} className="card">
              <h3 className="text-xl font-bold mb-4">{category.title}</h3>
              <ul className="space-y-2">
                {category.skills.map((skill) => (
                  <li
                    key={skill}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400"
                  >
                    <span className="w-2 h-2 bg-blue-600 rounded-full" />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white rounded-lg p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Let's Work Together</h2>
        <p className="text-lg mb-6 max-w-2xl mx-auto">
          Interested in collaborating or have a project in mind?
          I'd love to hear from you!
        </p>
        <Link href="/contact" className="btn bg-white text-blue-600 hover:bg-slate-100 px-6 py-3">
          Get In Touch
        </Link>
      </section>
    </div>
  );
}
