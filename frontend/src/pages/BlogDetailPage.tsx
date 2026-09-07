import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cmsApi } from '@/api/cms'

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => cmsApi.blogDetail(slug!),
    enabled: !!slug,
  })

  if (isLoading) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-ink-300 animate-pulse">Loading...</div>
  }

  if (isError || !post) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-ink-300">Post not found.</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {post.cover_image && (
        <img src={post.cover_image} alt={post.title} className="w-full h-48 object-cover rounded-[var(--radius-card)] mb-4" />
      )}
      <h1 className="font-display text-2xl font-semibold text-ink-500">{post.title}</h1>
      {post.published_at && (
        <p className="text-xs text-ink-300 mt-1">{new Date(post.published_at).toLocaleDateString()}</p>
      )}
      <div className="prose prose-sm text-ink-400 whitespace-pre-wrap mt-4">{post.content}</div>
    </div>
  )
}
