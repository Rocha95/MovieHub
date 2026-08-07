const prisma = require('../config/prisma');
const MovieService = require('./movie.service');

class LibraryService {

    async addMovie(userId, data) {
        // Trata a data enviada (se enviada) ou aplica a data atual caso o status seja WATCHED
        const watchedAt = data.watchedAt 
            ? new Date(data.watchedAt) 
            : (data.status === 'WATCHED' ? new Date() : null);

        const movie = await prisma.userMovie.upsert({
            where: {
                userId_movieId: {
                    userId,
                    movieId: data.movieId
                }
            },
            update: {
                status: data.status,
                ...(data.watchedAt !== undefined && { watchedAt: new Date(data.watchedAt) })
            },
            create: {
                userId,
                movieId: data.movieId,
                status: data.status,
                watchedAt
            }
        });

        return movie;
    }

    async updateMovie(userId, movieId, data) {
        const existing = await prisma.userMovie.findUnique({
            where: {
                userId_movieId: {
                    userId,
                    movieId
                }
            }
        });

        if (!existing) {
            throw new Error('Filme não encontrado na sua biblioteca.');
        }

        // Se uma nova data for enviada em data.watchedAt, converte para objeto Date do JS
        const updateData = { ...data };
        if (data.watchedAt) {
            updateData.watchedAt = new Date(data.watchedAt);
        }

        const movie = await prisma.userMovie.update({
            where: {
                userId_movieId: {
                    userId,
                    movieId
                }
            },
            data: updateData
        });

        return movie;
    }

    async removeMovie(userId, movieId) {
        const existing = await prisma.userMovie.findUnique({
            where: {
                userId_movieId: {
                    userId,
                    movieId
                }
            }
        });

        if (!existing) {
            throw new Error('Filme não encontrado na sua biblioteca.');
        }

        await prisma.userMovie.delete({
            where: {
                userId_movieId: {
                    userId,
                    movieId
                }
            }
        });
    }

    async getLibrary(userId) {
        const library = await prisma.userMovie.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const movies = await Promise.all(
            library.map(async (item) => {
                const movie = await MovieService.getById(
                    item.movieId
                );

                return {
                    movieId: item.movieId,
                    title: movie.title,
                    poster: movie.poster,
                    releaseDate: movie.releaseDate,
                    voteAverage: movie.voteAverage,
                    status: item.status,
                    favorite: item.favorite,
                    rating: item.rating,
                    notes: item.notes,
                    watchedAt: item.watchedAt, // Retorna a data em que o filme foi assistido
                    addedAt: item.createdAt
                };
            })
        );

        return movies;
    }

    async getStats(userId) {
        const library = await prisma.userMovie.findMany({
            where: {
                userId
            }
        });

        const watchedCount = library.filter(
            item => item.status === 'WATCHED'
        ).length;

        const watchlistCount = library.filter(
            item => item.status === 'WATCHLIST'
        ).length;

        const favoritesCount = library.filter(
            item => item.favorite
        ).length;

        const ratedItems = library.filter(
            item => item.rating !== null && item.rating !== undefined
        );

        const averageRating = ratedItems.length
            ? Number(
                (
                    ratedItems.reduce((sum, item) => sum + item.rating, 0) /
                    ratedItems.length
                ).toFixed(1)
            )
            : null;

        const genreCount = {};

        await Promise.all(
            library.map(async (item) => {
                try {
                    const movie = await MovieService.getById(item.movieId);
                    movie.genres.forEach((genre) => {
                        genreCount[genre.name] = (genreCount[genre.name] || 0) + 1;
                    });
                } catch (error) {
                    // ignora filmes que falharem ao buscar detalhes
                }
            })
        );

        const topGenres = Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return {
            totalMovies: library.length,
            watchedCount,
            watchlistCount,
            favoritesCount,
            averageRating,
            ratedCount: ratedItems.length,
            topGenres
        };
    }
}

module.exports = new LibraryService();