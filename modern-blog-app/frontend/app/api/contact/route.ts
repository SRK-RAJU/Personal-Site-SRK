import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getClientIp } from '@/lib/requestAccess';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Input validation schema
const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  website: z.string().optional().default(''), // honeypot
  captchaQuestion: z.string(),
  captchaAnswer: z.string(),
});

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 6; // max requests per window per IP

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

    // Validate input with Zod
    let validatedData;
    try {
      validatedData = ContactFormSchema.parse(body);
    } catch (validationError) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    const { name, email, subject, message, website, captchaQuestion, captchaAnswer } = validatedData;

    // Validate honeypot
    if (website) {
      // Silently reject spam attempts
      return NextResponse.json(
        { message: 'Thank you for your message! I will get back to you soon!' },
        { status: 200 }
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

    // Contact message received - no logging of sensitive data

    // Try to save to Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      try {
        const { error } = await supabase
          .from('contact_messages')
          .insert([{ name, email, subject, message, created_at: new Date().toISOString() }]);
        
        if (error && error.code !== 'PGRST116') {
          // Silently handle database errors
        }
      } catch (dbErr) {
        // Silently handle database save errors
        // Don't fail the request if database is not ready
      }
    }

    return NextResponse.json(
      { message: 'Thank you for your message! I will get back to you soon!' },
      { status: 200 }
    );
  } catch (error) {
    // Silently handle unexpected errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
