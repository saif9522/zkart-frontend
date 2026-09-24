import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { apiErrorMessage } from '@/api/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import type { AdminBlogPost } from '@/types'

const emptyForm = { title: '', excerpt: '', content: '' }

export function BlogPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminBlogPost | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['admin-blog'], queryFn: adminApi.blogPosts })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-blog'] })

  const create = useMutation({
    mutationFn: () => adminApi.createBlogPost({ ...form, ...(imageFile ? { imageFile } : {}) }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not create the post.')),
  })

  const update = useMutation({
    mutationFn: () => adminApi.updateBlogPost(editing!.id, { ...form, ...(imageFile ? { imageFile } : {}) }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'Could not save the post.')),
  })

  const togglePublished = useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      adminApi.updateBlogPost(id, { is_published }),
    onSuccess: invalidate,
  })

  const remove = useMutation({ mutationFn: adminApi.deleteBlogPost, onSuccess: invalidate })

  const closeModal = () => {
    setOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setImageFile(null)
    setFormError('')
  }

  const startCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setImageFile(null)
    setFormError('')
    setOpen(true)
  }

  const startEdit = (post: AdminBlogPost) => {
    setEditing(post)
    setForm({ title: post.title, excerpt: post.excerpt, content: post.content })
    setImageFile(null)
    setFormError('')
    setOpen(true)
  }

  const posts = data?.results ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-500">Blog</h1>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4" /> New post
        </Button>
      </div>

      {isLoading && <p className="text-ink-300 animate-pulse">Loading...</p>}

      <div className="rounded-[var(--radius-card)] bg-rice-50 border border-ink-100/60 divide-y divide-ink-100/60">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center gap-3 p-3.5">
            {post.cover_image && <img src={post.cover_image} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink-500 text-sm truncate">{post.title}</p>
              <p className="text-xs text-ink-300 truncate">{post.excerpt}</p>
            </div>
            <button onClick={() => togglePublished.mutate({ id: post.id, is_published: !post.is_published })}>
              <Badge status={post.is_published ? 'active' : 'inactive'} label={post.is_published ? 'Published' : 'Draft'} />
            </button>
            <button onClick={() => startEdit(post)} className="text-ink-300 hover:text-forest-600">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => remove.mutate(post.id)} className="text-ink-300 hover:text-chili-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {data && posts.length === 0 && <p className="text-ink-300 text-center py-8">No posts yet.</p>}
      </div>

      <Modal open={open} onClose={closeModal} title={editing ? 'Edit post' : 'New post'}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            editing ? update.mutate() : create.mutate()
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Cover image (optional)</span>
            <label className="flex items-center gap-2 rounded-lg border border-dashed border-ink-100 px-3 py-2 text-sm text-ink-400 cursor-pointer hover:border-forest-400">
              <ImagePlus className="h-4 w-4" />
              {imageFile ? imageFile.name : 'Choose image'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
            </label>
          </label>
          <Field label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
          <Field label="Excerpt (optional)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Content</span>
            <textarea
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              className="rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-forest-400 resize-none"
            />
          </label>
          {formError && <p className="text-xs text-chili-600">{formError}</p>}
          <Button type="submit" loading={create.isPending || update.isPending} className="mt-2">
            {editing ? 'Save changes' : 'Create post (as draft)'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
