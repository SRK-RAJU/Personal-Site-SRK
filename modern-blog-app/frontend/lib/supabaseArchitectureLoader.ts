/**
 * Supabase Architecture Registry Loader
 * 
 * Reads tool architecture metadata from Supabase instead of local files.
 * Used by the admin image generator to build diagram generation payloads.
 * 
 * Usage:
 *   import { getToolArchitecture, getAllToolArchitectures } from '@/lib/supabaseArchitectureLoader';
 *   
 *   const zscalerArch = await getToolArchitecture('Zscaler');
 *   const allArchitectures = await getAllToolArchitectures();
 */

import { supabase } from './supabaseClient';

export interface ArchitectureMetadata {
  family: string;
  productSet: Array<{
    name: string;
    role: string;
    modules: string[];
  }>;
  diagramBlueprint: {
    entry: string[];
    core: string[];
    data: string[];
    ops: string[];
  };
  officialDocs: {
    home: string;
    architecture?: string;
    documentation?: string;
  };
  description: string;
  notes?: string;
}

export interface ToolArchitectureRecord {
  id: number;
  tool_name: string;
  category: string;
  architecture_family: string;
  architecture_metadata: ArchitectureMetadata;
  diagram_image_path: string | null;
  diagram_updated_at: string | null;
}

/**
 * Get architecture for a single tool
 */
export async function getToolArchitecture(toolName: string): Promise<ArchitectureMetadata | null> {
  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('architecture_metadata')
      .eq('tool_name', toolName)
      .single();

    if (error) {
      console.error(`Failed to fetch architecture for ${toolName}:`, error);
      return null;
    }

    const row = data as { architecture_metadata?: ArchitectureMetadata } | null;
    if (!row?.architecture_metadata) {
      console.warn(`No architecture metadata found for ${toolName}`);
      return null;
    }

    return row.architecture_metadata;
  } catch (err) {
    console.error(`Error fetching architecture for ${toolName}:`, err);
    return null;
  }
}

/**
 * Get architecture with full record (includes diagram path, category, etc.)
 */
export async function getToolArchitectureRecord(toolName: string): Promise<ToolArchitectureRecord | null> {
  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('*')
      .eq('tool_name', toolName)
      .single();

    if (error) {
      console.error(`Failed to fetch record for ${toolName}:`, error);
      return null;
    }

    return (data as ToolArchitectureRecord | null) ?? null;
  } catch (err) {
    console.error(`Error fetching record for ${toolName}:`, err);
    return null;
  }
}

/**
 * Get all active tool architectures
 */
export async function getAllToolArchitectures(): Promise<ToolArchitectureRecord[]> {
  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('*')
      .eq('is_active', true)
      .not('architecture_metadata', 'is', null);

    if (error) {
      console.error('Failed to fetch all architectures:', error);
      return [];
    }

    return (data || []) as ToolArchitectureRecord[];
  } catch (err) {
    console.error('Error fetching all architectures:', err);
    return [];
  }
}

/**
 * Get tools by architecture family
 */
export async function getToolsByFamily(family: string): Promise<ToolArchitectureRecord[]> {
  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('*')
      .eq('architecture_family', family)
      .eq('is_active', true);

    if (error) {
      console.error(`Failed to fetch tools for family ${family}:`, error);
      return [];
    }

    return (data || []) as ToolArchitectureRecord[];
  } catch (err) {
    console.error(`Error fetching tools for family ${family}:`, err);
    return [];
  }
}

/**
 * Get tools needing diagram generation (no diagram_image_path set)
 */
export async function getToolsNeedingDiagrams(): Promise<ToolArchitectureRecord[]> {
  try {
    const { data, error } = await supabase
      .from('tools_coverage_metadata')
      .select('*')
      .eq('is_active', true)
      .is('diagram_image_path', null)
      .not('architecture_metadata', 'is', null);

    if (error) {
      console.error('Failed to fetch tools needing diagrams:', error);
      return [];
    }

    return (data || []) as ToolArchitectureRecord[];
  } catch (err) {
    console.error('Error fetching tools needing diagrams:', err);
    return [];
  }
}

/**
 * Update diagram path and timestamp for a tool
 */
export async function updateToolDiagramPath(
  toolName: string,
  diagramPath: string,
  timestamp: string = new Date().toISOString()
): Promise<boolean> {
  try {
    const typedSupabase = supabase as any;
    const { error } = await typedSupabase
      .from('tools_coverage_metadata')
      .update({
        diagram_image_path: diagramPath,
        diagram_updated_at: timestamp,
        updated_at: timestamp
      })
      .eq('tool_name', toolName);

    if (error) {
      console.error(`Failed to update diagram path for ${toolName}:`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Error updating diagram path for ${toolName}:`, err);
    return false;
  }
}

/**
 * Build diagram generation payload from architecture metadata
 * Ready to send to renderArchitectureDiagram()
 */
export function buildDiagramPayload(architecture: ArchitectureMetadata) {
  return {
    toolName: architecture.productSet[0]?.name || 'Unknown',
    family: architecture.family,
    productSet: architecture.productSet,
    modules: architecture.diagramBlueprint,
    useCase: architecture.notes || ''
  };
}
