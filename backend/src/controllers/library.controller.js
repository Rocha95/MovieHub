const LibraryService = require('../services/library.service');

class LibraryController {
  #extractUserId(req) {
    if (!req) return null;
    if (typeof req.user === 'object' && req.user !== null) {
      return req.user.id || req.user.userId || req.user.sub || null;
    }
    return req.user || req.userId || null;
  }

  // Parser robusto para datas (Suporta ISO, YYYY-MM-DD e DD/MM/YYYY)
  #parseDate(dateValue) {
    if (!dateValue) return null;
    
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }

    const strDate = String(dateValue).trim();

    // Suporte ao formato brasileiro DD/MM/YYYY ou DD/MM/YYYY HH:mm
    if (/^\d{2}\/\d{2}\/\d{4}/.test(strDate)) {
      const parts = strDate.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Mês no JS é 0-indexed
      const year = parseInt(parts[2].substring(0, 4), 10);
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Tenta o parser nativo para YYYY-MM-DD ou ISO String
    const parsedDate = new Date(strDate);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    throw { status: 400, message: `Data inválida enviada: "${dateValue}". Use o formato YYYY-MM-DD ou DD/MM/YYYY.` };
  }

  // Parser de nota (0 a 10)
  #parseRating(ratingValue) {
    if (ratingValue === undefined || ratingValue === null || ratingValue === '') {
      return null;
    }
    const parsedRating = Number(ratingValue);
    if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 10) {
      throw { status: 400, message: 'A nota deve ser um número entre 0 e 10.' };
    }
    return parsedRating;
  }

  handleRequest = async (req, res, next, callback, statusCode = 200) => {
    try {
      const userId = this.#extractUserId(req);

      if (!userId) {
        return res.status(401).json({
          message: 'Acesso não autorizado. Usuário não identificado.',
        });
      }

      const result = await callback(Number(userId));
      return res.status(statusCode).json(result);
    } catch (error) {
      if (error.status && error.message) {
        return res.status(error.status).json({ message: error.message });
      }
      console.error('Erro no LibraryController:', error);
      return next(error);
    }
  };

  // POST /library
  addMovie = async (req, res, next) => {
    return this.handleRequest(
      req,
      res,
      next,
      async (userId) => {
        // Exibe no terminal para debug exato do payload do Frontend
        console.log('>>> [LIBRARY CONTROLLER] req.body:', req.body);

        const {
          movieId,
          id, // fallback caso o frontend envie id em vez de movieId
          status,
          watchedAt,
          watchedDate,
          date,
          watched_at,
          rating,
          score,
          nota,
          userRating
        } = req.body;

        const finalMovieId = movieId || id;
        if (!finalMovieId) throw { status: 400, message: 'movieId é obrigatório.' };
        if (!status) throw { status: 400, message: 'status é obrigatório.' };

        const normalizedStatus = String(status).trim().toUpperCase();
        const isWatched = normalizedStatus === 'WATCHED';

        // Captura a data de qualquer uma das chaves possíveis enviadas pelo frontend
        const rawDate = watchedAt || watchedDate || date || watched_at;
        
        // Captura a nota de qualquer uma das chaves possíveis enviadas pelo frontend
        const rawRating = rating !== undefined ? rating : (score !== undefined ? score : (nota !== undefined ? nota : userRating));

        const payload = {
          userId,
          movieId: Number(finalMovieId),
          status: normalizedStatus,
          // Se for WATCHED e houver data, faz o parse. Se não houver data, aí sim usa new Date()
          watchedAt: isWatched ? (rawDate ? this.#parseDate(rawDate) : new Date()) : null,
          rating: isWatched ? this.#parseRating(rawRating) : null,
        };

        console.log('>>> [PAYLOAD SANITIZADO ENVIADO AO SERVICE]:', payload);

        return LibraryService.addMovie(payload);
      },
      201
    );
  };

  getLibrary = async (req, res, next) => {
    return this.handleRequest(req, res, next, (userId) =>
      LibraryService.getLibrary(userId)
    );
  };

  getStats = async (req, res, next) => {
    return this.handleRequest(req, res, next, (userId) =>
      LibraryService.getStats(userId)
    );
  };

  updateMovie = async (req, res, next) => {
    return this.handleRequest(req, res, next, async (userId) => {
      const movieId = Number(req.params.movieId);
      if (!movieId) throw { status: 400, message: 'ID do filme inválido.' };

      const { status, watchedAt, watchedDate, date, rating, score, nota, userRating } = req.body;
      const rawDate = watchedAt || watchedDate || date;
      const rawRating = rating !== undefined ? rating : (score !== undefined ? score : (nota !== undefined ? nota : userRating));

      const payload = {
        userId,
        movieId,
        ...(status && { status: String(status).trim().toUpperCase() }),
        ...(rawDate !== undefined && {
          watchedAt: rawDate ? this.#parseDate(rawDate) : null,
        }),
        ...(rawRating !== undefined && {
          rating: this.#parseRating(rawRating),
        }),
      };

      return LibraryService.updateMovie(payload);
    });
  };

  removeMovie = async (req, res, next) => {
    return this.handleRequest(req, res, next, (userId) => {
      const movieId = Number(req.params.movieId);
      if (!movieId) throw { status: 400, message: 'ID do filme inválido.' };

      return LibraryService.removeMovie(userId, movieId);
    });
  };
}

module.exports = new LibraryController();