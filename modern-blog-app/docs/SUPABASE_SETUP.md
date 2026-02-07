# 🚀 Supabase Setup Guide - 100% FREE Database & Backend

**Supabase** is like Firebase but with **PostgreSQL** (better for blogs). It gives you:
- ✅ Database (500MB FREE)
- ✅ REST API (automatic)
- ✅ Authentication
- ✅ File storage (1GB FREE)
- ✅ Real-time updates

**Cost: $0 forever** (for small projects)

---

## 📋 Prerequisites

- ✅ GitHub account (for signup)
- ✅ Google/GitHub email
- ✅ 15 minutes

---

## Step 1: Create Supabase Account

### 1.1 Go to Supabase
👉 Visit: https://supabase.com

### 1.2 Sign Up (Using GitHub - Easiest)
1. Click **"Sign Up"**
2. Click **"Continue with GitHub"**
3. Authorize Supabase
4. You're in! ✅

---

## Step 2: Create New Project

### 2.1 Create Project
1. Click **"New Project"**
2. Choose name: `personal-blog` or `personal-site`
3. **Set Password**: Remember this! (for database admin)
   - Example: `MySecurePass123!`
4. **Region**: Choose closest to you
   - India: `ap-south-1` (Mumbai)
   - Or leave default
5. Click **"Create new project"**

### 2.2 Wait for Setup
- Takes 2-3 minutes
- You'll see a loading screen
- Once done, you're in the dashboard ✅

---

## Step 3: Create Database Schema

### 3.1 Open SQL Editor
1. Click **"SQL Editor"** on the left
2. Click **"New Query"**
3. Copy & paste the code below

### 3.2 Run This SQL (Create Tables)

```sql
-- Create Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'READER',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  views_count INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  live_url TEXT,
  github_url TEXT,
  technologies TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for fast queries
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(published_at);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);
```

### 3.3 Execute Query
1. Click **"Run"** button (bottom right)
2. Wait for success message ✅

---

## Step 4: Insert Sample Data

### 4.1 Create Sample Posts

```sql
-- Create admin user first
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@example.com', '$2a$10$hashed_password_here', 'Raju SRK', 'ADMIN');

-- Get the user ID
SELECT id FROM users WHERE email = 'admin@example.com';
-- Copy this ID and replace 'USER_ID_HERE' below

-- Insert sample posts
INSERT INTO posts (title, slug, content, excerpt, author_id, is_published, published_at)
VALUES
  (
    'Getting Started with React',
    'getting-started-with-react',
    '# Getting Started with React\n\nReact is a JavaScript library...',
    'Learn React basics',
    'USER_ID_HERE'::UUID,
    true,
    now()
  ),
  (
    'Node.js Best Practices',
    'nodejs-best-practices',
    '# Node.js Best Practices\n\nHere are best practices...',
    'Best practices for Node.js',
    'USER_ID_HERE'::UUID,
    true,
    now()
  ),
  (
    'PostgreSQL Tips',
    'postgresql-tips',
    '# PostgreSQL Tips\n\nUseful PostgreSQL tips...',
    'PostgreSQL optimization',
    'USER_ID_HERE'::UUID,
    true,
    now()
  );

-- Insert sample projects
INSERT INTO projects (title, description, technologies)
VALUES
  (
    'E-commerce Platform',
    'Full-stack e-commerce with React and Node.js',
    ARRAY['React', 'Node.js', 'PostgreSQL', 'Stripe']
  ),
  (
    'AI Chat Application',
    'Real-time chat with AI integration',
    ARRAY['Next.js', 'Express', 'OpenAI']
  ),
  (
    'Task Management App',
    'Collaborative task management system',
    ARRAY['React', 'Firebase', 'Tailwind']
  );
```

### 4.2 Insert the Data
1. Create a new query
2. Paste the SQL above
3. Replace `USER_ID_HERE` with actual user ID
4. Click **"Run"** ✅

---

## Step 5: Setup Authentication

### 5.1 Enable Email Auth
1. Go to **"Auth"** on the left sidebar
2. Click **"Providers"**
3. Enable **"Email"**
4. Save ✅

### 5.2 Create API Keys
1. Go to **"Settings"** → **"API"**
2. Copy these values:
   - `Project URL` - Example: `https://abc123.supabase.co`
   - `anon key` (public key) - Long string

Save these! You'll need them for frontend setup.

---

## Step 6: Enable Row Level Security (RLS)

### 6.1 Enable RLS for Public/Private Data
1. Go to **"Authentication"** → **"Policies"**
2. For each table, enable:
   - **Select (published posts visible)**
   - **Insert (admin only)**
   - **Update (author only)**
   - **Delete (author only)**

Or keep it simple for now: **Disable RLS** to allow public access

---

## Step 7: Verify Setup

### 7.1 Check Tables
1. Go to **"Table Editor"** on the left
2. Click each table:
   - ✅ `users` - Should be empty (except sample admin)
   - ✅ `posts` - Should have 3 sample posts
   - ✅ `projects` - Should have 3 projects
   - ✅ `comments` - Should be empty

### 7.2 Test REST API
1. Open browser
2. Visit: `https://YOUR_PROJECT_URL/rest/v1/posts`
3. You should see your posts as JSON ✅

---

## Step 8: Setup Environment Variables

### 8.1 Create `.env.local` in Frontend

Go to: `modern-blog-app/frontend/`

Create file `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_key_here
```

Replace with your actual values from Supabase Dashboard!

---

## ✅ Supabase Setup Complete!

You now have:
- ✅ Free PostgreSQL database (500MB)
- ✅ Automatic REST API
- ✅ Authentication ready
- ✅ Sample data loaded

**Next steps:**
1. Update frontend to connect to Supabase
2. Deploy to Vercel
3. Your app is LIVE! 🎉

---

## 🔗 Connect Frontend to Supabase

See **`SUPABASE_FRONTEND_GUIDE.md`** for how to update your React code to use Supabase.

---

## 💡 Pro Tips

1. **Backup Data**: Go to Settings → Backups (automatic daily backups)
2. **Monitor Usage**: Settings → Usage (see database size)
3. **Scale Later**: Easy to upgrade to paid plan when needed
4. **Test Mode**: Disable RLS temporarily for testing, enable later

---

## 🆘 Troubleshooting

### Q: "Connection refused"
- Make sure you used the correct Project URL
- Check Project URL doesn't have extra `/`

### Q: "Authentication failed"
- Make sure `anon key` is from Supabase (not admin key)

### Q: "Tables not showing"
- Refresh the page
- Check SQL executed successfully

### Q: Can't see sample data
- Make sure you replaced `USER_ID_HERE` with actual ID
- Check if INSERT queries ran successfully

---

## 📚 Learn More

- **Supabase Docs**: https://supabase.com/docs
- **Database Functions**: https://www.postgresql.org/docs/
- **REST API**: https://supabase.com/docs/guides/api

---

**You're ALL SET!** 🚀

Next: Follow [SUPABASE_FRONTEND_GUIDE.md](./docs/SUPABASE_FRONTEND_GUIDE.md)
