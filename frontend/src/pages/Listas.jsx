import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Listas() {
  const [listas, setListas] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingListas, setFetchingListas] = useState(true)
  const [error, setError] = useState('')

  // 1. Carregar listas cadastradas no backend ao montar a tela
  useEffect(() => {
    async function fetchListas() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3000/lists', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setListas(Array.isArray(data) ? data : data.listas || [])
        }
      } catch (err) {
        console.error('Erro ao buscar listas:', err)
      } finally {
        setFetchingListas(false)
      }
    }

    fetchListas()
  }, [])

  // 2. Salvar nova lista no backend via API
  const handleCriarLista = async (e) => {
    e.preventDefault()
    if (!titulo.trim()) return

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao salvar a lista no banco.')
      }

      setListas((prev) => [data, ...prev])
      setTitulo('')
      setDescricao('')
      setIsModalOpen(false)
    } catch (err) {
      setError(err.message || 'Erro ao conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setError('')
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-cinema-black px-6 py-8 text-cream">
      <div className="mx-auto max-w-6xl">
        
        {/* Cabeçalho */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cinema-surface-2 pb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-marquee-gold tracking-wide">
              Minhas Listas
            </h1>
            <p className="text-sm text-dust mt-1">
              Crie e organize coleções personalizadas de filmes.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 rounded-full bg-marquee-gold px-5 py-2.5 text-sm font-semibold text-cinema-black hover:bg-yellow-400 transition-colors shadow-lg cursor-pointer"
          >
            <span className="text-lg leading-none">+</span>
            <span>Criar Nova Lista</span>
          </button>
        </div>

        {/* Estado de carregamento da página */}
        {fetchingListas ? (
          <div className="flex justify-center items-center py-20 text-dust">
            <span className="animate-pulse text-sm font-medium">Carregando listas...</span>
          </div>
        ) : listas.length === 0 ? (
          /* Estado Vazio */
          <div className="rounded-xl border border-cinema-surface-2 bg-cinema-surface p-12 text-center">
            <p className="text-dust text-lg">Você ainda não possui nenhuma lista criada.</p>
            <button
              onClick={handleOpenModal}
              className="mt-4 text-sm text-marquee-gold underline hover:text-yellow-400 transition-colors"
            >
              Criar sua primeira lista agora
            </button>
          </div>
        ) : (
          /* Grid de Listas */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listas.map((lista) => {
              const listId = lista.id || lista._id
              return (
                <Link
                  key={listId}
                  to={`/listas/${listId}`}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-cinema-surface-2 bg-cinema-surface hover:border-marquee-gold/50 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                >
                  <div className="h-40 w-full bg-cinema-surface-2 relative overflow-hidden flex items-center justify-center">
                    {lista.capaUrl ? (
                      <img
                        src={lista.capaUrl}
                        alt={lista.titulo}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                      />
                    ) : (
                      <span className="text-4xl text-dust/40">🎬</span>
                    )}
                    <span className="absolute bottom-3 right-3 rounded-md bg-cinema-black/80 backdrop-blur px-2.5 py-1 text-xs font-medium text-marquee-gold border border-cinema-surface-2">
                      {lista.filmesCount || 0} {lista.filmesCount === 1 ? 'filme' : 'filmes'}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-lg font-bold text-cream group-hover:text-marquee-gold transition-colors line-clamp-1">
                      {lista.titulo}
                    </h2>
                    <p className="mt-2 text-sm text-dust line-clamp-2 flex-1">
                      {lista.descricao || 'Sem descrição informada.'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Modal de Criar Nova Lista */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-cinema-surface-2 bg-[#121212] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-cinema-surface-2 pb-4 mb-4">
                <h3 className="text-lg font-bold text-marquee-gold">Criar Nova Lista</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-dust hover:text-cream text-xl font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleCriarLista} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-cream uppercase tracking-wider mb-1.5">
                    Título da Lista *
                  </label>
                  <input
                    type="text"
                    required
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Favoritos de Terror, Filmes do Oscar..."
                    className="w-full rounded-lg border border-cinema-surface-2 bg-cinema-surface px-4 py-2.5 text-sm text-cream placeholder-dust focus:border-marquee-gold focus:outline-none focus:ring-1 focus:ring-marquee-gold transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cream uppercase tracking-wider mb-1.5">
                    Descrição (opcional)
                  </label>
                  <textarea
                    rows="3"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Sobre o que é esta lista?"
                    className="w-full rounded-lg border border-cinema-surface-2 bg-cinema-surface px-4 py-2.5 text-sm text-cream placeholder-dust focus:border-marquee-gold focus:outline-none focus:ring-1 focus:ring-marquee-gold transition-colors resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-dust hover:text-cream transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-marquee-gold px-5 py-2 text-sm font-semibold text-cinema-black hover:bg-yellow-400 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar Lista'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}