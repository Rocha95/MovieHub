const prisma = require('../config/prisma');

class LibraryService {
  /**
   * Helper privado para buscar os detalhes do filme diretamente da API do TMDB
   */
  async #fetchTmdbMovie(movieId) {
    try {
      const token = process.env.TMDB_READ_TOKEN || process.env.TMDB_TOKEN;
      const apiKey = process.env.TMDB_API_KEY;

      let url = `https://api.themoviedb.org/3/movie/${movieId}?language=pt-BR`;
      const headers = { accept: 'application/json' };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else if (apiKey) {
        url += `&api_key=${apiKey}`;
      } else {
        console.warn('[LibraryService] Nenhuma chave/token do TMDB configurado nas variáveis de ambiente.');
        return null;
      }

      const response = await fetch(url, { headers });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(`[LibraryService] Erro ao buscar filme ${movieId} no TMDB:`, error.message);
      return null;
    }
  }

  /**
   * Helper privado para converter e sanitizar a data
   */
  #parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  /**
   * Helper privado para converter e sanitizar o rating (Float de 0 a 10)
   */
  #parseRating(value) {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    if (isNaN(num)) return null;
    return Math.min(Math.max(num, 0), 10);
  }

  /**
   * Adiciona ou atualiza (Upsert) um filme na biblioteca do usuário.
   */
  async addMovie(data = {}) {
    const { userId, movieId, status, watchedAt, watchedDate, rating, score } = data;

    const parsedUserId = Number(userId);
    const parsedMovieId = Number(movieId);

    // Validação estrita para evitar passar NaN ou ID inválido para a FK do Prisma
    if (!parsedUserId || isNaN(parsedUserId)) {
      throw new Error('ID do usuário inválido ou não autenticado.');
    }

    if (!parsedMovieId || isNaN(parsedMovieId)) {
      throw new Error('ID do filme é obrigatório e deve ser um número válido.');
    }

    // Verifica se o usuário realmente existe na tabela 'users' para evitar P2003
    const userExists = await prisma.user.findUnique({
      where: { id: parsedUserId },
      select: { id: true },
    });

    if (!userExists) {
      throw new Error(`Usuário ID ${parsedUserId} não foi encontrado no banco de dados.`);
    }

    const normalizedStatus = status ? String(status).trim().toUpperCase() : 'WATCHLIST';
    const isWatched = normalizedStatus === 'WATCHED';

    const rawDate = watchedAt || watchedDate;
    const rawRating = rating !== undefined && rating !== null ? rating : score;

    const finalWatchedAt = isWatched ? this.#parseDate(rawDate) : null;
    const finalRating = isWatched ? this.#parseRating(rawRating) : null;

    const payloadData = {
      userId: parsedUserId,
      movieId: parsedMovieId,
      status: normalizedStatus,
      watchedAt: finalWatchedAt,
      rating: finalRating,
    };

    return prisma.userMovie.upsert({
      where: {
        userId_movieId: {
          userId: parsedUserId,
          movieId: parsedMovieId,
        },
      },
      update: {
        status: payloadData.status,
        watchedAt: payloadData.watchedAt,
        rating: payloadData.rating,
      },
      create: payloadData,
    });
  }

  /**
   * Retorna os filmes salvos na biblioteca do usuário enriquecidos com metadados do TMDB (Poster, Título, Ano).
   */
  async getLibrary(userId) {
    const parsedUserId = Number(userId);
    if (!parsedUserId || isNaN(parsedUserId)) return [];

    const userMovies = await prisma.userMovie.findMany({
      where: {
        userId: parsedUserId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!userMovies.length) return [];

    const enrichedMovies = await Promise.all(
      userMovies.map(async (item) => {
        const movieDetails = await this.#fetchTmdbMovie(item.movieId);

        const posterPath = movieDetails?.poster_path;
        const fullPosterUrl = posterPath
          ? `https://image.tmdb.org/t/p/w500${posterPath}`
          : null;

        return {
          ...item,
          title: movieDetails?.title || `Filme #${item.movieId}`,
          releaseDate: movieDetails?.release_date || null,
          poster: fullPosterUrl,
        };
      })
    );

    return enrichedMovies;
  }

  /**
   * Estatísticas de filmes assistidos e na lista de desejos.
   */
  async getStats(userId) {
    const parsedUserId = Number(userId);
    if (!parsedUserId || isNaN(parsedUserId)) {
      return { total: 0, watchedCount: 0, watchlistCount: 0 };
    }

    const counts = await prisma.userMovie.groupBy({
      by: ['status'],
      where: {
        userId: parsedUserId,
      },
      _count: {
        _all: true,
      },
    });

    const statsMap = counts.reduce((acc, group) => {
      acc[group.status] = group._count._all;
      return acc;
    }, {});

    const watchedCount = statsMap['WATCHED'] || 0;
    const watchlistCount = statsMap['WATCHLIST'] || 0;

    return {
      total: watchedCount + watchlistCount,
      watchedCount,
      watchlistCount,
    };
  }

  /**
   * Atualiza registro específico no banco.
   */
  async updateMovie(data = {}) {
    const { userId, movieId, status, watchedAt, watchedDate, rating, score, favorite } = data;

    const parsedUserId = Number(userId);
    const parsedMovieId = Number(movieId);

    if (!parsedUserId || isNaN(parsedUserId) || !parsedMovieId || isNaN(parsedMovieId)) {
      throw new Error('IDs de usuário e filme são obrigatórios para atualização.');
    }

    const updateData = {};

    if (favorite !== undefined) {
      updateData.favorite = Boolean(favorite);
    }

    if (status !== undefined) {
      const normalizedStatus = String(status).trim().toUpperCase();
      updateData.status = normalizedStatus;

      if (normalizedStatus === 'WATCHLIST') {
        updateData.watchedAt = null;
        updateData.rating = null;
      }
    }

    if (updateData.status !== 'WATCHLIST') {
      const rawDate = watchedAt || watchedDate;
      const rawRating = rating !== undefined && rating !== null ? rating : score;

      if (rawDate !== undefined) {
        updateData.watchedAt = this.#parseDate(rawDate);
      }
      if (rawRating !== undefined) {
        updateData.rating = this.#parseRating(rawRating);
      }
    }

    return prisma.userMovie.update({
      where: {
        userId_movieId: {
          userId: parsedUserId,
          movieId: parsedMovieId,
        },
      },
      data: updateData,
    });
  }

  /**
   * Remove um filme da biblioteca.
   */
  async removeMovie(userId, movieId) {
    const parsedUserId = Number(userId);
    const parsedMovieId = Number(movieId);

    if (!parsedUserId || isNaN(parsedUserId) || !parsedMovieId || isNaN(parsedMovieId)) {
      return { count: 0 };
    }

    return prisma.userMovie.deleteMany({
      where: {
        userId: parsedUserId,
        movieId: parsedMovieId,
      },
    });
  }
}

module.exports = new LibraryService();