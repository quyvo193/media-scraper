-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_jobs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "urls" TEXT[],
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "scrape_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "source_url" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "scrape_jobs_status_idx" ON "scrape_jobs"("status");

-- CreateIndex
CREATE INDEX "scrape_jobs_created_at_idx" ON "scrape_jobs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "scrape_jobs_user_id_idx" ON "scrape_jobs"("user_id");

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "media_created_at_idx" ON "media"("created_at" DESC);

-- CreateIndex
CREATE INDEX "media_job_id_idx" ON "media"("job_id");

-- CreateIndex
CREATE INDEX "media_source_url_idx" ON "media"("source_url");

-- AddForeignKey
ALTER TABLE "scrape_jobs" ADD CONSTRAINT "scrape_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "scrape_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
