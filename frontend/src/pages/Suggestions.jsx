import { useState } from 'react'

export default function Suggestions() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 1. Pesquisa o filme digitado para pegar o ID
  async function handleSearchMovie(e) {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    setError(null)
    setRecommendations([])

    try {
      const res = await fetch(
        `http://localhost:3000/movies/search?query=${encodeURIComponent(searchTerm)}`
      )
      
      if (!res.ok) throw new Error('Falha ao buscar filme')

      const data = await res.json()
      // O seu backend devolve o array mapeado diretamente
      const firstMovie = data?.[0]

      if (!firstMovie) {
        setError('Nenhum filme encontrado com esse nome.')
        setLoading(false)
        return
      }

      setSelectedMovie(firstMovie)

      // 2. Chama a rota de recomendações passando o ID
      await fetchRecommendations(firstMovie.id)
    } catch (err) {
      setError('Erro ao carregar dados. Tente novamente.')
      setLoading(false)
    }
  }

  // 3. Busca os filmes recomendados usando a rota do backend
  async function fetchRecommendations(movieId) {
    try {
      const res = await fetch(`http://localhost:3000/movies/${movieId}/recommendations`)
      if (!res.ok) throw new Error('Falha ao buscar recomendações')

      const data = await res.json()
      setRecommendations(data || [])
    } catch (err) {
      setError('Erro ao carregar as recomendações de filmes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 text-cream">
      <h1 className="font-display text-3xl text-marquee-gold mb-2">
        Sugestões de Filmes
      </h1>
      <p className="text-dust mb-6">
        Digite o nome de um filme que você gosta para encontrar títulos semelhantes.
      </p>

      {/* Form de busca */}
      <form onSubmit={handleSearchMovie} className="flex gap-4 max-w-lg mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Ex: Fight Club, Interstellar..."
          className="flex-1 rounded-full border border-cinema-surface-2 bg-cinema-surface px-4 py-2 text-sm text-cream placeholder-dust outline-none focus:border-marquee-gold"
        />
        <button
          type="submit"
          className="rounded-full bg-marquee-gold px-6 py-2 font-medium text-cinema-black hover:bg-marquee-gold-dim transition-colors"
        >
          Buscar
        </button>
      </form>

      {loading && <p className="text-dust">Carregando sugestões...</p>}
      {error && <p className="text-velvet mb-4">{error}</p>}

      {/* Nome do filme pesquisado */}
      {selectedMovie && !loading && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            Recomendações baseadas em:{' '}
            <span className="text-marquee-gold">{selectedMovie.title}</span>
          </h2>
        </div>
      )}

      {/* Grid de Filmes Recomendados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {recommendations.map((movie) => (
          <div
            key={movie.id}
            className="rounded-lg bg-cinema-surface p-3 flex flex-col justify-between hover:scale-[1.02] transition-transform"
          >
            <div>
              {/* Utiliza diretamente o movie.poster do seu MovieMapper */}
              {movie.poster ? (
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-64 object-cover rounded mb-3"
                />
              ) : (
                <div className="w-full h-64 bg-cinema-surface-2 rounded mb-3 flex items-center justify-center text-dust text-xs text-center p-2">
                  Sem Cartaz
                </div>
              )}
              <h3 className="font-medium text-sm line-clamp-1">{movie.title}</h3>
            </div>

            <div className="flex items-center justify-between text-xs text-dust mt-3">
              <span>★ {movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A'}</span>
              {movie.releaseDate && (
                <span>{movie.releaseDate.split('-')[0]}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}