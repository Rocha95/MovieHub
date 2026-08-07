const AuthService = require('../services/auth.service');

class AuthController {

    async register(req, res) {

        const user = await AuthService.register(req.body);

        return res.status(201).json(user);

    }

    async login(req, res) {

    const response = await AuthService.login(req.body);

    return res.json(response);

}

}



module.exports = new AuthController();