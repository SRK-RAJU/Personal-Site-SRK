# 📱 Supabase Frontend Integration Guide

Learn how to connect your Next.js frontend to Supabase database.

---

## 🎯 Overview

Instead of calling a backend API (`/api/posts`), we'll call Supabase directly:

**Before (Express Backend - DELETE)**:
```typescript
const response = await fetch('http://localhost:5000/api/posts');
const posts = await response.json();
```

**After (Supabase - NEW)**:
```typescript
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .eq('is_published', true);
```

---

## 📥 Step 1: Install Supabase Package

Open terminal in `modern-blog-app/frontend/`:

```bash
npm install @supabase/supabase-js
```

---

## 📁 Step 2: Create Supabase Client

Create new file: `modern-blog-app/frontend/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions for your tables
export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  role: 'ADMIN' | 'READER';
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  author_id: string;
  is_published: boolean;
  published_at?: string;
  views_count: number;
  tags: string[];
  categories: string[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  live_url?: string;
  github_url?: string;
  technologies: string[];
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id?: string;
  author_name: string;
  author_email?: string;
  content: string;
  is_approved: boolean;
  created_at: string;
}
```

---

## 🔍 Step 3: Create Query Functions

Create new file: `modern-blog-app/frontend/lib/queries.ts`

```typescript
import { supabase, Post, Project, User, Comment } from './supabase';

// ========== POSTS ==========

export const getPosts = async (limit = 10, published = true) => {
  let query = supabase
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (published) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Error fetching posts: ${error.message}`);
  return data as Post[];
};

export const getPostBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) throw new Error(`Error fetching post: ${error.message}`);
  return data as Post;
};

export const createPost = async (post: Omit<Post, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('posts')
    .insert([post])
    .select()
    .single();

  if (error) throw new Error(`Error creating post: ${error.message}`);
  return data as Post;
};

export const updatePost = async (id: string, post: Partial<Post>) => {
  const { data, error } = await supabase
    .from('posts')
    .update(post)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Error updating post: ${error.message}`);
  return data as Post;
};

// ========== PROJECTS ==========

export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching projects: ${error.message}`);
  return data as Project[];
};

export const createProject = async (project: Omit<Project, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();

  if (error) throw new Error(`Error creating project: ${error.message}`);
  return data as Project;
};

// ========== COMMENTS ==========

export const getCommentsByPost = async (postId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error fetching comments: ${error.message}`);
  return data as Comment[];
};

export const createComment = async (comment: Omit<Comment, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('comments')
    .insert([comment])
    .select()
    .single();

  if (error) throw new Error(`Error creating comment: ${error.message}`);
  return data as Comment;
};

// ========== USERS ==========

export const getUserById = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Error fetching user: ${error.message}`);
  return data as User;
};

export const createUser = async (user: Omit<User, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .single();

  if (error) throw new Error(`Error creating user: ${error.message}`);
  return data as User;
};

// ========== HELPER FUNCTIONS ==========

export const incrementPostViews = async (postId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select('views_count')
    .eq('id', postId)
    .single();

  if (error) return;

  const newCount = (data?.views_count || 0) + 1;

  await supabase
    .from('posts')
    .update({ views_count: newCount })
    .eq('id', postId);
};
```

---

## 📖 Step 4: Use in Components

### Example 1: Blog Page (Fetch Posts)

File: `modern-blog-app/frontend/app/blog/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPosts, Post } from '@/lib/queries';

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div className="p-8">Loading posts...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      <div className="space-y-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="border rounded-lg p-6 hover:shadow-lg transition"
          >
            <h2 className="text-2xl font-bold mb-2">
              <Link href={`/blog/${post.slug}`} className="hover:text-blue-500">
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-600 mb-4">{post.excerpt}</p>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              <span>{post.views_count} views</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
```

### Example 2: Single Post Page (with Comments)

File: `modern-blog-app/frontend/app/blog/[slug]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getPostBySlug, getCommentsByPost, createComment, incrementPostViews, Post, Comment } from '@/lib/queries';
import CommentForm from '@/components/CommentForm';

