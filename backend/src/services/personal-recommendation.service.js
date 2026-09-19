
const prisma = require('../config/prisma');
const tmdbClient = require('../clients/tmdb.client');
const MovieMapper = require('../mappers/movie.mapper');
const TtlCache = require('../utils/cache');

const cache = new TtlCache(15 * 60 * 1000);

function weightForRating(rating) {
  if (rating == null) return 1;
  return Math.max(0.5, Number(rating) / 5);
}

class PersonalRecommendationService {
  async getForUser(userId, limit = 12) {
    const parsedUserId = Number(userId);
    const safeLimit = Math.min(Math.max(Number(limit) || 12, 4), 24);

    const watched = await prisma.userMovie.findMany({
      where: { userId: parsedUserId, status: 'WATCHED' },
      orderBy: [{ watchedAt: 'desc' }, { updatedAt: 'desc' }],
      take: 20,
      select: { movieId: true, rating: true, watchedAt: true },
    });

    if (!watched.length) {
      const response = await tmdbClient.get('/movie/popular', {
        params: { page: 1 },
      });
      return {
        strategy: 'popular-fallback',
        basedOn: [],
        movies: MovieMapper.mapSearchMovies(response.data?.results || []).slice(0, safeLimit),
      };
    }

    const detailResults = await Promise.allSettled(
      watched.map(async (item) => {
        const key = `recommendation-movie:${item.movieId}`;
        return cache.getOrSet(key, async () => {
          const response = await tmdbClient.get(`/movie/${item.movieId}`);
          return response.data;
        });
      })
    );

    const genreScores = new Map();
    detailResults.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      const movie = result.value;
      if (!movie?.genres) return;
      const weight = weightForRating(watched[index]?.rating);
      movie.genres.forEach((genre) => {
        genreScores.set(genre.id, (genreScores.get(genre.id) || 0) + weight);
      });
    });

    const topGenres = [...genreScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    const excludedIds = watched.map((item) => item.movieId);
    const params = {
      language: 'pt-BR',
      sort_by: 'popularity.desc',
      vote_count_gte: 100,
      with_genres: topGenres.join(','),
      page: 1,
    };

    const response = await tmdbClient.get('/discover/movie', { params });
    const movies = (response.data?.results || [])
      .filter((movie) => !excludedIds.includes(movie.id))
      .slice(0, safeLimit);

    return {
      strategy: 'history-genres',
      basedOn: topGenres,
      movies: MovieMapper.mapSearchMovies(movies),
    };
  }
}

module.exports = new PersonalRecommendationService();
