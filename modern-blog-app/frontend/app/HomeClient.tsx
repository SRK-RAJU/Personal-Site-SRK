'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import {
  FaArrowRight,
  FaCode,
  FaServer,
  FaDatabase,
  FaClock,
  FaEye,
  FaFire,
  FaUsers,
  FaGlobeAmericas,
  FaSyncAlt,
  FaDocker,
  FaCubes,
  FaShieldAlt,
  FaCheck,
  FaNewspaper,
  FaBookOpen,
  FaGlobe,
  FaLink,
} from 'react-icons/fa';
import TrendingPosts from '@/components/TrendingPosts';
import AIBlogPostsList, { type AIPost } from '@/components/AIBlogPostsList';
import ToolsList from '@/components/ToolsList';
import { useWebsiteStats, type WebsiteStats } from '@/lib/useAnalytics';

interface LearningImagePreview {
  name: string;
  tool_name: string;
  url: string;
}

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const marqueeItems = [
  'AWS', 'Azure', 'Google Cloud', 'Terraform', 'Kubernetes', 'Docker', 'Ansible', 'GitHub Actions',
  'Jenkins', 'GitLab CI', 'Next.js', 'React', 'TypeScript', 'Supabase', 'PostgreSQL', 'Grafana',
  'Prometheus', 'Zscaler', 'Cloudflare', 'Entra ID', 'Python', 'Linux',
];

const skills: Array<{ icon: IconType; title: string; description: string; skills: string[] }> = [
  {
    icon: FaServer,
    title: 'Cloud & Infrastructure',
    description: 'Cloud platforms, containerization, and infrastructure as code',
    skills: ['AWS (EC2, S3, RDS, Lambda)', 'Azure (VMs, App Service, DevOps)', 'Google Cloud Platform', 'Terraform', 'Kubernetes', 'Docker', 'Ansible', 'CI/CD (Jenkins, GitHub Actions, GitLab CI, Azure DevOps)', 'Git & Version Control', 'Infrastructure as Code', 'Linux/Unix Administration', 'Networking (TCP/IP, HTTP/HTTPS)'],
  },
  {
    icon: FaCode,
    title: 'Full-Stack Development',
    description: 'Modern web development with focus on scalability and performance',
    skills: ['React', 'Next.js 13+', 'Node.js & Express.js', 'TypeScript', 'PostgreSQL', 'MongoDB', 'Supabase', 'REST APIs', 'GraphQL', 'Tailwind CSS', 'Python', 'JavaScript/ES6+', 'Web Design (Responsive)', 'Vercel Deployment'],
  },
  {
    icon: FaDatabase,
    title: 'Security & DevOps',
    description: 'Security practices, monitoring, and operational excellence',
    skills: ['Zscaler', 'Cloudflare', 'Networking (DNS, SMTP, HTTP)', 'VPN & OpenVPN', 'Microsoft Entra ID', 'Active Directory (AD/AAD)', 'Monitoring (Grafana, Prometheus)', 'Logging & Analytics', 'VS Code', 'Terminal/Bash', 'System Administration', 'Data Protection', 'Cybersecurity Best Practices'],
  },
];

const certifications = [
  { title: 'AWS Certified', subtitle: 'Solutions Architect' },
  { title: 'Azure Certified', subtitle: 'AZ-900, AZ-104' },
  { title: 'GCP Certified', subtitle: 'Associate Cloud Engineer & DevOps Engineer' },
  { title: 'GitHub', subtitle: 'Foundations Certified' },
];

