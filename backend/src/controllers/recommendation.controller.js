
const PersonalRecommendationService = require('../services/personal-recommendation.service');

class RecommendationController {
  getPersonal = async (req, res, next) => {
    try {
      const limit = Number(req.query.limit || 12);
      const result = await PersonalRecommendationService.getForUser(req.userId, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new RecommendationController();
