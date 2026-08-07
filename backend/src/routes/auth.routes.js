const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');

const {
    registerSchema,
    loginSchema
} = require('../validators/auth.validator');

router.post(
    '/register',
    validate(registerSchema),
    AuthController.register
);

router.post(
    '/login',
    validate(loginSchema),
    AuthController.login
);

module.exports = router;