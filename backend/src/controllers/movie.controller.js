const MovieService = require('../services/movie.service');

class MovieController {

    handleRequest = async (res, next, callback) => {
        try {
            const result = await callback();
            return res.json(result);
        } catch (error) {
            next(error);
        }
    };

    search = async (req, res, next) => {
        return this.handleRequest(res, next, () => 
            MovieService.search(req.query.query)
        );
    };

    getById = async (req, res, next) => {
        return this.handleRequest(res, next, () =>
            MovieService.getById(req.params.id)
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
        return this.handleRequest(res, next, () =>
            MovieService.getRecommendations(req.params.id)
        );
    };

    getBoxOffice = async (req, res, next) => {
        return this.handleRequest(res, next, () =>
            MovieService.getBoxOffice(req.params.id)
        );
    };

    getBoxOfficeChart = async (req, res, next) => {
        return this.handleRequest(res, next, () =>
            MovieService.getBoxOfficeChart()
        );
    };

}

module.exports = new MovieController();