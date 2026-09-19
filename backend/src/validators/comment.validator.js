
const { z } = require('zod');

const movieIdParamSchema = z.object({
  movieId: z.string().regex(/^\d+$/, 'O ID do filme deve ser numérico.'),
});

const commentSchema = z.object({
  content: z.string().trim().min(1, 'O comentário não pode ficar vazio.').max(2000),
});

module.exports = { movieIdParamSchema, commentSchema };
