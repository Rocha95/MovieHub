const { z } = require('zod');

const addMovieSchema = z.object({

    movieId: z
        .number({
            required_error: 'O ID do filme é obrigatório.'
        })
        .int()
        .positive(),

    status: z.enum([
        'WATCHLIST',
        'WATCHED'
    ])

});

const updateMovieSchema = z.object({

    status: z
        .enum(['WATCHLIST', 'WATCHED'])
        .optional(),

    favorite: z
        .boolean()
        .optional(),

    rating: z
        .number()
        .int()
        .min(1, 'A nota deve ser entre 1 e 5.')
        .max(5, 'A nota deve ser entre 1 e 5.')
        .nullable()
        .optional(),

    notes: z
        .string()
        .max(1000, 'A anotação deve ter no máximo 1000 caracteres.')
        .nullable()
        .optional()

});

const movieIdParamSchema = z.object({

    movieId: z
        .string({
            required_error: 'O ID do filme é obrigatório.'
        })
        .regex(/^\d+$/, 'O ID do filme deve ser numérico.')

});

module.exports = {

    addMovieSchema,

    updateMovieSchema,

    movieIdParamSchema

};
