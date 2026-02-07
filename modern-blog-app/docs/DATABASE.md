# 🗄️ Database Setup Guide

## Prerequisites

- PostgreSQL 14+ installed
- pgAdmin (optional but recommended)
- Node.js 18+

---

## 1. PostgreSQL Installation

### Windows
```bash
# Download PostgreSQL installer from https://www.postgresql.org/download/windows/
# Run installer with default settings
# Remember the password you set for 'postgres' user
```

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt, create database:
CREATE DATABASE personal_blog;
CREATE DATABASE personal_blog_test;

# Create application user
CREATE USER app_user WITH PASSWORD 'secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE personal_blog TO app_user;
GRANT ALL PRIVILEGES ON DATABASE personal_blog_test TO app_user;

# Verify
\l  # List databases
\du # List users

# Exit
\q
```

---

## 3. Environment Setup

Create `.env` file in backend folder:

```env
# Database
DATABASE_URL="postgresql://app_user:secure_password_here@localhost:5432/personal_blog"
DATABASE_TEST_URL="postgresql://app_user:secure_password_here@localhost:5432/personal_blog_test"

# JWT
JWT_SECRET="your_secret_key_min_32_characters_long"
JWT_EXPIRY="7d"

# Server
NODE_ENV="development"
PORT=5000

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880  # 5MB

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# AWS S3 (optional, for image uploads)
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
```

---

## 4. Prisma Schema

The backend uses Prisma ORM. Create `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Users
model User {
  id            String     @id @default(cuid())
  email         String     @unique
  password_hash String
  name          String
  bio           String?
  avatar_url    String?
  role          Role       @default(READER)
  is_active     Boolean    @default(true)
  created_at    DateTime   @default(now())
  updated_at    DateTime   @updatedAt
  
  posts         Post[]
  comments      Comment[]
  
  @@map("users")
}

// Blog Posts
model Post {
  id                String     @id @default(cuid())
  title             String
  slug              String     @unique
  content           String     // Markdown content
  excerpt           String?
  featured_image_url String?
  author_id         String
  author            User       @relation(fields: [author_id], references: [id], onDelete: Cascade)
  
  is_published      Boolean    @default(false)
  published_at      DateTime?
  views_count       Int        @default(0)
  
  tags              String[]   @default([])  // Array of tags
  categories        String[]   @default([])  // Array of categories
  
  comments          Comment[]
  
  created_at        DateTime   @default(now())
  updated_at        DateTime   @updatedAt
  
  @@index([author_id])
  @@index([slug])
  @@index([published_at])
  @@map("posts")
}

// Portfolio Projects
model Project {
  id            String   @id @default(cuid())
  title         String
  description   String
  image_url     String?
  live_url      String?
  github_url    String?
  technologies  String[] // ["React", "Node.js", "PostgreSQL"]
  
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  @@map("projects")
}

// Comments
model Comment {
  id            String   @id @default(cuid())
  post_id       String
  post          Post     @relation(fields: [post_id], references: [id], onDelete: Cascade)
  
  author_id     String?
  author        User?    @relation(fields: [author_id], references: [id], onDelete: SetNull)
  
  author_name   String   // For anonymous comments
  author_email  String   // For anonymous comments
  
  content       String
  is_approved   Boolean  @default(false)
  
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  @@index([post_id])
  @@index([author_id])
  @@map("comments")
}

// Enum for user roles
enum Role {
  ADMIN
  AUTHOR
  READER
}
```

---

## 5. Run Migrations

```bash
cd backend

# Install dependencies
npm install

# Create tables from schema
npx prisma migrate dev --name init

# View database in Prisma Studio
npx prisma studio
```

---

## 6. Seed Initial Data

Create `backend/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password_hash: await bcrypt.hash('admin123', 10),
      name: 'Raju SRK',
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin.email);

  // Create sample projects
  const projects = await prisma.project.createMany({
    data: [
      {
        title: 'E-commerce Platform',
        description: 'Full-stack e-commerce built with React and Node.js',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
        github_url: 'https://github.com/yourusername/ecommerce',
        live_url: 'https://ecommerce-demo.com',
      },
      {
        title: 'AI Chat Application',
        description: 'Real-time chat with AI integration',
        technologies: ['Next.js', 'Express', 'WebSocket', 'OpenAI'],
        github_url: 'https://github.com/yourusername/ai-chat',
        live_url: 'https://ai-chat-demo.com',
      },
    ],
  });

  console.log(`Created ${projects.count} projects`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npx prisma db seed
```

---

## 7. Database Backup & Restore

### Backup
```bash
pg_dump -U app_user personal_blog > backup.sql
```

### Restore
```bash
psql -U app_user personal_blog < backup.sql
```

---

## 8. Common Issues

### Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Make sure PostgreSQL service is running
```bash
# Windows
net start postgresql-x64-14

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Wrong Password
```bash
# Reset postgres password
psql -U postgres
\password postgres  # Enter new password
\q
```

### Can't Connect with App
- Check DATABASE_URL format in .env
- Verify credentials with: `psql -U app_user -d personal_blog`
- Check firewall isn't blocking port 5432

---

## 9. Development Database Tools

### pgAdmin (Web UI)
```bash
# Install Docker and run:
docker run -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  dpage/pgadmin4
```
Then visit: http://localhost:5050

### DBeaver (Desktop Client)
- Download from https://dbeaver.io/
- Connect to local PostgreSQL
- Browse tables, run queries

---

## 10. Next Steps

1. ✅ PostgreSQL installed and running
2. ✅ Database created
3. ✅ Prisma schema defined
4. ✅ Migrations run
5. → Go to `MIGRATION.md` to import WordPress data
