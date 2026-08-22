const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /lists - Listar todas as listas
router.get('/', async (req, res, next) => {
  try {
    const listas = await prisma.list.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { movies: true },
        },
      },
    });

    const response = listas.map((lista) => ({
      id: lista.id,
      titulo: lista.titulo,
      title: lista.titulo,
      descricao: lista.descricao,
      description: lista.descricao,
      capaUrl: lista.capaUrl,
      filmesCount: lista._count.movies,
      createdAt: lista.createdAt,
    }));

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// GET /lists/:id - Buscar detalhes de uma lista e seus filmes
router.get('/:id', async (req, res, next) => {
  try {
    const listId = Number(req.params.id);

    if (isNaN(listId)) {
      return res.status(400).json({ message: 'ID da lista inválido.' });
    }

    const lista = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        movies: true,
      },
    });

    if (!lista) {
      return res.status(404).json({ message: 'Lista não encontrada.' });
    }

    return res.status(200).json({
      id: lista.id,
      titulo: lista.titulo,
      title: lista.titulo,
      descricao: lista.descricao,
      description: lista.descricao,
      capaUrl: lista.capaUrl,
      userId: lista.userId,
      movies: lista.movies,
      createdAt: lista.createdAt,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da lista:', error);
    next(error);
  }
});

// POST /lists - Criar nova lista
router.post('/', async (req, res, next) => {
  try {
    const titulo = req.body.titulo || req.body.title;
    const descricao = req.body.descricao || req.body.description;
    const userId = req.body.userId ? Number(req.body.userId) : null;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ message: 'O título da lista é obrigatório.' });
    }

    const novaLista = await prisma.list.create({
      data: {
        titulo: titulo.trim(),
        descricao: descricao ? descricao.trim() : '',
        userId: userId,
      },
    });

    return res.status(201).json({
      id: novaLista.id,
      titulo: novaLista.titulo,
      title: novaLista.titulo,
      descricao: novaLista.descricao,
      description: novaLista.descricao,
      filmesCount: 0,
      createdAt: novaLista.createdAt,
    });
  } catch (error) {
    console.error('Erro ao criar lista:', error);
    next(error);
  }
});

// POST /lists/:id/movies - Adicionar filme à lista
router.post('/:id/movies', async (req, res, next) => {
  try {
    const listId = Number(req.params.id);
    const { movieId } = req.body;

    if (isNaN(listId)) {
      return res.status(400).json({ message: 'ID da lista inválido.' });
    }

    if (!movieId) {
      return res.status(400).json({ message: 'O movieId é obrigatório.' });
    }

    const lista = await prisma.list.findUnique({
      where: { id: listId },
    });

    if (!lista) {
      return res.status(404).json({ message: 'Lista não encontrada.' });
    }

    await prisma.listItem.create({
      data: {
        listId: listId,
        movieId: Number(movieId),
      },
    });

    return res.status(200).json({ message: 'Filme adicionado com sucesso!' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Este filme já está nesta lista.' });
    }
    next(error);
  }
});

// DELETE /lists/:id/movies/:movieId - Remover filme de uma lista
router.delete('/:id/movies/:movieId', async (req, res, next) => {
  try {
    const listId = Number(req.params.id);
    const movieId = Number(req.params.movieId);

    if (isNaN(listId) || isNaN(movieId)) {
      return res.status(400).json({ message: 'IDs informados são inválidos.' });
    }

    await prisma.listItem.deleteMany({
      where: {
        listId: listId,
        movieId: movieId,
      },
    });

    return res.status(200).json({ message: 'Filme removido da lista com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover filme da lista:', error);
    next(error);
  }
});

// DELETE /lists/:id - Excluir uma lista inteira
router.delete('/:id', async (req, res, next) => {
  try {
    const listId = Number(req.params.id);

    if (isNaN(listId)) {
      return res.status(400).json({ message: 'ID da lista inválido.' });
    }

    // Remove primeiro todos os itens da lista
    await prisma.listItem.deleteMany({
      where: { listId: listId },
    });

    // Remove a lista
    await prisma.list.delete({
      where: { id: listId },
    });

    return res.status(200).json({ message: 'Lista excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar lista:', error);
    next(error);
  }
});

module.exports = router;