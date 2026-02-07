# 🚀 Modern Tech Blog & Portfolio

**Your complete tech blog and portfolio website - Built with Next.js, Supabase, and 100% FREE!**

A modern, production-ready application to replace your InfinityFree WordPress site with a custom, scalable solution. Zero cost forever.

## ⚡ Quick Start (30 minutes)

👉 **NEW TO THIS PROJECT?** Start here:
1. Read [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md) - 3-step overview (5 min)
2. Follow [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) - Create database (10 min)
3. Follow [docs/SUPABASE_FRONTEND_GUIDE.md](./docs/SUPABASE_FRONTEND_GUIDE.md) - Integrate frontend (10 min)
4. Follow [docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md) - Deploy to web (5 min)

**That's it! Your site is LIVE!** 🎉

## 🏗️ Architecture - 100% FREE

```
Your Blog
   ↓
Vercel Frontend (Next.js) — FREE tier ✅
   ↓
Supabase API — FREE tier ✅
   ↓
PostgreSQL Database — 500MB FREE ✅
```

**No backend server to manage. No database hosting costs. Completely free.**

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 + React + Tailwind CSS
- **Database**: PostgreSQL via Supabase
- **API**: Supabase REST API (auto-generated)
- **Auth**: Supabase Auth
- **File Storage**: Supabase Storage (1GB FREE)
- **Deployment**: Vercel (Next.js frontend)
- **Cost**: $0/month (forever free tier)

---

## 📁 Project Structure

```
modern-blog-app/
├── frontend/                 # Next.js application
│   ├── app/                  # Next.js 14 App Router
│   │   ├── page.tsx          # Home page
│   │   ├── blog/             # Blog pages
│   │   ├── portfolio/        # Projects page
│   │   ├── about/            # About page
│   │   └── contact/          # Contact page
│   ├── components/           # React components
│   │   ├── Header.tsx        # Navigation
│   │   ├── Footer.tsx        # Footer
│   │   └── CommentForm.tsx   # Comment form
│   ├── lib/                  # Utilities
│   │   ├── supabase.ts       # Supabase client
│   │   └── queries.ts        # Database queries
│   ├── styles/               # Tailwind CSS
│   ├── .env.local            # Environment vars
│   └── package.json          # Dependencies
├── docs/                     # Guides
│   ├── SUPABASE_SETUP.md     # Database setup
│   ├── SUPABASE_FRONTEND_GUIDE.md # Frontend integration
│   ├── VERCEL_DEPLOYMENT.md  # Deploy to web
│   ├── MIGRATION.md          # WordPress import
│   └── README.md             # Architecture docs
├── SUPABASE_QUICK_START.md   # 30-minute guide
├── CLEANUP.md                # Cleanup instructions
└── README.md                 # This file
```

---

## 🎯 Features

### Public Features ✅
- 📱 Responsive blog homepage
- 📄 Individual blog posts with markdown
- 🖼️ Portfolio projects showcase
- 👤 About page with bio
- 💬 Comments on blog posts
- 🌓 Dark/light mode toggle
- ⚡ Fast page loads (Next.js + Supabase)
- 🔍 SEO-friendly (metadata, sitemap, robots.txt)

### Admin Features (Manual via Supabase)
- ✏️ Create/edit/delete blog posts (via Supabase dashboard)
- 🖼️ Upload images to Supabase Storage
- 👤 Manage users and roles
- 💬 Moderate comments (approve/reject)

---

## 💰 Cost Breakdown

| Service | Cost | Why |
|---------|------|-----|
| **Supabase** | $0 | FREE tier: 500MB storage, unlimited API calls |
| **Vercel** | $0 | FREE tier: unlimited deploys, 100ms global latency |
| **GitHub** | $0 | Always free for public projects |
| **Custom Domain** | $12/year | Optional - use free `vercel.app` subdomain |
| **TOTAL** | **$0/month** | Completely free - forever! |

---

## 🗄️ Database Schema

### Users Table
```
users
├── id (UUID) — Primary key
├── email (unique) — User email
├── password_hash — Secure password
├── name — Display name
├── bio — Short biography
├── avatar_url — Profile picture
├── role — ADMIN or READER
└── created_at — Account creation date
```

### Posts Table
```
posts
├── id (UUID) — Primary key
├── title — Post title
├── slug (unique) — URL-friendly name
├── content — Full markdown content
├── excerpt — Short preview
├── featured_image_url — Cover image
├── author_id (FK) — Author reference
├── is_published — Draft/published status
├── published_at — Publish date
├── views_count — View counter
├── tags[] — Array of tags
├── categories[] — Array of categories
└── created_at — Post creation date
```

### Projects Table
```
projects
├── id (UUID) — Primary key
├── title — Project name
├── description — Project details
├── image_url — Project screenshot
├── live_url — Deployed link
├── github_url — GitHub repository
├── technologies[] — Tech stack used
└── created_at — Created date
```

### Comments Table
```
comments
├── id (UUID) — Primary key
├── post_id (FK) — Blog post reference
├── author_id (FK) — Optional user reference
├── author_name — Comment author name
├── author_email — Author email
├── content — Comment text
├── is_approved — Moderation status
└── created_at — Comment date
```

---

## 🔐 Environment Variables (Frontend)

Create `.env.local` in `modern-blog-app/frontend/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_key_here
```

Get these from Supabase dashboard → Settings → API

---

## 🚀 Getting Started

### Option 1: Complete Setup (30 minutes - Recommended)
1. Follow [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md) for guided setup
2. Creates everything step-by-step
3. You'll have a live site at the end

### Option 2: Each Step Separately
1. **Database**: [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)
2. **Frontend**: [docs/SUPABASE_FRONTEND_GUIDE.md](./docs/SUPABASE_FRONTEND_GUIDE.md)
3. **Deploy**: [docs/VERCEL_DEPLOYMENT.md](./docs/VERCEL_DEPLOYMENT.md)

### Option 3: Local Testing First
```bash
# 1. Install dependencies
cd modern-blog-app/frontend
npm install

# 2. Add .env.local with Supabase keys
cp .env.local.example .env.local
# Edit .env.local with your Supabase values

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000
```

---

## 📖 Documentation Files

- **SUPABASE_QUICK_START.md** - 30-minute guided setup
- **docs/SUPABASE_SETUP.md** - Create Supabase database
- **docs/SUPABASE_FRONTEND_GUIDE.md** - Connect frontend to database
- **docs/VERCEL_DEPLOYMENT.md** - Deploy to production
- **docs/MIGRATION.md** - Migrate from WordPress
- **docs/CLEANUP.md** - Remove old WordPress files

---

## 🆘 Troubleshooting

### "Cannot find SUPABASE_URL"
→ Check `.env.local` has `NEXT_PUBLIC_` prefix

### "Posts not loading"
→ Verify Supabase RLS settings or disable for testing

### "Build fails on Vercel"
→ Check Build Logs in Vercel dashboard

→ More help in each guide's troubleshooting section

---

## 🎉 You're Ready!

Start with [SUPABASE_QUICK_START.md](./SUPABASE_QUICK_START.md)

**Your site will be live in 30 minutes!** 🚀

---

## 📝 License

MIT License - Free to use and modify

---
