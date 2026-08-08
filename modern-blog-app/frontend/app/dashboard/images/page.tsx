'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { FaUpload, FaTrash, FaDownload, FaCopy, FaBolt, FaArrowLeft } from 'react-icons/fa';
import { validateImageFile, sanitizeFileName } from '@/lib/security';
import { compressImage, calculateCompressionSavings } from '@/lib/imageCompression';

interface Image {
  id: string | null;
  name: string;
  url: string;
  size: number;
  created_at: string | null;
}

interface ToolProgress {
  number: number;
  tool_name: string;
  category: string;
  generated: boolean;
  image_name: string | null;
  image_url: string | null;
}

export default function ImagesPage() {
  const router = useRouter();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchMode, setBatchMode] = useState<'single' | 'full'>('single');
  const [batchLimit, setBatchLimit] = useState(4);
  const [batchOffset, setBatchOffset] = useState(0);
  const [batchCategory, setBatchCategory] = useState('');
  const [batchStatus, setBatchStatus] = useState('');
  const [batchSummary, setBatchSummary] = useState('');
  const [selectedToolNumber, setSelectedToolNumber] = useState(1);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressGenerated, setProgressGenerated] = useState(0);
  const [generatedUptoNumber, setGeneratedUptoNumber] = useState(0);
  const [nextToolNumber, setNextToolNumber] = useState<number | null>(null);
  const [nextPendingNumber, setNextPendingNumber] = useState<number | null>(null);
  const [allGenerated, setAllGenerated] = useState(false);
  const [toolProgress, setToolProgress] = useState<ToolProgress[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<string>('');

  const CATEGORY_OPTIONS = [
    'AI/ML',
    'Cloud Platform',
    'Infrastructure as Code',
    'CI/CD Pipeline',
    'Monitoring/Observability',
    'Security/Zero-Trust',
    'Container/Orchestration',
    'Database',
    'Data Engineering',
    'Data Streaming',
    'Networking',
    'Identity & Access',
    'DevSecOps',
    'Developer Tools',
    'Automation',
  ];

  useEffect(() => {
    fetchImages();
    void fetchProgress('');
  }, []);

  useEffect(() => {
    void fetchProgress(batchCategory);
  }, [batchCategory]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      if (!supabase) {
        setError('Supabase is not configured');
        return;
      }

      const { data, error } = await supabase.storage
        .from('blog-images')
        .list();

      if (error) {
        return;
      }

      const imageList = (data || [])
        .filter((file: any) => file.name !== '.emptyFolderPlaceholder')
        .map((file: any) => {
          const { data } = supabase.storage
            .from('blog-images')
            .getPublicUrl(file.name);

          return {
            id: file.id,
            name: file.name,
            url: data.publicUrl,
            size: file.metadata?.size || 0,
            created_at: file.created_at,
          };
        });

      setImages(imageList);
    } catch (err) {
      console.error('Error fetchImages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setError('');
    setSuccess('');
    setCompressionStats('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        continue;
      }

      try {
        setUploading(true);
        const originalSize = file.size;

        // Compress image before upload
        let fileToUpload = file;
        let compression = '';
        
        try {
          const compressedBlob = await compressImage(file);
          const compressedSize = compressedBlob.size;
          const savings = calculateCompressionSavings(originalSize, compressedSize);
          
          fileToUpload = new File([compressedBlob], file.name, {
            type: 'image/jpeg',
          });
          
          compression = `(${savings}% saved - ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB)`;
          setCompressionStats(compression);
        } catch (compressErr) {
          console.warn('Compression failed, uploading original:', compressErr);
          compression = '(compression skipped)';
        }

        const fileName = sanitizeFileName(file.name);
        const uniqueName = `${Date.now()}-${fileName}`;

        const { data, error } = await supabase.storage
          .from('blog-images')
          .upload(uniqueName, fileToUpload);

        if (error) {
          setError(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }

        setSuccess(`✓ ${file.name} uploaded successfully! ${compression}`);
        setUploadProgress(((i + 1) / files.length) * 100);
      } catch (err) {
        console.error('Upload error:', err);
        setError('Failed to upload image');
      } finally {
        if (i === files.length - 1) {
          setUploading(false);
          setUploadProgress(0);
          fetchImages();
        }
      }
    }

    e.target.value = '';
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm('Delete this image?')) return;

    try {
      const { error } = await supabase.storage
        .from('blog-images')
        .remove([fileName]);

      if (error) {
        setError('Failed to delete image');
        return;
      }

      setImages(images.filter((img) => img.name !== fileName));
      setSuccess('Image deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete image');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const fetchProgress = async (category: string) => {
    try {
      setProgressLoading(true);
      const { data: authData, error: authError } = await supabase.auth.refreshSession();
      if (authError || !authData?.session?.access_token) {
        return;
      }

      const query = category ? `?category=${encodeURIComponent(category)}` : '';
      const response = await fetch(`/api/images/ai/progress${query}`, {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
          'x-user-email': authData.session.user.email || '',
        },
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        return;
      }

      setProgressTotal(result.total_tools || 0);
      setProgressGenerated(result.generated_tools || 0);
      setGeneratedUptoNumber(result.generated_upto_number || 0);
      setNextToolNumber(result.next_tool_number || null);
      setNextPendingNumber(result.next_pending_number || null);
      setAllGenerated(Boolean(result.all_generated));
      setToolProgress(Array.isArray(result.tools) ? result.tools : []);

      const suggestedNumber = result.next_pending_number || result.next_tool_number || 1;
      const suggestedOffset = Math.max(0, Number(suggestedNumber) - 1);
      setBatchOffset(suggestedOffset);
      setSelectedToolNumber(suggestedNumber);
    } catch {
      // Keep UI usable even if progress endpoint fails.
    } finally {
      setProgressLoading(false);
    }
  };

  const runImageBatch = async (offset: number, limitOverride?: number) => {
    const { data: authData, error: authError } = await supabase.auth.refreshSession();
    if (authError || !authData?.session?.access_token) {
      throw new Error('Admin session required. Please sign in again.');
    }

    const response = await fetch('/api/images/ai/generate-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authData.session.access_token}`,
        'x-user-email': authData.session.user.email || '',
      },
      body: JSON.stringify({
        category: batchCategory || undefined,
        offset,
        limit: limitOverride || batchLimit,
        learningMode: 'all-levels',
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      const failure = Array.isArray(payload?.failed) ? payload.failed[0] : null;
      throw new Error(
        failure?.error
          ? `${failure.tool || 'Image'} failed: ${failure.error}`
          : payload?.message || payload?.error || 'Batch generation failed',
      );
    }

    return payload;
  };

  const handleRunBatch = async () => {
    setError('');
    setSuccess('');
    setBatchStatus('');
    setBatchSummary('');
    setBatchRunning(true);

    try {
      if (batchMode === 'single') {
        setBatchStatus(`Running one batch from offset ${batchOffset}...`);
        const result = await runImageBatch(batchOffset);
        setBatchOffset(result.next_offset || batchOffset);
        const firstFailure = result.failed?.[0];
        setBatchSummary(
          `Generated ${result.generated_count}, failed ${result.failed_count}, next offset ${result.next_offset}.` +
          (firstFailure?.error ? ` ${firstFailure.tool || 'Image'}: ${firstFailure.error}` : ''),
        );
        setSuccess('Batch completed successfully.');
        await fetchImages();
        await fetchProgress(batchCategory);
      } else {
        let currentOffset = batchOffset;
        let totalGenerated = 0;
        let totalFailed = 0;
        let totalTools = 0;
        let guard = 0;

        while (guard < 500) {
          guard += 1;
          setBatchStatus(`Running full mode... processing from offset ${currentOffset}`);
          const result = await runImageBatch(currentOffset);
          totalGenerated += result.generated_count || 0;
          totalFailed += result.failed_count || 0;
          totalTools = result.total_tools || totalTools;
          currentOffset = result.next_offset || currentOffset;

          if (result.quota_stop || !result.has_more || (result.processed || 0) === 0) {
            break;
          }
        }

        setBatchOffset(currentOffset);
        setBatchSummary(`Full run done. Generated ${totalGenerated}, failed ${totalFailed}, processed upto ${currentOffset}/${totalTools}.`);
        setSuccess('Full tool-image run completed.');
        await fetchImages();
        await fetchProgress(batchCategory);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to run image generation batch');
    } finally {
      setBatchRunning(false);
      setBatchStatus('');
    }
  };

  const handleGenerateSelectedTool = async () => {
    if (!selectedToolNumber || selectedToolNumber < 1) {
      setError('Enter a valid tool number.');
      return;
    }

    const targetOffset = Math.max(0, selectedToolNumber - 1);
    setBatchRunning(true);
    setError('');
    setSuccess('');
    setBatchSummary('');
    setBatchStatus(`Generating tool #${selectedToolNumber}...`);

    try {
      const result = await runImageBatch(targetOffset, 1);
      setBatchSummary(`Tool #${selectedToolNumber}: generated ${result.generated_count}, failed ${result.failed_count}.`);
      setSuccess(`Tool #${selectedToolNumber} generation completed.`);
      await fetchImages();
      await fetchProgress(batchCategory);
    } catch (err: any) {
      setError(err?.message || 'Unable to generate selected tool image.');
    } finally {
      setBatchRunning(false);
      setBatchStatus('');
    }
  };

  const handleRunFromNextPending = async () => {
    const targetNumber = nextPendingNumber || nextToolNumber;
    if (!targetNumber) {
      setSuccess('All tools already generated for the selected category/filter.');
      return;
    }

    setSelectedToolNumber(targetNumber);
    const targetOffset = Math.max(0, targetNumber - 1);

    setBatchRunning(true);
    setError('');
    setSuccess('');
    setBatchSummary('');
    setBatchStatus(`Generating next pending tool #${targetNumber}...`);

    try {
      const result = await runImageBatch(targetOffset, 1);
      setBatchSummary(`Next pending #${targetNumber}: generated ${result.generated_count}, failed ${result.failed_count}.`);
      setSuccess(`Generated next pending tool #${targetNumber}.`);
      await fetchImages();
      await fetchProgress(batchCategory);
    } catch (err: any) {
      setError(err?.message || 'Unable to generate next pending tool image.');
    } finally {
      setBatchRunning(false);
      setBatchStatus('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => router.back()}
          className="text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <FaArrowLeft size={24} />
        </button>
        <h1 className="dashboard-title bg-gradient-to-r from-cyan-500 to-fuchsia-500 bg-clip-text text-transparent">
          Image Manager
        </h1>
      </div>
      <p className="text-slate-800 dark:text-slate-200 mb-8">
        Upload and manage your blog featured images with automatic compression
      </p>

      {/* Upload Section */}
      <div className="dashboard-card mb-8 border-violet-200/60 dark:border-violet-900/40">
        <div className="mb-6 rounded-lg border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-800 dark:bg-cyan-900/20">
          <h3 className="text-lg font-semibold text-cyan-900 dark:text-cyan-200">AI Tool Images (Admin Batch)</h3>
          <p className="mt-1 text-sm text-cyan-800 dark:text-cyan-300">
            Generate tool-wise learning images and track exactly how many are done.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
            <div className="rounded border border-cyan-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-cyan-700 dark:bg-slate-900 dark:text-slate-300">
              Total tools: <span className="font-semibold">{progressTotal}</span>
            </div>
            <div className="rounded border border-cyan-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-cyan-700 dark:bg-slate-900 dark:text-slate-300">
              Generated: <span className="font-semibold">{progressGenerated}</span>
            </div>
            <div className="rounded border border-cyan-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-cyan-700 dark:bg-slate-900 dark:text-slate-300">
              Generated upto #: <span className="font-semibold">{generatedUptoNumber}</span>
            </div>
            <div className="rounded border border-cyan-200 bg-white px-3 py-2 text-xs text-slate-700 dark:border-cyan-700 dark:bg-slate-900 dark:text-slate-300">
              Next tool #: <span className="font-semibold">{nextToolNumber || '-'}</span>
            </div>
          </div>

          {allGenerated ? (
            <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              All tools are already generated for current filter.
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Tool number</label>
              <input
                type="number"
                min={1}
                value={selectedToolNumber}
                onChange={(event) => setSelectedToolNumber(Math.max(1, Number(event.target.value) || 1))}
                className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
            <button
              type="button"
              onClick={() => { void handleGenerateSelectedTool(); }}
              disabled={batchRunning}
              className="rounded-lg border border-cyan-500 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-cyan-300"
            >
              {batchRunning ? 'Generating...' : 'Generate selected tool'}
            </button>
            <button
              type="button"
              onClick={() => { void handleRunFromNextPending(); }}
              disabled={batchRunning || allGenerated}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {batchRunning ? 'Working...' : `Run from next pending${nextPendingNumber ? ` (#${nextPendingNumber})` : ''}`}
            </button>
            <button
              type="button"
              onClick={() => { void fetchProgress(batchCategory); }}
              disabled={progressLoading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {progressLoading ? 'Refreshing...' : 'Refresh progress'}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <select
              value={batchMode}
              onChange={(event) => setBatchMode(event.target.value as 'single' | 'full')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="single">Single batch run</option>
              <option value="full">Full catalog run</option>
            </select>

            <select
              value={batchLimit}
              onChange={(event) => setBatchLimit(Number(event.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value={3}>Batch size 3</option>
              <option value={4}>Batch size 4</option>
              <option value={5}>Batch size 5</option>
              <option value={6}>Batch size 6</option>
              <option value={8}>Batch size 8</option>
            </select>

            <input
              type="number"
              min={0}
              value={batchOffset}
              onChange={(event) => setBatchOffset(Math.max(0, Number(event.target.value) || 0))}
              placeholder="Offset"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />

            <select
              value={batchCategory}
              onChange={(event) => setBatchCategory(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void handleRunBatch();
              }}
              disabled={batchRunning}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {batchRunning ? 'Running...' : 'Run AI image generation'}
            </button>
            {batchStatus ? <p className="text-xs text-cyan-700 dark:text-cyan-300">{batchStatus}</p> : null}
          </div>

          {batchSummary ? (
            <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">{batchSummary}</p>
          ) : null}

          <div className="mt-4 max-h-64 overflow-auto rounded border border-cyan-200 bg-white dark:border-cyan-800 dark:bg-slate-900">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-cyan-50 dark:bg-cyan-900/30">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Tool</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {toolProgress.slice(0, 200).map((tool) => (
                  <tr key={`${tool.number}-${tool.tool_name}`} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2">{tool.number}</td>
                    <td className="px-3 py-2">{tool.tool_name}</td>
                    <td className="px-3 py-2">
                      {tool.generated ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Generated</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-lg p-8 text-center bg-gradient-to-b from-violet-50 to-transparent dark:from-violet-900/10 dark:to-transparent">
          <FaUpload className="text-4xl text-violet-500 dark:text-violet-400 mx-auto mb-4" />

          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
            Drag and drop images here
          </h2>
          <p className="text-slate-800 dark:text-slate-200 mb-6">
            Images are automatically compressed before upload (Max 5MB, supports JPEG, PNG, WebP, GIF)
          </p>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="file-input"
          />

          <label htmlFor="file-input">
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('file-input') as HTMLInputElement;
                input?.click();
              }}
              disabled={uploading}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-2 rounded-lg font-semibold inline-block cursor-pointer shadow-md hover:shadow-lg transition-all"
            >
              Choose Images
            </button>
          </label>

          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-800 dark:text-slate-200 font-semibold">
                {Math.round(uploadProgress)}% Complete
              </p>
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg text-sm border border-red-300 dark:border-red-800">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-200 rounded-lg text-sm border border-violet-300 dark:border-violet-800">
            {success}
          </div>
        )}
      </div>

      {/* Images Grid */}
      <div className="dashboard-card border-slate-200/70 dark:border-slate-700/70">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
          Your Images ({images.length})
        </h2>

        {loading ? (
          <p className="text-slate-800 dark:text-slate-200">Loading images...</p>
        ) : images.length === 0 ? (
          <p className="text-slate-800 dark:text-slate-200 text-center py-8">
            No images uploaded yet. Start by uploading your first image!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div
                key={image.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-lg hover:border-violet-500 dark:hover:border-violet-500 transition-all duration-300"
              >
                {/* Image Preview */}
                <div className="bg-slate-100 dark:bg-slate-900 h-48 flex items-center justify-center overflow-hidden relative">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Image Info */}
                <div className="p-4">
                  <p className="text-sm text-slate-800 dark:text-slate-200 truncate font-medium">
                    {image.name}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
                    📦 {formatFileSize(image.size)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => copyToClipboard(image.url)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded hover:bg-violet-200 dark:hover:bg-violet-900/40 transition-colors text-sm font-semibold"
                    >
                      <FaCopy />
                      {copiedUrl === image.url ? 'Copied!' : 'Copy URL'}
                    </button>
                    <button
                      onClick={() => handleDelete(image.name)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors text-sm font-semibold"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-8 bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 border border-violet-300 dark:border-violet-700 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <FaBolt className="text-2xl text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-4 text-violet-900 dark:text-violet-300">
              🚀 Image Optimization with Auto-Compression
            </h3>
            <ul className="space-y-2 text-violet-800 dark:text-violet-200 text-sm">
              <li>✓ <span className="font-semibold">Auto Compression:</span> Images are automatically compressed before upload (40-70% size reduction)</li>
              <li>✓ <span className="font-semibold">Smart Format:</span> Optimized quality settings for best visual fidelity</li>
              <li>✓ <span className="font-semibold">Storage Savings:</span> 5MB image → ~1-2MB after compression</li>
              <li>✓ <span className="font-semibold">Descriptive Names:</span> Use clear file names (no spaces, use hyphens)</li>
              <li>✓ <span className="font-semibold">Supported Formats:</span> JPEG, PNG, WebP, GIF (Max 5MB original)</li>
              <li>✓ <span className="font-semibold">Copy URL:</span> Click "Copy URL" button to get shareable image link</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
