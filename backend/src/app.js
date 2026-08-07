const express = require('express');
const cors = require('cors');

const routes = require('./routes');

const errorMiddleware = require('./middlewares/error.middleware');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(routes);

app.use(errorMiddleware);

module.exports = app;
