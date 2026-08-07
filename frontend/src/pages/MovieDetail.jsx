import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import MovieCard from '../components/MovieCard'

export default function MovieDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const [movie, setMovie] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [boxOffice, setBoxOffice] = useState(null)
  const [libraryEntry, setLibraryEntry] = useState(null)
  const [savingStatus, setSavingStatus] = useState(null)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    setMovie(null)
    setFeedback(null)

    api.get(`/movies/${id}`).then((res) => setMovie(res.data))
    api
      .get(`/movies/${id}/recommendations`)
      .then((res) => setRecommendations(res.data))
    api
      .get(`/movies/${id}/boxoffice`)
      .then((res) => setBoxOffice(res.data))
      .catch(() => setBoxOffice({ available: false }))

    if (user) {
      api.get('/library').then((res) => {
        const entry = res.data.find((item) => item.movieId === Number(id))
        setLibraryEntry(entry || null)
      })
    }
  }, [id, user])

  async function handleAddToLibrary(status) {
    setSavingStatus(status)
    setFeedback(null)

    try {
      await api.post('/library', { movieId: Number(id), status })
      setLibraryEntry((prev) => ({ ...prev, status }))
      setFeedback(
        status === 'WATCHED'
          ? 'Marcado como assistido.'
          : 'Adicionado à sua lista para assistir.'
      )
    } catch (err) {
      setFeedback(
        err.response?.data?.message || 'Não foi possível salvar. Tente novamente.'
      )
    } finally {
      setSavingStatus(null)
    }
  }

  if (!movie) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-dust">Carregando...</p>
  }

  return (
    <div>
      <section
        className="relative bg-cover bg-center py-20"
        style={{
          backgroundImage: `linear-gradient(to top, var(--color-cinema-black), rgba(18,14,26,0.55)), url(${
            movie.backdrop || movie.poster
          })`,
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 sm:flex-row">
          {movie.poster && (
            <img
              src={movie.poster}
              alt={`Pôster de ${movie.title}`}
              className="w-40 flex-shrink-0 self-start rounded-lg shadow-xl sm:w-56"
            />
          )}

          <div>
            {movie.tagline && (
              <p className="font-display tracking-[0.3em] text-marquee-gold">
                {movie.tagline.toUpperCase()}
              </p>
            )}
            <h1 className="mt-2 font-display text-4xl text-cream sm:text-5xl">
              {movie.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-dust">
              <span>★ {movie.voteAverage?.toFixed(1) ?? '—'}</span>
              <span>{movie.releaseDate?.slice(0, 4) ?? '—'}</span>
              {movie.runtime && <span>{movie.runtime} min</span>}
              {movie.director && <span>Direção: {movie.director}</span>}
            </div>

            {movie.genres?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full border border-cinema-surface-2 px-3 py-1 text-xs text-dust"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {boxOffice?.available && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-marquee-gold/40 bg-cinema-surface px-4 py-2">
                <span className="font-display text-xs tracking-[0.2em] text-dust">
                  BILHETERIA (EUA)
                </span>
                <span className="font-display text-xl text-marquee-gold">
                  {boxOffice.boxOffice}
                </span>
              </div>
            )}

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/90">
              {movie.overview}
            </p>

            {movie.trailer && (
              <a
                href={movie.trailer}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm text-marquee-gold hover:underline"
              >
                Assistir trailer ↗
              </a>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <button
                    type="button"
                    disabled={savingStatus === 'WATCHLIST'}
                    onClick={() => handleAddToLibrary('WATCHLIST')}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      libraryEntry?.status === 'WATCHLIST'
                        ? 'bg-marquee-gold text-cinema-black'
                        : 'border border-marquee-gold text-marquee-gold hover:bg-marquee-gold hover:text-cinema-black'
                    }`}
                  >
                    Quero assistir
                  </button>

                  <button
                    type="button"
                    disabled={savingStatus === 'WATCHED'}
                    onClick={() => handleAddToLibrary('WATCHED')}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      libraryEntry?.status === 'WATCHED'
                        ? 'bg-velvet text-cream'
                        : 'border border-velvet text-velvet hover:bg-velvet hover:text-cream'
                    }`}
                  >
                    Já assisti
                  </button>
                </>
              ) : (
                <Link
                  to="/entrar"
                  className="rounded-full border border-marquee-gold px-4 py-2 text-sm text-marquee-gold hover:bg-marquee-gold hover:text-cinema-black"
                >
                  Entre para salvar na sua biblioteca
                </Link>
              )}
            </div>

            {feedback && <p className="mt-3 text-sm text-dust">{feedback}</p>}
          </div>
        </div>
      </section>

      {movie.cast?.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="font-display text-2xl text-cream">Elenco</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            {movie.cast.map((actor) => (
              <div key={actor.id} className="w-24 text-center">
                <img
                  src={
                    actor.profile ||
                    'data:image/svg+xml;utf8,' +
                      encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%231c1626"/></svg>'
                      )
                  }
                  alt={actor.name}
                  className="mx-auto h-24 w-24 rounded-full object-cover"
                />
                <p className="mt-2 text-xs text-cream">{actor.name}</p>
                <p className="text-xs text-dust">{actor.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="font-display text-2xl text-cream">
            Filmes semelhantes
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {recommendations.map((rec) => (
              <MovieCard key={rec.id} movie={rec} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
