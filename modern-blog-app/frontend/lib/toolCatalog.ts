import catalogJson from '@/data/industry-tools.json';
import registryJson from '@/data/tool-architecture-registry.json';
import docsJson from '@/data/tool-docs.json';
import categoryGuidesJson from '@/data/category-docs.json';

/** Static knowledge base built from local data files only: no database rows are used or created. */

export interface ToolGuide {
  scope: 'expanded' | 'catalog-reference';
  catalogCategories: string[];
  what: string;
  why: string[];
  where: string[];
  how: string[];
  alternatives: string[];
  references: string[];
}

export interface ToolComponent {
  name: string;
  role: string;
  modules: string[];
}

export interface CatalogTool {
  name: string;
  slug: string;
  description: string;
  officialUrl: string;
  tags: string[];
  docsUrls: string[];
  components: ToolComponent[];
  family: { title: string; layers: string[] } | null;
  guide: ToolGuide | null;
}

export interface CatalogCategory {
  id: string;
  name: string;
  tools: CatalogTool[];
}

export interface CategoryPlaybook {
  overview: string;
  architecture: string;
  useCases: string[];
  workflow: string[];
  decisionQuestions: string[];
  controls: string;
  rollout: string[];
  operations: string;
  toolNames: string[];
}

interface RegistryEntry {
  family?: string;
  officialDocs?: string[];
  productSet?: Array<{ name?: string; role?: string; modules?: string[] }>;
}

interface RegistryFamily {
  title?: string;
  core?: string[];
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const registryTools = new Map<string, RegistryEntry>(
  Object.entries(registryJson.tools as unknown as Record<string, RegistryEntry>).map(([name, entry]) => [normalize(name), entry])
);
const registryFamilies = registryJson.families as unknown as Record<string, RegistryFamily>;
const guides = (docsJson as unknown as { tools: Record<string, ToolGuide> }).tools || {};
const categoryPlaybooks = (categoryGuidesJson as unknown as { categories: Record<string, CategoryPlaybook> }).categories || {};

const isHttpUrl = (value: unknown): value is string => typeof value === 'string' && /^https?:\/\//i.test(value);

const toList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];

/** Guards against a hand-edited or partial tool-docs.json: a bad entry is ignored instead of breaking the build. */
function toGuide(raw: unknown): ToolGuide | null {
  const entry = raw as Partial<ToolGuide> | undefined;
  if (!entry || typeof entry.what !== 'string' || !entry.what.trim()) return null;
  return {
    scope: entry.scope === 'expanded' ? 'expanded' : 'catalog-reference',
    catalogCategories: toList(entry.catalogCategories),
    what: entry.what.trim(),
    why: toList(entry.why),
    where: toList(entry.where),
    how: toList(entry.how),
    alternatives: toList(entry.alternatives),
    references: toList(entry.references).filter(isHttpUrl),
  };
}

let cached: CatalogCategory[] | null = null;

export function getCategories(): CatalogCategory[] {
  if (cached) return cached;

  cached = (catalogJson.categories as Array<{ id: string; displayName: string; tools: Array<{ name: string; officialUrl?: string; description?: string; tags?: string[] }> }>)
    .map((category) => ({
      id: category.id,
      name: category.displayName,
      tools: category.tools.map((tool): CatalogTool => {
        const entry = registryTools.get(normalize(tool.name));
        const family = entry?.family ? registryFamilies[entry.family] : undefined;
        return {
          name: tool.name,
          slug: slugify(tool.name),
          description: tool.description || '',
          officialUrl: isHttpUrl(tool.officialUrl) ? tool.officialUrl : '',
          tags: Array.isArray(tool.tags) ? tool.tags : [],
          docsUrls: (entry?.officialDocs || []).filter(isHttpUrl),
          components: (entry?.productSet || [])
            .filter((product) => product.name)
            .map((product) => ({ name: String(product.name), role: String(product.role || ''), modules: product.modules || [] })),
          family: family?.title ? { title: family.title, layers: family.core || [] } : null,
          guide: toGuide(guides[tool.name]),
        };
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return cached;
}

export function getCategory(id: string): CatalogCategory | undefined {
  return getCategories().find((category) => category.id === id);
}

export function getCategoryPlaybook(id: string): CategoryPlaybook | undefined {
  return categoryPlaybooks[id];
}

export function getCatalogTotals() {
  const categories = getCategories();
  const allTools = categories.flatMap((category) => category.tools);
  const uniqueNames = new Set(allTools.map((tool) => normalize(tool.name)));
  return {
    categories: categories.length,
    catalogEntries: allTools.length,
    tools: uniqueNames.size,
    guides: categories.reduce((sum, category) => sum + category.tools.filter((tool) => tool.guide).length, 0),
    expandedGuides: allTools.filter((tool) => tool.guide?.scope === 'expanded').length,
  };
}
