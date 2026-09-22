const prisma = require('../config/prisma');

/**
 * Comments are persisted with parameterized SQL instead of the generated
 * `prisma.movieComment` delegate. This keeps the feature compatible with
 * environments where @prisma/client was generated before MovieComment was
 * added to schema.prisma.
 */
class CommentService {
  async list(movieId) {
    const id = Number(movieId);

    return prisma.$queryRaw`
      SELECT
        mc."id",
        mc."movieId",
        mc."content",
        mc."createdAt",
        mc."updatedAt",
        u."id" AS "userId",
        u."name" AS "userName"
      FROM "movie_comments" mc
      INNER JOIN "users" u ON u."id" = mc."userId"
      WHERE mc."movieId" = ${id}
      ORDER BY mc."createdAt" DESC
    `.then(rows => rows.map(row => ({
      id: Number(row.id),
      movieId: Number(row.movieId),
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        id: Number(row.userId),
        name: row.userName,
      },
    })));
  }

  async upsert(userId, movieId, content) {
    const user = Number(userId);
    const movie = Number(movieId);
    const text = String(content || '').trim();

    const watched = await prisma.$queryRaw`
      SELECT 1
      FROM "UserMovie"
      WHERE "userId" = ${user}
        AND "movieId" = ${movie}
        AND "status" = 'WATCHED'
      LIMIT 1
    `;

    if (watched.length === 0) {
      const error = new Error('Você precisa registrar o filme como assistido antes de comentar.');
      error.status = 403;
      throw error;
    }

    const rows = await prisma.$queryRaw`
      INSERT INTO "movie_comments" (
        "userId", "movieId", "content", "createdAt", "updatedAt"
      )
      VALUES (
        ${user}, ${movie}, ${text}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("userId", "movieId")
      DO UPDATE SET
        "content" = EXCLUDED."content",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "movieId", "content", "createdAt", "updatedAt"
    `;

    const comment = rows[0];

    return {
      id: Number(comment.id),
      movieId: Number(comment.movieId),
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        id: user,
        name: (await prisma.$queryRaw`
          SELECT "name" FROM "users" WHERE "id" = ${user} LIMIT 1
        `)[0]?.name,
      },
    };
  }

  async remove(userId, movieId) {
    const result = await prisma.$executeRaw`
      DELETE FROM "movie_comments"
      WHERE "userId" = ${Number(userId)}
        AND "movieId" = ${Number(movieId)}
    `;

    return { count: result };
  }
}

module.exports = new CommentService();
