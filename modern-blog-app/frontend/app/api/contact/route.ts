import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Log the contact message
    console.log('New contact message:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Try to save to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      try {
        const { error } = await supabase
          .from('contact_messages')
          .insert([{ name, email, subject, message, created_at: new Date().toISOString() }]);
        
        if (error && error.code !== 'PGRST116') {
          console.warn('Supabase insert warning:', error);
          // Still return success even if table doesn't exist yet
        }
      } catch (dbErr) {
        console.warn('Database save attempt:', dbErr);
        // Don't fail the request if database is not ready
      }
    }

    return NextResponse.json(
      { message: 'Thank you for your message! I will get back to you soon!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
