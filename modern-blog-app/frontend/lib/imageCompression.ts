/**
 * Image Compression Utility
 * Compresses images before uploading to Supabase Storage
 * Reduces storage usage and improves loading speed
 */

export async function compressImage(
  file: File,
  quality: number = 0.7,
  maxWidth: number = 1920,
  maxHeight: number = 1440
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'));
              return;
            }
            resolve(blob);
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function calculateCompressionSavings(
  originalSize: number,
  compressedSize: number
): string {
  const savings = ((originalSize - compressedSize) / originalSize) * 100;
  return savings.toFixed(2) + '%';
}

/**
 * Validate image and compress if needed
 */
export async function processImage(file: File): Promise<{
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savings: string;
}> {
  // Validate first
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(file.size) / Math.log(1024));
  const originalSizeStr = Math.round((file.size / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];

  // Compress
  const compressed = await compressImage(file, 0.75, 1920, 1440);

  const savings = calculateCompressionSavings(file.size, compressed.size);

  return {
    blob: compressed,
    originalSize: file.size,
    compressedSize: compressed.size,
    savings,
  };
}
