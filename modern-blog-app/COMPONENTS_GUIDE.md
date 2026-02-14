# 🎨 Advanced Components & Utilities Guide

Complete documentation for all new advanced components, utilities, and hooks added in v2.0.

## 📦 Components

### 1. BlogSearch Component

Advanced search and filtering component for blog posts.

**Location**: `components/BlogSearch.tsx`

**Usage**:
```tsx
import BlogSearch from '@/components/BlogSearch';

export default function BlogPage() {
  const handleSearch = (query: string) => {
    // Handle search
  };

  const handleCategoryFilter = (category: string) => {
    // Handle category filter
  };

  return (
    <BlogSearch
      onSearch={handleSearch}
      onCategoryFilter={handleCategoryFilter}
      categories={['All', 'Cloud', 'DevOps', 'Security']}
      placeholder="Search articles..."
    />
  );
}
```

**Props**:
- `onSearch: (query: string) => void` - Search callback
- `onCategoryFilter?: (category: string) => void` - Category filter callback
- `categories?: string[]` - Available categories
- `placeholder?: string` - Input placeholder

**Features**:
- Real-time search input
- Category filter buttons
- Clear button for active search
- Smooth animations
- Focus state styling
- Responsive design

---

### 2. BlogCard Component

Enhanced blog post card with metadata, images, and rich information.

**Location**: `components/BlogCard.tsx`

**Usage**:
```tsx
import BlogCard from '@/components/BlogCard';

const post = {
  id: '1',
  slug: 'my-blog-post',
  title: 'Advanced Cloud Architecture',
  excerpt: 'Learn about modern cloud patterns...',
  content: 'Full blog content...',
  featured_image_url: 'https://...',
  created_at: new Date().toISOString(),
  views: 1200,
  category: 'Cloud',
  tags: ['AWS', 'Architecture', 'DevOps'],
  featured: true,
};

export default function BlogGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <BlogCard {...post} />
    </div>
  );
}
```

**Props**:
- `id: string` - Post ID
- `slug: string` - URL slug
- `title: string` - Post title
- `excerpt?: string` - Short description
- `content: string` - Full content (for reading time)
- `featured_image_url?: string` - Cover image URL
- `created_at: string` - ISO date string
- `views?: number` - View count (default: 0)
- `category?: string` - Post category (default: 'General')
- `tags?: string[]` - Post tags
- `featured?: boolean` - Featured post badge

**Features**:
- Featured post badge
- Auto-calculated reading time
- View count display
- Category badges
- Tag display
- Image with lazy loading
- Hover animations
- Responsive design

---

### 3. StatsCard Component

Analytics and statistics display component.

**Location**: `components/StatsCard.tsx`

**Usage**:
```tsx
import StatsCard from '@/components/StatsCard';
import { FaEye, FaFire } from 'react-icons/fa';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatsCard
        icon={<FaEye />}
        label="Total Views"
        value={15420}
        change={12.5}
        trend="up"
        color="emerald"
      />
      <StatsCard
        icon={<FaFire />}
        label="Trending Posts"
        value={8}
        change={-3.2}
        trend="down"
        color="orange"
      />
    </div>
  );
}
```

**Props**:
- `icon: ReactNode` - Icon element
- `label: string` - Stat label
- `value: string | number` - Stat value
- `change?: number` - Percentage change
- `trend?: 'up' | 'down'` - Trend direction
- `color?: 'emerald' | 'blue' | 'orange' | 'purple'` - Color scheme
- `gradient?: string` - Custom gradient class

**Features**:
- Color-coded icons
- Trend indicators
- Glassmorphic design
- Hover animations
- Responsive sizing
- Customizable gradients

---

### 4. LoadingSkeleton Component

Professional loading skeleton states.

**Location**: `components/LoadingSkeleton.tsx`

**Usage**:
```tsx
import LoadingSkeleton, { CardSkeleton, BlogCardSkeleton } from '@/components/LoadingSkeleton';

export default function LoadingState() {
  return (
    <>
      {/* Basic skeleton */}
      <LoadingSkeleton count={3} variant="card" />

      {/* Card skeleton */}
      <CardSkeleton />

      {/* Blog card skeleton */}
      <BlogCardSkeleton />
    </>
  );
}
```

**Props**:
- `count?: number` - Number of skeletons (default: 1)
- `variant?: 'card' | 'text' | 'avatar' | 'line'` - Skeleton type
- `height?: string` - Height class (e.g., 'h-12')
- `width?: string` - Width class (e.g., 'w-full')

