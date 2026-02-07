# 📦 WordPress to Modern Stack Migration Guide

This guide explains how to export data from your InfinityFree WordPress site and import it into your new modern tech stack.

---

## Phase 1: Export Data from WordPress

### 1.1 Access phpMyAdmin

1. Log into InfinityFree control panel
2. Go to **phpMyAdmin**
3. Select your WordPress database

### 1.2 Export Database

**Method 1: Full Database Export** (Easiest)

1. Click your database name on left
2. Click "Export" tab
3. **Format**: SQL
4. **Options**:
   - ✅ Structure and data
   - ✅ Drop table if exists
5. Click "Go"
6. Save file: `wordpress_backup.sql`

**Method 2: Selective Tables Export**

Export these specific tables:
- `wp_posts` → Blog posts
- `wp_postmeta` → Post metadata
- `wp_users` → Authors
- `wp_comments` → Comments (optional)
- `wp_termmeta` → Categories/tags

### 1.3 Export Media Files

1. Via FTP (FileZilla):
   - Connect to InfinityFree FTP
   - Navigate to `wp-content/uploads/`
   - Download all media files locally

2. Or via File Manager:
   - Go to InfinityFree File Manager
   - Download folders from `public_html/wp-content/uploads/`

---

## Phase 2: Parse WordPress Data

Create a migration script `backend/scripts/migrate-wordpress.js`:

```javascript
const fs = require('fs');
const path = require('path');
const { parse } = require('json2xml');

// Read exported SQL file
const sqlFile = fs.readFileSync('wordpress_backup.sql', 'utf-8');

// Parse WordPress posts table
function extractPosts(sqlContent) {
  const postRegex = /INSERT INTO `wp_posts`.*?\) VALUES (.*?);/s;
  const match = sqlContent.match(postRegex);
  
  if (!match) return [];

  const posts = [];
  const rows = match[1].split('),(');
  
  rows.forEach(row => {
    const values = row.split(',').map(v => 
      v.trim().replace(/'/g, '').replace(/\\'/g, "'")
    );
    
    posts.push({
      id: values[0],
      title: values[4],
      content: values[5],
      excerpt: values[6],
      status: values[7],
      date: values[8],
      modified: values[9],
      author_id: values[3],
    });
  });
  
  return posts;
}

// Parse authors
function extractUsers(sqlContent) {
  const userRegex = /INSERT INTO `wp_users`.*?\) VALUES (.*?);/s;
  const match = sqlContent.match(userRegex);
  
  if (!match) return [];
  
  // Similar parsing as posts
  return [];
}

const posts = extractPosts(sqlFile);
const users = extractUsers(sqlFile);

console.log(`Found ${posts.length} posts`);
console.log(`Found ${users.length} users`);

// Save as JSON for processing
fs.writeFileSync('wordpress_posts.json', JSON.stringify(posts, null, 2));
fs.writeFileSync('wordpress_users.json', JSON.stringify(users, null, 2));
```

Run it:
```bash
cd backend
node scripts/migrate-wordpress.js
```

---

## Phase 3: Transform Data

Create transformation script `backend/scripts/transform-data.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const posts = require('./wordpress_posts.json');

const prisma = new PrismaClient();

async function migrateData() {
  try {
    // 1. Create admin user (you)
    const admin = await prisma.user.create({
      data: {
        email: 'your-email@example.com',
        password_hash: await bcrypt.hash('ChangeMe123!', 10),
        name: 'Raju SRK',
        role: 'ADMIN',
      },
    });
    console.log('✓ Created admin user');

    // 2. Transform and import posts
    for (const post of posts) {
      // Only import published posts
      if (post.status !== 'publish') continue;

      // Create slug from title
      const slug = post.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');

      await prisma.post.create({
        data: {
          title: post.title,
          slug: slug,
          content: post.content, // Already markdown from WordPress
          excerpt: post.excerpt,
          author_id: admin.id,
          published_at: new Date(post.date),
          is_published: true,
        },
      });
    }
    console.log(`✓ Imported ${posts.length} posts`);

    // 3. Download and link images
    // See Phase 4 below
    
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
```

Run it:
```bash
cd backend
node scripts/transform-data.js
```

---

## Phase 4: Migrate Media Files

### 4.1 Download Images from WordPress

Create script `backend/scripts/download-images.js`:

```javascript
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// List of image URLs from your WordPress site
const imageUrls = [
  'https://yoursite.com/wp-content/uploads/2024/01/image1.jpg',
  'https://yoursite.com/wp-content/uploads/2024/01/image2.jpg',
  // ... add all your images
];

const uploadDir = path.join(__dirname, '../uploads/blog');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function downloadImages() {
  for (const url of imageUrls) {
    try {
      const fileName = path.basename(url);
      const filePath = path.join(uploadDir, fileName);

      if (fs.existsSync(filePath)) {
        console.log(`⊘ Already exists: ${fileName}`);
        continue;
      }

      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });

      response.data.pipe(fs.createWriteStream(filePath));
      console.log(`✓ Downloaded: ${fileName}`);
    } catch (error) {
      console.error(`✗ Failed: ${url}`, error.message);
    }
  }
}

downloadImages();
```

### 4.2 Store Images in Cloud (Recommended)

Instead of local storage, upload to AWS S3:

