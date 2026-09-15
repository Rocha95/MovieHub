const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 1. Ajuste do caminho: sobe 2 níveis (src/routes/ -> backend/) para acessar /backend/Uploads
// IMPORTANTE: o nome da pasta precisa bater EXATAMENTE (maiúsculas/minúsculas) com a pasta
// real do projeto (MovieHub\backend\Uploads) e com o que estiver configurado no
// express.static() do server.js/app.js. Em sistemas de arquivo case-sensitive (Linux/produção),
// "uploads" e "Uploads" são pastas diferentes.
const uploadDir = path.join(__dirname, '..', '..', 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configuração do Multer (Armazenamento em Disco)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `capa-${uniqueSuffix}${ext}`);
  },
});

// Filtro para aceitar somente imagens
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Helper para construir URL acessível do arquivo uploadado
// Precisa usar o MESMO prefixo/caso configurado na rota estática do servidor
// (ex: app.use('/Uploads', express.static(path.join(__dirname, 'Uploads'))) )
const getFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/Uploads/${filename}`;
};

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

// POST /lists - Criar nova lista (Suporta FormData com arquivo ou JSON com URL)
router.post('/', upload.single('capa'), async (req, res, next) => {
  try {
    const titulo = req.body.titulo || req.body.title;
    const descricao = req.body.descricao || req.body.description;
    const userId = req.body.userId ? Number(req.body.userId) : null;

    // Procura por capas enviadas via arquivo (req.file) ou via texto em variações comuns
    let capaUrl = null;
    if (req.file) {
      capaUrl = getFileUrl(req, req.file.filename);
    } else if (req.body.capaUrl || req.body.novaCapaUrl || req.body.capa) {
      capaUrl = req.body.capaUrl || req.body.novaCapaUrl || req.body.capa;
    }

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ message: 'O título da lista é obrigatório.' });
    }

    const novaLista = await prisma.list.create({
      data: {
        titulo: titulo.trim(),
        descricao: descricao ? descricao.trim() : '',
        capaUrl: capaUrl ? capaUrl.trim() : null,
        userId: userId,
      },
    });

    return res.status(201).json({
      id: novaLista.id,
      titulo: novaLista.titulo,
      title: novaLista.titulo,
      descricao: novaLista.descricao,
      description: novaLista.descricao,
      capaUrl: novaLista.capaUrl,
      filmesCount: 0,
      createdAt: novaLista.createdAt,
    });
  } catch (error) {
    console.error('Erro ao criar lista:', error);
    next(error);
  }
});

// PATCH /lists/:id - Atualizar informações da lista (Suporta Multipart FormData e JSON)
router.patch('/:id', upload.single('capa'), async (req, res, next) => {
  try {
    const listId = Number(req.params.id);

    if (isNaN(listId)) {
      return res.status(400).json({ message: 'ID da lista inválido.' });
    }

    const titulo = req.body.titulo || req.body.title;
    const descricao = req.body.descricao || req.body.description;
    
    // Captura valores enviados em texto caso não venha arquivo
    let capaUrl = req.body.capaUrl || req.body.novaCapaUrl || req.body.capa;

    // Se o Multer processou um arquivo novo, sobrescreve a URL
    if (req.file) {
      capaUrl = getFileUrl(req, req.file.filename);
    }

    const dataToUpdate = {};
    if (capaUrl !== undefined && capaUrl !== null) {
      dataToUpdate.capaUrl = capaUrl.trim();
    }
    if (titulo !== undefined) {
      dataToUpdate.titulo = titulo.trim();
    }
    if (descricao !== undefined) {
      dataToUpdate.descricao = descricao.trim();
    }

    const listaAtualizada = await prisma.list.update({
      where: { id: listId },
      data: dataToUpdate,
    });

    return res.status(200).json({
      id: listaAtualizada.id,
      titulo: listaAtualizada.titulo,
      title: listaAtualizada.titulo,
      descricao: listaAtualizada.descricao,
      description: listaAtualizada.descricao,
      capaUrl: listaAtualizada.capaUrl,
      createdAt: listaAtualizada.createdAt,
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Lista não encontrada.' });
    }
    console.error('Erro ao atualizar lista:', error);
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