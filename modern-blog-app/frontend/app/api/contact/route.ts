import { NextRequest, NextResponse } from 'next/server';

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

    // TODO: In production, integrate with Supabase or email service
    // For now, just log the contact message
    console.log('New contact message:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    });

    // Optional: Save to Supabase
    // const { error } = await supabase
    //   .from('contact_messages')
    //   .insert([{ name, email, subject, message }]);
    
    // if (error) {
    //   return NextResponse.json(
    //     { error: 'Failed to send message' },
    //     { status: 500 }
    //   );
    // }

    return NextResponse.json(
      { message: 'Thank you for your message. I will get back to you soon!' },
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
