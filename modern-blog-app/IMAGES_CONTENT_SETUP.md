# 📁 Images, Logos & Content Setup Guide for rjexa.com

## Directory Structure for Public Assets

```
frontend/public/
├── images/
│   ├── devsecops-banner.svg           ✅ Created
│   ├── srk-logo.png                    (TODO - Add)
│   ├── devops-logo.png                 (TODO - Add)
│   ├── security-logo.png               (TODO - Add)
│   ├── cloud-logo.png                  (TODO - Add)
│   ├── tools-combined.png              (TODO - Add image-2.png)
│   └── tech-stack.svg                  ✅ Exists
├── logos/
│   └── rjexa-logo.png                  (TODO - Add as branding)
├── uploads/
│   └── 2024/
│       └── 01/
│           ├── adv-banner.jpg          ✅ Exists
│           └── devsecops-banner.svg    (copy of main banner)
└── favicon.ico                          ✅ Exists
```

---

## 🎨 Image Placement Guide for rjexa.com

### 1. **SRK-Logo.png** - Profile/Header Logo

**Where to use:**
- Header component (left side, 40-50px height)
- About page (author section)
- Contact page (branding)
- Email signatures

**Recommended placement in code:**
```tsx
// components/Header.tsx
<Image 
  src="/images/srk-logo.png"
  alt="rjexa - Raju SRK"
  width={45}
  height={45}
  className="rounded-full"
/>
```

**Size recommendation:** 200x200px (will scale down)  
**Format:** PNG with transparency

---

### 2. **Tools-Combined.png (image-2.png)** - Tech Stack Display

**Where to use:**
- Home page (skills section)
- About page (expertise showcase)
- Services/capabilities section

**Recommended placement:**
```tsx
// app/page.tsx - Skills section
<div className="my-16">
  <h2 className="text-3xl font-bold mb-8">Our Tech Stack</h2>
  <Image 
    src="/images/tools-combined.png"
    alt="DevOps, Cloud, and Security Tools at rjexa"
    width={1000}
    height={400}
    className="rounded-xl shadow-lg"
  />
</div>
```

**Content idea:** Single image showing: 
- Docker, Kubernetes, Terraform, Jenkins, GitHub Actions
- AWS, Azure, Google Cloud
- Prometheus, ELK Stack, DataDog
- OWASP, Snyk, HashiCorp Vault
- (All logos in one cohesive image)

**Size recommendation:** 1200x500px  
**Format:** PNG or WebP

---

### 3. **DevOps + Security + Cloud Logos**

**Where to place:**

#### a. **DevOps Logo** - `/images/devops-logo.png`
- Services page (DevOps section)
- Blog categories icon
- Dashboard section header

#### b. **Security Logo** - `/images/security-logo.png`
- About page (security focus)
- Service offerings
- DevSecOps pipeline section

#### c. **Cloud Logo** - `/images/cloud-logo.png`
- Infrastructure section
- Cloud services showcase
- Header navigation (optional)

**Code example:**
```tsx
// app/page.tsx - Services display
const services = [
  {
    icon: '/images/devops-logo.png',
    title: 'DevSecOps',
    description: 'Secure development pipelines'
  },
  {
    icon: '/images/security-logo.png',
    title: 'Security',
    description: 'Infrastructure security'
  },
  {
    icon: '/images/cloud-logo.png',
    title: 'Cloud Architecture',
    description: 'Scalable cloud solutions'
  },
];
```

---

### 4. **DevSecOps Banner** - Already Created! ✅

**Location:** `/public/images/devsecops-banner.svg`

**Usage:**
```tsx
// app/page.tsx or blog/page.tsx
<Image 
  src="/images/devsecops-banner.svg"
  alt="DevSecOps Pipeline with Security Integration"
  width={1200}
  height={400}
  className="rounded-lg shadow-xl my-12"
/>
```

**Shows:** Plan → Design → Scan (Security) → Build → Test → Deploy

---

## 💾 Text-Based Posts Only Setup (Supabase Free Tier)

### Supabase Posts Schema (Optimized for Text-Only)

```sql
-- Create posts table (text-based only)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,  -- Markdown content only
  excerpt TEXT,           -- Brief summary
  author VARCHAR(100) DEFAULT 'Raju SRK',
  category VARCHAR(50),   -- devops, security, cloud, tutorial
  tags TEXT[],            -- Array of tags
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  views_count INT DEFAULT 0,
  reading_time_minutes INT  -- Calculate: word_count / 200
);

-- Create indexes for better query performance
CREATE INDEX idx_posts_published ON posts(published) WHERE published = true;
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
```

### Database Storage Estimation

```
Assuming average post:
- Content: 2000-3000 words ≈ 10-15 KB
- Metadata: 1 KB
- Total per post: ~12-16 KB

Supabase Free Tier: 500 MB database
500 MB ÷ 16 KB per post = ~31,250 posts possible!

For reference:
- 100 posts ≈ 1.6 MB
- 1,000 posts ≈ 16 MB
- 10,000 posts ≈ 160 MB

You're SAFE for thousands of text-only posts!
```

### Image Strategy: Link to External URLs

Instead of uploading images to Supabase storage:

