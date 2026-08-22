import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const TMDB_API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || '92db8f15ae04ad999f2b051360a79fa6';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_LOGO_BASE = 'https://image.tmdb.org/t/p/w92';

// Dados do Quiz
const MOODS = [
  { id: 'fun', label: '😂 Divertido / Leve', genres: [35, 16] },
  { id: 'intense', label: '🔥 Tenso / Ação', genres: [28, 53] },
  { id: 'scary', label: '😱 Asustador / Terror', genres: [27, 9648] },
  { id: 'mindbend', label: '🧠 Para Pensar', genres: [878, 9648] },
  { id: 'emotional', label: '🥺 Emocionante', genres: [18, 10749] },
];

const DURATIONS = [
  { id: 'short', label: 'Rápido (< 90 min)', maxRuntime: 90 },
  { id: 'medium', label: 'Padrão (90 - 120 min)', minRuntime: 90, maxRuntime: 120 },
  { id: 'long', label: 'Longo (> 120 min)', minRuntime: 120 },
];

const GENRES = [
  { id: 28, label: 'Ação' },
  { id: 35, label: 'Comédia' },
  { id: 18, label: 'Drama' },
  { id: 878, label: 'Ficção Científica' },
  { id: 27, label: 'Terror' },
  { id: 10749, label: 'Romance' },
  { id: 53, label: 'Thriller' },
];

