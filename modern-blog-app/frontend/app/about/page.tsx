export const metadata = {
  title: 'About',
  description: 'Learn more about me and my journey.',
};

export default function About() {
  return (
    <div className="container-max py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold mb-8">About Me</h1>

        <div className="prose dark:prose-dark">
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            Hi! I'm Raju SRK, a passionate full-stack developer with over 5 years of experience
            in building web applications. I specialize in React, Node.js, and PostgreSQL, and
            I'm always eager to learn new technologies and best practices.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">My Journey</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            I started my programming journey with curiosity and a desire to build things. Over the
            years, I've worked on various projects ranging from small startups to large-scale
            applications. Each project has taught me something valuable about software development
            and problem-solving.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What I Do</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 mb-4">
            <li>Build responsive and modern web applications</li>
            <li>Design scalable backend systems and APIs</li>
            <li>Optimize database queries and application performance</li>
            <li>Mentor junior developers and share knowledge</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Frontend</h3>
              <ul className="text-slate-600 dark:text-slate-400 space-y-1">
                <li>• React & Next.js</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Responsive Design</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Backend</h3>
              <ul className="text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Node.js & Express</li>
                <li>• PostgreSQL</li>
                <li>• REST APIs</li>
                <li>• Authentication & Security</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">Currently</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            I'm currently focused on building modern web applications and exploring new technologies
            like AI integrations and serverless architectures. I also enjoy contributing to open-source
            projects and helping the developer community through blog posts and tutorials.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Let's Connect</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Feel free to reach out if you want to discuss web development, collaborate on a project, or
            just chat about tech. You can find me on GitHub, LinkedIn, or simply send me an email.
          </p>
        </div>
      </div>
    </div>
  );
}
