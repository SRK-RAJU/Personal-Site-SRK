# 🚀 Setup Guide - Personal Tech Blog & Portfolio

This guide will walk you through setting up your complete modern website from scratch, from your old InfinityFree WordPress site to a scalable, modern tech stack.

---

## ⏱️ Time Estimate
- **Total Setup**: 45-60 minutes
- **Database Setup**: 10 minutes
- **Backend Setup**: 15 minutes  
- **Frontend Setup**: 15 minutes
- **Testing**: 10 minutes

---

## 📋 Prerequisites

Before you start, ensure you have installed:

1. **Node.js** (v18+): https://nodejs.org/
   ```bash
   node --version  # Should show v18+
   ```

2. **PostgreSQL**: https://www.postgresql.org/download/
   ```bash
   psql --version
   ```

3. **Git**: https://git-scm.com/
   ```bash
   git --version
   ```

4. **VS Code** (optional but recommended): https://code.visualstudio.com/

### Verify Installation
```bash
node --version
npm --version
psql --version
git --version
```

---

## Step 1: Database Setup (10 minutes)

### 1.1 Start PostgreSQL Service

**Windows**:
```powershell
# If PostgreSQL was installed with Windows installer
net start postgresql-x64-15
# Or use the Windows Services app to start PostgreSQL
```

**macOS**:
```bash
brew services start postgresql
```

**Linux**:
```bash
sudo systemctl start postgresql
```

### 1.2 Create Database & User

```bash
# Connect to PostgreSQL as admin
psql -U postgres

# In the postgres prompt (psql>):
CREATE DATABASE personal_blog;
CREATE USER app_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE personal_blog TO app_user;
\q  # Exit

# Verify connection
psql -U app_user -d personal_blog -c "SELECT version();"
```

### 1.3 Verify Database

```bash
psql -U app_user -d personal_blog
\dt  # Should show empty (no tables yet)
\q
```

✅ **Success**: Database created and ready

---

## Step 2: Backend Setup (15 minutes)

### 2.1 Install Dependencies

```bash
# Navigate to backend directory
cd modern-blog-app/backend

# Install all dependencies
npm install
```

### 2.2 Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env  # Or use your editor
```

Update `.env`:
```env
DATABASE_URL="postgresql://app_user:your_secure_password_here@localhost:5432/personal_blog"
JWT_SECRET="your_super_secret_key_min_32_chars_long"
NODE_ENV="development"
PORT=5000
CORS_ORIGIN="http://localhost:3000"
```

### 2.3 Create Database Tables

```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# This will:
# 1. Create all tables
# 2. Generate Prisma client
# 3. Prompt to seed database (say yes)
```

### 2.4 Seed Database with Sample Data

```bash
# Add sample posts and projects
npm run seed

# This creates:
# - Admin user (admin@example.com / ChangeMe123!)
# - 3 sample blog posts
# - 3 sample projects
```

### 2.5 Start Backend Server

```bash
# Terminal 1: Backend
npm run dev

# You should see:
# ==================================================
# ✨ Server running at http://localhost:5000
# 📚 API docs at http://localhost:5000/api/docs
# ==================================================
```

Test the API:
```bash
# In a new terminal
curl http://localhost:5000/api/health
# Should return: {"status":"ok",...}

curl http://localhost:5000/api/posts
# Should return: [list of posts...]
```

✅ **Backend Running**: http://localhost:5000

---

## Step 3: Frontend Setup (15 minutes)

### 3.1 Install Dependencies

```bash
# Navigate to frontend directory  
cd ../frontend  # Go from backend to backend/../frontend

# Install dependencies
npm install
```

### 3.2 Setup Environment

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit with your backend URL
nano .env.local
```

Update `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

###3.3 Start Frontend Server

```bash
# Terminal 2: Frontend
npm run dev

# You should see:
# - ready started server on 0.0.0.0:3000
# - event compiled client and server successfully
```

### 3.4 Open in Browser

Visit: **http://localhost:3000**

You should see:
- Home page with welcome message
- Navigation header and footer
- Blog, Portfolio, About, Contact pages accessible

✅ **Frontend Running**: http://localhost:3000

---

## Step 4: Testing (10 minutes)

### 4.1 Test Blog Posts

1. Go to http://localhost:3000/blog
2. You should see 3 sample posts
3. Click on a post to view it
4. Check the views counter increments

### 4.2 Test Portfolio

1. Go to http://localhost:3000/portfolio
2. You should see 3 sample projects
3. Each project shows tech stack and links

### 4.3 Test Admin Features (Optional)

```bash
# Login with sample admin credentials
# (You'd create a login page for this)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}'

# You'll get a token back
```

### 4.4 Common Issues

**Backend not running?**
```bash
# Check if port 5000 is in use
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

