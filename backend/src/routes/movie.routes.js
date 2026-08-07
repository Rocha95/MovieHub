const express = require('express');

const MovieController = require('../controllers/movie.controller');

const validate = require('../middlewares/validate.middleware');

const {
    searchMovieSchema,
    movieIdSchema
} = require('../validators/movie.validator');

const router = express.Router();

router.get(
    '/search',
    validate(searchMovieSchema, 'query'),
    MovieController.search
);

router.get(
    '/popular',
    MovieController.getPopular
);

router.get(
    '/top-rated',
    MovieController.getTopRated
);

router.get(
    '/upcoming',
    MovieController.getUpcoming
);

router.get(
    '/now-playing',
    MovieController.getNowPlaying
);

router.get(
    '/bilheteria',
    MovieController.getBoxOfficeChart
);

router.get(
    '/:id/recommendations',
    validate(movieIdSchema, 'params'),
    MovieController.getRecommendations
);

router.get(
    '/:id/boxoffice',
    validate(movieIdSchema, 'params'),
    MovieController.getBoxOffice
);

router.get(
    '/:id',
    validate(movieIdSchema, 'params'),
    MovieController.getById
);

module.exports = router;