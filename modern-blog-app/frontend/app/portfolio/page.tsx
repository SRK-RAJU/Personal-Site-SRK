import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

export const metadata = {
  title: 'Portfolio - Raju Tech',
  description: 'Full-stack web development, devops, security, and cloud engineering projects. Explore projects built with modern technologies and best practices.',
};

// Static portfolio projects
const projects = [
  {
    id: 1,
    title: 'Personal Blog Platform',
    description: 'Modern full-stack blog platform built with Next.js, Supabase, and Cloudflare. Features include real-time analytics, content management, and advanced security.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase'],
    link: 'https://rjexa.com',
    github: 'https://github.com/SRK-RAJU/Personal-Site-SRK',
    image: '/projects/blog.svg',
  },
  {
    id: 2,
    title: 'Local Kirana Shop - E-commerce Store',
    description: 'Full-featured e-commerce solution for a local kirana shop with shopping cart, product management, and payment integration.',
    technologies: ['React', 'Next.js', 'TypeScript', 'PostgreSQL', 'Supabase'],
    link: 'https://jayalakshmikiranashop.vercel.app',
    github: 'https://github.com/SRK-RAJU',
    image: '/projects/ecommerce.svg',
  },
  {
    id: 3,
    title: 'Facility Management System',
    description: 'Comprehensive facility management system for maintenance operations, scheduling, and resource management. Built for professional service providers.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL'],
    link: 'https://zispark-services.vercel.app/',
    github: 'https://github.com/SRK-RAJU',
    image: '/projects/tasks.svg',
  },
];

export default async function Portfolio() {
  return (
    <div className="container-max py-12">
      {/* Heading */}
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          My Projects
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Selected projects showcasing my skills in full-stack development and cloud engineering. All projects are actively maintained and regularly updated. Check them out and share your feedback!
        </p>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <div key={project.id} className="card">
              {project.image_url && (
                <div
                  className="w-full h-40 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg mb-4"
                  style={{
                    backgroundImage: `url(${project.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
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
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="https://github.com/SRK-RAJU"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                    title="GitHub"
                  >
                    <FaGithub /> Code
                  </a>
                )}
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="https://rjexa.com"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                    title="Live Demo"
                  >
                    <FaExternalLinkAlt /> Live
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Projects coming soon! Stay tuned.
          </p>
        </div>
      )}
    </div>
  );
}
