# 📚 API Documentation

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://api.yourdomain.com`

---

## Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Tokens are obtained after login and last for 7 days.

---

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "cuid123",
    "title": "My First Post",
    ...
  }
}
```

### Error Response (400+)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required",
    "details": {
      "field": "title"
    }
  }
}
```

---

## Endpoints

### 🔐 Authentication

#### POST `/api/auth/register`
Create new user account.

**Request:**
```json
{
  "email": "raju@example.com",
  "password": "SecurePass123!",
  "name": "Raju SRK"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "raju@example.com",
    "name": "Raju SRK"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "raju@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "raju@example.com",
    "name": "Raju SRK"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "7 days"
}
```

---

#### POST `/api/auth/logout`
Logout current user. Requires authentication.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 📝 Blog Posts

#### GET `/api/posts`
List all published blog posts.

**Query Parameters:**
```
?page=1&limit=10&sort=-date&category=tech
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "post-1",
      "title": "Getting Started with React",
      "slug": "getting-started-with-react",
      "excerpt": "Learn React basics...",
      "featured_image_url": "...",
      "author": {
        "id": "user-1",
        "name": "Raju SRK"
      },
      "tags": ["react", "javascript"],
      "published_at": "2024-01-15T10:00:00Z",
      "views_count": 1250
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

#### GET `/api/posts/:slug`
Get single blog post by slug.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "post-1",
    "title": "Getting Started with React",
    "slug": "getting-started-with-react",
    "content": "# Getting Started\n\nReact is...",
    "excerpt": "Learn React basics...",
    "featured_image_url": "...",
    "author": {
      "id": "user-1",
      "name": "Raju SRK",
      "avatar_url": "..."
    },
    "tags": ["react", "javascript"],
    "categories": ["tutorials"],
    "published_at": "2024-01-15T10:00:00Z",
    "views_count": 1251,
    "comments": [
      {
        "id": "comment-1",
        "author_name": "John Doe",
        "content": "Great post!",
        "created_at": "2024-01-16T08:30:00Z"
      }
    ]
  }
}
```

---

#### POST `/api/posts` ⚙️
Create new blog post. Requires AUTHOR role.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "New Blog Post",
  "slug": "new-blog-post",
  "content": "# New Post\n\nContent here...",
  "excerpt": "Short description",
  "featured_image_url": "https://...",
  "tags": ["tech", "blog"],
  "categories": ["tutorials"],
  "is_published": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "post-2",
    "title": "New Blog Post",
    ...
  }
}
```

---

#### PATCH `/api/posts/:id` ⚙️
Update blog post. Requires AUTHOR role.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

#### DELETE `/api/posts/:id` ⚙️
Delete blog post. Requires AUTHOR role.

**Response (200):**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

### 🎨 Portfolio Projects

#### GET `/api/projects`
List all portfolio projects.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "proj-1",
      "title": "E-commerce Platform",
      "description": "Full-stack e-commerce...",
      "image_url": "...",
      "live_url": "https://...",
      "github_url": "https://...",
      "technologies": ["React", "Node.js", "PostgreSQL"],
      "created_at": "2024-01-10T00:00:00Z"
    }
  ]
}
```

---

#### GET `/api/projects/:id`
Get single project.

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

#### POST `/api/projects` ⚙️
Create project. Requires ADMIN role.

**Request:**
```json
{
  "title": "New Project",
  "description": "Project description",
  "image_url": "...",
  "live_url": "https://...",
  "github_url": "https://...",
  "technologies": ["React", "Node.js"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### 💬 Comments

#### POST `/api/posts/:id/comments`
Add comment to post.

**Request:**
```json
{
  "author_name": "John Doe",
  "author_email": "john@example.com",
  "content": "Great post!"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "comment-2",
    "post_id": "post-1",
    "author_name": "John Doe",
    "content": "Great post!",
    "is_approved": false,
    "created_at": "2024-01-17T12:00:00Z"
  }
}
```

---

#### GET `/api/posts/:id/comments`
Get comments for a post.

**Response (200):**
```json
{
  "success": true,
  "data": [...]
}
```

---

### 👤 User Profile

#### GET `/api/users/me` ⚙️
Get current user profile. Requires authentication.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user-1",
    "email": "raju@example.com",
    "name": "Raju SRK",
    "bio": "Tech enthusiast...",
    "avatar_url": "...",
    "role": "AUTHOR",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

#### PATCH `/api/users/me` ⚙️
Update user profile. Requires authentication.

**Request:**
```json
{
  "name": "Raju SRK",
  "bio": "Updated bio",
  "avatar_url": "..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### 📊 Analytics

#### GET `/api/analytics/posts` ⚙️
Get posts analytics. Requires AUTHOR role.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_posts": 25,
    "published_posts": 20,
    "total_views": 15650,
    "avg_views_per_post": 782,
    "top_posts": [
      {
        "title": "...",
        "views": 2500
      }
    ]
  }
}
```

---

### 🔧 Admin Endpoints

#### GET `/api/admin/users` ⚙️
List all users. Requires ADMIN role.

---

#### PATCH `/api/admin/comments/:id/approve` ⚙️
Approve comment. Requires ADMIN role.

---

#### DELETE `/api/admin/users/:id` ⚙️
Delete user. Requires ADMIN role.

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_EMAIL` | 409 | Email already exists |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Unauthenticated**: 100 requests per hour per IP
- **Authenticated**: 1000 requests per hour per user
- **Admin**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1234567890
```

---

## Pagination

List endpoints support pagination:

```
GET /api/posts?page=1&limit=10
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)

**Response includes:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 120,
    "pages": 12
  }
}
```

---

## Sorting

Some endpoints support sorting:

```
GET /api/posts?sort=-published_at,title
```

Use `-` prefix for descending order.

---

## API Client Example (React)

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all posts
const posts = await API.get('/posts');

// Get single post
const post = await API.get(`/posts/${slug}`);

// Create post
const newPost = await API.post('/posts', {
  title: '...',
  content: '...'
});

// Update post
await API.patch(`/posts/${id}`, { title: '...' });

// Delete post
await API.delete(`/posts/${id}`);
```

---

## Webhook Events (Future)

Later, we can add webhooks for:
- Post published
- Comment added
- User registered
- Newsletter subscribed

---

## API Testing

Test the API using Postman:

1. Import collection from `/docs/postman-collection.json`
2. Set environment variables
3. Run requests

Or use `curl`:

```bash
# Get posts
curl http://localhost:5000/api/posts

# Create post
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"...","content":"..."}'
```

---

## Client Libraries

- JavaScript/Node.js: Use `axios` or `fetch`
- React: Use `@tanstack/react-query`
- React Native: Use `@react-native-community/async-storage`

---

**Full API Swagger docs available at**: `http://localhost:5000/api/docs`