```javascript
const AWS = require('aws-sdk');
const fs = require('fs');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

async function uploadToS3(filePath, key) {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `blog/${key}`,
    Body: fileContent,
    ContentType: 'image/jpeg',
    ACL: 'public-read', // Public access
  };

  return s3.upload(params).promise();
}
```

---

## Phase 5: Update Post Image References

Create script to update post image URLs:

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateImageUrls() {
  const posts = await prisma.post.findMany();

  for (const post of posts) {
    // Replace WordPress image URLs with new ones
    let content = post.content;
    
    // Example: Replace all image URLs
    content = content.replace(
      /https:\/\/youroldsite\.com\/wp-content\/uploads\//g,
      'https://cdn.yourdomain.com/images/'
    );

    await prisma.post.update({
      where: { id: post.id },
      data: { content },
    });
  }

  console.log('✓ Updated image URLs in all posts');
  await prisma.$disconnect();
}

updateImageUrls();
```

---

## Phase 6: Verify Migration

Create verification script:

```bash
#!/bin/bash

echo "🔍 Migration Verification"
echo ""

echo "Posts:"
npm run prisma -- query-raw 'SELECT COUNT(*) as count FROM posts'

echo "Users:"
npm run prisma -- query-raw 'SELECT COUNT(*) as count FROM users'

echo "Comments:"
npm run prisma -- query-raw 'SELECT COUNT(*) as count FROM comments'

echo ""
echo "Sample posts:"
npm run prisma -- query-raw 'SELECT title, slug, published_at FROM posts LIMIT 5'

echo ""
echo "✓ Verification complete!"
```

---

## Phase 7: Update Frontend Content

### 7.1 Create Blog Post Pages

The frontend will automatically fetch posts from the API. Create page template:

```typescript
// frontend/app/blog/[slug]/page.tsx
import { getPost } from '@/lib/api';
import PostContent from '@/components/PostContent';

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug);
  
  return <PostContent post={post} />;
}
```

### 7.2 Create Portfolio Page

Portfolio items are managed via API too:

```typescript
// frontend/app/portfolio/page.tsx
import { getProjects } from '@/lib/api';
import ProjectCard from '@/components/ProjectCard';

export default async function Portfolio() {
  const projects = await getProjects();
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

---

## Phase 8: SEO & Redirects

### 8.1 Setup Redirects

If your old WordPress URLs were different:

```javascript
// next-config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/2024/01/15/my-old-post',
        destination: '/blog/my-old-post',
        permanent: true,
      },
    ];
  },
};
```

### 8.2 Generate Sitemap

```typescript
// app/sitemap.ts
import { getAllPosts } from '@/lib/api';

export default async function sitemap() {
  const posts = await getAllPosts();

  return [
    {
      url: 'https://yourdomain.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    ...posts.map(post => ({
      url: `https://yourdomain.com/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
  ];
}
```

---

## Phase 9: Testing Migration

```bash
# 1. Verify data imported
cd backend
npm run prisma studio
# Check tables in visual interface

# 2. Test API endpoints
curl http://localhost:5000/api/posts
curl http://localhost:5000/api/posts/first-post-slug

# 3. Test frontend
cd frontend
npm run dev
# Visit http://localhost:3000/blog
# Verify posts display correctly

# 4. Check image URLs
# Ensure images load without 404 errors
```

---

## Phase 10: Cleanup InfinityFree

Once migration is complete and tested:

1. ✅ Backup your AWS bucket/storage
2. ✅ Keep a copy of `wordpress_backup.sql`
3. ✅ Test new site thoroughly
4. ✅ Update DNS to point to new domain
5. ✅ Keep InfinityFree for 1 month as fallback
6. ✅ Then cancel InfinityFree hosting

---

## Troubleshooting

### Posts not importing
```bash
# Check Prisma migration status
npx prisma migrate status

# Check for duplicate slugs
SELECT slug, COUNT(*) FROM posts GROUP BY slug HAVING COUNT(*) > 1
```

### Images broken
```bash
# Verify image URLs
SELECT featured_image_url FROM posts WHERE featured_image_url IS NOT NULL
```

### Character encoding issues
```sql
-- Fix MySQL encoding
ALTER TABLE posts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## Complete Migration Command Reference

```bash
# 1. Export from WordPress
# (Done via phpMyAdmin - save as wordpress_backup.sql)

# 2. Setup backend
cd backend
npm install

# 3. Configure database (.env)
# Edit .env with correct PostgreSQL URL

# 4. Setup Prisma
npx prisma migrate dev --name init

# 5. Transform & import data
node scripts/migrate-wordpress.js
node scripts/transform-data.js

# 6. Update image URLs
node scripts/update-image-urls.js

# 7. Verify
npx prisma studio
npm run dev

# 8. Setup frontend
cd frontend
npm install
npm run dev

# 9. Test
# Visit http://localhost:3000/blog
# Check all posts load correctly
```

---

## Success Checklist

- [ ] Database created in PostgreSQL
- [ ] WordPress data imported
- [ ] Posts visible in Prisma Studio
- [ ] API returns posts at `/api/posts`
- [ ] Images loading correctly
- [ ] Frontend successfully displays blog
- [ ] All links working
- [ ] SEO metadata correct
- [ ] Analytics setup
- [ ] Backups stored safely

---

**Next**: See `DEPLOYMENT.md` to deploy your new site to production!
