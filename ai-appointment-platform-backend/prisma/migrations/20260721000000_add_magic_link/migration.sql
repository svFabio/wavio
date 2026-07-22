-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN "magicToken" TEXT,
ADD COLUMN "magicLinkExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_magicToken_key" ON "Cliente"("magicToken");
