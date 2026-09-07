import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cmsApi } from '@/api/cms'

export function StaticPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => cmsApi.page(slug!),
    enabled: !!slug,
  })

  if (isLoading) {
    return <div className="mx-auto max-w-2xl px-4 py-10 text-ink-300 animate-pulse">Loading...</div>
  }

  if (isError || !page) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-ink-300">
        This page isn't available right now.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-2xl font-semibold text-ink-500 mb-4">{page.title}</h1>
      <div className="prose prose-sm text-ink-400 whitespace-pre-wrap">{page.content}</div>
    </div>
  )
}
