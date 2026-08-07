import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import MovieCard from '../components/MovieCard'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query) {
      setMovies([])
      return
    }

    setLoading(true)
    api
      .get('/movies/search', { params: { query } })
      .then((res) => setMovies(res.data))
      .finally(() => setLoading(false))
  }, [query])

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm text-dust">Resultados para</p>
      <h1 className="font-display text-3xl tracking-wide text-marquee-gold">
        “{query}”
      </h1>

      {loading && <p className="mt-6 text-sm text-dust">Buscando...</p>}

      {!loading && query && movies.length === 0 && (
        <p className="mt-6 text-sm text-dust">
          Nenhum filme encontrado para essa busca.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  )
}
