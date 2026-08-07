const { z } = require('zod');

const searchMovieSchema = z.object({

    query: z
        .string({
            required_error: 'O parâmetro "query" é obrigatório.'
        })
        .trim()
        .min(1, 'Informe o nome de um filme para pesquisar.')

});

const movieIdSchema = z.object({

    id: z
        .string({
            required_error: 'O ID do filme é obrigatório.'
        })
        .regex(/^\d+$/, 'O ID do filme deve ser numérico.')

});

module.exports = {

    searchMovieSchema,

    movieIdSchema

};