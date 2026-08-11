const { z } = require('zod');

// Validação para ADICIONAR ou ATUALIZAR via POST /library
const addMovieSchema = z.object({
  movieId: z
    .number({
      required_error: 'O ID do filme é obrigatório.',
    })
    .int()
    .positive(),

  status: z.enum(['WATCHLIST', 'WATCHED']),

  // Aceita variações de data no envio
  watchedAt: z.union([z.string(), z.date()]).nullable().optional(),
  watchedDate: z.union([z.string(), z.date()]).nullable().optional(),

  // Aceita notas de 0 a 10 (conforme seu slider do frontend)
  rating: z
    .number()
    .min(0, 'A nota deve ser no mínimo 0.')
    .max(10, 'A nota deve ser no máximo 10.')
    .nullable()
    .optional(),

  score: z
    .number()
    .min(0, 'A nota deve ser no mínimo 0.')
    .max(10, 'A nota deve ser no máximo 10.')
    .nullable()
    .optional(),

  favorite: z.boolean().optional(),

  notes: z
    .string()
    .max(1000, 'A anotação deve ter no máximo 1000 caracteres.')
    .nullable()
    .optional(),
});

// Validação para requisições PUT/PATCH
const updateMovieSchema = z.object({
  status: z.enum(['WATCHLIST', 'WATCHED']).optional(),

  favorite: z.boolean().optional(),

  watchedAt: z.union([z.string(), z.date()]).nullable().optional(),
  watchedDate: z.union([z.string(), z.date()]).nullable().optional(),

  rating: z
    .number()
    .min(0, 'A nota deve ser entre 0 e 10.')
    .max(10, 'A nota deve ser entre 0 e 10.')
    .nullable()
    .optional(),

  notes: z
    .string()
    .max(1000, 'A anotação deve ter no máximo 1000 caracteres.')
    .nullable()
    .optional(),
});

const movieIdParamSchema = z.object({
  movieId: z
    .string({
      required_error: 'O ID do filme é obrigatório.',
    })
    .regex(/^\d+$/, 'O ID do filme deve ser numérico.'),
});

module.exports = {
  addMovieSchema,
  updateMovieSchema,
  movieIdParamSchema,
};