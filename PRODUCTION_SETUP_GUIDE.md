# AI BLOGGING PLATFORM - PRODUCTION SETUP & TESTING GUIDE

> **Last Updated**: June 13, 2026  
> **Status**: ✅ PRODUCTION READY  
> **Cost**: $0/month (100% free tier)

---

## 📋 QUICK OVERVIEW

This guide covers the complete setup and testing of your AI-powered blogging platform that automatically generates DevOps, Cloud, and Security content weekly using:

- **LLM**: Google Gemini API (100% FREE - gemini-3.5-flash model)
- **Search**: Tavily AI API (100% FREE - 1,000 calls/month)
- **Database**: Supabase PostgreSQL (100% FREE tier)
- **Hosting**: Vercel (100% FREE tier for Next.js)
- **Automation**: Vercel Cron Jobs (Runs every Monday 3 AM UTC)

---

## 🚀 PHASE 1: CREATE FREE ACCOUNTS (10 minutes)

### 1.1 Supabase Account & Project
```
1. Go to https://supabase.com
2. Sign up with GitHub or email
3. Click "New Project"
   - Organization: Create new
   - Project Name: "personal-blog-db"
   - Password: Save in password manager
   - Region: Choose closest to you
4. Wait for project initialization
5. Go to Settings → API
6. Copy and save:
   - Project URL
   - anon key
   - service_role key (🔒 Keep private!)
```

### 1.2 Google Gemini API Key
```
1. Go to https://ai.google.dev
2. Click "Get API Key"
3. Create new API key
4. Copy the key and save
5. Keep in safe place (don't commit to git)
```

### 1.3 Tavily AI API Key
```
1. Go to https://tavily.com
2. Sign up for free tier
3. Go to Settings → API Keys
4. Copy and save your API key
5. Keep in safe place (don't commit to git)
```

### 1.4 Vercel Account
```
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import your repository
4. You'll need this for deployment
```

---

## 🔧 PHASE 2: LOCAL ENVIRONMENT SETUP (5 minutes)

### 2.1 Create .env.local File
```bash
# Copy the example file
cp modern-blog-app/frontend/.env.example modern-blog-app/frontend/.env.local

# Edit .env.local and add your credentials:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXBlOiJKV1QiLC...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXBlOiJKV1QiLC...

# AI Agent Configuration
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...YOUR_GOOGLE_API_KEY...
TAVILY_API_KEY=tvly-...YOUR_TAVILY_API_KEY...

# Cron Secret (Generate 32+ random characters)
# On PowerShell: [System.Convert]::ToBase64String([System.Security.Cryptography.RNGCryptoServiceProvider]::new().GenerateRandomBytes(32))
# On Mac/Linux: openssl rand -hex 32
CRON_SECRET=abc123xyz789... (save this, you'll need it for Vercel)
```

### 2.2 Install Dependencies
```bash
cd modern-blog-app/frontend
npm install --legacy-peer-deps
```

### 2.3 Run Local Build
```bash
npm run build
```

If build succeeds, environment is correctly configured!

---

## 🗄️ PHASE 3: DATABASE SETUP (5 minutes)

### 3.1 Initialize Supabase Schema

1. Go to your Supabase project dashboard
2. Click "SQL Editor" in left sidebar
3. Click "New Query"
4. Copy entire content from: `modern-blog-app/frontend/docs/PRODUCTION_SCHEMA_FINAL.sql`
5. Paste into SQL editor
6. Click "Run"
7. Wait for all tables to be created ✅

### 3.2 Verify Tables Created
```
In Supabase:
- Table Editor (left sidebar)
- You should see these tables:
  ✓ ai_generated_posts
  ✓ ai_generation_logs
  ✓ ai_excluded_topics
  ✓ tools_coverage_metadata
  ✓ website_analytics
  ✓ visitor_log
  ✓ ai_blog_settings
```

---

## 🌐 PHASE 4: VERCEL DEPLOYMENT (10 minutes)

### 4.1 Push Code to GitHub
```bash
cd c:\Users\Raju\local-vs-code-files\Personal-Site-SRK

git add .
git commit -m "Production ready: AI blogging with Google Gemini"
git push origin main
```

### 4.2 Deploy to Vercel
```
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Click "Import"
5. Configure project:
   - Framework: Next.js
   - Root Directory: ./modern-blog-app/frontend
   - Click "Deploy"
6. Wait 5-10 minutes for deployment
```

### 4.3 Add Environment Variables to Vercel
```
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add these 5 variables:

Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://YOUR-PROJECT.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJ0eXBlOiJKV1QiLC...

Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJ0eXBlOiJKV1QiLC...

Name: GOOGLE_GENERATIVE_AI_API_KEY
Value: AIzaSy...

Name: TAVILY_API_KEY
Value: tvly-...

Name: CRON_SECRET
Value: (your 32+ char secret from .env.local)

4. Click "Save"
5. Trigger new deployment (Deployments → Redeploy)
```

---

## ✅ PHASE 5: TESTING (Manual Trigger)

### 5.1 Test via URL (Before Monday)
```
Once deployed to Vercel, you can test manually:

URL Format:
https://YOUR-VERCEL-URL.vercel.app/api/ai-agent/generate-post?test=true&secret=YOUR_CRON_SECRET

Example:
https://my-blog.vercel.app/api/ai-agent/generate-post?test=true&secret=abc123xyz789...

Steps:
1. Copy your deployed Vercel URL
2. Get your CRON_SECRET from .env.local
3. Construct the URL above
4. Open URL in browser
5. Wait 30-60 seconds for response

Expected Response (Success):
{
  "success": true,
  "runId": "ai-blog-1686528000000-xyz789abc",
  "duration_seconds": 45,
  "post": {
    "title": "Weekly DevOps & Security Digest...",
    "slug": "weekly-devops-security-digest-...",
    "tools_covered": ["Kubernetes", "Docker", ...],
    "cves_mentioned": 5
  }
}
```