export default function PostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostBySlug(params.slug);
        setPost(postData);
        
        // Increment views
        await incrementPostViews(postData.id);

        // Fetch comments
        const commentsData = await getCommentsByPost(postData.id);
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.slug]);

  const handleCommentSubmit = async (comment: Omit<Comment, 'id' | 'created_at'>) => {
    try {
      await createComment(comment);
      // Refresh comments
      const updated = await getCommentsByPost(post!.id);
      setComments(updated);
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!post) return <div className="p-8">Post not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <article>
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="text-gray-500 mb-8">
          {new Date(post.published_at || '').toLocaleDateString()} · {post.views_count} views
        </div>

        {post.featured_image_url && (
          <img src={post.featured_image_url} alt={post.title} className="w-full rounded-lg mb-8" />
        )}

        <div className="prose dark:prose-invert max-w-none mb-12">
          {post.content.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-8">
            {post.tags.map((tag) => (
              <span key={tag} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded mr-2 mb-2">
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Comments Section */}
      <section className="border-t pt-8 mt-8">
        <h2 className="text-2xl font-bold mb-6">Comments</h2>

        <CommentForm postId={post.id} onSubmit={handleCommentSubmit} />

        <div className="space-y-4 mt-8">
          {comments.map((comment) => (
            <div key={comment.id} className="border rounded p-4">
              <p className="font-bold">{comment.author_name}</p>
              <p>{comment.content}</p>
              <p className="text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

### Example 3: Portfolio/Projects Page

File: `modern-blog-app/frontend/app/portfolio/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getProjects, Project } from '@/lib/queries';

export default function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div className="p-8">Loading projects...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Portfolio</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
            {project.image_url && (
              <img src={project.image_url} alt={project.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{project.title}</h3>
              <p className="text-gray-600 mb-4">{project.description}</p>

              {project.technologies && (
                <div className="mb-4">
                  {project.technologies.map((tech) => (
                    <span key={tech} className="inline-block bg-gray-200 px-2 py-1 rounded text-sm mr-2 mb-2">
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                {project.live_url && (
                  <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Live Demo
                  </a>
                )}
                {project.github_url && (
                  <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔐 Step 5: Error Handling

### Create Error Boundary Component

File: `modern-blog-app/frontend/components/ErrorBoundary.tsx`

```typescript
'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded">
          <h2 className="text-red-800 font-bold mb-2">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🧪 Step 6: Test Locally

### 1. Set Environment Variables

Create `.env.local` in `modern-blog-app/frontend/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Start Dev Server

```bash
cd modern-blog-app/frontend
npm run dev
```

### 3. Test Pages

Visit in browser:
- http://localhost:3000 (Home)
- http://localhost:3000/blog (Blog listing)
- http://localhost:3000/blog/getting-started-with-react (Single post)
- http://localhost:3000/portfolio (Projects)

You should see data from Supabase! ✅

---

## 📊 Database Hooks React

Use `useEffect` to fetch data:

```typescript
import { useEffect, useState } from 'react';

function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []); // Run once on mount

  const fetchData = async () => {
    // Your Supabase query here
  };

  return (
    // Your JSX here
  );
}
```

---

## 🚀 Ready for Production!

Once tested locally:
1. Push to GitHub
2. Deploy to Vercel
3. Add Supabase environment variables in Vercel dashboard
4. Your site is LIVE! 🎉

---

## 📚 Next Steps

1. **Delete old API client** - Remove `lib/api.ts`
2. **Delete backend folder** - No longer needed
3. **Create CommentForm component** - For blog comment submission
4. **Setup authentication** - Use Supabase Auth for admin login
5. **Deploy to Vercel** - See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

---

**Questions?** Check [Supabase Docs](https://supabase.com/docs/guides/api)
