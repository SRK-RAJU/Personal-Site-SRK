# 🚀 AI-Powered Tech Blog & Portfolio Platform

**Automated AI blogging platform with Google Generative AI + Tavily - Fully automated, production-ready, 100% FREE!**

> 🎯 **AUTOMATED AI BLOGGING**: Blog posts generate automatically every Monday at 3 AM UTC  
> � **SMART FIRST-RUN**: Auto-tests on first deployment, then Monday auto-runs  
> �📋 **START HERE**: Read [PRODUCTION_SETUP_GUIDE.md](./PRODUCTION_SETUP_GUIDE.md) for complete setup instructions  
> ⏱️ **Time to Deploy**: ~45 minutes | 💰 **Cost**: $0/month (free tiers only)

---

## ✨ Features

- ⚡ **Fast**: Next.js 14 with optimized images and code splitting
- 🤖 **AI-Powered**: Automatic blog posts every Monday (Google Generative AI + Tavily)
- 📚 **50+ Tools Covered**: DevOps, Cloud, Security, and AI/ML tools
- 🎨 **Modern UI**: Futuristic design with dark mode support
- 📱 **Responsive**: Perfect on mobile, tablet, and desktop
- 🔐 **Secure**: Supabase Auth and Row-Level Security
- 💰 **Free Forever**: $0/month with Vercel + Supabase free tier
- 🌐 **Production Ready**: Live deployment on Vercel
- 📝 **Original Content**: AI paraphrases, never copy-pastes (copyright safe)
- 🔍 **Smart Anti-Duplication**: Prevents repeating topics from last 14 days

## 🏗️ Tech Stack

| Component | Technology | Cost | Purpose |
|-----------|-----------|------|---------|
| **Frontend** | Next.js 14 + React | Free | Web interface |
| **Database** | PostgreSQL (Supabase) | Free (500MB) | Content & analytics |
| **AI Engine** | Google Generative AI | Free (15K tokens/min) | Post generation |
| **Research** | Tavily AI Search | Free (100 queries/month) | Tool updates research |
| **Deployment** | Vercel Serverless | Free | Hosting + Cron jobs |
| **Storage** | Supabase Storage | Free (1GB) | Images (unused) |
| **Auth** | Supabase Auth | Free | Admin access |
| **Custom Domain** | Your domain (optional) | $12/year | Brand URL |
| **TOTAL COST** | **$0/month forever** | ✅ | Production ready |

## 🚀 QUICK START - 45 MINUTES TO LIVE

### Prerequisites (Create Free Accounts)

- [x] **Supabase**: https://supabase.com (PostgreSQL database)
- [x] **Google Generative AI**: https://aistudio.google.com (AI LLM - Get API key)
- [x] **Tavily**: https://tavily.com (Web search - Get API key)
- [x] **Vercel**: https://vercel.com (Deployment)
- [x] **GitHub**: https://github.com (Code repository)

### 4-Step Deployment

```bash
# Step 1: Clone repository
git clone <your-repo>
cd Personal-Site-SRK

# Step 2: Setup environment
cp modern-blog-app/frontend/.env.example modern-blog-app/frontend/.env.local
# Edit .env.local with your API keys

# Step 3: Deploy to Vercel
cd modern-blog-app/frontend
npm install
vercel --prod

# Step 4: Run database schema
# Go to Supabase → SQL Editor
# Paste entire contents of: modern-blog-app/frontend/docs/PRODUCTION_SCHEMA_FINAL.sql
# Click Run
```

### Verification

```bash
# Test AI agent (replace with your secret)
curl -X GET "https://your-vercel-domain.vercel.app/api/ai-agent/generate-post?test=true&secret=YOUR_CRON_SECRET"

# Should return a successful post with 50+ tools covered
```

---

## 📖 COMPLETE DOCUMENTATION

**👉 [See PRODUCTION_SETUP_GUIDE.md for complete step-by-step setup](./PRODUCTION_SETUP_GUIDE.md)**

The guide covers:
- Creating free accounts (Supabase, Google Gemini, Tavily, Vercel)
- Local environment setup
- Database schema initialization
- Vercel deployment
- Manual cron testing
- Monitoring and maintenance
- Troubleshooting common issues

