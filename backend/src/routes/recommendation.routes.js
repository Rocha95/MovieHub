
const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const RecommendationController = require('../controllers/recommendation.controller');

const router = express.Router();
router.use(authMiddleware);
router.get('/personalized', RecommendationController.getPersonal);

module.exports = router;
