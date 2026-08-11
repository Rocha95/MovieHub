const MovieService = require('../services/movie.service');

class MovieController {
  /**
   * Helper genérico para execução segura de handlers e repasse de erros ao middleware.
   */
  handleRequest = async (res, next, callback, statusCode = 200) => {
    try {
      const result = await callback();
      return res.status(statusCode).json(result);
    } catch (error) {
      return next(error);
    }
  };

  search = async (req, res, next) => {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.status(400).json({
        message: 'O parâmetro de busca "query" é obrigatório.',
      });
    }

    return this.handleRequest(res, next, () =>
      MovieService.search(query.trim())
    );
  };

  getById = async (req, res, next) => {
    const { id } = req.params;
    return this.handleRequest(res, next, () =>
      MovieService.getById(id)
    );
  };

  getPopular = async (req, res, next) => {
    return this.handleRequest(res, next, () =>
      MovieService.getPopular()
    );
  };

  getTopRated = async (req, res, next) => {
    return this.handleRequest(res, next, () =>
      MovieService.getTopRated()
    );
  };

  getUpcoming = async (req, res, next) => {
    return this.handleRequest(res, next, () =>
      MovieService.getUpcoming()
    );
  };

  getNowPlaying = async (req, res, next) => {
    return this.handleRequest(res, next, () =>
      MovieService.getNowPlaying()
    );
  };

  getRecommendations = async (req, res, next) => {
    const { id } = req.params;
    return this.handleRequest(res, next, () =>
      MovieService.getRecommendations(id)
    );
  };

  getBoxOffice = async (req, res, next) => {
    const { id } = req.params;
    return this.handleRequest(res, next, () =>
      MovieService.getBoxOffice(id)
    );
  };

  getBoxOfficeChart = async (req, res, next) => {
    return this.handleRequest(res, next, () =>
      MovieService.getBoxOfficeChart()
    );
  };
}

module.exports = new MovieController();