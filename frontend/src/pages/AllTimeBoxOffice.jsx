import { useEffect, useState } from 'react'

export default function AllTimeBoxOffice() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAllTimeBoxOffice() {
      try {
        const apiKey = import.meta.env.VITE_TMDB_API_KEY || '92db8f15ae04ad999f2b051360a79fa6'

        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=pt-BR&sort_by=revenue.desc&page=1`

        const res = await fetch(url)

        if (!res.ok) {
          throw new Error(`Erro na requisição: ${res.status}`)
        }

        const data = await res.json()
        setMovies(data.results || [])
      } catch (err) {
        console.error('Erro ao buscar maiores bilheterias:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAllTimeBoxOffice()
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 text-center text-dust">
        Carregando ranking de maiores bilheterias da história...
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12 text-center text-velvet">
        Erro ao carregar dados do TMDB: {error}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="font-display text-3xl tracking-wider text-marquee-gold mb-2">
        🏆 Maiores Bilheterias de Todos os Tempos
      </h1>
      <p className="text-dust text-sm mb-8">
        Os filmes com maior arrecadação global na história do cinema.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {movies.map((movie, index) => (
          <div
            key={movie.id}
            className="group relative rounded-lg border border-cinema-surface-2 bg-cinema-surface p-3 transition-transform hover:-translate-y-1"
          >
            <span className="absolute top-2 left-2 z-10 rounded-md bg-marquee-gold px-2 py-1 text-xs font-bold text-cinema-black shadow">
              #{index + 1}
            </span>
            <div className="overflow-hidden rounded-md bg-cinema-black aspect-[2/3] mb-3">
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-dust">
                  Sem Pôster
                </div>
              )}
            </div>
            <h2 className="font-medium text-sm text-cream line-clamp-1">
              {movie.title}
            </h2>
            <p className="text-xs text-dust mt-1">
              {movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}