### 5.2 Verify Post in Database
```
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Click "ai_generated_posts"
4. You should see your generated post with:
   - title
   - slug
   - content (markdown)
   - tools_covered (array)
   - cves_mentioned (number)
   - published_at (timestamp)
```

### 5.3 View Post on Blog Page
```
1. Go to: https://YOUR-VERCEL-URL.vercel.app/blog
2. You should see your newly generated post
3. Click on it to read the full article
4. Verify formatting and content quality
```

---

## 🤖 PHASE 6: AUTOMATIC SCHEDULING

### 6.1 Verify Cron Schedule
```
Cron Schedule: 0 3 * * 1
Meaning: Monday (day 1), at 03:00 UTC

IST Equivalent: Monday 8:30 AM IST
PST Equivalent: Sunday 8:00 PM PST
EST Equivalent: Sunday 10:00 PM EST

Next Run: Automatically this Monday at 3 AM UTC
```

### 6.2 Monitor Cron Execution
```
Option A: Check Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to "Functions" tab
4. Look for: /api/ai-agent/generate-post
5. View recent invocations

Option B: Check Supabase Logs
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Click "ai_generation_logs"
4. View execution history with status and duration
```

---

## 🔍 TROUBLESHOOTING

### Problem: API returns 401 Unauthorized
**Solution**: 
- Verify CRON_SECRET is correct
- Check URL parameter: `?secret=YOUR_EXACT_SECRET`
- Ensure secret matches in .env.local AND Vercel

### Problem: 500 Error - API Request Failed
**Solution**:
- Check GOOGLE_API_KEY is correct in Vercel env vars
- Check TAVILY_API_KEY is correct in Vercel env vars
- Verify Supabase credentials (service_role_key)
- Check Supabase tables exist (ai_generated_posts table)

### Problem: No Post in Database
**Solution**:
- Check ai_generation_logs table for error messages
- Verify RLS policies in Supabase (should be disabled for service role)
- Check Network tab in browser for failed requests

### Problem: Cron Job Not Running Monday
**Solution**:
- Verify vercel.json schedule: "0 3 * * 1"
- Check Vercel project has deployment from main branch
- Monitor Vercel Functions tab for invocation logs

---

## 📊 MONITORING & MAINTENANCE

### Weekly Post Generation
```
✅ Every Monday 3 AM UTC
✅ Automatically generates 15-20 KB article
✅ Covers 8-10 different DevOps/Cloud/Security tools
✅ No duplicate topics from last 14 days
✅ 100% original content (paraphrased, not copy-pasted)
```

### Database Storage
```
Current Supabase Free Tier: 500 MB
Expected Usage: ~2 MB per year (text-only, no images)
Projected Lifespan: 250+ years of posts 🎉
```

### Cost Tracking
```
Google Gemini: FREE (60 req/min limit)
Tavily AI: FREE (1,000 calls/month)
Supabase: FREE (500 MB, 50 GB bandwidth)
Vercel: FREE (serverless functions, bandwidth)

Total Monthly Cost: $0.00 forever!
```

---

## 📋 PRODUCTION CHECKLIST

Before considering your platform live:

- [ ] Supabase project created and verified
- [ ] All 7 tables created and populated
- [ ] Google Gemini API key obtained
- [ ] Tavily AI API key obtained
- [ ] .env.local configured with all credentials
- [ ] Local build successful (npm run build)
- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel successfully
- [ ] Environment variables added to Vercel
- [ ] Manual test successful (post visible on /blog)
- [ ] Post appears in ai_generated_posts table
- [ ] Cron schedule verified in vercel.json (0 3 * * 1)
- [ ] CRON_SECRET saved and kept private
- [ ] First Monday generation monitored

---

## 🎯 NEXT STEPS

### Immediate (This Week)
1. ✅ Create free accounts (Supabase, Google Gemini, Tavily)
2. ✅ Set up local environment with .env.local
3. ✅ Deploy to Vercel
4. ✅ Test manual generation
5. ✅ Verify post on blog page

### This Monday
1. Monitor automatic cron execution
2. Check ai_generation_logs for success
3. Verify new post appears on /blog page
4. Share link on social media (optional)

### Ongoing
1. Monitor Supabase storage usage
2. Review generated content weekly
3. Update .env.local if API keys change
4. Backup database monthly

---

## 📞 SUPPORT & RESOURCES

### Documentation
- [Vercel Cron Docs](https://vercel.com/docs/cron-jobs)
- [Supabase Docs](https://supabase.com/docs)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Tavily AI Docs](https://docs.tavily.com)

### Emergency: Reset Everything
```bash
# If you need to start over:
1. Delete Supabase project
2. Delete Vercel project
3. Delete .env.local
4. Start from PHASE 1
```

---

## 📈 SUCCESS METRICS

Your platform is working perfectly when:

✅ Weekly post generates every Monday  
✅ Post covers 8-10 different tools  
✅ Content is 15-20 KB of original markdown  
✅ Post visible on /blog page within 5 minutes  
✅ Database storage stays under 10 MB  
✅ Zero cost every month  
✅ No duplicate topics in last 14 days  

---

**Status**: 🚀 **READY FOR PRODUCTION**

Your AI blogging platform is fully configured and automated. Enjoy your weekly DevOps & Security digest!

