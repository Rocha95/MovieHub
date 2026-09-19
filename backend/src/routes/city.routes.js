
const express = require('express');
const CityController = require('../controllers/city.controller');

const router = express.Router();
router.get('/', CityController.list);

module.exports = router;
