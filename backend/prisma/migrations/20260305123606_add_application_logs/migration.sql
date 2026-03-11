-- CreateTable
CREATE TABLE "application_logs" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "response_time" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "application_logs" ADD CONSTRAINT "application_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
