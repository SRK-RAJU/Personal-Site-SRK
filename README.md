# 🚀 Modern Tech Blog & Portfolio

**A modern, production-ready blog and portfolio website - Built with Next.js, Supabase, and 100% FREE!**


- ⚡ **Fast**: Next.js 14 with optimized images and code splitting
- 🎨 **Modern UI**: Futuristic design with dark mode support
- 📱 **Responsive**: Perfect on mobile, tablet, and desktop
- 🔐 **Secure**: Supabase Auth and Row-Level Security (RLS)
- 💰 **Free Forever**: $0/month with Vercel + Supabase free tier
- 🌐 **Production Ready**: Live deployment on Vercel

## 🏗️ Tech Stack

| Component | Technology | Cost |
|-----------|-----------|------|
| **Frontend** | Next.js 14 + React + Tailwind CSS | Free |
| **Database** | PostgreSQL via Supabase | Free (500MB) |
| **API** | Supabase REST API | Free |
| **Auth** | Supabase Auth | Free |
| **Storage** | Supabase Storage | Free (1GB) |
| **Deployment** | Vercel | Free |
| **Domain** | vercel.app | Free |
| **Custom Domain** (Optional) | Your domain | $12/year |
| **TOTAL** | **$0/month forever** | ✅ |

## 📁 Project Structure

```
modern-blog-app/
├── frontend/                # Next.js application
│   ├── app/                 # App Router pages
│   │   ├── page.tsx         # Home page
│   │   ├── blog/            # Blog pages
│   │   ├── portfolio/       # Projects showcase
│   │   ├── about/           # About page
│   │   ├── contact/         # Contact form
│   │   └── dashboard/       # Admin dashboard
│   ├── components/          # React components
│   ├── lib/                 # Utilities & API
│   ├── styles/              # Tailwind CSS
│   ├── .env.local           # Environment variables
│   └── package.json         # Dependencies
├── docs/                    # Technical documentation
└── README.md                # This file
```

## ⚡ Quick Start (5 minutes)

### Prerequisites
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

**This project is maintained by Raju SRK @ rjexa inc. Visit [rjexa.com](https://rjexa.com) for more DevSecOps insights and cloud engineering content!** 