---

## 📁 Project Structure

```
modern-blog-app/
├── frontend/                        # Next.js application
│   ├── app/
│   │   ├── page.tsx                 # Home (updated with AI messaging)
│   │   ├── api/
│   │   │   ├── ai-agent/
│   │   │   │   └── generate-post/   # 🤖 AI blog generation engine
│   │   │   ├── posts/               # Blog CRUD API
│   │   │   └── analytics/           # Real-time stats
│   │   ├── blog/                    # Blog pages
│   │   ├── portfolio/               # Projects page
│   │   ├── dashboard/               # Admin dashboard
│   │   └── ...                      # Other pages
│   ├── components/
│   │   ├── AIBlogPostsList.tsx       # 🤖 Display AI posts
│   │   ├── TrendingPosts.tsx         # Most viewed posts
│   │   ├── Header.tsx                # Navigation
│   │   └── Footer.tsx                # Footer
│   ├── lib/
│   │   ├── ai-utils.ts               # 🤖 AI helper functions
│   │   ├── supabaseClient.ts         # Database client
│   │   └── useAnalytics.ts           # Real-time stats
│   ├── docs/
│   │   └── PRODUCTION_SCHEMA_FINAL.sql  # 🗄️ Database schema (50+ tools)
│   └── .env.example                 # Environment template
├── DEPLOYMENT_GUIDE_FINAL.md        # 👈 START HERE!
└── README.md                        # This file
```

## 🤖 How AI Blog Generation Works

### Every Monday at 3 AM UTC (8:30 AM IST)

1. **Research**: Tavily API searches for updates on 50+ tools
2. **Generate**: Google Generative AI writes original blog post
3. **Anti-Duplicate**: Excludes topics from last 14 days
4. **Save**: Post stored in Supabase with metadata
5. **Publish**: Automatically visible on /blog page

### Tools Covered (50+)

**Container & Orchestration**: Kubernetes, Docker, Docker Swarm, OpenShift, Nomad  
**Cloud Platforms**: AWS, Azure, Google Cloud Platform, DigitalOcean, Linode  
**Infrastructure as Code**: Terraform, Ansible, CloudFormation, Pulumi, Salt, Chef  
**CI/CD**: GitHub Actions, GitLab CI, Jenkins, ArgoCD, CircleCI, Azure DevOps, Tekton  
**Monitoring**: Prometheus, Grafana, ELK Stack, Datadog, New Relic, Jaeger  
**Security**: Zscaler, Cloudflare, HashiCorp Vault, Falco, OWASP, OPA  
**Service Mesh**: Istio, Linkerd, Envoy  
**Networking**: Flannel, Calico, Cilium, WireGuard  
**AI/ML**: Google Generative AI, Hugging Face, OpenAI, LLaMA, Tavily, MLflow  
**Databases**: PostgreSQL, MongoDB, Redis, Cassandra, Supabase  
**DevSecOps**: Trivy, Snyk, SAST Tools, Keycloak, OAuth 2.0  
**Deployment**: Vercel, Kong, NGINX, HAProxy  

---
- Node.js 18+ and npm
- Git account
- Supabase account (free at supabase.com)
- Vercel account (free at vercel.com)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd modern-blog-app/frontend
npm install
```

### 2. Setup Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run the schema SQL from `docs/DATABASE.md`
3. Get your API keys from Settings → API

### 3. Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_key_here
```

### 4. Run Locally
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel
```bash
# Push to GitHub first
git add .
git commit -m "Initial commit"
git push

# Then deploy:
# 1. Go to vercel.com
# 2. New Project → Import Git Repository
# 3. Add same .env.local values
# 4. Deploy!
```

## 🎯 Features

### Public Features ✅
- 📱 Responsive blog homepage
- 📄 Blog posts with markdown support
- 🖼️ Portfolio projects showcase  
- 👤 About page with bio
- 💬 Blog post comments
- 🌓 Dark/light mode toggle
- ⚡ Optimized images and performance
- 🔍 SEO-friendly metadata

