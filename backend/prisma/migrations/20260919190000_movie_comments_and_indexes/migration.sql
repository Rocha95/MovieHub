
-- Movie comments are linked to the user's watched movie record.
CREATE TABLE "movie_comments" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "movieId" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "movie_comments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "movie_comments_userId_movieId_key"
  ON "movie_comments"("userId", "movieId");

CREATE INDEX "movie_comments_movieId_createdAt_idx"
  ON "movie_comments"("movieId", "createdAt");

CREATE INDEX "UserMovie_userId_status_idx"
  ON "UserMovie"("userId", "status");

CREATE INDEX "UserMovie_userId_watchedAt_idx"
  ON "UserMovie"("userId", "watchedAt");

ALTER TABLE "movie_comments"
  ADD CONSTRAINT "movie_comments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "movie_comments"
  ADD CONSTRAINT "movie_comments_userId_movieId_fkey"
  FOREIGN KEY ("userId", "movieId") REFERENCES "UserMovie"("userId", "movieId")
  ON DELETE CASCADE ON UPDATE CASCADE;
