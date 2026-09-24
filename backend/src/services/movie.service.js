
const tmdbClient = require('../clients/tmdb.client');
const omdbClient = require('../clients/omdb.client');
const MovieMapper = require('../mappers/movie.mapper');
const ingressoService = require('./ingresso.service');
const TtlCache = require('../utils/cache');

const cache = new TtlCache(5 * 60 * 1000);

const DEFAULT_BOX_OFFICE_DATA = Object.freeze({
  available: false,
  boxOffice: null,
  imdbRating: null,
  awards: null,
});

function parseCurrency(value) {
  if (!value) return -1;
  const number = Number(String(value).replace(/[$,]/g, ''));
  return Number.isNaN(number) ? -1 : number;
}

class MovieService {
  async search(query) {
    const normalized = query.trim();
    return cache.getOrSet(`search:${normalized.toLowerCase()}`, async () => {
      const response = await tmdbClient.get('/search/movie', { params: { query: normalized } });
      return MovieMapper.mapSearchMovies(response.data?.results || []);
    });
  }

  async getById(id) {
    return cache.getOrSet(`movie:${id}`, async () => {
      const response = await tmdbClient.get(`/movie/${id}`, {
        params: { append_to_response: 'credits,videos' },
      });
      return MovieMapper.mapMovieDetails(response.data);
    });
  }

  async fetchMovieList(endpoint) {
    return cache.getOrSet(`list:${endpoint}`, async () => {
      const response = await tmdbClient.get(endpoint);
      return MovieMapper.mapSearchMovies(response.data?.results || []);
    });
  }

  async getNowPlaying(city) {
    const cleanCity = city?.trim();

    // Sem cidade, mantém o comportamento original de exibir o catálogo geral do TMDB.
    if (!cleanCity) {
      const movies = await this.fetchMovieList('/movie/now_playing');
      return { city: null, source: 'tmdb', movies };
    }

    const result = await ingressoService.getMovieTitlesInCity(cleanCity);

    if (!result.city) {
      const error = new Error(`Cidade não encontrada no catálogo do Ingresso.com: ${cleanCity}`);
      error.statusCode = 404;
      error.code = 'CITY_NOT_FOUND';
      throw error;
    }

    if (!result.titles.length) {
      return {
        city: result.city.name,
        cityId: result.city.id,
        source: 'ingresso',
        reason: 'NO_MOVIES_IN_CITY',
        movies: [],
      };
    }

    const movies = await this.fetchMovieList('/movie/now_playing');
    const filtered = ingressoService.filterMoviesByTitles(movies, result.titles);
    const highlights = await ingressoService.getHighlightsByCity(result.city);
    const sessions = ingressoService.normalizeShowtimes(highlights);

    const withSessions = filtered.map((movie) => ({
      ...movie,
      sessions: sessions.filter((session) =>
        ingressoService.filterMoviesByTitles(
          [{ title: movie.title, originalTitle: movie.originalTitle }],
          [session.movieTitle, session.movieOriginalTitle].filter(Boolean)
        ).length > 0
      ),
    }));

    return {
      city: result.city.name,
      cityId: result.city.id,
      source: 'ingresso',
      reason: filtered.length ? null : 'NO_TMDB_MATCH',
      movies: withSessions,
    };
  }


  async discover(params = {}) {
    const allowed = [
      'language', 'sort_by', 'vote_count.gte', 'with_genres',
      'with_runtime.gte', 'with_runtime.lte', 'primary_release_year',
      'page',
    ];
    const safeParams = Object.fromEntries(
      Object.entries(params).filter(([key, value]) => allowed.includes(key) && value !== undefined && value !== '')
    );
    safeParams.language = safeParams.language || 'pt-BR';
    safeParams.sort_by = safeParams.sort_by || 'popularity.desc';

    const cacheKey = `discover:${JSON.stringify(safeParams)}`;
    return cache.getOrSet(cacheKey, async () => {
      const response = await tmdbClient.get('/discover/movie', { params: safeParams });
      return MovieMapper.mapSearchMovies(response.data?.results || []);
    });
  }

  async getAllTimeBoxOffice(year) {
    const params = {
      language: 'pt-BR',
      sort_by: 'revenue.desc',
      page: 1,
    };
    if (year) params.primary_release_year = Number(year);

    const movies = await this.discover(params);
    const details = await Promise.all(
      movies.slice(0, 20).map(async (movie) => {
        try {
          const response = await tmdbClient.get(`/movie/${movie.id}`, {
            params: { language: 'pt-BR' },
          });
          return { ...movie, revenue: response.data?.revenue || 0 };
        } catch {
          return { ...movie, revenue: 0 };
        }
      })
    );

    return details.sort((a, b) => b.revenue - a.revenue);
  }

  async getPopular() { return this.fetchMovieList('/movie/popular'); }
  async getTopRated() { return this.fetchMovieList('/movie/top_rated'); }
  async getUpcoming() { return this.fetchMovieList('/movie/upcoming'); }

  async getRecommendations(id) {
    return cache.getOrSet(`recommendations:${id}`, async () => this.fetchMovieList(`/movie/${id}/recommendations`));
  }

  async getProviders(id) {
    return cache.getOrSet(`providers:${id}`, async () => {
      const response = await tmdbClient.get(`/movie/${id}/watch/providers`);
      return response.data?.results || {};
    });
  }

  async getBoxOffice(id) {
    return cache.getOrSet(`boxoffice:${id}`, async () => {
      try {
        const response = await tmdbClient.get(`/movie/${id}`);
        const imdbId = response.data?.imdb_id;
        if (!imdbId) return { ...DEFAULT_BOX_OFFICE_DATA };

        const omdbResponse = await omdbClient.get('/', { params: { i: imdbId } });
        return MovieMapper.mapBoxOffice(omdbResponse.data);
      } catch (error) {
        this._logError('OMDB/TMDB (getBoxOffice)', error);
        return { ...DEFAULT_BOX_OFFICE_DATA };
      }
    });
  }

  async getBoxOfficeChart() {
    const movies = await this.getNowPlaying();
    const topMovies = movies.movies.slice(0, 10);

    const withBoxOffice = await Promise.all(
      topMovies.map(async (movie) => ({
        ...movie,
        ...(await this.getBoxOffice(movie.id)),
      }))
    );

    return withBoxOffice.sort(
      (a, b) => parseCurrency(b.boxOffice) - parseCurrency(a.boxOffice)
    );
  }

  _logError(context, error) {
    if (error.response) {
      console.error(
        `Erro no ${context} [HTTP ${error.response.status}]:`,
        JSON.stringify(error.response.data)
      );
    } else {
      console.error(`Erro no ${context}:`, error.message);
    }
  }
}

module.exports = new MovieService();
