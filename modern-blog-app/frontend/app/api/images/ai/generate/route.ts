import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const IMAGE_MODEL_FALLBACKS = [
  'imagen-4.0-fast-generate-001',
  'imagen-4.0-generate-001',
];
const IMAGE_STORAGE_BUCKET = 'blog-images';

const SUPPORTED_IMAGE_MODELS = new Set(IMAGE_MODEL_FALLBACKS);
const MAX_COMPONENTS = 12;
const MAX_PROMPT_TEXT = 180;
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

function getGoogleApiKey(): string {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
}

function normalizeModel(model?: string): string {
  return (model || '').trim();
}

function getModelCandidates(requestedModel?: string): string[] {
  const requested = normalizeModel(requestedModel);
  const fallbackList = [...IMAGE_MODEL_FALLBACKS];

  if (requested && SUPPORTED_IMAGE_MODELS.has(requested)) {
    fallbackList.unshift(requested);
  }

  const seen = new Set<string>();
  return fallbackList.filter((model) => {
    if (!model || seen.has(model)) return false;
    seen.add(model);
    return true;
  });
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

function getLearningGuide(mode: ImageGenerateBody['learningMode']): string {
  if (mode === 'basic') {
    return 'Explain beginner essentials first. Keep labels simple and avoid deep jargon.';
  }

  if (mode === 'intermediate') {
    return 'Balance concept clarity with implementation details such as policy flow and integrations.';
  }

  if (mode === 'advanced') {
    return 'Include advanced controls, governance, observability, and failure handling patterns.';
  }

  return 'Use three learning layers in one image: Basic concepts, Intermediate architecture flow, and Advanced operations/governance.';
}

function buildArchitecturePrompt(input: {
  toolName: string;
  postTitle?: string;
  category?: string;
  components: string[];
  keyFeatures: string[];
  extraContext?: string;
  learningMode?: ImageGenerateBody['learningMode'];
  audience?: string;
  useCase?: string;
}): string {
  const titleText = sanitizeText(input.postTitle || `${input.toolName} architecture`, MAX_PROMPT_TEXT);
  const categoryText = sanitizeText(input.category || 'Technology', 50);
  const contextText = sanitizeText(input.extraContext || '', 260);
  const audienceText = sanitizeText(input.audience || 'Beginners to advanced engineers', 90);
  const useCaseText = sanitizeText(input.useCase || 'Enterprise deployment and daily operations', 120);
  const learningGuide = getLearningGuide(input.learningMode || 'all-levels');
  const componentsLine = input.components.length > 0
    ? input.components.join(', ')
    : `${input.toolName} Core Platform, Control Plane, Data Plane, Client Connector, Observability`;
  const featureLine = input.keyFeatures.length > 0
    ? input.keyFeatures.join(', ')
    : 'Policy management, Access control, Threat protection, Telemetry, Alerting, Automation';

  return [
    `Create one modern architecture learning infographic for ${input.toolName}.`,
    `The image must explain the full platform in a single frame and be easy to understand for mixed skill levels.`,
    `Cover these architecture modules with labels: ${componentsLine}.`,
    `Cover these core features with short callouts: ${featureLine}.`,
    `Use a visual flow with zones: Users/Endpoints, Internet/Edge, Control Plane, Data Plane, Integrations, Monitoring.`,
    `Include directional arrows and concise annotations for each module and feature relationship.`,
    `Learning objective: ${learningGuide}`,
    `Audience: ${audienceText}.`,
    `Use case to illustrate: ${useCaseText}.`,
    `Mandatory sections inside image: Basics, Workflow, Advanced Operations.`,
    `In Advanced Operations include policy lifecycle, observability signals, reliability/failure handling, and governance.`,
    `Style: clean enterprise architecture diagram, high contrast labels, minimal clutter, educational layout.`,
    `Topic context: ${titleText}. Category: ${categoryText}.`,
    contextText ? `Additional context: ${contextText}.` : '',
    `Do not include brand logos, copyrighted mascots, or watermarks.`,
    `Do not mimic existing vendor posters. Produce an original layout and composition.`,
    `Output only the image, no text outside the image.`,
  ].filter(Boolean).join(' ');
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

function extractImageFromPayload(payload: any): { mimeType: string; base64Data: string } | null {
  const prediction = payload?.predictions?.[0];
  if (prediction?.bytesBase64Encoded) {
    return {
      mimeType: prediction.mimeType || 'image/png',
      base64Data: prediction.bytesBase64Encoded,
    };
  }

  const candidatePart = payload?.candidates?.[0]?.content?.parts?.find((part: any) => part?.inlineData?.data);
  if (candidatePart?.inlineData?.data) {
    return {
      mimeType: candidatePart.inlineData.mimeType || 'image/png',
      base64Data: candidatePart.inlineData.data,
    };
  }

  const generatedImage = payload?.generatedImages?.[0];
  if (generatedImage?.imageBytes) {
    return {
      mimeType: generatedImage.mimeType || 'image/png',
      base64Data: generatedImage.imageBytes,
    };
  }

  const b64Json = payload?.data?.[0]?.b64_json;
  if (b64Json) {
    return {
      mimeType: 'image/png',
      base64Data: b64Json,
    };
  }

  return null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateImageWithModel(apiKey: string, model: string, prompt: string, aspectRatio: '1:1' | '4:3' | '16:9') {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio,
          safetyFilterLevel: 'block_medium_and_above',
          personGeneration: 'dont_allow',
        },
      }),
    }
  );

  return response;
}

