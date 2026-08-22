import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import MovieCard from '../components/MovieCard'

export default function MovieDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  // Estados principais de dados
  const [movie, setMovie] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [boxOffice, setBoxOffice] = useState(null)
  const [providers, setProviders] = useState(null)
  const [libraryEntry, setLibraryEntry] = useState(null)

  // Estados de feedback e UI
  const [loading, setLoading] = useState(true)
  const [savingStatus, setSavingStatus] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Estados do Modal "Já Assisti"
  const [isWatchedModalOpen, setIsWatchedModalOpen] = useState(false)
  const [watchedDate, setWatchedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [rating, setRating] = useState(10)

  // Estados do Modal "Adicionar à Lista"
  const [isListModalOpen, setIsListModalOpen] = useState(false)
  const [userLists, setUserLists] = useState([])
  const [selectedListId, setSelectedListId] = useState('')
  const [loadingLists, setLoadingLists] = useState(false)
  const [addingToList, setAddingToList] = useState(false)
  const [listFeedback, setListFeedback] = useState(null)

  // Carregamento dos dados do filme
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setMovie(null)
    setFeedback(null)
    setProviders(null)

    const fetchMovieData = async () => {
      try {
        const [movieRes, recsRes, boxOfficeRes, providersRes] = await Promise.all([
          api.get(`/movies/${id}`),
          api.get(`/movies/${id}/recommendations`).catch(() => ({ data: [] })),
          api.get(`/movies/${id}/boxoffice`).catch(() => ({ data: { available: false } })),
          api.get(`/movies/${id}/providers`).catch(() => ({ data: null })),
        ])

        if (!isMounted) return

        setMovie(movieRes.data)
        setRecommendations(recsRes.data)
        setBoxOffice(boxOfficeRes.data)
        
        const brProviders = providersRes.data?.results?.BR || providersRes.data?.BR || null
        setProviders(brProviders)
      } catch (err) {
        if (isMounted) setFeedback('Erro ao carregar detalhes do filme.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchMovieData()

    return () => {
      isMounted = false
    }
  }, [id])

  // Carregamento de dados da biblioteca do usuário
  useEffect(() => {
    let isMounted = true

    if (!user) {
      setLibraryEntry(null)
      return
    }

    api
      .get('/library')
      .then((res) => {
        if (!isMounted) return
        const entry = res.data.find((item) => Number(item.movieId) === Number(id))
        setLibraryEntry(entry || null)
      })
      .catch(() => {
        if (isMounted) setLibraryEntry(null)
      })

    return () => {
      isMounted = false
    }
  }, [id, user])

  // Ação: Abrir modal de Já Assisti
  function handleOpenWatchedModal() {
    setFeedback(null)

    const currentDateValue = libraryEntry?.watchedAt || libraryEntry?.watchedDate

    let initialDate = new Date().toISOString().split('T')[0]
    if (currentDateValue) {
      const parsed = new Date(currentDateValue)
      if (!isNaN(parsed.getTime())) {
        initialDate = parsed.toISOString().split('T')[0]
      }
    }

    const initialRating =
      libraryEntry?.rating !== undefined && libraryEntry?.rating !== null
        ? Number(libraryEntry.rating)
        : 10

    setWatchedDate(initialDate)
    setRating(initialRating)
    setIsWatchedModalOpen(true)
  }

  // Ação: Abrir modal e buscar as listas personalizadas do usuário
  async function handleOpenListModal() {
    setListFeedback(null)
    setIsListModalOpen(true)
    setLoadingLists(true)

    try {
      const response = await api.get('/lists')
      const listsData = Array.isArray(response.data) ? response.data : response.data?.listas || []
      setUserLists(listsData)

      if (listsData.length > 0) {
        // Trata a chave primária aceitando id (Prisma/SQL) ou _id (MongoDB)
        const firstId = listsData[0].id || listsData[0]._id
        setSelectedListId(String(firstId))
      }
    } catch (err) {
      setListFeedback('Erro ao carregar suas listas.')
    } finally {
      setLoadingLists(false)
    }
  }

  // Ação: Adicionar o filme na lista selecionada
  async function handleAddMovieToList(e) {
    e.preventDefault()
    if (!selectedListId) return

    setAddingToList(true)
    setListFeedback(null)

    try {
      await api.post(`/lists/${selectedListId}/movies`, {
        movieId: Number(id),
      })

      setListFeedback('Filme adicionado à lista com sucesso!')
      setTimeout(() => {
        setIsListModalOpen(false)
        setListFeedback(null)
      }, 1500)
    } catch (err) {
      setListFeedback(err.response?.data?.message || 'Erro ao adicionar filme à lista. Verifique a rota no servidor.')
    } finally {
      setAddingToList(false)
    }
  }

  // Ação: Adicionar à lista "Quero Assistir"
  async function handleAddToWatchlist() {
    setSavingStatus('WATCHLIST')
    setFeedback(null)

    try {
      const response = await api.post('/library', {
        movieId: Number(id),
        status: 'WATCHLIST',
      })

      setLibraryEntry(
        response.data || {
          movieId: Number(id),
          status: 'WATCHLIST',
        }
      )
      setFeedback('Adicionado à sua lista para assistir.')
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Não foi possível salvar na lista.')
    } finally {
      setSavingStatus(null)
    }
  }

  // Ação: Salvar filme assistido
  async function handleSaveWatched(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setSavingStatus('WATCHED')
    setFeedback(null)

    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const finalDate = watchedDate && watchedDate.trim() !== '' ? watchedDate : todayStr
      const finalRating = Number(rating) >= 0 && Number(rating) <= 10 ? Number(rating) : 10

      const payload = {
        movieId: Number(id),
        status: 'WATCHED',
        watchedAt: finalDate,
        watchedDate: finalDate,
        rating: finalRating,
        score: finalRating,
      }

      const response = await api.post('/library', payload)

      setLibraryEntry(response.data || payload)
      setFeedback('Marcado como assistido com sucesso!')
      setIsWatchedModalOpen(false)
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Erro ao salvar no servidor.')
    } finally {
      setSavingStatus(null)
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-dust">Carregando...</p>
  }

  if (!movie) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-dust">Filme não encontrado.</p>
  }

  const savedDate = libraryEntry?.watchedAt || libraryEntry?.watchedDate

  return (
    <div>
      {/* Banner Principal */}
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

          <div className="flex-1">
            {movie.tagline && (
              <p className="font-display tracking-[0.3em] text-marquee-gold">
                {movie.tagline.toUpperCase()}
              </p>
            )}
            <h1 className="mt-2 font-display text-4xl text-cream sm:text-5xl">{movie.title}</h1>

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

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-cream/90">{movie.overview}</p>

            {/* Onde Assistir */}
            {providers && (providers.flatrate?.length > 0 || providers.rent?.length > 0 || providers.buy?.length > 0) && (
              <div className="mt-6 rounded-xl border border-cinema-surface-2 bg-cinema-surface/80 p-4 max-w-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-cinema-surface-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cream">
                    Onde Assistir no Brasil
                  </span>
                  <a
                    href={providers.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-dust hover:text-marquee-gold transition-colors"
                  >
                    Oferecido por JustWatch ↗
                  </a>
                </div>

                <div className="mt-3 flex flex-col gap-3">
                  {providers.flatrate?.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-xs font-medium text-dust">Streaming:</span>
                      <div className="flex flex-wrap gap-2">
                        {providers.flatrate.map((provider) => (
                          <div key={provider.provider_id} title={provider.provider_name}>
                            <img
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="h-8 w-8 rounded-lg object-cover shadow border border-cinema-surface-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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

            {/* Ações da Biblioteca e Listas */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <button
                    type="button"
                    disabled={savingStatus === 'WATCHLIST'}
                    onClick={handleAddToWatchlist}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      libraryEntry?.status === 'WATCHLIST'
                        ? 'bg-marquee-gold text-cinema-black'
                        : 'border border-marquee-gold text-marquee-gold hover:bg-marquee-gold hover:text-cinema-black'
                    }`}
                  >
                    {savingStatus === 'WATCHLIST' ? 'Salvando...' : 'Quero assistir'}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWatchedModal}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      libraryEntry?.status === 'WATCHED'
                        ? 'bg-velvet text-cream'
                        : 'border border-velvet text-velvet hover:bg-velvet hover:text-cream'
                    }`}
                  >
                    {libraryEntry?.status === 'WATCHED' ? '✓ Já assistido (Editar)' : 'Já assisti'}
                  </button>

                  {/* BOTÃO: Adicionar a Lista */}
                  <button
                    type="button"
                    onClick={handleOpenListModal}
                    className="rounded-full border border-cinema-surface-2 bg-cinema-surface px-4 py-2 text-sm font-medium text-cream hover:border-marquee-gold/60 hover:text-marquee-gold transition-colors"
                  >
                    + Adicionar à Lista
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

            {/* Dados Salvos pelo Usuário */}
            {libraryEntry?.status === 'WATCHED' && (
              <div className="mt-3 flex items-center gap-4 text-xs text-dust">
                {savedDate && (
                  <span>
                    📅 Assistido em:{' '}
                    {new Date(savedDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </span>
                )}
                {libraryEntry.rating !== undefined && libraryEntry.rating !== null && (
                  <span>★ Sua nota: {libraryEntry.rating}/10</span>
                )}
              </div>
            )}

            {feedback && <p className="mt-3 text-sm text-dust">{feedback}</p>}
          </div>
        </div>
      </section>

      {/* MODAL: Adicionar à Lista */}
      {isListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cinema-surface-2 pb-3 mb-4">
              <h3 className="font-display text-xl text-marquee-gold">Adicionar a uma Lista</h3>
              <button
                type="button"
                onClick={() => setIsListModalOpen(false)}
                className="text-dust hover:text-cream text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {listFeedback && (
              <p className="mb-4 text-xs font-medium text-marquee-gold bg-marquee-gold/10 p-2.5 rounded border border-marquee-gold/20">
                {listFeedback}
              </p>
            )}

            {loadingLists ? (
              <p className="py-6 text-center text-sm text-dust">Buscando suas listas...</p>
            ) : userLists.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-dust">Você ainda não possui nenhuma lista criada.</p>
                <Link
                  to="/listas"
                  className="mt-3 inline-block text-xs text-marquee-gold underline hover:text-yellow-400"
                >
                  Ir para minhas listas e criar uma
                </Link>
              </div>
            ) : (
              <form onSubmit={handleAddMovieToList} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm text-cream">
                  Selecione a lista desejada:
                  <select
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="rounded-lg border border-cinema-surface-2 bg-cinema-black px-3 py-2.5 text-sm text-cream outline-none focus:border-marquee-gold"
                  >
                    {userLists.map((lista) => {
                      const lId = lista.id || lista._id
                      return (
                        <option key={lId} value={lId}>
                          {lista.titulo || lista.title || 'Lista sem título'}
                        </option>
                      )
                    })}
                  </select>
                </label>

                <div className="mt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsListModalOpen(false)}
                    className="rounded-full px-4 py-2 text-xs text-dust hover:text-cream"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addingToList}
                    className="rounded-full bg-marquee-gold px-5 py-2 text-xs font-semibold text-cinema-black hover:bg-yellow-400 disabled:opacity-50"
                  >
                    {addingToList ? 'Adicionando...' : 'Confirmar e Adicionar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Avaliação de Filme Assistido */}
      {isWatchedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <form
            onSubmit={handleSaveWatched}
            className="w-full max-w-md rounded-xl border border-cinema-surface-2 bg-cinema-surface p-6 shadow-2xl"
          >
            <h3 className="font-display text-xl text-marquee-gold">Registrar Assistido</h3>
            <p className="mt-1 text-xs text-dust">
              Informe a data em que assistiu e atribua sua nota (0 a 10) para {movie.title}.
            </p>

            <div className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm text-cream">
                Data em que assistiu:
                <input
                  type="date"
                  required
                  value={watchedDate}
                  onChange={(e) => setWatchedDate(e.target.value)}
                  className="rounded-lg border border-cinema-surface-2 bg-cinema-black px-3 py-2 text-cream outline-none focus:border-marquee-gold"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-cream">
                Sua nota (0 a 10):
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer accent-marquee-gold"
                  />
                  <span className="w-8 text-right font-display text-lg font-bold text-marquee-gold">
                    {rating}
                  </span>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsWatchedModalOpen(false)}
                className="rounded-full px-4 py-2 text-xs text-dust hover:text-cream"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingStatus === 'WATCHED'}
                className="rounded-full bg-marquee-gold px-5 py-2 text-xs font-semibold text-cinema-black hover:bg-yellow-400"
              >
                {savingStatus === 'WATCHED' ? 'Salvando...' : 'Salvar Avaliação'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Elenco */}
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

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-8">
          <h2 className="font-display text-2xl text-cream">Filmes semelhantes</h2>
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