const tmdbClient = require('../clients/tmdb.client');
const omdbClient = require('../clients/omdb.client');
const MovieMapper = require('../mappers/movie.mapper');

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
            return MovieMapper.mapSearchMovies(response.data.results);
        } catch (error) {
            console.error('❌ Erro no TMDB (search):', error.response?.data || error.message);
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
            console.error('❌ Erro no TMDB (getById):', error.response?.data || error.message);
            throw new Error('Erro ao buscar detalhes do filme.');
        }
    }

    async fetchMovieList(endpoint) {
        try {
            const response = await tmdbClient.get(endpoint);
            return MovieMapper.mapSearchMovies(response.data.results);
        } catch (error) {
            console.error('❌ Erro no TMDB (fetchMovieList):');
            if (error.response) {
                console.error('  Status HTTP:', error.response.status);
                console.error('  Resposta TMDB:', JSON.stringify(error.response.data));
            } else {
                console.error('  Detalhes do Erro:', error.message);
            }

            throw new Error('Erro ao buscar lista de filmes.');
        }
    }

    async getNowPlaying() {
        return this.fetchMovieList('/movie/now_playing');
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
            
            // Retorna os dados agrupados por região (ex: response.data.results.BR)
            return response.data.results || {};
        } catch (error) {
            console.error('❌ Erro no TMDB (getProviders):', error.response?.data || error.message);
            throw new Error('Erro ao buscar provedores do filme.');
        }
    }

    async getBoxOffice(id) {
        try {
            const response = await tmdbClient.get(`/movie/${id}`);
            const imdbId = response.data.imdb_id;

            if (!imdbId) {
                return {
                    available: false,
                    boxOffice: null,
                    imdbRating: null,
                    awards: null
                };
            }

            const omdbResponse = await omdbClient.get('/', {
                params: { i: imdbId }
            });

            return MovieMapper.mapBoxOffice(omdbResponse.data);
        } catch (error) {
            console.error('❌ Erro ao buscar dados de bilheteria:', error.response?.data || error.message);
            throw new Error('Erro ao buscar dados de bilheteria.');
        }
    }

    async getBoxOfficeChart() {
        try {
            const nowPlaying = await this.getNowPlaying();
            const top = nowPlaying.slice(0, 10);

            const withBoxOffice = await Promise.all(
                top.map(async (movie) => {
                    const boxOffice = await this.getBoxOffice(movie.id)
                        .catch(() => ({
                            available: false,
                            boxOffice: null,
                            imdbRating: null,
                            awards: null
                        }));

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
            throw new Error('Erro ao montar o ranking de bilheteria.');
        }
    }
}

module.exports = new MovieService();