import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'

// Formata valores numéricos para moeda em USD (ex: $2,923,706,026)
const formatCurrency = (value) => {
  if (!value) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

export default function AllTimeBoxOffice() {
  const [movies, setMovies] = useState([])
  const [selectedYear, setSelectedYear] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Lista dinâmica de anos (1980 até o ano atual)
  const currentYear = new Date().getFullYear()
  const years = Array.from(
    { length: currentYear - 1980 + 1 },
    (_, index) => currentYear - index
  )

  const fetchBoxOffice = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/movies/all-time-boxoffice', {
        params: selectedYear ? { year: selectedYear } : {},
      })
      setMovies(response.data || [])
    } catch (err) {
      console.error('Erro ao carregar bilheterias:', err)
      setError(err.response?.data?.message || 'Não foi possível carregar os dados de bilheteria.')
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    fetchBoxOffice()
  }, [fetchBoxOffice])

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Cabeçalho e Seleção de Ano */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wider text-marquee-gold">
            🏆 Maiores Bilheterias {selectedYear ? `de ${selectedYear}` : 'de Todos os Tempos'}
          </h1>
          <p className="mt-1 text-sm text-dust">
            Os filmes com maior arrecadação global {selectedYear ? `lançados no ano de ${selectedYear}` : 'na história do cinema'}.
          </p>
        </div>

        <div className="min-w-[180px]">
          <label htmlFor="year-select" className="mb-1 block text-xs font-medium text-dust">
            Filtrar por ano:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full rounded-lg border border-cinema-surface-2 bg-cinema-surface px-3 py-2 text-sm text-cream transition-colors focus:border-marquee-gold focus:outline-none"
          >
            <option value="">Todos os Tempos</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Estados da Interface */}
      {loading ? (
        <div className="py-20 text-center text-dust">
          Carregando ranking de maiores bilheterias...
        </div>
      ) : error ? (
        <div className="py-20 text-center text-velvet">
          Erro ao carregar dados do TMDB: {error}
        </div>
      ) : movies.length === 0 ? (
        <div className="py-20 text-center text-dust">
          Nenhum filme com dados de bilheteria foi encontrado para este ano.
        </div>
      ) : (
        /* Grid de Cards */
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {movies.map((movie, index) => {
            const releaseYear = movie.releaseDate ? movie.releaseDate.split('-')[0] : 'N/A'
            const formattedRevenue = formatCurrency(movie.revenue)

            return (
              <article
                key={movie.id}
                className="group relative flex flex-col justify-between rounded-lg border border-cinema-surface-2 bg-cinema-surface p-3 transition-transform hover:-translate-y-1"
              >
                {/* Badge de Posição */}
                <span className="absolute left-2 top-2 z-10 rounded-md bg-marquee-gold px-2 py-1 text-xs font-bold text-cinema-black shadow-md">
                  #{index + 1}
                </span>

                <div>
                  {/* Poster */}
                  <div className="mb-3 aspect-[2/3] overflow-hidden rounded-md bg-cinema-black">
                    {movie.poster_path ? (
                      <img
                        src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                        alt={movie.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-dust">
                        Sem Pôster
                      </div>
                    )}
                  </div>

                  {/* Informações do Filme */}
                  <h2 className="line-clamp-1 font-medium text-sm text-cream" title={movie.title}>
                    {movie.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-dust">{releaseYear}</p>
                </div>

                {/* Exibição da Receita */}
                {formattedRevenue && (
                  <div className="mt-3 border-t border-cinema-surface-2 pt-2">
                    <p className="text-[10px] uppercase tracking-wider text-dust">Bilheteria</p>
                    <p className="text-xs font-semibold text-marquee-gold truncate">
                      {formattedRevenue}
                    </p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}