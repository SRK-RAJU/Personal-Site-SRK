import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/apiAuth';
import industryToolsData from '@/data/industry-tools.json';

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

function slugify(value: string): string {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
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
    if (data.length < limit) {
      break;
    }

    offset += limit;
    if (offset > 5000) {
      break;
    }
  }

  return files;
}

function getIndustryCatalogTools(category?: string) {
  const categories = Array.isArray((industryToolsData as any)?.categories) ? (industryToolsData as any).categories : [];

  return categories
    .filter((group: any) => {
      if (!category) return true;
      const target = category.toLowerCase();
      return (
        String(group.displayName || '').toLowerCase().includes(target) ||
        String(group.id || '').toLowerCase().includes(target)
      );
    })
    .flatMap((group: any) =>
      (group.tools || []).map((tool: any) => ({
        tool_name: String(tool.name || '').trim(),
        category: String(group.displayName || group.id || 'Industry Catalog'),
        description: String(tool.description || ''),
      }))
    )
    .filter((tool: any) => tool.tool_name);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || 'Admin access required' }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase service client is not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') || '').trim();

    let toolsQuery = supabase
      .from('tools_coverage_metadata')
      .select('tool_name, category, priority')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('tool_name', { ascending: true });

    if (category) {
      toolsQuery = toolsQuery.ilike('category', category);
    }

    const { data: toolsData, error: toolsError } = await toolsQuery;
    if (toolsError) {
      return NextResponse.json({ error: toolsError.message }, { status: 500 });
    }

    const dbTools = (toolsData || []).map((tool: any) => ({
      tool_name: String(tool.tool_name || '').trim(),
      category: String(tool.category || 'General'),
      description: String(tool.description || ''),
    }));

    // Merge with industry catalog tools
    const industryTools = getIndustryCatalogTools(category);
    const seen = new Set<string>();
    const allTools = [...dbTools, ...industryTools].filter((tool) => {
      const key = (tool.tool_name || '').toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const files = await listAllStorageFiles(supabase, IMAGE_STORAGE_BUCKET);
    const aiFiles = files.filter((file: any) => typeof file?.name === 'string' && file.name.startsWith('ai-'));

    const tools = allTools.map((tool: any, index: number) => {
      const toolName = String(tool.tool_name || '').trim();
      const toolSlug = slugify(toolName);
      const prefix = `ai-${toolSlug}-`;
      const matching = aiFiles.filter((file: any) => String(file.name || '').startsWith(prefix));
      const latest = matching
        .slice()
        .sort((a: any, b: any) => {
          const at = new Date(a?.created_at || 0).getTime();
          const bt = new Date(b?.created_at || 0).getTime();
          return bt - at;
        })[0];

      const imageUrl = latest
        ? supabase.storage.from(IMAGE_STORAGE_BUCKET).getPublicUrl(String(latest.name)).data.publicUrl
        : null;

      return {
        number: index + 1,
        tool_name: toolName,
        category: String(tool.category || ''),
        generated: matching.length > 0,
        image_name: latest?.name || null,
        image_url: imageUrl,
      };
    });

    const generatedCount = tools.filter((tool: any) => tool.generated).length;

    let contiguous = 0;
    for (const tool of tools) {
      if (!tool.generated) break;
      contiguous += 1;
    }

    const nextToolNumber = contiguous < tools.length ? contiguous + 1 : null;
    const firstPending = tools.find((tool: any) => !tool.generated);

    return NextResponse.json({
      success: true,
      category: category || null,
      total_tools: tools.length,
      generated_tools: generatedCount,
      remaining_tools: Math.max(0, tools.length - generatedCount),
      generated_upto_number: contiguous,
      next_tool_number: nextToolNumber,
      next_pending_number: firstPending?.number || null,
      all_generated: generatedCount === tools.length,
      tools,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to load image progress',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
