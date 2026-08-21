const express = require('express');

const authRoutes = require('./auth.routes');
const movieRoutes = require('./movie.routes');
const libraryRoutes = require('./library.routes');
const listRoutes = require('./list.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/movies', movieRoutes);
router.use('/library', libraryRoutes);
router.use('/lists', listRoutes);

module.exports = router;