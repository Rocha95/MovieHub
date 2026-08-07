const jwt = require('jsonwebtoken');

function generateToken(user) {

    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1d'
        }
    );

}

module.exports = {
    generateToken
};