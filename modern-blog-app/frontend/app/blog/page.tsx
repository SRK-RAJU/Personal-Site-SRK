import Link from 'next/link';
import { FaCalendar, FaUser, FaEye } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

export const metadata = {
  title: 'Blog',
  description: 'Read my latest blog posts on web development and tech.',
};

// Fetch posts from Supabase
async function getBlogPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Supabase error:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error fetching posts:', err)
    return []
  }
}

export default async function Blog() {
  const posts = await getBlogPosts();

  return (
    <div className="container-max py-12">
      {/*Heading */}
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Latest Blog Posts
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Insights, tutorials, and thoughts on web development and technology.
        </p>
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post: any) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="card hover:shadow-xl cursor-pointer"
            >
              {post.featured_image_url && (
                <div
                  className="w-full h-48 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg mb-4"
                  style={{
                    backgroundImage: `url(${post.featured_image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              <div className="flex gap-2 mb-3 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                {post.tags?.map((tag: string) => (
                  <span key={tag} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>

              <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                {post.title}
              </h2>

              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-4">
                  {post.author_name && (
                    <div className="flex items-center gap-1">
                      <FaUser className="text-xs" />
                      {post.author_name}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <FaCalendar className="text-xs" />
                    {new Date(post.published_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <FaEye className="text-xs" />
                  {post.views_count}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">
            No posts yet. Check back soon!
          </p>
          <p className="text-slate-500 dark:text-slate-500">
            In the meantime, browse the portfolio or check out my projects.
          </p>
        </div>
      )}
    </div>
  );
}
