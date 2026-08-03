-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "ipAddress" TEXT,
    "success" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TotpCredential" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TotpCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCode" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAttempt_username_timestamp_idx" ON "LoginAttempt"("username", "timestamp");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_timestamp_idx" ON "LoginAttempt"("ipAddress", "timestamp");

-- CreateIndex
CREATE INDEX "LoginAttempt_timestamp_idx" ON "LoginAttempt"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "TotpCredential_user_id_key" ON "TotpCredential"("user_id");

-- CreateIndex
CREATE INDEX "TotpCredential_user_id_idx" ON "TotpCredential"("user_id");

-- CreateIndex
CREATE INDEX "RecoveryCode_user_id_idx" ON "RecoveryCode"("user_id");

-- AddForeignKey
ALTER TABLE "TotpCredential" ADD CONSTRAINT "TotpCredential_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCode" ADD CONSTRAINT "RecoveryCode_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
