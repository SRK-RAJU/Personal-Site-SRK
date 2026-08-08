import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const IMAGE_STORAGE_BUCKET = 'blog-images';

function getSupabaseServiceClient() {
  const url = process.env.DIRECT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function toTitleCaseFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function listAllStorageFiles(supabase: any, bucket: string): Promise<any[]> {
  const files: any[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', { limit, offset });

    if (error || !data || data.length === 0) {
      break;
    }

    files.push(...data);
    if (data.length < limit) break;

    offset += limit;
    if (offset > 5000) break;
  }

  return files;
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ images: [] }, { status: 200 });
    }

    const files = await listAllStorageFiles(supabase, IMAGE_STORAGE_BUCKET);

    const aiImages = files
      .filter((file: any) => typeof file?.name === 'string' && file.name.startsWith('ai-'))
      .sort((a: any, b: any) => {
        const at = new Date(a?.created_at || 0).getTime();
        const bt = new Date(b?.created_at || 0).getTime();
        return bt - at;
      })
      .map((file: any) => {
        const name = String(file.name || '');
        const base = name.replace(/^ai-/, '').replace(/\.[a-zA-Z0-9]+$/, '');
        const toolSlug = base.replace(/-\d{10,}-.*$/, '');
        const { data } = supabase.storage.from(IMAGE_STORAGE_BUCKET).getPublicUrl(name);

        return {
          name,
          tool_name: toTitleCaseFromSlug(toolSlug),
          url: data.publicUrl,
          size: file?.metadata?.size || 0,
          created_at: file?.created_at || null,
        };
      });

    return NextResponse.json({ images: aiImages }, { status: 200 });
  } catch {
    return NextResponse.json({ images: [] }, { status: 200 });
  }
}
