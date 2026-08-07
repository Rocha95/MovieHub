const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');

class AuthService {

    async register(data) {

        // Verifica se o e-mail já existe
        const existingUser = await prisma.user.findUnique({
            where: {
                email: data.email
            }
        });

        if (existingUser) {
            throw new Error('E-mail já cadastrado.');
        }

        // Criptografa a senha
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Salva o usuário
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword
            }
        });

        // Retorna sem a senha
        return {
            id: user.id,
            name: user.name,
            email: user.email
        };
    }

    async login(data) {

        // Procura o usuário pelo e-mail
        const user = await prisma.user.findUnique({
            where: {
                email: data.email
            }
        });

        if (!user) {
            throw new Error('Usuário não encontrado.');
        }

        // Compara a senha informada com o hash salvo
        const passwordIsValid = await bcrypt.compare(
            data.password,
            user.password
        );

        if (!passwordIsValid) {
            throw new Error('Senha inválida.');
        }

        // Gera o token JWT
        const token = generateToken(user);

        // Retorna os dados do usuário e o token
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        };
    }

}

module.exports = new AuthService();