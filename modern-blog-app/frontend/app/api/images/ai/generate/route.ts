import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/apiAuth';
import { renderArchitectureDiagram } from '@/lib/architectureDiagram';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const IMAGE_STORAGE_BUCKET = 'blog-images';

const MAX_COMPONENTS = 12;
const IMAGE_CACHE_SECONDS = 60 * 60 * 24 * 30;

interface ImageGenerateBody {
  postTitle?: string;
  toolName?: string;
  components?: string[] | string;
  keyFeatures?: string[] | string;
  category?: string;
  model?: string;
  aspectRatio?: '1:1' | '4:3' | '16:9';
  extraContext?: string;
  learningMode?: 'basic' | 'intermediate' | 'advanced' | 'all-levels';
  audience?: string;
  useCase?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sanitizeText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function parseComponents(components: string[] | string | undefined): string[] {
  if (!components) return [];

  const values = Array.isArray(components)
    ? components
    : components.split(',').map((item) => item.trim());

  const unique = new Set<string>();
  values
    .map((item) => sanitizeText(item, 60))
    .filter(Boolean)
    .slice(0, MAX_COMPONENTS)
    .forEach((item) => unique.add(item));

  return Array.from(unique);
}

function parseFeatureList(features: string[] | string | undefined): string[] {
  if (!features) return [];

  const values = Array.isArray(features)
    ? features
    : features.split(',').map((item) => item.trim());

  const unique = new Set<string>();
  values
    .map((item) => sanitizeText(item, 80))
    .filter(Boolean)
    .slice(0, 12)
    .forEach((item) => unique.add(item));

  return Array.from(unique);
}

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

function inferImageExtension(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('webp')) return 'webp';
  return 'png';
}

async function uploadImageToSupabase(params: {
  imageBuffer: Buffer;
  mimeType: string;
  toolName: string;
  model: string;
}): Promise<{ publicUrl: string; path: string }> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new Error('Supabase service client is not configured');
  }

  const bucket = IMAGE_STORAGE_BUCKET;
  const extension = inferImageExtension(params.mimeType);
  const toolSlug = slugify(params.toolName || 'tool-architecture');
  const filePrefix = `ai-${toolSlug}-`;
  const fileName = `${filePrefix}${Date.now()}-${slugify(params.model)}.${extension}`;
  const path = fileName;

  // Keep only the latest generated image per tool to stay within free storage limits.
  try {
    const { data: existingFiles } = await supabase.storage
      .from(bucket)
      .list('', { limit: 100, search: filePrefix });

    const staleFiles = (existingFiles || [])
      .map((item: any) => item?.name)
      .filter((name: string | undefined) => !!name && name !== fileName) as string[];

    if (staleFiles.length > 0) {
      await supabase.storage.from(bucket).remove(staleFiles);
    }
  } catch {
    // Best-effort cleanup only; continue upload even if listing/removal fails.
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, params.imageBuffer, {
      contentType: params.mimeType,
      upsert: false,
      cacheControl: String(IMAGE_CACHE_SECONDS),
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('Unable to fetch public image URL after upload');
  }

  return {
    publicUrl: data.publicUrl,
    path,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || 'Admin access required' }, { status: 401 });
    }

    const body = (await request.json()) as ImageGenerateBody;
    const toolName = sanitizeText(body.toolName || '', 80);

    if (!toolName) {
      return NextResponse.json({ error: 'toolName is required' }, { status: 400 });
    }

    const components = parseComponents(body.components);
    const keyFeatures = parseFeatureList(body.keyFeatures);
    const generated = await renderArchitectureDiagram({
      toolName,
      postTitle: body.postTitle,
      category: body.category,
      components,
      keyFeatures,
      learningMode: body.learningMode,
      audience: body.audience,
      useCase: body.useCase,
    });
    const uploaded = await uploadImageToSupabase({
      imageBuffer: generated.imageBuffer,
      mimeType: generated.mimeType,
      toolName,
      model: generated.renderer,
    });

    return NextResponse.json({
      success: true,
      featured_image_url: uploaded.publicUrl,
      storage_path: uploaded.path,
      storage_bucket: IMAGE_STORAGE_BUCKET,
      image_size_kb: Math.round(generated.imageBuffer.length / 1024),
      model_used: generated.renderer,
      tool_name: toolName,
      covered_components: components,
      covered_features: keyFeatures,
      learning_mode: body.learningMode || 'all-levels',
      diagram_source_preview: generated.source.slice(0, 220),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Image generation failed',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
