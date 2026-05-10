import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Default fallback projects
const DEFAULT_PROJECTS = [
  {
    id: 1,
    title: 'Personal Portfolio Site',
    description: 'A modern portfolio website built with Next.js 14, featuring real-time analytics and content management',
    technologies: ['Next.js', 'TypeScript', 'Supabase', 'Tailwind CSS'],
    link: 'https://rjexa.com',
    github: 'https://github.com/SRK-RAJU/Personal-Site-SRK',
    image: '/projects/portfolio.jpg',
  },
  {
    id: 2,
    title: 'Local E-Commerce Platform',
    description: 'Full-stack e-commerce platform with markdown support, comments, and SEO optimization',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'GraphQL'],
    link: 'https://jayalakshmikiranashop.vercel.app/',
    github: 'https://github.com/SRK-RAJU',
    image: '/projects/ecommerce.jpg',
  },
  {
    id: 3,
    title: 'Facility Management Dashboard',
    description: 'Analytics dashboard for facility management businesses with real-time sales tracking',
    technologies: ['Next.js', 'Redux', 'Supabase', 'Chart.js'],
    link: 'https://zispark-services.vercel.app/',
    github: 'https://github.com/SRK-RAJU',
    image: '/projects/dashboard.jpg',
  },
];

export async function GET(request: NextRequest) {
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
      console.error('Projects API query error:', error.message);
      return NextResponse.json({ data: DEFAULT_PROJECTS });
    }

    // If no data in database, return fallback projects
    if (!data || data.length === 0) {
      return NextResponse.json({ data: DEFAULT_PROJECTS });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Projects API exception:', err);
    // Return fallback data instead of error
    return NextResponse.json({ data: DEFAULT_PROJECTS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('projects')
      .insert([body])
      .select();

    if (error) {
      console.error('Projects POST error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Projects POST exception:', err);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 400 }
    );
  }
}
