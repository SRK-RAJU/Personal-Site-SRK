import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/apiAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return requireAdminAuth(request, async () => {
    try {
      const { id } = params;

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('Posts DELETE error:', err);
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return requireAdminAuth(request, async () => {
    try {
      const { id } = params;
      const body = await request.json();

      const { data, error } = await supabase
        .from('posts')
        .update(body)
        .eq('id', id)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    } catch (err) {
      console.error('Posts PATCH error:', err);
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }
  });
}