async function generateArchitectureImage(apiKey: string, prompt: string, requestedModel?: string, aspectRatio: '1:1' | '4:3' | '16:9' = '16:9') {
  const modelCandidates = getModelCandidates(requestedModel);

  let lastError = 'Unknown image generation failure';
  for (const model of modelCandidates) {
    const response = await generateImageWithModel(apiKey, model, prompt, aspectRatio);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const isRetryable = response.status === 429 || response.status === 500 || response.status === 503;
      lastError = `${model}: ${response.status} ${body}`;

      if (isRetryable) {
        await sleep(1200);
        continue;
      }

      if (response.status === 404) {
        continue;
      }

      continue;
    }

    const payload = await response.json();
    const extracted = extractImageFromPayload(payload);

    if (!extracted) {
      lastError = `${model}: response did not include image bytes`;
      continue;
    }

    return {
      model,
      mimeType: extracted.mimeType,
      imageBuffer: Buffer.from(extracted.base64Data, 'base64'),
    };
  }

  throw new Error(lastError);
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

    const apiKey = getGoogleApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'Google AI API key is missing' }, { status: 503 });
    }

    const body = (await request.json()) as ImageGenerateBody;
    const toolName = sanitizeText(body.toolName || '', 80);

    if (!toolName) {
      return NextResponse.json({ error: 'toolName is required' }, { status: 400 });
    }

    const components = parseComponents(body.components);
    const keyFeatures = parseFeatureList(body.keyFeatures);
    const aspectRatio = body.aspectRatio || '16:9';
    const prompt = buildArchitecturePrompt({
      toolName,
      postTitle: body.postTitle,
      category: body.category,
      components,
      keyFeatures,
      extraContext: body.extraContext,
      learningMode: body.learningMode,
      audience: body.audience,
      useCase: body.useCase,
    });

    const generated = await generateArchitectureImage(apiKey, prompt, body.model, aspectRatio);
    const uploaded = await uploadImageToSupabase({
      imageBuffer: generated.imageBuffer,
      mimeType: generated.mimeType,
      toolName,
      model: generated.model,
    });

    return NextResponse.json({
      success: true,
      featured_image_url: uploaded.publicUrl,
      storage_path: uploaded.path,
      storage_bucket: IMAGE_STORAGE_BUCKET,
      image_size_kb: Math.round(generated.imageBuffer.length / 1024),
      model_used: generated.model,
      tool_name: toolName,
      covered_components: components,
      covered_features: keyFeatures,
      learning_mode: body.learningMode || 'all-levels',
      prompt_preview: prompt.slice(0, 220),
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
