# 🚀 Raju Dev - Full-Stack Portfolio Site

> Modern, production-ready portfolio and blog platform built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

- 📝 **Blog Platform** - Write and publish articles with markdown support
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode
- 📊 **Analytics** - Track page views and user engagement
- 📧 **Contact Form** - Integrated contact submissions to database
- 🎯 **Portfolio** - Showcase your projects with details
- ⚡ **Performance** - Optimized for speed with Next.js
- 🔐 **Secure** - Authentication and authorization ready
- 📱 **Responsive** - Works on all devices

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Icons** - Icon library

### Backend & Database
- **Supabase** - Backend as a Service
- **PostgreSQL** - Database
- **Vercel** - Hosting & Deployment

### Tools & Libraries
- **Axios** - HTTP client
- **Zustand** - State management
- **React Query** - Data fetching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 📦 Project Structure

```
modern-blog-app/
├── frontend/                    # Next.js application
│   ├── app/                    # App router pages
│   │   ├── api/               # API routes
│   │   ├── blog/              # Blog pages
│   │   ├── portfolio/         # Portfolio page
│   │   ├── about/             # About page
│   │   ├── contact/           # Contact page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   ├── lib/                   # Utilities and hooks
│   ├── public/                # Static assets
│   ├── styles/                # Global styles
│   └── tailwind.config.js     # Tailwind config
├── SUPABASE_TABLES_SETUP.sql  # Database setup
├── PRODUCTION_DEPLOYMENT_GUIDE.md
└── SITE_CHANGES_SUMMARY.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (optional, for deployment)

### Local Setup

```bash
# 1. Navigate to frontend directory
cd modern-blog-app/frontend

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Add your Supabase credentials to .env.local
# Edit the following:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
SUPABASE_SERVICE_ROLE_KEY=your-key-here

# 5. Start development server
npm run dev

# Visit http://localhost:3000
```

### Database Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Note your project URL and API keys

2. **Initialize Database**
   - Open your Supabase SQL Editor
   - Run the contents of `SUPABASE_TABLES_SETUP.sql`
   - Tables will be created automatically

3. **Verify Tables**
   - Check that these tables exist:
     - `posts` - Blog articles
     - `page_analytics` - Page views
     - `website_stats` - Site statistics
     - `contact_messages` - Contact form submissions
     - `projects` - Portfolio projects
     - `topics` - Blog categories

## 📝 Usage

### Create a Blog Post

1. Add a new post to your `posts` table in Supabase:
```sql
INSERT INTO posts (title, slug, content, excerpt, category, published)
VALUES (
  'My First Post',
  'my-first-post',
  'Content here...',
  'This is a preview',
  'Web Development',
  true
);
```

### Contact Form
- Automatically saves submissions to `contact_messages` table
- Email validation built-in
- Confirmation message shown to users

### Analytics
- Page views tracked automatically
- View stats on homepage
- Access data via Supabase dashboard

## 🔐 Environment Variables

Required variables in `.env.local`:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Site Configuration
NEXT_PUBLIC_SITE_NAME=Your Site Name
NEXT_PUBLIC_SITE_DESCRIPTION=Your description
NEXT_PUBLIC_AUTHOR=Your Name
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_COMPANY_NAME=Your Company
NEXT_PUBLIC_COMPANY_DOMAIN=yourdomain.com

# Optional
# NEXT_PUBLIC_ANALYTICS_ID=G-XXXX
```

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables during deployment
# or add them in Vercel dashboard
```

Or connect via GitHub in the [Vercel Dashboard](https://vercel.com/dashboard).

For detailed deployment instructions, see `PRODUCTION_DEPLOYMENT_GUIDE.md`.

## 📚 API Routes

### GET `/api/analytics?action=stats`
Returns website statistics:
```json
{
  "articles": 5,
  "monthly_views": 1200,
  "topics": 3,
  "projects": 5,
  "total_visits": 5000
}
```

### GET `/api/analytics?action=page-views`
Returns homepage page views:
```json
{
  "total_views": 1500
}
```

### POST `/api/contact`
Submit contact form:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Hello",
  "message": "I'd like to work with you..."
}
```

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to customize theme colors:
```javascript
theme: {
  colors: {
    // Add your colors
  }
}
```

### Typography
Update font families in `tailwind.config.js` or `app/layout.tsx`

### Logo
Replace the SVG in `components/Header.tsx`

### Content
All content is dynamically loaded from Supabase

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## 📊 Monitoring

### Supabase Monitoring
- Monitor API usage in Supabase dashboard
- Check database performance
- View logs for debugging

### Vercel Monitoring
- Monitor deployment logs
- Check performance metrics
- Set up alerts

## 🐛 Troubleshooting

### Issue: Supabase connection error
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check API key is not truncated
- Ensure project is active in Supabase

### Issue: Contact form not saving
- Run `SUPABASE_TABLES_SETUP.sql` to create tables
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase logs for errors

### Issue: Images not displaying
- SVG placeholders are in `/public/projects/`
- Replace with your own images
- Verify paths are correct

For more troubleshooting, see `PRODUCTION_DEPLOYMENT_GUIDE.md`.

## 📝 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run format    # Format code with Prettier
```

## 📄 License

This project is open source and available under the MIT License.

## 👥 Contributing

Feel free to fork, create branches, and submit pull requests!

## 📞 Support

For issues or questions:
- Check `PRODUCTION_DEPLOYMENT_GUIDE.md` for setup help
- Review API documentation in code comments
- Check Supabase logs for database issues

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Vercel](https://vercel.com/) - Hosting platform

---

## 📈 Roadmap

- [ ] Add blog search functionality
- [ ] Implement user comments on posts
- [ ] Add newsletter subscription
- [ ] Create admin dashboard for content management
- [ ] Add more analytics and metrics
- [ ] Implement caching strategies
- [ ] Add performance monitoring

---

**Made with ❤️ by Raju**

---

## 🌟 If you found this helpful, please star the repository!

**Quick Links:**
- [Raju Dev](https://rjexa.com)
- [GitHub](https://github.com/SRK-RAJU)
- [LinkedIn](https://www.linkedin.com/in/srajukumargoud/)
- [Twitter](https://twitter.com/srajukumargoud)

---

*Last Updated: May 9, 2026*
