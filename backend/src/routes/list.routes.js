const express = require('express');
const router = express.Router();

// Array em memória para testes (substitua pela sua lógica com banco de dados)
let listas = [];

// GET /lists
router.get('/', async (req, res, next) => {
  try {
    return res.status(200).json(listas);
  } catch (error) {
    next(error);
  }
});

// POST /lists
router.post('/', async (req, res, next) => {
  try {
    const { titulo, descricao } = req.body;

    if (!titulo) {
      const error = new Error('O título é obrigatório.');
      error.statusCode = 400;
      throw error;
    }

    const novaLista = {
      id: Date.now(),
      titulo,
      descricao: descricao || '',
      filmesCount: 0,
      capaUrl: null,
      createdAt: new Date()
    };

    listas.unshift(novaLista);
    return res.status(201).json(novaLista);
  } catch (error) {
    next(error);
  }
});

module.exports = router;