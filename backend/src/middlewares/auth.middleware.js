const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Token não informado.'
        });
    }

    const [, token] = authHeader.split(' ');

    try {

        const payload = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = payload.id;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado.'
        });

    }

}

module.exports = authMiddleware;
