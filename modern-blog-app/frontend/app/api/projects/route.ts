import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Input validation schema
const ProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  technologies: z.array(z.string()).min(1, 'At least one technology is required'),
  link: z.string().url().optional(),
  github: z.string().url().optional(),
  image: z.string().optional(),
});

// Rate limiting
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_READ = 100; // max read requests per window
const RATE_LIMIT_MAX_WRITE = 20; // max write requests per window

function getClientIp(request: NextRequest) {
  const forwardedIp = request.headers.get('x-forwarded-for');
  if (forwardedIp) {
    return forwardedIp.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(ip: string, isWrite: boolean = false) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  recent.push(now);
  rateLimitMap.set(ip, recent);
  const limit = isWrite ? RATE_LIMIT_MAX_WRITE : RATE_LIMIT_MAX_READ;
  return recent.length > limit;
}

// Default fallback projects
const DEFAULT_PROJECTS = [
  {
    id: 1,
    title: 'Personal Portfolio Site',
    description: 'A modern portfolio website built with Next.js 14, featuring real-time analytics and content management',
    technologies: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'],
    link: 'https://rjexa.com',
    github: 'https://github.com/SRK-RAJU/Personal-Site-SRK',
    image: '/projects/blog.svg',
  },
  {
    id: 2,
    title: 'Local E-Commerce Platform',
    description: 'Full-stack e-commerce platform with markdown support, comments, and SEO optimization',
    technologies: ['React', 'Next.js', 'TypeScript', 'PostgreSQL', 'Supabase', 'Tailwind CSS', 'Payment Integration'],
    link: 'https://jayalakshmikiranashop.vercel.app/',
    github: 'https://github.com/SRK-RAJU',
    image: '/projects/ecommerce.svg',
  },
  {
    id: 3,
    title: 'Facility Management Dashboard',
    description: 'Analytics dashboard for facility management businesses with real-time sales tracking',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Real-time Updates'],
    link: 'https://zispark-services.vercel.app/',
    github: 'https://github.com/SRK-RAJU',
    image: '/projects/tasks.svg',
  },
];

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // If there's an error or no data, return fallback projects
    if (error) {
      return NextResponse.json({ data: DEFAULT_PROJECTS });
    }

    // If no data in database, return fallback projects
    if (!data || data.length === 0) {
      return NextResponse.json({ data: DEFAULT_PROJECTS });
    }

    return NextResponse.json({ data });
  } catch (err) {
    // Return fallback data instead of error
    return NextResponse.json({ data: DEFAULT_PROJECTS });
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, true)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();

    // Validate input with Zod
    let validatedData;
    try {
      validatedData = ProjectSchema.parse(body);
    } catch (validationError) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([validatedData])
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 400 }
    );
  }
}
