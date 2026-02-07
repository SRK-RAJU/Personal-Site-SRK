# 🚀 WORDPRESS MIGRATION - STEP BY STEP

**Migrate your WordPress site data to new Supabase in 30 minutes!**

---

## 📊 What's Being Migrated

```
WordPress (InfinityFree)          →    Supabase
├── Pages                              ├── Posts Table
├── Posts                              ├── Images in Storage
├── Images                             └── All content preserved
└── Database
```

---

## ⏱️ TIME BREAKDOWN

```
Step 1: Backup WordPress        →  5 min
Step 2: Export Database         →  5 min
Step 3: Run Migration Script    →  5 min
Step 4: Import to Supabase      →  5 min
Step 5: Verify & Upload Images  → 10 min

TOTAL: 30 minutes!
```

---

## ✅ STEP 1: Backup WordPress (5 minutes)

### 1.1 Login to WordPress

Go to: `https://yoursite.infinityfree.com/wp-admin`

### 1.2 Check What You Have

Click on each menu:
- **Dashboard** - Note total posts/pages
- **Posts** - Count how many posts
- **Pages** - Count how many pages
- **Media** - Count images

**Write down:**
```
Total Posts: ___
Total Pages: ___
Total Images: ___
```

### 1.3 Create WordPress Backup (Plugin Method - Easiest)

**NOT using plugins?** Skip to Step 2 (use cPanel)

---

## ✅ STEP 2: Export Database from InfinityFree (5 minutes)

### 2.1 Go to cPanel

1. Open: https://infinityfree.com
2. Login
3. Click "Account" or "Control Panel"
4. Find "cPanel" button → Click it

### 2.2 Open phpMyAdmin

1. In cPanel, look for **phpMyAdmin**
2. Click it

### 2.3 Select Database

1. Left side panel → Click your database name
   - Usually named: `epizXXXXX_yoursite`

### 2.4 Export SQL

1. Top menu → Click **"Export"**
2. Export method: **SQL**
3. Click **"Go"**
4. File downloads: `epizXXXXX_yoursite.sql`

**Save this file!**

✅ Database exported!

---

## ✅ STEP 3: Run Migration Script (5 minutes)

### 3.1 Download migrate_wordpress.py

This file is already in your workspace:
```
c:\Users\Raju\local-vs-code-files\Personal-Site-SRK\migrate_wordpress.py
```

### 3.2 Place SQL File

