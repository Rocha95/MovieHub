const express = require('express');

const authRoutes = require('./auth.routes');

const router = express.Router();

const movieRoutes = require('./movie.routes');

const libraryRoutes = require('./library.routes');

router.use('/library', libraryRoutes);

router.use('/auth', authRoutes);

router.use('/movies', movieRoutes);

module.exports = router;