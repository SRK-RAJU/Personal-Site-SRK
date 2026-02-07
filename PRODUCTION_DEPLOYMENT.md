# Production Deployment Guide

## Prerequisites
- Supabase project with `posts` table created
- Vercel account connected to GitHub
- GitHub repository linked to Vercel

## Environment Setup

### 1. Add Supabase Credentials to Vercel

In Vercel Dashboard → Project Settings → Environment Variables, add:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase
```

### 2. Verify Local .env.local

Create `modern-blog-app/frontend/.env.local` with same values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase
```

## Deployment Steps

1. **Push changes to GitHub**
   ```bash
   git add .
   git commit -m "Production ready: Supabase integration, cleaned dependencies"
   git push origin develop
   ```

2. **Vercel will auto-deploy**
   - Watch the build in Vercel Dashboard
   - Ensure no errors in build logs

3. **Test in Production**
   - Visit your Vercel domain
   - Check `/blog` page loads posts from Supabase
   - Verify all pages render correctly

## Database Migration (if not done yet)

1. Export WordPress posts to Supabase using `migrate_wordpress.py`
2. Upload WordPress images to Supabase Storage
3. Test data appears in production blog

## Cleanup

To remove legacy WordPress files after migration is verified:
```bash
rm -r wp-admin/
rm -r diag/
rm if0_*.sql
git add .
git commit -m "Remove legacy WordPress files"
git push origin develop
```

## Production Checklist

- [ ] Supabase URL and ANON KEY set in Vercel
- [ ] Build succeeds on Vercel (no errors)
- [ ] Blog page loads posts from Supabase
- [ ] Images display correctly (or uploaded to Supabase Storage)
- [ ] Custom domain configured (if applicable)
- [ ] Contact form working (if using)
- [ ] All navigation links functional

## Troubleshooting

**Blog page shows "No posts yet"**
- Check Supabase `posts` table has data
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel
- Check browser console for errors

**Build fails on Vercel**
- Clear Vercel cache: Settings → Git → Ignore Build Cache
- Redeploy
- Check `modern-blog-app/frontend/package.json` has correct Next.js version

**Images not showing**
- Verify image URLs in posts point to correct Supabase Storage bucket
- Check Supabase Storage bucket is public (if using public URLs)

## Support
For more details, see:
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