### Admin Features ✅
- 📝 Full dashboard for content management
- ✏️ Create/edit/delete blog posts
- 🖼️ Image gallery with compression
- 📊 Analytics and view tracking
- 👤 User role management
- 💬 Comment moderation

## 🗄️ Database Schema

**Posts** - Blog articles and content
- `id`, `title`, `slug`, `content`, `excerpt`, `featured_image_url`
- `author_id`, `is_published`, `published_at`, `views_count`

**Users** - Authors and admins
- `id`, `email`, `name`, `bio`, `avatar_url`, `role`, `created_at`

**Comments** - Blog post discussions
- `id`, `post_id`, `author_name`, `author_email`, `content`
- `is_approved`, `created_at`

**Projects** - Portfolio projects
- `id`, `title`, `description`, `image_url`, `live_url`, `github_url`

**Images** - Uploaded images
- `id`, `name`, `url`, `size`, `created_at`

See `docs/DATABASE.md` for full schema and SQL setup.

## 🚀 Deployment

### Vercel (Recommended - 2 minutes)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. New Project → Import Git Repository
4. Add environment variables
5. Click Deploy

Your site will be live at `https://your-app.vercel.app` 🎉

See `docs/VERCEL_DEPLOYMENT.md` for detailed steps.

### Custom Domain
1. Buy domain (or use existing)
2. Point DNS to Vercel nameservers
3. Add domain in Vercel dashboard
4. SSL certificate auto-generated ✅

See `docs/DEPLOYMENT.md` for more options.

## 🔐 Security

- ✅ Environment variables for secrets (no hardcoded keys)
- ✅ Supabase RLS policies protect data
- ✅ Input validation and sanitization
- ✅ HTTPS encryption in production
- ✅ Safe image uploads with validation
- ✅ Protected admin routes

## 📊 Performance

Built for speed:
- ⚡ Next.js automatic code splitting
- 🖼️ Optimized images (WebP, responsive)
- 💾 Image compression before upload
- 🔄 Efficient data fetching
- 📦 Minimal bundle size
- 🌐 Global CDN via Vercel

## 🆘 Troubleshooting

### Build fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment variables not loading
- Check `.env.local` exists in `frontend/` folder
- Variables must start with `NEXT_PUBLIC_` for client-side
- Restart dev server after changes

### Supabase connection errors
- Verify URL and keys in `.env.local`
- Check Supabase project is active
- Test RLS policies aren't blocking access
- See `docs/SUPABASE_SETUP.md` for details

### Images not loading
- Verify Supabase Storage bucket exists
- Check image file permissions
- Ensure image URLs are public

See `docs/SUPABASE_FRONTEND_GUIDE.md` for more help.

## 📚 Documentation

- **docs/DATABASE.md** - Database schema and SQL setup
- **docs/SUPABASE_SETUP.md** - Supabase configuration
- **docs/SUPABASE_FRONTEND_GUIDE.md** - Frontend integration
- **docs/VERCEL_DEPLOYMENT.md** - Production deployment
- **docs/MIGRATION.md** - Migrate from WordPress
- **docs/DEPLOYMENT.md** - Alternative deployment options
- **docs/API.md** - API endpoint documentation

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run type-check  # Check TypeScript types
```

### Environment Setup
```bash
# Copy example env
cp .env.local.example .env.local

# Edit with your Supabase keys
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [Supabase Guide](https://supabase.com/docs)
- [Vercel Deployment](https://vercel.com/docs)

## 📝 License

MIT License - Free to use and modify

Feel free to fork, modify, and use for your own projects!

## 🤝 Contributing

Issues, suggestions, and pull requests welcome!

## 📞 Support

Check the docs folder for detailed guides, or open an issue on GitHub.

---

**Ready to launch?** Start with the Quick Start above, or read the detailed guides in the `docs/` folder. Your site will be live in 5 minutes! 🚀

**This project is a personal tech blog and portfolio maintained by Raju SRK. A showcase of DevOps, cloud engineering, and full-stack development insights!** 

**Author**: Raju SRK - [rjexa.com](https://rjexa.com) 
**If any issues or suggestions, please open an issue or contact me directly!**