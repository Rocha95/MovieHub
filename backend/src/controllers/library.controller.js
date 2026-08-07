const LibraryService = require('../services/library.service');

class LibraryController {

    async addMovie(req, res, next) {

        try {

            const movie = await LibraryService.addMovie(
                req.userId,
                req.body
            );

            return res.status(201).json(movie);

        } catch (error) {

            next(error);

        }

    }

    async getLibrary(req, res, next) {

        try {

            const library = await LibraryService.getLibrary(
                req.userId
            );

            return res.json(library);

        } catch (error) {

            next(error);

        }

    }

    async updateMovie(req, res, next) {

        try {

            const movie = await LibraryService.updateMovie(
                req.userId,
                Number(req.params.movieId),
                req.body
            );

            return res.json(movie);

        } catch (error) {

            next(error);

        }

    }

    async removeMovie(req, res, next) {

        try {

            await LibraryService.removeMovie(
                req.userId,
                Number(req.params.movieId)
            );

            return res.status(204).send();

        } catch (error) {

            next(error);

        }

    }

    async getStats(req, res, next) {

        try {

            const stats = await LibraryService.getStats(
                req.userId
            );

            return res.json(stats);

        } catch (error) {

            next(error);

        }

    }

}

module.exports = new LibraryController();
