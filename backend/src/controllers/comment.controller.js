
const CommentService = require('../services/comment.service');

class CommentController {
  list = async (req, res, next) => {
    try {
      res.json(await CommentService.list(Number(req.params.movieId)));
    } catch (error) {
      next(error);
    }
  };

  save = async (req, res, next) => {
    try {
      res.status(200).json(
        await CommentService.upsert(req.userId, Number(req.params.movieId), req.body.content)
      );
    } catch (error) {
      next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      res.json(await CommentService.remove(req.userId, Number(req.params.movieId)));
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new CommentController();
