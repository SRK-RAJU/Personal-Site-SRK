import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/apiAuth';
import { renderArchitectureDiagram } from '@/lib/architectureDiagram';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

const IMAGE_STORAGE_BUCKET = 'blog-images';
const IMAGE_CACHE_SECONDS = 60 * 60 * 24 * 30;
const MAX_BATCH_LIMIT = 8;

interface BatchGenerateBody {
  category?: string;
  offset?: number;
  limit?: number;
  model?: string;
  learningMode?: 'basic' | 'intermediate' | 'advanced' | 'all-levels';
}

function sanitizeText(value: string, maxLength: number): string {
  return (value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
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

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function categoryDefaults(category: string) {
  const c = (category || '').toLowerCase();

  if (c.includes('security')) {
    return {
      modules: ['Users/Endpoints', 'Identity', 'Policy Engine', 'Inspection/Protection', 'Cloud Control Plane', 'Threat Intelligence', 'Logs/SIEM', 'Admin Console'],
      features: ['policy enforcement', 'threat prevention', 'identity-based access', 'data protection', 'incident response', 'analytics'],
      useCase: 'Secure user access to SaaS and private apps with policy-based controls and continuous monitoring',
    };
  }

  if (c.includes('cloud')) {
    return {
      modules: ['Users/Teams', 'Resource Provisioning', 'Control Plane', 'Compute/Storage', 'Network', 'Security Layer', 'Observability', 'Automation'],
      features: ['scalability', 'resource orchestration', 'cost visibility', 'security controls', 'resilience', 'automation'],
      useCase: 'Deploy and operate cloud workloads with secure and observable architecture patterns',
    };
  }

  if (c.includes('database')) {
    return {
      modules: ['Applications', 'Connection Layer', 'Query Engine', 'Storage Engine', 'Replication', 'Backup/Recovery', 'Security', 'Monitoring'],
      features: ['data durability', 'high availability', 'query performance', 'access control', 'backup strategy', 'observability'],
      useCase: 'Run production database services with performance, security, and disaster recovery coverage',
    };
  }

  if (c.includes('container') || c.includes('orchestration')) {
    return {
      modules: ['Developers', 'CI/CD', 'Registry', 'Cluster Control Plane', 'Worker Nodes', 'Network/Ingress', 'Security Policies', 'Monitoring'],
      features: ['workload orchestration', 'rolling updates', 'auto-scaling', 'policy controls', 'service routing', 'health monitoring'],
      useCase: 'Deliver containerized apps with orchestrated deployments and operational reliability',
    };
  }

  if (c.includes('ci/cd')) {
    return {
      modules: ['Developers', 'Source Control', 'Build Pipeline', 'Test Stage', 'Artifact Store', 'Deploy Stage', 'Environment Targets', 'Observability'],
      features: ['pipeline automation', 'test gates', 'artifact versioning', 'deployment strategies', 'rollback', 'release visibility'],
      useCase: 'Automate software delivery from commit to production with quality and release controls',
    };
  }

  if (c.includes('monitoring') || c.includes('observability')) {
    return {
      modules: ['Applications', 'Metrics/Logs/Traces', 'Collectors/Agents', 'Storage Backend', 'Query Layer', 'Dashboards', 'Alerts', 'Incident Workflow'],
      features: ['telemetry collection', 'correlation', 'alerting', 'SLO tracking', 'root-cause analysis', 'incident response'],
      useCase: 'Observe distributed systems end-to-end and respond quickly to reliability issues',
    };
  }

  if (c.includes('identity')) {
    return {
      modules: ['Users', 'Identity Provider', 'Auth Protocol Layer', 'Policy Engine', 'Applications', 'Session Management', 'Audit Logs', 'Admin Controls'],
      features: ['authentication', 'authorization', 'single sign-on', 'federation', 'session security', 'compliance auditing'],
      useCase: 'Enable secure user identity flows across enterprise apps with centralized policy and auditability',
    };
  }

  return {
    modules: ['Users', 'Integrations', 'Control Plane', 'Data Plane', 'Policy/Config', 'Security', 'Monitoring', 'Admin Console'],
    features: ['configuration', 'automation', 'security', 'scalability', 'reliability', 'visibility'],
    useCase: 'Operate the platform effectively from setup to production-scale operations',
  };
}

function getLearningGuide(mode: BatchGenerateBody['learningMode']): string {
  if (mode === 'basic') return 'Explain beginner essentials first with simple labels.';
  if (mode === 'intermediate') return 'Balance concept clarity with architecture workflow details.';
  if (mode === 'advanced') return 'Highlight advanced operations, governance, and failure handling patterns.';
  return 'Use three layers in one visual: Basic concepts, Intermediate workflow, and Advanced operations.';
}

function buildPrompt(input: {
  toolName: string;
  category: string;
  description?: string;
  modules: string[];
  features: string[];
  useCase: string;
  learningMode?: BatchGenerateBody['learningMode'];
}): string {
  const toolName = sanitizeText(input.toolName, 90);
  const category = sanitizeText(input.category || 'Technology', 50);
  const description = sanitizeText(input.description || '', 180);
  const modules = input.modules.map((m) => sanitizeText(m, 60)).filter(Boolean).slice(0, 10);
  const features = input.features.map((f) => sanitizeText(f, 70)).filter(Boolean).slice(0, 10);

  const modulesLine = modules.join(', ');
  const featuresLine = features.join(', ');

  return [
    `Create one modern architecture learning infographic for ${toolName}.`,
    `The image must cover complete tool understanding in one frame and be easy for public users.`,
    `Category: ${category}.`,
    description ? `Tool description context: ${description}.` : '',
    `Architecture modules to include: ${modulesLine}.`,
    `Feature callouts to include: ${featuresLine}.`,
    `Add clear directional data-flow arrows between modules.`,
    `Mandatory educational sections inside image: Basics, Workflow, Advanced Operations.`,
    `Learning objective: ${getLearningGuide(input.learningMode || 'all-levels')}`,
    `Use-case to illustrate: ${sanitizeText(input.useCase, 140)}.`,
    `Style: enterprise infographic, clear labels, high contrast, minimal clutter, original composition.`,
    `Do not include logos, brand mascots, or watermarks.`,
    `Do not copy or mimic existing vendor poster layouts.`,
    `Output image only.`,
  ].filter(Boolean).join(' ');
}

async function uploadImageToSupabase(params: {
  supabase: any;
  imageBuffer: Buffer;
  mimeType: string;
  toolName: string;
  model: string;
}): Promise<{ publicUrl: string; path: string }> {
  const extension = inferImageExtension(params.mimeType);
  const toolSlug = slugify(params.toolName || 'tool-architecture');
  const filePrefix = `ai-${toolSlug}-`;
  const fileName = `${filePrefix}${Date.now()}-${slugify(params.model)}.${extension}`;

  try {
    const { data: existingFiles } = await params.supabase.storage
      .from(IMAGE_STORAGE_BUCKET)
      .list('', { limit: 100, search: filePrefix });

    const staleFiles = (existingFiles || [])
      .map((item: any) => item?.name)
      .filter((name: string | undefined) => !!name && name !== fileName) as string[];

    if (staleFiles.length > 0) {
      await params.supabase.storage.from(IMAGE_STORAGE_BUCKET).remove(staleFiles);
    }
  } catch {
    // Best-effort cleanup
  }

  const { error: uploadError } = await params.supabase.storage
    .from(IMAGE_STORAGE_BUCKET)
    .upload(fileName, params.imageBuffer, {
      contentType: params.mimeType,
      upsert: false,
      cacheControl: String(IMAGE_CACHE_SECONDS),
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = params.supabase.storage.from(IMAGE_STORAGE_BUCKET).getPublicUrl(fileName);
  if (!data?.publicUrl) {
    throw new Error('Unable to fetch public URL after upload');
  }

  return {
    publicUrl: data.publicUrl,
    path: fileName,
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || 'Admin access required' }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase service client is not configured' }, { status: 503 });
    }

    const body = (await request.json().catch(() => ({}))) as BatchGenerateBody;
    const rawLimit = Number(body.limit || 4);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, Math.floor(rawLimit)), MAX_BATCH_LIMIT) : 4;
    const rawOffset = Number(body.offset || 0);
    const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.floor(rawOffset)) : 0;
    const category = sanitizeText(body.category || '', 80);

    let countQuery = supabase
      .from('tools_coverage_metadata')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (category) {
      countQuery = countQuery.ilike('category', category);
    }

    const { count: totalCount } = await countQuery;
    const totalTools = totalCount || 0;

    let toolsQuery = supabase
      .from('tools_coverage_metadata')
      .select('tool_name, category, description, priority')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('tool_name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (category) {
      toolsQuery = toolsQuery.ilike('category', category);
    }

    const { data: tools, error: toolsError } = await toolsQuery;
    if (toolsError) {
      return NextResponse.json({ error: toolsError.message }, { status: 500 });
    }

    const generated: Array<Record<string, any>> = [];
    const failed: Array<Record<string, any>> = [];
    let quotaStop = false;

    for (const tool of tools || []) {
      const toolName = sanitizeText(tool.tool_name || '', 90);
      if (!toolName) continue;

      try {
        const defaults = categoryDefaults(tool.category || 'General');
        const generatedImage = await renderArchitectureDiagram({
          toolName,
          category: tool.category || 'General',
          components: defaults.modules,
          keyFeatures: defaults.features,
          learningMode: body.learningMode || 'all-levels',
          useCase: defaults.useCase,
        });
        const uploaded = await uploadImageToSupabase({
          supabase,
          imageBuffer: generatedImage.imageBuffer,
          mimeType: generatedImage.mimeType,
          toolName,
          model: generatedImage.renderer,
        });

        generated.push({
          tool: toolName,
          category: tool.category,
          model_used: generatedImage.renderer,
          featured_image_url: uploaded.publicUrl,
          storage_path: uploaded.path,
          image_size_kb: Math.round(generatedImage.imageBuffer.length / 1024),
        });
      } catch (error: any) {
        const message = error?.message || 'Generation failed';
        failed.push({ tool: toolName, category: tool.category, error: message });

        if (/429|quota|rate/i.test(message)) {
          quotaStop = true;
          break;
        }
      }

      await sleep(150);
    }

    const processed = generated.length + failed.length;
    const nextOffset = offset + processed;
    const hasMore = !quotaStop && nextOffset < totalTools;

    const responseStatus = generated.length === 0 && failed.length > 0 ? 502 : failed.length > 0 ? 207 : 200;

    return NextResponse.json({
      success: generated.length > 0 || failed.length === 0,
      total_tools: totalTools,
      offset,
      requested_limit: limit,
      processed,
      generated_count: generated.length,
      failed_count: failed.length,
      next_offset: nextOffset,
      has_more: hasMore,
      quota_stop: quotaStop,
      generated,
      failed,
    }, { status: responseStatus });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Bulk image generation failed',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