export default function Suggestions() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' ou 'quiz'

  // --- ESTADOS: Busca por Filme (Abordagem Atual) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // --- ESTADOS: Quiz O Que Assistir Hoje ---
  const [step, setStep] = useState(1);
  const [quizMood, setQuizMood] = useState(null);
  const [quizDuration, setQuizDuration] = useState(null);
  const [quizGenre, setQuizGenre] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [watchProviders, setWatchProviders] = useState([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const [error, setError] = useState(null);

  // ==========================================
  // LÓGICA 1: Busca Por Filme Semelhante
  // ==========================================
  async function handleSearchMovie(e) {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoadingSearch(true);
    setError(null);
    setRecommendations([]);

    try {
      const res = await api.get(`/movies/search?query=${encodeURIComponent(searchTerm)}`);
      const firstMovie = res.data?.[0];

      if (!firstMovie) {
        setError('Nenhum filme encontrado com esse nome.');
        setLoadingSearch(false);
        return;
      }

      setSelectedMovie(firstMovie);
      await fetchRecommendations(firstMovie.id);
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar recomendações no servidor.');
      setLoadingSearch(false);
    }
  }

  async function fetchRecommendations(movieId) {
    try {
      const res = await api.get(`/movies/${movieId}/recommendations`);
      setRecommendations(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar as recomendações de filmes.');
    } finally {
      setLoadingSearch(false);
    }
  }

  // ==========================================
  // LÓGICA 2: Quiz "O que assistir hoje?"
  // ==========================================
  async function handleRunQuiz() {
    setLoadingQuiz(true);
    setError(null);
    setQuizResult(null);
    setWatchProviders([]);

    try {
      // Monta filtros para o TMDB
      let genreFilter = quizGenre;
      if (!genreFilter && quizMood) {
        genreFilter = quizMood.genres.join(',');
      }

      let runtimeFilter = '';
      if (quizDuration?.minRuntime) runtimeFilter += `&with_runtime.gte=${quizDuration.minRuntime}`;
      if (quizDuration?.maxRuntime) runtimeFilter += `&with_runtime.lte=${quizDuration.maxRuntime}`;

      const res = await fetch(
        `https://api.themoviedb.org/3/discover/movie?language=pt-BR&sort_by=popularity.desc&vote_count.gte=200&with_genres=${genreFilter || ''}${runtimeFilter}&api_key=${TMDB_API_KEY}`
      );

      if (!res.ok) throw new Error('Falha ao consultar TMDB');

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        setError('Nenhum filme encontrado com esses filtros. Tente refazer o quiz!');
        setLoadingQuiz(false);
        return;
      }

      // Sorteia um dos 10 primeiros mais populares
      const randomIndex = Math.floor(Math.random() * Math.min(data.results.length, 10));
      const picked = data.results[randomIndex];
      setQuizResult(picked);

      // Busca onde assistir (Watch Providers) no Brasil
      const resProviders = await fetch(
        `https://api.themoviedb.org/3/movie/${picked.id}/watch/providers?api_key=${TMDB_API_KEY}`
      );
      if (resProviders.ok) {
        const provData = await resProviders.json();
        setWatchProviders(provData.results?.BR?.flatrate || []);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar recomendação. Tente novamente.');
    } finally {
      setLoadingQuiz(false);
    }
  }

  function resetQuiz() {
    setStep(1);
    setQuizMood(null);
    setQuizDuration(null);
    setQuizGenre(null);
    setQuizResult(null);
    setWatchProviders([]);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 text-cream">
      {/* Cabeçalho e Seleção de Modo */}
      <div className="mb-8 border-b border-cinema-surface-2 pb-6">
        <h1 className="font-display text-3xl tracking-wide text-marquee-gold">
          Sugestões de Filmes
        </h1>
        <p className="mt-2 text-sm text-dust">
          Encontre o próximo filme para sua sessão buscando por títulos parecidos ou fazendo o quiz interativo.
        </p>

        {/* Abas para alternar entre as 2 abordagens */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => { setActiveTab('search'); setError(null); }}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'search'
                ? 'bg-marquee-gold text-cinema-black'
                : 'bg-cinema-surface border border-cinema-surface-2 text-dust hover:text-cream'
            }`}
          >
            🔍 Por Filme Semelhante
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('quiz'); setError(null); }}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'quiz'
                ? 'bg-marquee-gold text-cinema-black'
                : 'bg-cinema-surface border border-cinema-surface-2 text-dust hover:text-cream'
            }`}
          >
            🎲 Quiz: O Que Assistir Hoje?
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* ========================================================= */}
      {/* ABA 1: BUSCA POR FILME SEMELHANTE                           */}
      {/* ========================================================= */}
      {activeTab === 'search' && (
        <section>
          <form onSubmit={handleSearchMovie} className="mb-8 flex max-w-lg gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: Interstellar, Fight Club, Matrix..."
              className="flex-1 rounded-full border border-cinema-surface-2 bg-cinema-surface px-5 py-2.5 text-sm text-cream placeholder-dust outline-none focus:border-marquee-gold"
            />
            <button
              type="submit"
              disabled={loadingSearch}
              className="rounded-full bg-marquee-gold px-6 py-2.5 font-display text-sm font-bold text-cinema-black hover:brightness-110 disabled:opacity-50"
            >
              {loadingSearch ? 'Buscando...' : 'Buscar'}
            </button>
          </form>

          {selectedMovie && !loadingSearch && (
            <div className="mb-8 flex items-center gap-4 rounded-xl bg-cinema-surface p-4 border border-cinema-surface-2">
              {selectedMovie.poster && (
                <img
                  src={selectedMovie.poster}
                  alt={selectedMovie.title}
                  className="h-16 w-12 rounded-md object-cover flex-shrink-0"
                />
              )}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-dust">
                  Recomendações baseadas em:
                </span>
                <h2 className="font-display text-xl text-marquee-gold">
                  {selectedMovie.title}
                </h2>
              </div>
            </div>
          )}

          {loadingSearch && (
            <p className="mt-8 text-center text-sm text-dust animate-pulse">
              Carregando sugestões do servidor...
            </p>
          )}

          {!loadingSearch && recommendations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {recommendations.map((movie) => (
                <div
                  key={movie.id}
                  className="flex flex-col justify-between rounded-xl bg-cinema-surface p-3 border border-cinema-surface-2/60 hover:border-marquee-gold/40 hover:-translate-y-1 transition-all"
                >
                  <div>
                    <Link to={`/filme/${movie.id}`} className="block overflow-hidden rounded-lg">
                      {movie.poster ? (
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="h-60 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-60 w-full items-center justify-center rounded-lg bg-cinema-surface-2 text-xs text-dust">
                          Sem Cartaz
                        </div>
                      )}
                    </Link>
                    <Link
                      to={`/filme/${movie.id}`}
                      className="mt-3 block font-display text-sm font-semibold text-cream line-clamp-1 hover:text-marquee-gold"
                    >
                      {movie.title}
                    </Link>
                  </div>

                  <div className="mt-4 border-t border-cinema-surface-2/60 pt-3 flex items-center justify-between text-xs text-dust">
                    <span className="text-marquee-gold font-medium">
                      ★ {movie.voteAverage ? Number(movie.voteAverage).toFixed(1) : 'N/A'}
                    </span>
                    <span>{movie.releaseDate ? movie.releaseDate.split('-')[0] : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* ABA 2: QUIZ 3 PASSOS + ONDE ASSISTIR                       */}
      {/* ========================================================= */}
      {activeTab === 'quiz' && (
        <section className="max-w-2xl mx-auto">
          {!quizResult && (
            <div className="rounded-2xl bg-cinema-surface p-6 border border-cinema-surface-2">
              {/* Barra de Progresso do Passo */}
              <div className="mb-6 flex items-center justify-between border-b border-cinema-surface-2 pb-4 text-xs text-dust">
                <span>Passo {step} de 3</span>
                <button type="button" onClick={resetQuiz} className="underline hover:text-cream">
                  Reiniciar Quiz
                </button>
              </div>

              {/* PASSO 1: HUMOR */}
              {step === 1 && (
                <div>
                  <h2 className="font-display text-xl text-cream mb-2">1. Qual o seu humor hoje?</h2>
                  <p className="text-xs text-dust mb-6">Escolha o sentimento que define a sua noite.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MOODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setQuizMood(m); setStep(2); }}
                        className="rounded-xl border border-cinema-surface-2 bg-cinema-surface-2/40 p-4 text-left font-medium text-cream hover:border-marquee-gold hover:bg-cinema-surface-2 transition-all"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSO 2: DURAÇÃO */}
              {step === 2 && (
                <div>
                  <h2 className="font-display text-xl text-cream mb-2">2. Quanto tempo você tem?</h2>
                  <p className="text-xs text-dust mb-6">Filtre filmes de acordo com a sua disponibilidade.</p>
                  <div className="grid grid-cols-1 gap-3">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => { setQuizDuration(d); setStep(3); }}
                        className="rounded-xl border border-cinema-surface-2 bg-cinema-surface-2/40 p-4 text-left font-medium text-cream hover:border-marquee-gold hover:bg-cinema-surface-2 transition-all"
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PASSO 3: GÊNERO PREFERIDO */}
              {step === 3 && (
                <div>
                  <h2 className="font-display text-xl text-cream mb-2">3. Prefere algum gênero específico?</h2>
                  <p className="text-xs text-dust mb-6">Você pode escolher um ou deixar em aberto baseado no humor.</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {GENRES.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setQuizGenre(quizGenre === g.id ? null : g.id)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                          quizGenre === g.id
                            ? 'bg-marquee-gold text-cinema-black'
                            : 'bg-cinema-surface-2 text-cream border border-cinema-surface-2'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleRunQuiz}
                    disabled={loadingQuiz}
                    className="w-full rounded-xl bg-marquee-gold py-3 font-display text-sm font-bold text-cinema-black hover:brightness-110 disabled:opacity-50"
                  >
                    {loadingQuiz ? 'Encontrando Filme...' : '🎯 Descobrir Filme Perfeito'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RESULTADO DO QUIZ COM WATCH PROVIDERS */}
          {quizResult && !loadingQuiz && (
            <div className="rounded-2xl bg-cinema-surface p-6 border border-cinema-surface-2">
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                <img
                  src={
                    quizResult.poster_path
                      ? `${TMDB_IMAGE_BASE}${quizResult.poster_path}`
                      : 'https://via.placeholder.com/200x300'
                  }
                  alt={quizResult.title}
                  className="w-44 rounded-xl object-cover shadow-lg flex-shrink-0"
                />

                <div className="flex-1 text-center sm:text-left">
                  <span className="inline-block rounded-md bg-marquee-gold/10 px-2 py-1 text-xs font-semibold text-marquee-gold mb-2">
                    ★ {quizResult.vote_average?.toFixed(1)} / 10
                  </span>
                  <h2 className="font-display text-2xl text-cream">{quizResult.title}</h2>
                  <p className="mt-1 text-xs text-dust">
                    Lançamento: {quizResult.release_date?.slice(0, 4) || '—'}
                  </p>

                  <p className="mt-3 text-xs text-dust line-clamp-3 leading-relaxed">
                    {quizResult.overview || 'Sem sinopse disponível.'}
                  </p>

                  {/* ONDE ASSISTIR (STREAMINGS BRASIL) */}
                  <div className="mt-4 border-t border-cinema-surface-2 pt-3">
                    <span className="block text-[11px] text-dust mb-2">Onde assistir (Brasil):</span>
                    {watchProviders.length > 0 ? (
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {watchProviders.map((p) => (
                          <img
                            key={p.provider_id}
                            src={`${TMDB_LOGO_BASE}${p.logo_path}`}
                            alt={p.provider_name}
                            title={p.provider_name}
                            className="h-7 w-7 rounded-md object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-dust italic">
                        Disponível em serviços digitais para aluguel ou compra.
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex gap-3 justify-center sm:justify-start">
                    <Link
                      to={`/filme/${quizResult.id}`}
                      className="rounded-lg bg-marquee-gold px-4 py-2 text-xs font-bold text-cinema-black hover:brightness-110"
                    >
                      Ver Detalhes
                    </Link>
                    <button
                      type="button"
                      onClick={resetQuiz}
                      className="rounded-lg border border-cinema-surface-2 px-4 py-2 text-xs font-semibold text-cream hover:bg-cinema-surface-2"
                    >
                      Refazer Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}