import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa';

export const metadata = {
  title: 'Portfolio',
  description: 'Check out my projects and recent work.',
};

// This would normally fetch from API
async function getProjects() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
      cache: 'revalidate',
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error('Failed to fetch projects');
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export default async function Portfolio() {
  const projects = await getProjects();

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
