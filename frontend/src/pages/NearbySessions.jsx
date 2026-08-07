import { useState, useEffect } from 'react'

export default function NearbySessions() {
  const [movies, setMovies] = useState([])
  const [loadingMovies, setLoadingMovies] = useState(true)
  const [location, setLocation] = useState(null)
  const [cityInput, setCityInput] = useState('')
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [error, setError] = useState(null)

  // 1. Carrega os filmes em cartaz ao montar a página
  useEffect(() => {
    async function fetchNowPlaying() {
      try {
        const res = await fetch('http://localhost:3000/movies/now-playing')
        if (!res.ok) throw new Error('Erro ao carregar filmes em cartaz')
        const data = await res.json()
        setMovies(data || [])
      } catch (err) {
        setError('Não foi possível carregar a lista de filmes em cartaz.')
      } finally {
        setLoadingMovies(false)
      }
    }

    fetchNowPlaying()
  }, [])

  // 2. Obtém a localização do usuário via navegador + Reverse Geocoding
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
          // Busca o nome da cidade gratuitamente via OpenStreetMap (Nominatim)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await res.json()
          const detectedCity =
            data.address.city ||
            data.address.town ||
            data.address.municipality ||
            data.address.village ||
            ''

          if (detectedCity) {
            setLocation(detectedCity)
            setCityInput(detectedCity)
          } else {
            setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
          }
        } catch (err) {
          setLocation('Sua região')
        } finally {
          setLoadingLocation(false)
        }
      },
      () => {
        setError('Não foi possível obter sua localização automaticamente. Digite sua cidade abaixo.')
        setLoadingLocation(false)
      }
    )
  }

  // 3. Permite definir a cidade manualmente no formulário
  function handleManualCitySubmit(e) {
    e.preventDefault()
    if (!cityInput.trim()) return
    setLocation(cityInput.trim())
    setError(null)
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 text-cream">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-marquee-gold mb-2">
          Sessões Próximas de Você
        </h1>
        <p className="text-dust">
          Encontre os horários e cinemas que estão exibindo os filmes em cartaz na sua região.
        </p>
      </div>

      {/* Caixa de Controle de Localização */}
      <div className="mb-10 rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-cream">Sua Localização</h2>
            <p className="text-sm text-dust mt-1">
              {location ? (
                <span>
                  Exibindo opções para:{' '}
                  <strong className="text-marquee-gold font-medium">{location}</strong>
                </span>
              ) : (
                'Detecte sua posição para buscar cinemas e horários locais.'
              )}
            </p>
          </div>

          <button
            onClick={handleDetectLocation}
            disabled={loadingLocation}
            className="flex items-center justify-center gap-2 rounded-full bg-marquee-gold px-5 py-2.5 font-medium text-cinema-black hover:bg-marquee-gold-dim transition-colors disabled:opacity-50"
          >
            {loadingLocation ? (
              <span>Detectando...</span>
            ) : (
              <>
                <span>📍 Detectar via GPS</span>
              </>
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
          />
          <button
            type="submit"
            className="rounded-full border border-marquee-gold px-4 py-1.5 text-sm text-marquee-gold hover:bg-marquee-gold hover:text-cinema-black transition-colors"
          >
            Definir
          </button>
        </form>

        {error && <p className="text-sm text-velvet mt-3">{error}</p>}
      </div>

      {/* Lista de Filmes em Cartaz e Botões de Sessões */}
      <div>
        <h2 className="text-xl font-semibold mb-6 text-cream">
          Filmes Atualmente em Exibição
        </h2>

        {loadingMovies ? (
          <p className="text-dust">Carregando filmes em cartaz...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {movies.map((movie) => {
              const currentCity = location || 'minha cidade'
              
              // Busca generalizada de horários no Google
              const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
                `filme ${movie.title} cinema ${currentCity} horarios`
              )}`
              
              // Rota oficial de resultados do Ingresso.com (corrige o erro 404)
              const ingressoUrl = `https://www.ingresso.com/busca/resultado?q=${encodeURIComponent(movie.title)}`

              return (
                <div
                  key={movie.id}
                  className="flex gap-4 rounded-xl bg-cinema-surface p-4 border border-cinema-surface-2 hover:border-cinema-surface-2/80 transition-colors"
                >
                  {/* Cartaz do filme */}
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-28 h-40 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-28 h-40 bg-cinema-surface-2 rounded-lg flex items-center justify-center text-dust text-xs text-center p-2 flex-shrink-0">
                      Sem Cartaz
                    </div>
                  )}

                  {/* Informações e Ações */}
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

                    {/* Botões para Checar Horários */}
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}