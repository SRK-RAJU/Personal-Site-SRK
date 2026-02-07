# 🚀 Deployment Guide

Your website can be deployed in minutes to production with custom domain!

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Domain                            │
│              (yourname.com via Namecheap/GoDaddy)           │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
    ┌────────────────┐            ┌─────────────────┐
    │  Frontend      │            │   Backend       │
    │  (Vercel)      │            │   (Railway)     │
    │  Next.js       │            │   Express       │
    │  Tailwind      │◄───────────►PostgreSQL       │
    │  3000 → 80     │   API       │  5000 → 80      │
    └────────────────┘            └─────────────────┘
         auto               auto
        deploy            deploy
         from               from
        GitHub            GitHub
```

---

## Phase 1: GitHub Setup

### 1.1 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create repo: `personal-blog`
3. Set to **Private** (personal data security)
4. Click "Create repository"

### 1.2 Push Code to GitHub

```bash
cd c:/Users/Raju/local-vs-code-files/Personal-Site-SRK/modern-blog-app

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Set up modern tech blog structure"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/personal-blog.git

# Push
git branch -M main
git push -u origin main
```

---

## Phase 2: Frontend Deployment (Vercel)

Vercel is the **easiest** way to deploy Next.js apps. Free tier gives you unlimited small projects!

### 2.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your GitHub

### 2.2 Deploy Frontend

1. Click "Add New..." → "Project"
2. Select `personal-blog` repo
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Environment Variables**:
     ```
     NEXT_PUBLIC_API_URL = https://api.yourdomain.com
     NEXT_PUBLIC_SITE_URL = https://yourdomain.com
     ```
   - Click "Deploy"

✅ **Frontend deployed!** You get a `.vercel.app` domain instantly

### 2.3 Auto-Deployments

Now whenever you push to GitHub:
```bash
git add .
git commit -m "Update website"
git push origin main
```
Vercel automatically rebuilds and deploys! 🎉

---

## Phase 3: Backend Deployment (Railway or Render)

### Option A: Railway (Recommended)

Railway provides PostgreSQL + Node.js hosting in one place!

#### 3A.1 Setup Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project
4. Add PostgreSQL database
5. Add Node.js service

#### 3A.2 Configure Backend

1. Add environment variables:
   ```
   DATABASE_URL = (auto-filled from Railway PostgreSQL)
   JWT_SECRET = your_secret_key_32_chars
   NODE_ENV = production
   PORT = 8000
   CORS_ORIGIN = https://yourdomain.com
   ```

2. Connect GitHub repo
3. Set root to `/backend`
4. Deploy!

#### 3A.3 Get Backend URL

Railway gives you: `https://api-prod-xxxx.railway.app`

---

### Option B: Render

If you prefer separate services:

#### 3B.1 Deploy PostgreSQL

1. Go to [render.com](https://render.com)
2. Create new PostgreSQL database
3. Copy connection string to `.env`

#### 3B.2 Deploy Backend

1. New "Web Service"
2. Connect GitHub repo
3. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Root Directory**: `backend`
   - **Environment Variables**: Add your `.env` vars
4. Deploy!

---

## Phase 4: Custom Domain Setup

### 4.1 Buy Domain

**Recommended registrars:**
- Namecheap (₹150-300/year)
- GoDaddy
- Google Domains

**Example**: `yourname.com` or `raju-tech-blog.com`

### 4.2 Configure Vercel Domain

1. Go to Vercel project settings
2. "Domains" tab
3. Add custom domain: `yourname.com`
4. Vercel shows you DNS records to add
5. Go to your domain registrar
6. Add those DNS records
7. Wait 24-48 hours for DNS to propagate

### 4.3 Update API URL

Once domain is live, update frontend `.env`:

```env
NEXT_PUBLIC_API_URL = https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL = https://yourdomain.com
```

Then push:
```bash
git push origin main
# Vercel auto-rebuilds with new config
```

---

## Phase 5: SSL/HTTPS Certificate

**Good news**: All deployment platforms auto-provide FREE SSL certificates!

- Vercel: Automatic
- Railway: Automatic
- Render: Automatic

Your site will have **https://yourdomain.com** 🔒

---

## Phase 6: Environment Variables Reference

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX  # Optional: Google Analytics
```

### Backend (.env.production)
```env
DATABASE_URL=postgresql://user:pass@host:5432/personal_blog
JWT_SECRET=your_super_secret_key_minimum_32_chars
NODE_ENV=production
PORT=8000
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

---

## Phase 7: Monitoring & Logs

### Vercel Logs
1. Vercel Dashboard → Project → Deployments
2. Click any deployment to see logs
3. Real-time function logs

### Railway/Render Logs
1. Dashboard → Service → Logs
2. View recent logs
3. Filter by level (errors, warnings)

---

## Phase 8: Continuous Deployment Workflow

Your development workflow is now **super simple**:

```bash
# 1. Make changes locally
vim frontend/app/page.tsx
vim backend/routes/posts.js

# 2. Test locally
cd frontend && npm run dev
cd backend && npm run dev

# 3. Commit changes
git add .
git commit -m "Add new feature"

# 4. Push to GitHub
git push origin main

# 5. ✨ Auto-deployed to production ✨
# Check Vercel/Railway dashboards in 2-3 minutes
```

---

## Phase 9: Scaling in Future

| When | Action | Cost |
|------|--------|------|
| **<1000 visits/month** | Use free tiers (Vercel, Railway) | $0 |
| **1000-10k visits/month** | Railway pro ($7/mo), Vercel Free | ~$10/month |
| **10k+ visits/month** | Railway pro ($20/mo), add CDN | ~$25/month |

---

## Phase 10: Backup Strategy

### Automated Backups
```bash
# Weekly backup script (add to cron)
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump $DATABASE_URL > backups/backup_$DATE.sql
```

### GitHub as Backup
- Your code is always backed up on GitHub
- Database backups go to separate storage

---

## Troubleshooting Deployments

### Site Shows "Not Found"
- Wait 24-48 hours for DNS propagation
- Check domain DNS records in registrar
- Verify Vercel domain settings

### 502 Bad Gateway
- Backend service might be down
- Check Railway/Render logs
- Ensure DATABASE_URL is correct

### Environment Variables Not Working
- Make sure variables are set in dashboard
- Restart service after changing vars
- Check quotes around values (remove if present)

### CORS Errors
- Update CORS_ORIGIN in backend to match your domain
- Redeploy backend
- Clear browser cache

---

## Post-Deployment Checklist

- [ ] Frontend loads at yourdomain.com
- [ ] API responds at https://api.yourdomain.com/health
- [ ] Database connected (check logs)
- [ ] SSL certificate valid (green lock icon)
- [ ] Emails working (if configured)
- [ ] Analytics installed
- [ ] Backup strategy in place
- [ ] Domain auto-renewal enabled
- [ ] Monitoring alerts setup

---

## Support & Docs

- [Vercel Docs](https://vercel.com/docs)
- [Railway Guides](https://railway.app/docs)
- [Render Docs](https://render.com/docs)
- [Custom Domains Guide](https://vercel.com/docs/concepts/projects/domains/add-a-domain)

---

## Next Steps

1. Create GitHub repo ← **You are here**
2. Push code to GitHub
3. Deploy frontend to Vercel
4. Deploy backend to Railway
5. Setup custom domain
6. Test everything works
7. Celebrate! 🎉