Put your `wordpress_backup.sql` (or whatever it's named) in SAME folder as script:

```
Personal-Site-SRK/
├── migrate_wordpress.py    ← Script
├── wordpress_backup.sql    ← Your downloaded SQL
└── (other files)
```

### 3.3 Run Script

Open PowerShell in that folder:

```powershell
# Navigate to folder
cd "C:\Users\Raju\local-vs-code-files\Personal-Site-SRK"

# Make sure Python is installed
python --version

# Run the script
python migrate_wordpress.py
```

### 3.4 Check Output

Script creates 2 files:

```
✅ supabase_migration.sql     ← Use this!
✅ migration_preview.json     ← Check this for preview
```

If you see errors, check:
- [ ] File named exactly `wordpress_backup.sql`?
- [ ] Python installed? (python --version)
- [ ] Running from correct folder?

---

## ✅ STEP 4: Import to Supabase (5 minutes)

### 4.1 Create Admin User First

1. Go to: https://app.supabase.com
2. Click your project
3. Click **SQL Editor**
4. New Query
5. Run this:

```sql
INSERT INTO users (email, password_hash, name, role)
VALUES ('admin@yoursite.com', 'temp_password_hash_123', 'Your Name', 'ADMIN');
```

Click **"Run"**

### 4.2 Get User ID

Same SQL Editor, new query:

```sql
SELECT id FROM users WHERE email = 'admin@yoursite.com';
```

Copy the UUID you get:
```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 4.3 Update Migration SQL

Open `supabase_migration.sql` (created by script)

Find this line:
```sql
INSERT INTO posts (title, slug, content, excerpt, author_id, is_published, published_at) VALUES
('Page Title', 'slug', 'content', 'excerpt', 'USER_ID_HERE'::UUID, true, '2024-01-01'),
```

Replace `USER_ID_HERE` with your UUID:
```sql
INSERT INTO posts (title, slug, content, excerpt, author_id, is_published, published_at) VALUES
('Page Title', 'slug', 'content', 'excerpt', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::UUID, true, '2024-01-01'),
```

### 4.4 Run Migration SQL

1. Back in Supabase SQL Editor
2. New Query
3. Paste entire `supabase_migration.sql` (with updated UUID)
4. Click **"Run"**

⏱️ Wait a few seconds...

✅ Success message? Posts imported!

### 4.5 Verify

```sql
-- Check how many posts imported
SELECT COUNT(*) as total_posts FROM posts;

-- See first 5 posts
SELECT title, slug FROM posts LIMIT 5;
```

---

## ✅ STEP 5: Upload Images (10 minutes)

### 5.1 Download Images from WordPress

**Option A: Via WordPress Media (Easy)**

1. Go to WordPress Dashboard
2. Media → Library
3. Select all images (Ctrl+A on page)
4. Bulk Download (if available)
5. Save to folder: `wordpress-images/`

**Option B: Via FTP (Complete)**

1. Use FTP client (FileZilla - free)
2. Connect to InfinityFree FTP
3. Navigate to: `public_html/wp-content/uploads/`
4. Download all folders
5. Save locally: `wordpress-images/`

### 5.2 Upload to Supabase Storage

1. Go to Supabase → Storage
2. Click **"+"** → Create new bucket
3. Name: `blog-images`
4. Set to **Public**
5. Click **"Create Bucket"**

6. Click `blog-images` bucket
7. Click **"Upload file"**
8. Select all images from `wordpress-images/`
9. Upload

✅ Images uploaded!

### 5.3 Update Image URLs

Run this SQL to update images in posts:

```sql
-- Update all image URLs in posts
UPDATE posts 
SET content = replace(
    content, 
    'https://yoursite.infinityfree.com/wp-content/uploads/',
    'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/blog-images/'
)
WHERE content LIKE '%wp-content/uploads%';
```

Replace `YOUR-PROJECT` with your Supabase project ID!

**How to find project ID:**
1. Go to Supabase dashboard
2. Settings → API
3. Look for URL: `https://YOUR-PROJECT.supabase.co`

---

## ✨ VERIFY MIGRATION (2 minutes)

### Checklist

- [ ] Ran migration script successfully
- [ ] All posts imported to Supabase
- [ ] Images uploaded to Storage
- [ ] Image URLs updated in posts
- [ ] No errors in SQL

### Test in Your Site

```bash
cd modern-blog-app/frontend
npm run dev
```

Visit: http://localhost:3000/blog

- [ ] All posts display?
- [ ] Images show correctly?
- [ ] Content looks good?
- [ ] No broken links?

✅ **If yes → Migration complete!**

---

## 📊 EXAMPLE

### Your WordPress Has:

```
Homepage: "Welcome to Raju"
About: "About Me"
Blog Post 1: "React Tips"
Blog Post 2: "Python Guide"
Images: 15 .jpg files
```

### After Migration:

**Supabase posts table:**
```
id   | title                | slug           | content
-----|----------------------|----------------|----------
1    | Welcome to Raju      | welcome-raju   | <h1>Welcome...</h1>
2    | About Me             | about-me       | <h1>About...</h1>
3    | React Tips           | react-tips     | <h1>React...</h1>
4    | Python Guide         | python-guide   | <h1>Python...</h1>
```

**Supabase storage:**
```
blog-images/
├── image1.jpg
├── image2.jpg
├── ... (all 15 images)
```

**Your Site Shows:**
```
vercel.app/               → Home
vercel.app/blog          → Blog listing (shows all 4)
vercel.app/blog/welcome-raju
vercel.app/blog/about-me
vercel.app/blog/react-tips
vercel.app/blog/python-guide
```

---

## 🆘 TROUBLESHOOTING

### "Script says no posts found"

**Solution:**
- Check filename: Must be exactly `wordpress_backup.sql`
- Check format: Should be SQL export from phpMyAdmin
- Check contents: Open in Notepad, should see `INSERT INTO wp_posts`

### "Images still showing old URLs"

**Solution:**
```sql
-- Check if update worked
SELECT COUNT(*) FROM posts WHERE content LIKE '%wp-content/uploads%';

-- If still showing, run update again with correct URL
UPDATE posts 
SET content = REPLACE(content, 'old-url', 'new-url');
```

### "Some posts importing, some not"

**Solution:**
- Check SQL has no syntax errors
- Check user UUID is correct (not just copied text)
- Run in small batches:
  ```sql
  INSERT INTO posts ... WHERE post_type = 'page';  -- pages first
  INSERT INTO posts ... WHERE post_type = 'post';  -- posts second
  ```

### "URL format wrong for Supabase storage"

**Solution:** Correct format:
```
https://YOUR-PROJECT.supabase.co/storage/v1/object/public/blog-images/image.jpg
```

Not:
```
https://YOUR-PROJECT.supabase.co/blog-images/image.jpg
```

---

## ✅ AFTER MIGRATION

### You Have:

```
✅ All WordPress pages imported
✅ All blog posts in Supabase
✅ All images in cloud storage
✅ Professional Next.js design
✅ Zero cost hosting
✅ Automatic deployments
✅ Better performance
```

### Next:

1. **Verify everything works**
   ```bash
   npm run dev
   # Visit http://localhost:3000/blog
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Migration complete: imported WordPress data"
   git push origin main
   ```

3. **Vercel auto-deploys** → Your site LIVE! 🎉

4. **When Ready, Delete Old WordPress**
   ```powershell
   Remove-Item -Recurse -Force "wp-admin"
   ```

---

## 🎊 RESULT

**Before:**
- Slow WordPress on InfinityFree
- Limited control
- No SSL by default
- Same old design
- Potential to get hacked

**After:**
- Fast Next.js + Supabase
- Complete control
- Industry-grade security
- Modern professional design
- $0/month (vs potential ₹500+)
- Unlimited growth

---

## 📋 COMPLETE CHECKLIST

### Pre-Migration
- [ ] Backed up WordPress database
- [ ] Downloaded all images
- [ ] Noted post/page count

### Migration Process
- [ ] Exported WordPress SQL
- [ ] Placed SQL file in right folder
- [ ] Ran migrate_wordpress.py script
- [ ] Created admin user in Supabase
- [ ] Got admin user UUID
- [ ] Replaced USER_ID_HERE with UUID
- [ ] Ran supabase_migration.sql
- [ ] Uploaded images to Storage
- [ ] Updated image URLs in posts

### Verification
- [ ] All posts imported (checked count)
- [ ] All images uploaded (checked Storage)
- [ ] Image URLs updated
- [ ] Visited /blog page locally
- [ ] Posts display correctly
- [ ] Images show correctly
- [ ] No broken content

### Final
- [ ] Pushed code to GitHub
- [ ] Vercel auto-deployed
- [ ] Live site works
- [ ] Old WordPress deleted (ready when confident)

---

## 🚀 READY?

**Run:** `python migrate_wordpress.py`

**Then:** Follow Step 4 above

**Result:** Your site with all old content! 🎉

---

Next: [DEPLOY_NOW.md](./DEPLOY_NOW.md)
