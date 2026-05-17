import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 6; // max requests per window per IP

function getClientIp(request: NextRequest) {
  const forwardedIp = request.headers.get('x-forwarded-for');
  if (forwardedIp) {
    return forwardedIp.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW);
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }
  try {
    const body = await request.json();
    const { name, email, subject, message, website, captchaQuestion, captchaAnswer } = body;

    // Validate honeypot first
    if (website) {
      console.warn('Spam blocked by honeypot:', { ip: clientIp, website });
      return NextResponse.json(
        { message: 'Thank you for your message! I will get back to you soon!' },
        { status: 200 }
      );
    }

    // Validate inputs
    if (!name || !email || !subject || !message || !captchaAnswer || !captchaQuestion) {
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

    // Validate simple math challenge
    const parsedAnswer = Number(String(captchaAnswer).trim());
    const questionMatch = String(captchaQuestion || '').match(/(\d+)\s*([+×*\-])\s*(\d+)/);
    if (!questionMatch) {
      return NextResponse.json(
        { error: 'Verification question is invalid.' },
        { status: 400 }
      );
    }

    const operand1 = Number(questionMatch[1]);
    const operator = questionMatch[2];
    const operand2 = Number(questionMatch[3]);
    let expected: number;

    switch (operator) {
      case '+':
        expected = operand1 + operand2;
        break;
      case '-':
      case '−':
        expected = operand1 - operand2;
        break;
      case '*':
      case '×':
        expected = operand1 * operand2;
        break;
      default:
        return NextResponse.json(
          { error: 'Verification question is invalid.' },
          { status: 400 }
        );
    }

    if (parsedAnswer !== expected) {
      return NextResponse.json(
        { error: 'Please answer the verification question correctly.' },
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
