const tmdbClient = require('../clients/tmdb.client');
const omdbClient = require('../clients/omdb.client');
const MovieMapper = require('../mappers/movie.mapper');
const ingressoService = require('./ingresso.service');

const DEFAULT_BOX_OFFICE_DATA = Object.freeze({
    available: false,
    boxOffice: null,
    imdbRating: null,
    awards: null
});

function parseCurrency(value) {
    if (!value) return -1;
    const number = Number(value.replace(/[$,]/g, ''));
    return Number.isNaN(number) ? -1 : number;
}

class MovieService {

    async search(query) {
        try {
            const response = await tmdbClient.get('/search/movie', {
                params: { query }
            });
            return MovieMapper.mapSearchMovies(response.data?.results || []);
        } catch (error) {
            this._logError('TMDB (search)', error);
            throw new Error('Erro ao pesquisar filmes.');
        }
    }

    async getById(id) {
        try {
            const response = await tmdbClient.get(`/movie/${id}`, {
                params: { append_to_response: 'credits,videos' }
            });
            return MovieMapper.mapMovieDetails(response.data);
        } catch (error) {
            this._logError('TMDB (getById)', error);
            throw new Error('Erro ao buscar detalhes do filme.');
        }
    }

    async fetchMovieList(endpoint) {
        try {
            const response = await tmdbClient.get(endpoint);
            return MovieMapper.mapSearchMovies(response.data?.results || []);
        } catch (error) {
            this._logError('TMDB (fetchMovieList)', error);
            throw new Error('Erro ao buscar lista de filmes.');
        }
    }

    /**
     * Retorna os filmes em cartaz. Quando uma cidade é informada, tenta
     * filtrar pelos filmes com sessão confirmada nela (via Ingresso.com).
     */
    async getNowPlaying(city) {
        const movies = await this.fetchMovieList('/movie/now_playing');

        const cleanCity = city?.trim();
        if (!cleanCity) {
            return { city: null, source: 'tmdb', movies };
        }

        try {
            const referenceTitles = await ingressoService.getMovieTitlesInCity(cleanCity);

            if (!referenceTitles?.length) {
                return { city: cleanCity, source: 'tmdb-fallback', movies };
            }

            const filtered = ingressoService.filterMoviesByTitles(movies, referenceTitles);
            const hasMatches = filtered.length > 0;

            return {
                city: cleanCity,
                source: hasMatches ? 'ingresso' : 'tmdb-fallback',
                movies: hasMatches ? filtered : movies,
            };
        } catch (error) {
            console.error(`❌ Erro ao filtrar filmes para a cidade "${cleanCity}":`, error.message);
            return { city: cleanCity, source: 'tmdb-fallback', movies };
        }
    }

    async getPopular() {
        return this.fetchMovieList('/movie/popular');
    }

    async getTopRated() {
        return this.fetchMovieList('/movie/top_rated');
    }

    async getUpcoming() {
        return this.fetchMovieList('/movie/upcoming');
    }

    async getRecommendations(id) {
        return this.fetchMovieList(`/movie/${id}/recommendations`);
    }

    async getProviders(id) {
        try {
            const response = await tmdbClient.get(`/movie/${id}/watch/providers`);
            return response.data?.results || {};
        } catch (error) {
            this._logError('TMDB (getProviders)', error);
            throw new Error('Erro ao buscar provedores do filme.');
        }
    }

    async getBoxOffice(id) {
        try {
            const response = await tmdbClient.get(`/movie/${id}`);
            const imdbId = response.data?.imdb_id;

            if (!imdbId) {
                return { ...DEFAULT_BOX_OFFICE_DATA };
            }

            const omdbResponse = await omdbClient.get('/', {
                params: { i: imdbId }
            });

            return MovieMapper.mapBoxOffice(omdbResponse.data);
        } catch (error) {
            this._logError('OMDB/TMDB (getBoxOffice)', error);
            return { ...DEFAULT_BOX_OFFICE_DATA };
        }
    }

    async getBoxOfficeChart() {
        try {
            const { movies } = await this.getNowPlaying();
            const topMovies = movies.slice(0, 10);

            // Busca os dados de bilheteria em paralelo sem travar a execução total se uma falhar
            const withBoxOffice = await Promise.all(
                topMovies.map(async (movie) => {
                    const boxOffice = await this.getBoxOffice(movie.id);
                    return {
                        ...movie,
                        ...boxOffice
                    };
                })
            );

            return withBoxOffice.sort(
                (a, b) => parseCurrency(b.boxOffice) - parseCurrency(a.boxOffice)
            );
        } catch (error) {
            console.error('❌ Erro ao montar ranking de bilheteria:', error.message);
            throw new Error('Erro ao montar o ranking de bilheteria.');
        }
    }

    /**
     * Helper privado para padronizar os logs de erro do TMDB/OMDB
     */
    _logError(context, error) {
        if (error.response) {
            console.error(`❌ Erro no ${context} [HTTP ${error.response.status}]:`, JSON.stringify(error.response.data));
        } else {
            console.error(`❌ Erro no ${context}:`, error.message);
        }
    }
}

module.exports = new MovieService();