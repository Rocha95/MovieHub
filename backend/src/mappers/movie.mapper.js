const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const PROFILE_URL = 'https://image.tmdb.org/t/p/w185';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

class MovieMapper {

    mapSearchMovies(results) {

        return results.map(movie => ({

            id: movie.id,

            title: movie.title,

            overview: movie.overview,

            releaseDate: movie.release_date,

            voteAverage: movie.vote_average,

            poster: movie.poster_path
                ? `${IMAGE_URL}${movie.poster_path}`
                : null

        }));

    }

    mapMovieDetails(movie) {

        const director = movie.credits?.crew.find(
            person => person.job === 'Director'
        );

        const trailer = movie.videos?.results.find(
            video =>
                video.type === 'Trailer' &&
                video.site === 'YouTube'
        );

        return {

            id: movie.id,

            title: movie.title,

            originalTitle: movie.original_title,

            tagline: movie.tagline,

            overview: movie.overview,

            releaseDate: movie.release_date,

            runtime: movie.runtime,

            status: movie.status,

            language: movie.original_language,

            voteAverage: movie.vote_average,

            voteCount: movie.vote_count,

            popularity: movie.popularity,

            poster: movie.poster_path
                ? `${IMAGE_URL}${movie.poster_path}`
                : null,

            backdrop: movie.backdrop_path
                ? `${BACKDROP_URL}${movie.backdrop_path}`
                : null,

            genres: movie.genres.map(genre => ({

                id: genre.id,

                name: genre.name

            })),

            director: director
                ? director.name
                : null,

            cast: movie.credits.cast
                .slice(0, 5)
                .map(actor => ({

                    id: actor.id,

                    name: actor.name,

                    character: actor.character,

                    profile: actor.profile_path
                        ? `${PROFILE_URL}${actor.profile_path}`
                        : null

                })),

            trailer: trailer
                ? `https://www.youtube.com/watch?v=${trailer.key}`
                : null

        };

    }

    mapBoxOffice(data) {

        if (!data || data.Response === 'False') {
            return {
                available: false,
                boxOffice: null,
                imdbRating: null,
                awards: null
            };
        }

        const boxOffice = data.BoxOffice && data.BoxOffice !== 'N/A'
            ? data.BoxOffice
            : null;

        return {

            available: Boolean(boxOffice),

            boxOffice,

            imdbRating: data.imdbRating && data.imdbRating !== 'N/A'
                ? data.imdbRating
                : null,

            awards: data.Awards && data.Awards !== 'N/A'
                ? data.Awards
                : null

        };

    }

}

module.exports = new MovieMapper();