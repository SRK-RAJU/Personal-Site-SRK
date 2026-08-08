'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave } from 'react-icons/fa';

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [imageMessage, setImageMessage] = useState('');
  const [toolSuiteName, setToolSuiteName] = useState('');
  const [toolComponents, setToolComponents] = useState('');
  const [toolKeyFeatures, setToolKeyFeatures] = useState('');
  const [learningMode, setLearningMode] = useState<'basic' | 'intermediate' | 'advanced' | 'all-levels'>('all-levels');
  const [audienceLabel, setAudienceLabel] = useState('Beginners to advanced engineers');
  const [useCaseSummary, setUseCaseSummary] = useState('Enterprise deployment, policy enforcement, monitoring, and operations');
  const [imageModel, setImageModel] = useState('imagen-4.0-fast-generate-001');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    tags: '',
    category: 'General',
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from title
    if (name === 'title') {
      const newSlug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData((prev) => ({
        ...prev,
        slug: newSlug,
      }));

      // Keep the tool suite default aligned with post title unless manually changed.
      setToolSuiteName((prev) => prev || value);
    }
  };

  const handleGenerateFeatureImage = async () => {
    setImageError('');
    setImageMessage('');

    const toolName = (toolSuiteName || formData.title).trim();
    if (!toolName) {
      setImageError('Enter a post title or tool suite name before generating image.');
      return;
    }

    setIsGeneratingImage(true);
    setImageMessage('Generating architecture image...');

    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData?.session?.access_token) {
        throw new Error('Sign in as admin to generate images.');
      }

      const response = await fetch('/api/images/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authData.session.access_token}`,
          'x-user-email': authData.session.user.email || '',
        },
        body: JSON.stringify({
          postTitle: formData.title,
          toolName,
          components: toolComponents,
          keyFeatures: toolKeyFeatures,
          category: formData.category,
          model: imageModel,
          aspectRatio: '16:9',
          learningMode,
          audience: audienceLabel,
          useCase: useCaseSummary,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success || !result?.featured_image_url) {
        throw new Error(result?.message || result?.error || 'Image generation failed.');
      }

      setFormData((prev) => ({
        ...prev,
        featured_image_url: result.featured_image_url,
      }));

      setImageMessage(`Image generated with ${result.model_used || imageModel}.`);
    } catch (err: any) {
      setImageError(err?.message || 'Unable to generate image now.');
      setImageMessage('');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }

      if (!formData.slug.trim()) {
        setError('Slug is required');
        setLoading(false);
        return;
      }

      if (!formData.content.trim()) {
        setError('Content is required');
        setLoading(false);
        return;
      }

      // Create post object with optional featured image URL
      const postData: Record<string, unknown> = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 160),
        content: formData.content.trim(),
        category: formData.category || 'General',
        tags: formData.tags.split(',').map(tag => tag.trim()),
        published: false, // Default to draft
        published_at: new Date().toISOString(),
        view_count: 0,
        author_name: 'Raju', // Or get from user context
        created_at: new Date().toISOString(),
      };

      // Only add featured_image_url if provided
      if (formData.featured_image_url.trim()) {
        postData.featured_image_url = formData.featured_image_url.trim();
      }

      const { data, error: insertError } = await supabase
        .from('posts')
        .insert([postData as never])
        .select();

      if (insertError) throw insertError;

      // Success
      alert('Post created successfully! It\'s currently in draft mode.');
      router.push('/dashboard/posts');
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message ||'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/posts" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <FaArrowLeft className="text-xl text-slate-800 dark:text-slate-200" />
        </Link>
        <h1 className="dashboard-title">Create New Post</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-100 p-4 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="dashboard-card space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Post Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Getting Started with DevOps"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            URL Slug * (auto-generated from title)
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="e.g., getting-started-with-devops"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Category & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="General">General</option>
              <option value="DevOps">DevOps</option>
              <option value="Cloud">Cloud</option>
              <option value="Security">Security</option>
              <option value="Development">Development</option>
              <option value="Tutorial">Tutorial</option>
              <option value="Tip">Tip</option>
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., devops, kubernetes, automation"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Excerpt (preview text - optional)
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            placeholder="Brief summary of your post (optional, will be auto-generated if empty)"
            rows={2}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-slate-800 dark:text-slate-100 mt-1">
            If empty, the first 160 characters of content will be used.
          </p>
        </div>

        {/* AI Feature Image Generation */}
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-800 dark:bg-cyan-900/20">
          <h3 className="text-sm font-bold text-cyan-900 dark:text-cyan-200">AI Feature Image Generator</h3>
          <p className="mt-1 text-xs text-cyan-800 dark:text-cyan-300">
            One API call to generate tool + sub-tools/modules cover architecture image generated by AI Agent.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="toolSuiteName" className="mb-2 block text-xs font-semibold text-slate-900 dark:text-white">
                Tool suite name
              </label>
              <input
                type="text"
                id="toolSuiteName"
                value={toolSuiteName}
                onChange={(event) => setToolSuiteName(event.target.value)}
                placeholder="e.g., Zscaler"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="imageModel" className="mb-2 block text-xs font-semibold text-slate-900 dark:text-white">
                Image model
              </label>
              <select
                id="imageModel"
                value={imageModel}
                onChange={(event) => setImageModel(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="imagen-4.0-fast-generate-001">Imagen 4 Fast</option>
                <option value="imagen-4.0-generate-001">Imagen 4 Standard</option>
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="learningMode" className="mb-2 block text-xs font-semibold text-slate-900 dark:text-white">
                Learning coverage mode
              </label>
              <select
                id="learningMode"
                value={learningMode}
                onChange={(event) => setLearningMode(event.target.value as 'basic' | 'intermediate' | 'advanced' | 'all-levels')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="all-levels">All levels (Basic to Advanced)</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label htmlFor="audienceLabel" className="mb-2 block text-xs font-semibold text-slate-900 dark:text-white">
                Audience
              </label>
              <input
                type="text"
                id="audienceLabel"
                value={audienceLabel}
                onChange={(event) => setAudienceLabel(event.target.value)}
                placeholder="e.g., Beginners, admins, architects"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-3">
            <label htmlFor="toolComponents" className="mb-2 block text-xs font-semibold text-slate-900 dark:text-white">
              Modules / sub-tools (comma-separated)
            </label>
            <textarea
              id="toolComponents"
              value={toolComponents}
              onChange={(event) => setToolComponents(event.target.value)}
              placeholder="e.g., ZIA, ZPA, ZCC, ZDX, Admin Portal, Threat Insights"
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="mt-3">
            <label htmlFor="toolKeyFeatures" className="mb-2 block text-xs font-semibold text-slate-900 dark:text-white">
              Key features to teach (comma-separated)
            </label>
            <textarea
              id="toolKeyFeatures"
              value={toolKeyFeatures}
              onChange={(event) => setToolKeyFeatures(event.target.value)}
              placeholder="e.g., policy engine, inline inspection, identity-based access, telemetry, automation"
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="mt-3">
            <label htmlFor="useCaseSummary" className="mb-2 block text-xs font-semibold text-slate-900 dark:text-white">
              Real-world use case
            </label>
            <input
              type="text"
              id="useCaseSummary"
              value={useCaseSummary}
              onChange={(event) => setUseCaseSummary(event.target.value)}
              placeholder="e.g., secure branch-to-SaaS and private app access"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void handleGenerateFeatureImage();
              }}
              disabled={isGeneratingImage}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingImage ? 'Generating image...' : 'Generate architecture image'}
            </button>
            {imageMessage ? <p className="text-xs text-emerald-700 dark:text-emerald-400">{imageMessage}</p> : null}
            {imageError ? <p className="text-xs text-red-700 dark:text-red-400">{imageError}</p> : null}
          </div>
        </div>

        {/* Featured Image URL (Optional) */}
        <div>
          <label htmlFor="featured_image_url" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Featured Image URL (optional)
          </label>
          <input
            type="url"
            id="featured_image_url"
            name="featured_image_url"
            value={formData.featured_image_url}
            onChange={handleChange}
            placeholder="e.g., https://example.com/image.jpg"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formData.featured_image_url ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <img
                src={formData.featured_image_url}
                alt="Generated feature preview"
                className="h-auto max-h-64 w-full object-cover"
              />
            </div>
          ) : null}
          <p className="text-xs text-slate-800 dark:text-slate-100 mt-1">
            💡 TIP: Leave empty to save Supabase storage quota. Text-only posts work great!
          </p>
        </div>

        {/* Main Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Post Content * (Markdown supported)
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your post content here...&#10;&#10;# Heading 1&#10;## Heading 2&#10;&#10;**Bold text** or *italic text*&#10;&#10;- List item 1&#10;- List item 2&#10;&#10;[Link text](https://example.com)"
            rows={12}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
            required
          />
          <p className="text-xs text-slate-800 dark:text-slate-100 mt-1">
            Write your post in Markdown format. You can include code blocks with triple backticks.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">💡 Quota Optimization Tips:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>✓ Text-only posts don't use storage spaces within free tier</li>
            <li>✓ Use markdown for code snippets instead of images</li>
            <li>✓ Link to external images instead of uploading</li>
            <li>✓ Each post counts towards your free row limit</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
          >
            <FaSave /> {loading ? 'Creating...' : 'Create Draft Post'}
          </button>
          <Link
            href="/dashboard/posts"
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