**Variants**:
- `card` - Full-width card skeleton
- `text` - Text line skeleton
- `avatar` - Round avatar skeleton
- `line` - Horizontal line skeleton

---

## 🪝 Hooks

### useToast Hook

Custom toast notification system.

**Location**: `lib/useToast.ts`

**Usage**:
```tsx
'use client';

import { useToast } from '@/lib/useToast';

export default function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Article published successfully!');
  };

  const handleError = () => {
    toast.error('Failed to publish article');
  };

  const handleLoading = () => {
    const toastId = toast.loading('Publishing...');
    // Later: dismiss or update toast
  };

  const handlePromise = async () => {
    await toast.promise(
      publishArticle(),
      {
        loading: 'Publishing...',
        success: 'Published successfully!',
        error: 'Failed to publish',
      }
    );
  };

  return (
    <>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
      <button onClick={handleLoading}>Loading</button>
      <button onClick={handlePromise}>Promise</button>
    </>
  );
}
```

**Methods**:
- `success(message: string)` - Success notification
- `error(message: string)` - Error notification
- `loading(message: string)` - Loading notification
- `promise<T>(promise, messages)` - Promise-based notification

---

## 🎨 CSS Classes & Utilities

### Button Classes

```tsx
// Primary button
<button className="btn-primary">
  Click me
</button>

// Secondary button
<button className="btn-secondary">
  Click me
</button>

// Outline button
<button className="btn-outline">
  Click me
</button>
```

### Card Classes

```tsx
// Standard card
<div className="card">
  Content
</div>

// Hover effect card
<div className="card-hover">
  Content
</div>

// Glassmorphic card
<div className="card-glass">
  Content
</div>
```

### Text & Typography

```tsx
// Gradient text
<h1 className="gradient-text">
  Gradient Heading
</h1>

// Badge
<span className="badge">
  New
</span>

// Secondary badge
<span className="badge-secondary">
  Label
</span>
```

### Input Classes

```tsx
// Custom input
<input className="input-custom" />

// Custom textarea
<textarea className="textarea-custom" />
```

### Effects & Animations

```tsx
// Glow effect
<div className="glow-emerald">
  Glowing element
</div>

// Intense glow
<div className="glow-emerald-intense">
  Intense glow
</div>

// Fade animation
<div className="animate-fade">
  Fading element
</div>
```

---

## 🎬 Framer Motion Integration

### Header Component

```tsx
import { motion } from 'framer-motion';

// Logo animation
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.5 }}
>
  Logo
</motion.div>
```

### Home Page

```tsx
// Container variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

// Item variants
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};
```

### Hover Effects

```tsx
<motion.button
  whileHover={{ scale: 1.05, y: -5 }}
  whileTap={{ scale: 0.95 }}
>
  Click me
</motion.button>
```

---

## 🌈 Color Schemes

### Primary Colors
- Emerald (#10b981)
- Teal (#14b8a6)
- Cyan (#06b6d4)

### Secondary Colors
- Blue (#3b82f6)
- Orange (#f97316)
- Purple (#a855f7)

### Neutral Colors
- Slate 900-950 (dark)
- Slate 50-100 (light)

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile first */
/* ... mobile styles ... */

@media (min-width: 640px) {
  /* sm: tablet styles */
}

@media (min-width: 1024px) {
  /* lg: desktop styles */
}
```

### Container Classes
```tsx
<div className="container-max">
  {/* Max width 6xl with padding */}
</div>
```

---

## ♿ Accessibility

- ARIA labels for interactive elements
- Proper heading hierarchy
- Keyboard navigation support
- Color contrast compliance
- Focus states on all interactive elements
- Reduced motion support

---

## 🚀 Performance Tips

1. **Use Loading Skeletons**: Show skeletons while loading data
2. **Lazy Load Images**: Use `loading="lazy"` on images
3. **Code Splitting**: Next.js handles this automatically
4. **Optimize Animations**: Use Transform/Opacity for best performance
5. **Use React.memo**: For components that don't change often

---

## 🐛 Common Issues & Solutions

### Animations not working
- Ensure Framer Motion is installed: `npm install framer-motion`
- Check `"use client"` directive at top of component

### Styling not applied
- Clear Next.js cache: `rm -rf .next`
- Verify Tailwind CSS import in `globals.css`
- Check `tailwind.config.js` includes all paths

### Toast not showing
- Ensure `<Toaster />` is in layout
- Check browser console for errors
- Verify CSS is loaded

---

## 📚 Additional Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Hot Toast](https://react-hot-toast.com/)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Last Updated**: February 14, 2026  
**Version**: 2.0.0
