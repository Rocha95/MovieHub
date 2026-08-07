const express = require('express');

const router = express.Router();

const LibraryController = require('../controllers/library.controller');

const validate = require('../middlewares/validate.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

const {
    addMovieSchema,
    updateMovieSchema,
    movieIdParamSchema
} = require('../validators/library.validator');

router.use(authMiddleware);

router.post(
    '/',
    validate(addMovieSchema),
    LibraryController.addMovie
);

router.get(
    '/',
    LibraryController.getLibrary
);

router.get(
    '/stats',
    LibraryController.getStats
);

router.patch(
    '/:movieId',
    validate(movieIdParamSchema, 'params'),
    validate(updateMovieSchema),
    LibraryController.updateMovie
);

router.delete(
    '/:movieId',
    validate(movieIdParamSchema, 'params'),
    LibraryController.removeMovie
);

module.exports = router;
