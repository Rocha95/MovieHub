
const express = require('express');
const CommentController = require('../controllers/comment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { movieIdParamSchema, commentSchema } = require('../validators/comment.validator');

const router = express.Router();

router.get('/:movieId', validate(movieIdParamSchema, 'params'), CommentController.list);

router.use(authMiddleware);
router.put(
  '/:movieId',
  validate(movieIdParamSchema, 'params'),
  validate(commentSchema),
  CommentController.save
);
router.delete(
  '/:movieId',
  validate(movieIdParamSchema, 'params'),
  CommentController.remove
);

module.exports = router;
