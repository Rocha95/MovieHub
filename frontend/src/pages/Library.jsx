import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'

const STATUS_LABEL = {
  WATCHLIST: 'Quero assistir',
  WATCHED: 'Assistido',
}

function TenPointRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score === value ? null : score)}
            className={`h-6 w-6 rounded text-xs font-semibold transition-colors ${
              value && score <= value
                ? 'bg-marquee-gold text-cinema-surface'
                : 'bg-cinema-surface-2 text-dust hover:text-cream'
            }`}
            aria-label={`Avaliar com nota ${score}`}
          >
            {score}
          </button>
        ))}
      </div>
      <span className="min-w-[3rem] text-xs font-medium text-cream">
        {value ? `${value}/10` : 'Sem nota'}
      </span>
    </div>
  )
}

export default function Library() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const navigate = useNavigate()

  useEffect(() => {
    loadLibrary()
  }, [])

  function loadLibrary() {
    setLoading(true)
    setError(null)

    api
      .get('/library')
      .then((res) => setItems(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          navigate('/login')
          return
        }
        setError('Não foi possível carregar sua biblioteca. Tente novamente.')
      })
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
    const previousFavorite = item.favorite
    const favorite = !previousFavorite
    
    updateLocalItem(item.movieId, { favorite })

    try {
      await api.patch(`/library/${item.movieId}`, { favorite })
    } catch (err) {
      updateLocalItem(item.movieId, { favorite: previousFavorite })
      if (err.response?.status === 401) navigate('/login')
    }
  }

  async function setRating(item, rating) {
    const previousRating = item.rating
    
    updateLocalItem(item.movieId, { rating })

    try {
      await api.patch(`/library/${item.movieId}`, { rating })
    } catch (err) {
      updateLocalItem(item.movieId, { rating: previousRating })
      if (err.response?.status === 401) navigate('/login')
    }
  }

  async function removeItem(item) {
    const previousItems = [...items]
    
    setItems((prev) => prev.filter((i) => i.movieId !== item.movieId))

    try {
      await api.delete(`/library/${item.movieId}`)
    } catch (err) {
      setItems(previousItems)
      if (err.response?.status === 401) navigate('/login')
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl tracking-wide text-marquee-gold">
        Minha biblioteca
      </h1>

      {loading && <p className="mt-6 text-sm text-dust">Carregando...</p>}

      {error && !loading && (
        <p className="mt-6 text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
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

              <div className="mt-2 flex flex-wrap items-center gap-4">
                <TenPointRating
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