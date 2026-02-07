import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

export const metadata = {
  title: 'Portfolio',
  description: 'Check out my projects and recent work.',
};

// Static portfolio projects
const projects = [
  {
    id: 1,
    title: 'Personal Tech Blog',
    description: 'Modern full-stack blog platform built with Next.js and Supabase',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase'],
    link: '/',
    github: 'https://github.com/SRK-RAJU/Personal-Site-SRK',
    image: '/projects/blog.jpg',
  },
  {
    id: 2,
    title: 'E-commerce Platform',
    description: 'Full-featured e-commerce solution with shopping cart and payments',
    technologies: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Stripe'],
    link: 'https://example.com',
    github: 'https://github.com',
    image: '/projects/ecommerce.jpg',
  },
  {
    id: 3,
    title: 'Task Management App',
    description: 'Collaborative task management tool with real-time updates',
    technologies: ['Next.js', 'WebSockets', 'MongoDB', 'Socket.io'],
    link: 'https://example.com',
    github: 'https://github.com',
    image: '/projects/tasks.jpg',
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
          Selected projects showcasing my skills and expertise.
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
                    target="_blank"
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
                    target="_blank"
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