```markdown
# Blog Post Example

## Content with External Images

When referencing images, use external CDN URLs:

![DevOps Pipeline](https://images.example.com/pipeline.png)

Or embed from your public folder:

![Architecture](https://rjexa.com/images/devsecops-banner.svg)
```

### Update Blog Post Data Structure

```typescript
// lib/types.ts
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;        // Markdown text only
  excerpt: string;
  author: string;
  category: string;       // 'devops' | 'security' | 'cloud'
  tags: string[];
  published: boolean;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
  views_count: number;
  reading_time_minutes: number;
  // NO image_url field needed!
}
```

### Create Blog Post (No Images)

```typescript
// app/dashboard/posts/new/actions.ts
export async function createBlogPost(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = title.toLowerCase().replace(/\s+/g, '-');
  const content = formData.get('content') as string;  // Markdown
  const category = formData.get('category') as string;
  const tags = (formData.get('tags') as string).split(',');
  
  // Calculate reading time
  const wordCount = content.split(/\s+/).length;
  const reading_time_minutes = Math.ceil(wordCount / 200);
  
  const { data, error } = await supabase.from('posts').insert([{
    title,
    slug,
    content,
    category,
    tags,
    reading_time_minutes,
    excerpt: content.substring(0, 160) + '...',
    author: 'Raju SRK',
    published: false
  }]);
  
  if (error) throw error;
  return data;
}
```

### Blog Dashboard Form (No Image Upload)

```tsx
// app/dashboard/posts/new/page.tsx
'use client';

import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { createBlogPost } from './actions';

export default function NewPost() {
  const [markdown, setMarkdown] = useState('# Title\n\nContent here...');
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('content', markdown);
    
    try {
      const result = await createBlogPost(formData);
      console.log('Post created:', result);
      // Redirect to post list
    } catch (error) {
      console.error('Error creating post:', error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label>Post Title</label>
        <input 
          name="title" 
          required 
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Category */}
      <div>
        <label>Category</label>
        <select name="category" className="w-full p-2 border rounded">
          <option>devops</option>
          <option>security</option>
          <option>cloud</option>
          <option>tutorial</option>
        </select>
      </div>

      {/* Tags */}
      <div>
        <label>Tags (comma-separated)</label>
        <input 
          name="tags" 
          placeholder="kubernetes, docker, cicd"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Markdown Editor */}
      <div>
        <label>Content (Markdown)</label>
        <MDEditor
          value={markdown}
          onChange={(val) => setMarkdown(val || '')}
          height={400}
        />
      </div>

      {/* Publish Preview */}
      <div>
        <label>
          <input type="checkbox" name="publish" />
          Publish immediately?
        </label>
      </div>

      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded">
        Create Post
      </button>
    </form>
  );
}
```

### Display Blog Post (Render Markdown)

```tsx
// app/blog/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabaseClient';

export default function BlogPost({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<any>(null);
  
  useEffect(() => {
    const fetchPost = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', params.slug)
        .eq('published', true)
        .single();
      
      setPost(data);
    };
    
    fetchPost();
  }, [params.slug]);

  if (!post) return <div>Loading...</div>;

  return (
    <article className="max-w-3xl mx-auto py-12">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      
      <div className="flex gap-4 mb-8 text-slate-600">
        <span>By {post.author}</span>
        <span>{post.reading_time_minutes} min read</span>
        <span>{new Date(post.published_at).toLocaleDateString()}</span>
      </div>

      {/* Render Markdown */}
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {/* Tags */}
      <div className="mt-8 flex flex-wrap gap-2">
        {post.tags?.map(tag => (
          <span key={tag} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-sm">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}
```

---

## 📊 Database Quotas Reference

| Item | Free Tier Limit | Status |
|------|-----------------|--------|
| Database Size | 500 MB | ✅ Sufficient for 10,000+ text posts |
| Realtime Connections | 200 | ✅ OK for blog |
| Monthly Egress | 2 GB | ✅ Plenty for blog traffic |
| API Calls | Unlimited* | ✅ No limits |
| File Storage | 1 GB | ⚠️ **Use external CDN instead** |

**Recommendation:** Use only Supabase database, not storage. Host images on:
- Vercel (free with Next.js)
- Cloudinary (free tier)
- Imgix
- Your own CDN

---

## 🚀 Implementation Steps

1. ✅ Update Supabase schema (SQL in DATABASE.md section)
2. ✅ Update Post interfaces (remove image_url)
3. ✅ Create new blog dashboard (text only, no image upload)
4. ✅ Update blog display components
5. ✅ Test with 2-3 sample posts
6. ✅ Deploy to Vercel

---

## 💡 Tips for Text-Based Posts

### Using Images in Markdown Posts

Link to external images in your markdown content:
```markdown
# Understanding Kubernetes

## Architecture Overview

![Kubernetes Architecture](https://rjexa.com/images/devsecops-banner.svg)

## Core Components

- Control Plane
- Worker Nodes
- etc...
```

### SEO with Text-Only Posts

```typescript
// Generate metadata for blog posts
export async function generateMetadata({ params }: any) {
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', params.slug)
    .single();

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://rjexa.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.published_at,
      authors: [post.author],
    },
  };
}
```

