
const tmdbClient = require('../clients/tmdb.client');

async function discoverMovies({ genreId, era, sortBy = 'popularity.desc' } = {}) {
  const params = {
    language: 'pt-BR',
    sort_by: sortBy,
    'vote_count.gte': 300,
  };

  if (genreId) params.with_genres = genreId;
  if (era === 'classic') params['primary_release_date.lte'] = '1999-12-31';
  if (era === 'modern') {
    params['primary_release_date.gte'] = '2000-01-01';
    params['primary_release_date.lte'] = '2019-12-31';
  }
  if (era === 'recent') params['primary_release_date.gte'] = '2020-01-01';

  const response = await tmdbClient.get('/discover/movie', { params });
  return response.data;
}

async function getWatchProviders(movieId) {
  try {
    const response = await tmdbClient.get(`/movie/${movieId}/watch/providers`);
    return response.data?.results?.BR?.flatrate || [];
  } catch {
    return [];
  }
}

module.exports = { discoverMovies, getWatchProviders };