const stack: Array<{ icon: IconType; title: string; description: string; tags: string[] }> = [
  {
    icon: FaSyncAlt,
    title: 'CI/CD Pipeline',
    description: 'Automated build, test, and deployment workflows with GitHub Actions, GitLab CI, Azure DevOps and Jenkins for continuous integration.',
    tags: ['GitHub Actions', 'Jenkins', 'GitLab CI', 'Docker'],
  },
  {
    icon: FaDocker,
    title: 'Container Orchestration',
    description: 'Kubernetes and Docker for container management, scaling, and orchestration in production environments.',
    tags: ['Kubernetes', 'Docker', 'Container Registry', 'Helm'],
  },
  {
    icon: FaCubes,
    title: 'Infrastructure as Code',
    description: 'Terraform and Ansible for declarative infrastructure management, ensuring consistency and reproducibility.',
    tags: ['Terraform', 'Ansible', 'CloudFormation', 'Pulumi'],
  },
  {
    icon: FaShieldAlt,
    title: 'Security & Monitoring',
    description: 'Comprehensive security scanning, threat detection, and real-time monitoring with Grafana and Prometheus.',
    tags: ['Grafana', 'Prometheus', 'Zscaler', 'Security Scanning'],
  },
];

function formatValue(value: number) {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toString();
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title mt-3">{title}</h2>
        {description && <p className="mt-3 text-[var(--fg-muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export interface HomeCatalog {
  categories: number;
  catalogEntries: number;
  tools: number;
  featured: Array<{ id: string; name: string; toolCount: number }>;
}

export default function Home({
  initialStats,
  initialPosts,
  catalog,
}: {
  initialStats: WebsiteStats;
  initialPosts: AIPost[] | null;
  catalog: HomeCatalog;
}) {
  const { stats } = useWebsiteStats(initialStats);
  const [toolImages, setToolImages] = useState<LearningImagePreview[]>([]);

  const trust: Array<{ icon: IconType; title: string; text: string }> = [
    { icon: FaLink, title: 'Source links', text: 'Research links are included when available for a report.' },
    { icon: FaShieldAlt, title: 'CVE lookups', text: 'Selected CVE IDs are checked against NVD/CVE.org when lookup capacity allows.' },
    { icon: FaBookOpen, title: 'Knowledge base', text: `Official links and architecture context for ${catalog.tools} tools.` },
    { icon: FaCode, title: 'Public API & RSS', text: 'JSON, OpenAPI and a feed. Usage terms apply.' },
    { icon: FaGlobe, title: '16 languages', text: 'Translate any page in one click.' },
  ];

  // Numbers that are still 0 (no analytics collected yet) are left out instead of advertising "0".
  const statTiles: Array<{ icon: IconType; label: string; value: number }> = [
    { icon: FaClock, label: 'Reports', value: stats.articles },
    { icon: FaFire, label: 'Active catalog entries', value: stats.topics },
    { icon: FaUsers, label: 'Page views', value: stats.total_visits },
    { icon: FaEye, label: 'Views · 30 days', value: stats.monthly_views },
    { icon: FaGlobeAmericas, label: 'Countries', value: stats.countries_reached },
  ].filter((tile, index) => index < 2 || tile.value > 0);

  useEffect(() => {
    const loadToolImages = async () => {
      try {
        const response = await fetch('/api/images/public');
        const result = await response.json();
        if (!response.ok) return;
        setToolImages(Array.isArray(result?.images) ? result.images.slice(0, 6) : []);
      } catch {
        setToolImages([]);
      }
    };

    void loadToolImages();
  }, []);

  return (
    <div className="w-full overflow-x-clip">
      {/* Hero */}
      <section className="relative">
        <div className="container-max pb-12 pt-6 sm:pb-16 sm:pt-10 lg:pb-20 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="futurist-pill">
                <span className="live-dot" aria-hidden="true" />
                Weekly reports · {catalog.tools} tools · {catalog.categories} categories
              </span>

              <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
                Stay current across your{' '}
                <span className="gradient-text">AI, cloud &amp; security stack</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--fg-muted)] sm:text-lg">
                Weekly reports on AI, cloud, DevOps and security tools. Research links are included when available; selected CVE IDs are checked against public records when lookup capacity allows. Explore tool guides, RSS and public API access, and translate pages into 16 languages.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/blog" className="btn-primary !px-6 !py-3">
                  <FaNewspaper />
                  Read the latest reports
                  <FaArrowRight className="text-xs" />
                </Link>
                <Link href="/docs" className="btn-secondary !px-6 !py-3">
                  <FaBookOpen />
                  Browse the knowledge base
                </Link>
                <Link href="/developers" className="btn-ghost !px-4 !py-3">
                  <FaCode />
                  Public API
                </Link>
              </div>

              <div className="mt-6">
                <ToolsList />
              </div>
            </motion.div>

            <motion.div
              className="futurist-hero !p-5 sm:!p-7"
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--fg-subtle)]">{'// site pulse'}</span>
                <span className="flex items-center gap-2 font-mono text-xs text-[rgb(var(--accent-rgb))]">
                  <span className="live-dot" aria-hidden="true" />
                  live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {statTiles.map((stat, index) => {
                  const Icon = stat.icon;
                  const wide = index === statTiles.length - 1 && statTiles.length % 2 === 1;
                  return (
                    <motion.div
                      key={stat.label}
                      className={`group rounded-2xl border border-[var(--line)] bg-[rgb(var(--fg-rgb)/0.03)] p-4 transition hover:border-[rgb(var(--accent-rgb)/0.45)] hover:bg-[rgb(var(--accent-rgb)/0.06)] ${wide ? 'col-span-2' : ''}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.07 }}
                    >
                      <Icon className="text-lg text-[rgb(var(--accent-rgb))]" />
                      <p className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{formatValue(stat.value)}</p>
                      <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--fg-subtle)]">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="marquee border-y border-[var(--line)] py-4" aria-hidden="true">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="mx-6 flex items-center gap-6 font-mono text-sm uppercase tracking-[0.16em] text-[var(--fg-subtle)]"
              >
                {item}
                <span className="h-1 w-1 rounded-full bg-[rgb(var(--accent-rgb)/0.7)]" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why readers trust it */}
      <motion.section className="container-max section-padding-tight" {...reveal}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {trust.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="futurist-card flex items-start gap-3 !p-4 sm:block">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--accent-rgb)/0.3)] bg-[rgb(var(--accent-rgb)/0.1)] text-[rgb(var(--accent-rgb))] sm:mb-3">
                  <Icon />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--fg-muted)]">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Trending Posts */}
      <motion.section className="section-padding-tight" {...reveal}>
        <div className="container-max">
          <TrendingPosts />
        </div>
      </motion.section>

      {/* Tool architecture visuals */}
      <motion.section className="container-max section-padding-tight" {...reveal}>
        <SectionHeading
          eyebrow="Enterprise tool map"
          title="Architecture visuals"
          description="Reference diagrams for the tools covered in the weekly reports."
          action={
            <Link href="/images" className="btn-secondary !text-sm">
              View all images <FaArrowRight className="text-xs" />
            </Link>
          }
        />

        {toolImages.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {toolImages.map((image) => (
              <Link
                key={image.name}
                href="/learning-images"
                className="card-hover group !p-0 overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden bg-[rgb(var(--fg-rgb)/0.05)]">
                  <Image
                    src={image.url}
                    alt={`${image.tool_name} architecture`}
                    fill
                    unoptimized
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
                <p className="p-4 font-display font-semibold">{image.tool_name}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-10 text-center text-[var(--fg-muted)]">
            Tool architecture visuals will appear here after the first admin generation.
          </div>
        )}
      </motion.section>

      {/* AI-Generated Weekly Insights */}
      <motion.section {...reveal}>
        <AIBlogPostsList initialPosts={initialPosts} />
      </motion.section>

      {/* Knowledge base by category */}
      <motion.section className="container-max section-padding-tight" {...reveal}>
        <SectionHeading
          eyebrow="Knowledge base"
          title="Explore every category"
          description={`What each tool is, where it fits and where to find its official docs: ${catalog.tools} tools in ${catalog.categories} categories.`}
          action={
            <Link href="/docs" className="btn-secondary !text-sm">
              All categories <FaArrowRight className="text-xs" />
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {catalog.featured.map((category) => (
            <Link key={category.id} href={`/docs/${category.id}`} className="futurist-card group !p-4">
              <p className="font-display font-semibold group-hover:text-[rgb(var(--accent-rgb))]">{category.name}</p>
              <p className="mt-1 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--fg-subtle)]">{category.toolCount} tools</p>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Credentials & Skills */}
      <motion.section className="container-max section-padding-tight" {...reveal}>
        <SectionHeading eyebrow="Credentials" title="Certifications & credentials" />
        <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {certifications.map((cert) => (
            <div key={cert.title} className="futurist-card text-center">
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[rgb(var(--accent-rgb)/0.35)] bg-[rgb(var(--accent-rgb)/0.1)] text-[rgb(var(--accent-rgb))]">
                <FaCheck />
              </span>
              <h4 className="font-display text-base font-semibold">{cert.title}</h4>
              <p className="mt-1 text-xs text-[var(--fg-muted)]">{cert.subtitle}</p>
            </div>
          ))}
        </div>

        <SectionHeading
          eyebrow="Expertise"
          title="Skills & expertise"
          description="Comprehensive technical knowledge across multiple domains."
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {skills.map((category) => {
            const Icon = category.icon;
            const visible = category.skills.slice(0, 8);
            const rest = category.skills.length - visible.length;
            return (
              <div key={category.title} className="futurist-card flex flex-col">
                <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgb(var(--accent-rgb)/0.35)] bg-gradient-to-br from-[rgb(var(--accent-rgb)/0.2)] to-[rgb(var(--accent2-rgb)/0.2)] text-xl text-[rgb(var(--accent-rgb))]">
                  <Icon />
                </span>
                <h3 className="font-display text-xl font-semibold">{category.title}</h3>
                <p className="mt-2 text-sm text-[var(--fg-muted)]">{category.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {visible.map((skill) => (
                    <span key={skill} className="badge">
                      {skill}
                    </span>
                  ))}
                  {rest > 0 && <span className="badge-secondary">+{rest} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* DevSecOps stack */}
      <motion.section className="container-max section-padding-tight" {...reveal}>
        <SectionHeading
          eyebrow="Stack"
          title="Complete DevSecOps stack"
          description="Integrated technologies and tools for secure, scalable deployments."
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {stack.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="futurist-card group">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[rgb(var(--accent2-rgb)/0.4)] bg-gradient-to-br from-[rgb(var(--accent2-rgb)/0.25)] to-[rgb(var(--accent-rgb)/0.18)] text-xl text-[rgb(var(--accent-rgb))] transition group-hover:scale-105">
                    <Icon />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">{item.description}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="badge">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* About */}
      <motion.section className="container-max section-padding-tight" {...reveal}>
        <div className="page-hero !mb-0 !p-8 md:!p-14">
          <p className="eyebrow">About</p>
          <h2 className="section-title mt-3">About me</h2>
          <div className="mt-6 max-w-4xl space-y-4 text-base leading-relaxed text-[var(--fg-muted)] sm:text-lg">
            <p>
              Hi! I&apos;m <span className="gradient-text font-semibold">Raju SRK</span>, a{' '}
              <span className="font-semibold text-[rgb(var(--fg-rgb))]">DevSecOps specialist and cloud engineer</span> passionate about
              building scalable, secure, and efficient systems. With expertise spanning cloud architecture, containerization,
              infrastructure automation, security practices, and modern web development, I help teams and fellow developers
              transform ideas into secure reality.
            </p>
            <p>
              This platform is my personal tech blog and knowledge hub where I share deep dives into cloud technologies, security
              best practices, DevSecOps patterns, and innovative software solutions. Whether you&apos;re exploring containerization
              strategies, CI/CD pipelines, security scanning, or cloud-native architectures, you&apos;ll find actionable insights and
              real-world examples from industry practice.
            </p>
            <p>
              Beyond coding, I&apos;m passionate about mentoring, open-source contributions, and building communities. Let&apos;s
              collaborate and create something extraordinary together!
            </p>
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section className="container-max section-padding-tight pb-4" {...reveal}>
        <div className="futurist-hero text-center !p-10 md:!p-16">
          <h2 className="section-title mx-auto max-w-3xl">
            Ready to build something <span className="gradient-text">extraordinary</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--fg-muted)]">
            Whether you have a project in mind, want to collaborate, or just want to chat about cloud and DevOps, I&apos;d love to
            hear from you!
          </p>
          <div className="mt-8">
            <Link href="/contact" className="btn-primary !px-7 !py-3.5">
              Start a conversation
              <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
