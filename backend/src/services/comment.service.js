
const prisma = require('../config/prisma');

class CommentService {
  async list(movieId) {
    return prisma.movieComment.findMany({
      where: { movieId: Number(movieId) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        movieId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async upsert(userId, movieId, content) {
    const userMovie = await prisma.userMovie.findUnique({
      where: {
        userId_movieId: {
          userId: Number(userId),
          movieId: Number(movieId),
        },
      },
      select: { status: true },
    });

    if (!userMovie || userMovie.status !== 'WATCHED') {
      const error = new Error('Você precisa registrar o filme como assistido antes de comentar.');
      error.status = 403;
      throw error;
    }

    return prisma.movieComment.upsert({
      where: {
        userId_movieId: {
          userId: Number(userId),
          movieId: Number(movieId),
        },
      },
      update: { content: content.trim() },
      create: {
        userId: Number(userId),
        movieId: Number(movieId),
        content: content.trim(),
      },
      select: {
        id: true,
        movieId: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async remove(userId, movieId) {
    return prisma.movieComment.deleteMany({
      where: { userId: Number(userId), movieId: Number(movieId) },
    });
  }
}

module.exports = new CommentService();