**Frontend can't connect to API?**
- Check `.env.local` has correct API_URL
- Ensure backend is running
- Check browser console for CORS errors

**Database connection failed?**
- Verify PostgreSQL is running
- Check DATABASE_URL in backend `.env`
- Ensure password is correct

See **TROUBLESHOOTING.md** for more help.

---

## Step 5: Next Steps

### Now That You're Up & Running:

1. **Migrate WordPress Data** (optional)
   - See `docs/MIGRATION.md`
   - Export your InfinityFree database
   - Import into PostgreSQL

2. **Customize Your Site**
   - Edit `frontend/app/page.tsx` to personalize homepage
   - Update profile info in components
   - Upload your own images

3. **Deploy to Production**
   - See `docs/DEPLOYMENT.md`
   - Setup GitHub repository
   - Deploy frontend on Vercel
   - Deploy backend on Railway

4. **Add Custom Domain**
   - Buy domain from Namecheap/GoDaddy
   - Connect to Vercel
   - Setup SSL certificate (automatic)

---

## Development Workflow

### Daily Development

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev

# Terminal 3: Database GUI (optional)
cd backend
npx prisma studio  # http://localhost:5555
```

### Making Changes

**Backend**:
```bash
cd backend
# Edit files in src/routes/, src/controllers/, etc.
# Changes auto-reload with nodemon
```

**Frontend**:
```bash
cd frontend
# Edit files in app/, components/, lib/, etc.
# Changes auto-reload with Next.js hot reload
```

### Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build  # Creates .next/ folder
npm start      # Starts production server
```

---

## File Structure Reference

```
modern-blog-app/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express server
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Auth, error handling
│   │   └── utils/              # Helper functions
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Seed data
│   ├── .env                    # Environment variables
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── blog/               # Blog pages
│   │   ├── portfolio/          # Portfolio page
│   │   └── ...
│   ├── components/             # React components
│   ├── lib/                    # Utilities, API client
│   ├── styles/                 # CSS files
│   ├── .env.local              # Environment variables
│   └── package.json
└── docs/
    ├── API.md                  # API documentation
    ├── DATABASE.md             # Database setup
    ├── DEPLOYMENT.md           # Production deployment
    └── MIGRATION.md            # WordPress migration
```

---

## Useful Commands Reference

### Backend Commands

```bash
cd backend

npm install              # Install dependencies
npm run dev            # Start development server
npm run build          # Build for production
npm start              # Run production build
npm run seed           # Seed database with sample data

npx prisma studio     # Open database GUI
npx prisma migrate dev --name <name>  # Create migration
npx prisma db push    # Sync schema to database
```

### Frontend Commands

```bash
cd frontend

npm install            # Install dependencies
npm run dev           # Start development server
npm run build         # Build for production
npm start             # Run production build
npm run lint          # Run ESLint
```

### Git Commands

```bash
git init                           # Initialize repo
git add .                          # Stage all changes
git commit -m "message"            # Commit changes
git remote add origin <url>        # Add GitHub remote
git push origin main               # Push to GitHub
git pull origin main               # Pull from GitHub
```

---

## Environment Variables Cheat Sheet

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your_secret_key_here
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Getting Help

1. **Check Documentation**
   - `docs/API.md` - API endpoints reference
   - `docs/DATABASE.md` - Database questions
   - `docs/DEPLOYMENT.md` - Production deployment

2. **Common Issues**
   - **Port already in use?** - `lsof -i :5000` or `netstat -ano | findstr :5000`
   - **PostgreSQL won't start?** - Check services or restart your computer
   - **npm install fails?** - Delete `node_modules` and `package-lock.json`, run `npm install` again

3. **Resources**
   - [Next.js Docs](https://nextjs.org/docs)
   - [Express.js Guide](https://expressjs.com/)
   - [Prisma Docs](https://www.prisma.io/docs/)
   - [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## ✅ Setup Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Database `personal_blog` created
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend `.env` configured with DATABASE_URL
- [ ] Backend migrations run (`npx prisma migrate dev`)
- [ ] Backend database seeded (`npm run seed`)
- [ ] Backend server running (`npm run dev`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend `.env.local` configured
- [ ] Frontend server running (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can see sample blog posts
- [ ] Can see sample projects

---

## 🎉 You're Ready!

Your complete tech blog and portfolio is now running locally!

**Next steps**:
1. Customize content (edit pages and components)
2. Migrate your WordPress data (see `docs/MIGRATION.md`)
3. Deploy to production (see `docs/DEPLOYMENT.md`)
4. Add custom domain

---

**Need Help?** Check the documentation files or the GitHub issues page.

Happy coding! 🚀
