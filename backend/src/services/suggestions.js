const TMDB_API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || '92db8f15ae04ad999f2b051360a79fa6';
const BASE_URL = 'https://api.themoviedb.org/3';

export async function discoverMovies({ genreId, era, sortBy = 'popularity.desc' }) {
  let eraQuery = '';
  
  if (era === 'classic') eraQuery = '&primary_release_date.lte=1999-12-31';
  if (era === 'modern') eraQuery = '&primary_release_date.gte=2000-01-01&primary_release_date.lte=2019-12-31';
  if (era === 'recent') eraQuery = '&primary_release_date.gte=2020-01-01';

  const genreQuery = genreId ? `&with_genres=${genreId}` : '';

  const res = await fetch(
    `${BASE_URL}/discover/movie?language=pt-BR&sort_by=${sortBy}&vote_count.gte=300${genreQuery}${eraQuery}&api_key=${TMDB_API_KEY}`
  );

  if (!res.ok) throw new Error('Falha ao buscar recomendações');
  return await res.json();
}

export async function getWatchProviders(movieId) {
  try {
    const res = await fetch(
      `${BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Retorna os provedores do Brasil (BR)
    return data.results?.BR?.flatrate || [];
  } catch {
    return [];
  }
}