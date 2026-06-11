-- CreateTable
CREATE TABLE "ExportTicket" (
    "id" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExportTicket_userId_idx" ON "ExportTicket"("userId");

-- AddForeignKey
ALTER TABLE "ExportTicket" ADD CONSTRAINT "ExportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
