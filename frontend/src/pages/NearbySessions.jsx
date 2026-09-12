import { useState, useEffect } from 'react'

const API_BASE_URL = 'http://localhost:3000'

export default function NearbySessions() {
  const [movies, setMovies] = useState([])
  const [source, setSource] = useState(null) // 'tmdb' | 'ingresso' | 'tmdb-fallback'
  const [loadingMovies, setLoadingMovies] = useState(false)
  const [location, setLocation] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [error, setError] = useState(null)

  // 1. Busca os filmes com cancelamento de requisições antigas (AbortController)
  useEffect(() => {
    const controller = new AbortController()
    
    async function fetchMoviesByLocation() {
      setLoadingMovies(true)
      setError(null)

      try {
        const query = location ? `?city=${encodeURIComponent(location.trim())}` : ''
        const res = await fetch(`${API_BASE_URL}/movies/now-playing${query}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error('Erro ao carregar filmes em cartaz.')

        const data = await res.json()

        // Tratamento flexível: aceita { movies: [...] } ou array direto [...]
        const movieList = Array.isArray(data) ? data : (data.movies || [])
        const currentSource = Array.isArray(data) ? (location ? 'tmdb-fallback' : 'tmdb') : (data.source || null)

        setMovies(movieList)
        setSource(currentSource)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Não foi possível carregar a lista de filmes para esta localização.')
          setMovies([])
          setSource(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingMovies(false)
        }
      }
    }

    fetchMoviesByLocation()

    return () => controller.abort()
  }, [location])

  // 2. Localização via Geolocalização do Navegador + Reverse Geocoding
  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador.')
      return
    }

    setLoadingLocation(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await res.json()
          
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.municipality ||
            data.address?.village ||
            ''

          if (detectedCity) {
            setLocation(detectedCity)
            setCityInput(detectedCity)
          } else {
            setError('Não foi possível identificar o nome da cidade.')
          }
        } catch (err) {
          setError('Erro ao converter geolocalização em cidade.')
        } finally {
          setLoadingLocation(false)
        }
      },
      (geoError) => {
        let errorMsg = 'Não foi possível obter sua localização automaticamente.'
        if (geoError.code === geoError.PERMISSION_DENIED) {
          errorMsg = 'Permissão de localização negada pelo usuário.'
        }
        setError(`${errorMsg} Digite sua cidade manualmente.`)
        setLoadingLocation(false)
      },
      { timeout: 10000 }
    )
  }

  // 3. Submissão do formulário manual
  function handleManualCitySubmit(e) {
    e.preventDefault()
    const trimmedCity = cityInput.trim()
    if (!trimmedCity) return
    setLocation(trimmedCity)
    setError(null)
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 text-cream">
      {/* Cabeçalho */}
      <header className="mb-8">
        <h1 className="font-display text-3xl text-marquee-gold mb-2">
          Sessões Próximas de Você
        </h1>
        <p className="text-dust">
          Encontre os horários e cinemas que estão exibindo os filmes em cartaz na sua região.
        </p>
      </header>

      {/* Caixa de Controle de Localização */}
      <section className="mb-10 rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6 shadow-lg" aria-label="Controle de Localização">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-cream">Sua Localização</h2>
            <p className="text-sm text-dust mt-1">
              {location ? (
                <span>
                  Exibindo filmes com sessões em:{' '}
                  <strong className="text-marquee-gold font-medium">{location}</strong>
                </span>
              ) : (
                'Detecte sua posição ou digite a cidade para filtrar os filmes disponíveis.'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={loadingLocation}
            className="flex items-center justify-center gap-2 rounded-full bg-marquee-gold px-5 py-2.5 font-medium text-cinema-black hover:bg-marquee-gold-dim transition-colors disabled:opacity-50"
            aria-label="Detectar localização via GPS"
          >
            {loadingLocation ? (
              <span>Detectando...</span>
            ) : (
              <span>📍 Detectar via GPS</span>
            )}
          </button>
        </div>

        {/* Form de alteração manual da cidade */}
        <form onSubmit={handleManualCitySubmit} className="mt-4 flex gap-3 max-w-md">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Ou digite sua cidade (ex: Sorocaba)..."
            className="flex-1 rounded-full border border-cinema-surface-2 bg-cinema-black px-4 py-1.5 text-sm text-cream placeholder-dust outline-none focus:border-marquee-gold"
            aria-label="Digite sua cidade"
          />
          <button
            type="submit"
            className="rounded-full border border-marquee-gold px-4 py-1.5 text-sm text-marquee-gold hover:bg-marquee-gold hover:text-cinema-black transition-colors"
          >
            Filtrar
          </button>
        </form>

        {/* Feedbacks de Erro e Origem dos Dados */}
        {error && <p className="text-sm text-velvet mt-3" role="alert">{error}</p>}

        {!error && location && source === 'tmdb-fallback' && (
          <p className="text-sm text-dust mt-3">
            Ainda não temos a grade confirmada para <strong>{location}</strong> — exibindo o cartaz geral em exibição.
          </p>
        )}
        {!error && location && source === 'ingresso' && (
          <p className="text-sm text-dust mt-3">
            Sessões confirmadas para {location}.
          </p>
        )}
      </section>

      {/* Lista de Filmes */}
      <section aria-label="Lista de Filmes em Exibição">
        <h2 className="text-xl font-semibold mb-6 text-cream">
          {location ? `Filmes em Exibição em ${location}` : 'Todos os Filmes em Cartaz'}
        </h2>

        {loadingMovies ? (
          <p className="text-dust">Buscando filmes disponíveis na região...</p>
        ) : movies.length === 0 ? (
          <p className="text-dust">Nenhum filme encontrado no momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {movies.map((movie) => {
              const currentCity = location || 'minha cidade'

              const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                `filme ${movie.title} cinema ${currentCity} horarios`
              )}`

              const ingressoUrl = `https://www.ingresso.com/busca/resultado?q=${encodeURIComponent(movie.title)}`

              return (
                <article
                  key={movie.id}
                  className="flex gap-4 rounded-xl bg-cinema-surface p-4 border border-cinema-surface-2 hover:border-cinema-surface-2/80 transition-colors"
                >
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={`Cartaz do filme ${movie.title}`}
                      className="w-28 h-40 object-cover rounded-lg flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-28 h-40 bg-cinema-surface-2 rounded-lg flex items-center justify-center text-dust text-xs text-center p-2 flex-shrink-0">
                      Sem Cartaz
                    </div>
                  )}

                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-lg font-bold text-cream line-clamp-1">
                        {movie.title}
                      </h3>
                      <p className="text-xs text-dust mt-1 line-clamp-2">
                        {movie.overview || 'Sem sinopse disponível.'}
                      </p>
                      <span className="inline-block mt-2 text-xs font-medium text-marquee-gold">
                        ★ {movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <a
                        href={googleSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-cinema-black border border-cinema-surface-2 px-3 py-1.5 text-xs text-cream hover:border-marquee-gold transition-colors"
                      >
                        🔍 Horários no Google
                      </a>
                      <a
                        href={ingressoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-marquee-gold/10 border border-marquee-gold/30 px-3 py-1.5 text-xs text-marquee-gold hover:bg-marquee-gold hover:text-cinema-black transition-colors"
                      >
                        🎟️ Ingresso.com
                      </a>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
} 