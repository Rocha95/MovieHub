import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function MovieComments({ movieId, isWatched }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const currentUserId = useMemo(() => Number(user?.id), [user])

  async function loadComments() {
    try {
      const response = await api.get(`/comments/${movieId}`)
      setComments(Array.isArray(response.data) ? response.data : [])
    } catch {
      setError('Não foi possível carregar os comentários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [movieId])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!content.trim()) return

    setSaving(true)
    setError(null)

    try {
      const response = await api.put(`/comments/${movieId}`, { content })
      setComments((current) => [
        response.data,
        ...current.filter((comment) => Number(comment.user?.id) !== currentUserId),
      ])
      setContent('')
    } catch (err) {
      setError(err.response?.data?.message || 'Não foi possível salvar o comentário.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/comments/${movieId}`)
      setComments((current) =>
        current.filter((comment) => Number(comment.user?.id) !== currentUserId)
      )
    } catch {
      setError('Não foi possível excluir o comentário.')
    }
  }

  const ownComment = comments.find((comment) => Number(comment.user?.id) === currentUserId)

  useEffect(() => {
    setContent(ownComment?.content || '')
  }, [ownComment?.id, ownComment?.content])

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="rounded-2xl border border-cinema-surface-2 bg-cinema-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-cream">Comentários</h2>
            <p className="mt-1 text-xs text-dust">
              Registre sua experiência depois de assistir ao filme.
            </p>
          </div>
          <span className="rounded-full bg-cinema-surface-2 px-3 py-1 text-xs text-dust">
            {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
          </span>
        </div>

        {user && isWatched && (
          <form onSubmit={handleSubmit} className="mt-5">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder={ownComment ? 'Edite seu comentário...' : 'O que você achou deste filme?'}
              className="w-full resize-y rounded-xl border border-cinema-surface-2 bg-cinema-black px-4 py-3 text-sm text-cream outline-none placeholder:text-dust focus:border-marquee-gold"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-dust">{content.length}/2000 caracteres</span>
              <div className="flex gap-2">
                {ownComment && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-full border border-red-500/30 px-4 py-2 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Excluir
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving || !content.trim()}
                  className="rounded-full bg-marquee-gold px-5 py-2 text-xs font-semibold text-cinema-black disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : ownComment ? 'Atualizar comentário' : 'Publicar comentário'}
                </button>
              </div>
            </div>
          </form>
        )}

        {!user && (
          <p className="mt-5 text-sm text-dust">Entre na sua conta para participar dos comentários.</p>
        )}

        {user && !isWatched && (
          <p className="mt-5 rounded-xl bg-cinema-black/50 p-4 text-sm text-dust">
            Marque o filme como assistido para registrar um comentário.
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-sm text-dust">Carregando comentários...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-dust">Ainda não há comentários para este filme.</p>
          ) : (
            comments.map((comment) => (
              <article key={comment.id} className="rounded-xl border border-cinema-surface-2/70 bg-cinema-black/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-cream">{comment.user?.name || 'Usuário'}</strong>
                  <time className="text-[11px] text-dust">
                    {new Date(comment.updatedAt || comment.createdAt).toLocaleDateString('pt-BR')}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-dust">{comment.content}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
