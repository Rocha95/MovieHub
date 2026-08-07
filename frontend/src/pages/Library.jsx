import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const STATUS_LABEL = {
  WATCHLIST: 'Quero assistir',
  WATCHED: 'Assistido',
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? null : star)}
          className={`text-lg ${
            value && star <= value ? 'text-marquee-gold' : 'text-cinema-surface-2'
          }`}
          aria-label={`Avaliar com ${star} estrelas`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function Library() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLibrary()
  }, [])

  function loadLibrary() {
    setLoading(true)
    api
      .get('/library')
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false))
  }

  function updateLocalItem(movieId, changes) {
    setItems((prev) =>
      prev.map((item) =>
        item.movieId === movieId ? { ...item, ...changes } : item
      )
    )
  }

  async function toggleFavorite(item) {
    const favorite = !item.favorite
    updateLocalItem(item.movieId, { favorite })
    await api.patch(`/library/${item.movieId}`, { favorite })
  }

  async function setRating(item, rating) {
    updateLocalItem(item.movieId, { rating })
    await api.patch(`/library/${item.movieId}`, { rating })
  }

  async function removeItem(item) {
    setItems((prev) => prev.filter((i) => i.movieId !== item.movieId))
    await api.delete(`/library/${item.movieId}`)
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl tracking-wide text-marquee-gold">
        Minha biblioteca
      </h1>

      {loading && <p className="mt-6 text-sm text-dust">Carregando...</p>}

      {!loading && items.length === 0 && (
        <p className="mt-6 text-sm text-dust">
          Sua biblioteca está vazia. Busque um filme e adicione à sua lista.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.movieId}
            className="flex items-center gap-4 rounded-xl bg-cinema-surface p-3"
          >
            <Link to={`/filme/${item.movieId}`} className="flex-shrink-0">
              <img
                src={item.poster}
                alt={item.title}
                className="h-24 w-16 rounded-md object-cover"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                to={`/filme/${item.movieId}`}
                className="truncate font-display text-lg text-cream hover:text-marquee-gold"
              >
                {item.title}
              </Link>
              <p className="text-xs text-dust">
                {STATUS_LABEL[item.status]} ·{' '}
                {item.releaseDate?.slice(0, 4) ?? '—'}
              </p>

              <div className="mt-2 flex items-center gap-4">
                <StarRating
                  value={item.rating}
                  onChange={(rating) => setRating(item, rating)}
                />

                <button
                  type="button"
                  onClick={() => toggleFavorite(item)}
                  className={`text-sm ${
                    item.favorite ? 'text-velvet' : 'text-dust hover:text-velvet'
                  }`}
                >
                  {item.favorite ? '♥ Favorito' : '♡ Favoritar'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item)}
              className="flex-shrink-0 rounded-full border border-cinema-surface-2 px-3 py-1.5 text-xs text-dust hover:border-velvet hover:text-velvet"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
