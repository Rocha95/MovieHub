const path = require('path');
const express = require('express');
const cors = require('cors');

const routes = require('./routes');

const errorMiddleware = require('./middlewares/error.middleware');

require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve os arquivos da pasta Uploads (localizada em backend/Uploads) publicamente
// em /Uploads/<nome-do-arquivo>. O nome da pasta e o prefixo da rota precisam
// bater EXATAMENTE (maiúsculas/minúsculas) com o que é usado em list.routes.js
// (uploadDir e getFileUrl).
app.use('/Uploads', express.static(path.join(__dirname, '..', 'Uploads')));

app.use(routes);

app.use(errorMiddleware);

module.exports = app;
