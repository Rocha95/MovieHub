const { z } = require('zod');

const registerSchema = z.object({

    name: z
        .string()
        .min(3, 'Nome deve possuir pelo menos 3 caracteres.'),

    email: z
        .email('E-mail inválido.'),

    password: z
        .string()
        .min(6, 'A senha deve possuir pelo menos 6 caracteres.')

});

const loginSchema = z.object({

    email: z
        .email('E-mail inválido.'),

    password: z
        .string()
        .min(1, 'Senha obrigatória.')

});

module.exports = {

    registerSchema,

    loginSchema

};