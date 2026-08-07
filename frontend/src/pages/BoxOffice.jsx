import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function BoxOffice() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/movies/bilheteria')
      .then((res) => setRanking(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <p className="font-display tracking-[0.3em] text-marquee-gold">
        RANKING
      </p>
      <h1 className="font-display text-4xl text-cream">
        Bilheteria dos filmes em cartaz
      </h1>
      <p className="mt-2 text-sm text-dust">
        Arrecadação doméstica (EUA), via OMDb. Nem todo filme em cartaz tem
        esse dado disponível.
      </p>

      {loading && <p className="mt-6 text-sm text-dust">Carregando...</p>}

      <ol className="mt-8 flex flex-col gap-2">
        {ranking.map((movie, index) => (
          <li key={movie.id}>
            <Link
              to={`/filme/${movie.id}`}
              className="flex items-center gap-4 rounded-xl bg-cinema-surface p-3 hover:bg-cinema-surface-2"
            >
              <span className="font-display w-8 flex-shrink-0 text-center text-2xl text-marquee-gold">
                {index + 1}
              </span>

              <img
                src={movie.poster}
                alt={movie.title}
                className="h-20 w-14 flex-shrink-0 rounded-md object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg text-cream">
                  {movie.title}
                </p>
                <p className="text-xs text-dust">
                  {movie.releaseDate?.slice(0, 4) ?? '—'}
                </p>
              </div>

              <span className="flex-shrink-0 font-display text-lg text-marquee-gold">
                {movie.available ? movie.boxOffice : 'Sem dados'}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
