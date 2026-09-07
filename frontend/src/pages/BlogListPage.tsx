import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Newspaper } from 'lucide-react'
import { cmsApi } from '@/api/cms'

export function BlogListPage() {
  const { data: posts, isLoading } = useQuery({ queryKey: ['blog'], queryFn: cmsApi.blogList })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-xl font-semibold text-ink-500 mb-4">From our blog</h1>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="flex flex-col gap-3">
        {(posts ?? []).map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 overflow-hidden flex gap-3"
          >
            {post.cover_image && (
              <img src={post.cover_image} alt={post.title} className="h-24 w-24 object-cover shrink-0" />
            )}
            <div className="p-3">
              <p className="font-semibold text-ink-500 text-sm">{post.title}</p>
              {post.excerpt && <p className="text-xs text-ink-300 mt-1 line-clamp-2">{post.excerpt}</p>}
            </div>
          </Link>
        ))}
        {posts && posts.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="h-10 w-10 text-ink-200 mx-auto" />
            <p className="text-ink-300 mt-2 text-sm">No posts yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
