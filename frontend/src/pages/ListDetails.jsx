import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200';
const TMDB_API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || '92db8f15ae04ad999f2b051360a79fa6';

const PLACEHOLDER_POSTER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="225" viewBox="0 0 150 225"><rect width="100%" height="100%" fill="%231a1a24"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23888899" font-family="sans-serif" font-size="14">Sem Capa</text></svg>';

export default function ListDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lista, setLista] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadListAndMovies() {
      try {
        setLoading(true);
        setError(null);

        const resLista = await api.get(`/lists/${id}`);
        const dadosLista = resLista.data;
        setLista(dadosLista);

        const arrayFilmes = dadosLista.movies || dadosLista.items || [];

        if (arrayFilmes.length > 0) {
          const promessasFilmes = arrayFilmes.map(async (item) => {
            if (item.title && item.poster) {
              return {
                idItem: item.id || item.movieId,
                movieId: item.movieId,
                title: item.title,
                poster: item.poster,
                releaseDate: item.releaseDate,
              };
            }

            const rawMovieId = item.movieId || item.movie_id || item.tmdbId;

            if (!rawMovieId) {
              return null;
            }

            try {
              const resMovie = await fetch(
                `https://api.themoviedb.org/3/movie/${rawMovieId}?language=pt-BR&api_key=${TMDB_API_KEY}`
              );

              if (!resMovie.ok) {
                throw new Error(`HTTP ${resMovie.status}`);
              }

              const movieData = await resMovie.json();

              return {
                idItem: item.id || rawMovieId,
                movieId: rawMovieId,
                title: movieData.title || movieData.original_title || `Filme #${rawMovieId}`,
                poster: movieData.poster_path
                  ? `${TMDB_IMAGE_BASE}${movieData.poster_path}`
                  : PLACEHOLDER_POSTER,
                releaseDate: movieData.release_date,
              };
            } catch (err) {
              console.warn(`Erro ao buscar dados do filme #${rawMovieId} no TMDB:`, err);
              return {
                idItem: item.id || rawMovieId,
                movieId: rawMovieId,
                title: `Filme #${rawMovieId}`,
                poster: PLACEHOLDER_POSTER,
                releaseDate: null,
              };
            }
          });

          const filmesResolvidos = await Promise.all(promessasFilmes);
          setItems(filmesResolvidos.filter(Boolean));
        }
      } catch (err) {
        console.error('Erro ao carregar lista:', err);

        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        setError('Não foi possível carregar os detalhes desta lista.');
      } finally {
        setLoading(false);
      }
    }

    loadListAndMovies();
  }, [id, navigate]);

  async function removeItem(item) {
    const previousItems = [...items];

    setItems((prev) => prev.filter((i) => i.movieId !== item.movieId));

    try {
      await api.delete(`/lists/${id}/movies/${item.movieId}`);
    } catch (err) {
      setItems(previousItems);

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('Não foi possível remover o filme da lista.');
      }
    }
  }

  // Função para compartilhar a lista
  function handleShareWhatsApp() {
    const tituloLista = lista?.titulo || lista?.title || 'Minha Lista de Filmes';
    const urlAtual = window.location.href;
    const mensagem = encodeURIComponent(
      `Confira a minha lista de filmes "${tituloLista}" no MovieHub:\n${urlAtual}`
    );

    // Se estiver no celular e suportar o compartilhamento nativo do sistema
    if (navigator.share) {
      navigator
        .share({
          title: tituloLista,
          text: `Confira a minha lista de filmes "${tituloLista}" no MovieHub`,
          url: urlAtual,
        })
        .catch(() => {
          // Fallback para o link direto do WhatsApp caso o usuário cancele ou falhe
          window.open(`https://api.whatsapp.com/send?text=${mensagem}`, '_blank');
        });
    } else {
      // Abre o WhatsApp Web ou aplicativo direto
      window.open(`https://api.whatsapp.com/send?text=${mensagem}`, '_blank');
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      {loading && <p className="mt-6 text-sm text-dust">Carregando...</p>}

      {error && !loading && (
        <p className="mt-6 text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && lista && (
        <>
          <div className="mb-8 border-b border-cinema-surface-2 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl tracking-wide text-marquee-gold">
                  {lista.titulo || lista.title}
                </h1>
                {(lista.descricao || lista.description) && (
                  <p className="mt-2 text-sm text-dust">
                    {lista.descricao || lista.description}
                  </p>
                )}
              </div>

              {/* Botão de Compartilhar via WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 rounded-full border border-cinema-surface-2 bg-cinema-surface px-4 py-2 text-xs font-semibold text-cream hover:border-emerald-500 hover:text-emerald-400 transition-colors"
              >
                {/* Ícone simples do WhatsApp em SVG */}
                <svg
                  className="h-4 w-4 fill-current text-emerald-500"
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.842-1.001z" />
                </svg>
                Compartilhar
              </button>
            </div>
          </div>

          <h2 className="mb-4 font-display text-xl text-cream">
            Filmes na lista ({items.length})
          </h2>

          {items.length === 0 ? (
            <p className="mt-6 text-sm text-dust">
              Nenhum filme adicionado a esta lista ainda.
            </p>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.idItem || item.movieId}
                  className="flex items-center gap-4 rounded-xl bg-cinema-surface p-3"
                >
                  <Link to={`/filme/${item.movieId}`} className="flex-shrink-0">
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="h-24 w-16 rounded-md object-cover bg-cinema-surface-2"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/filme/${item.movieId}`}
                      className="truncate font-display text-lg text-cream hover:text-marquee-gold block"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-dust mt-1">
                      {item.releaseDate ? item.releaseDate.slice(0, 4) : '—'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    className="flex-shrink-0 rounded-full border border-cinema-surface-2 px-3 py-1.5 text-xs text-dust hover:border-velvet hover:text-velvet transition-colors"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}