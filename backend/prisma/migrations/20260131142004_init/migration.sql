/*
  Warnings:

  - Added the required column `creatorWallet` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mintAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "supply" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 6,
    "website" TEXT,
    "twitter" TEXT,
    "telegram" TEXT,
    "discord" TEXT,
    "isListed" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT NOT NULL,
    "creatorWallet" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Token_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Token" ("createdAt", "creatorId", "decimals", "description", "discord", "id", "imageUrl", "isListed", "mintAddress", "name", "supply", "symbol", "telegram", "twitter", "updatedAt", "website") SELECT "createdAt", "creatorId", "decimals", "description", "discord", "id", "imageUrl", "isListed", "mintAddress", "name", "supply", "symbol", "telegram", "twitter", "updatedAt", "website" FROM "Token";
DROP TABLE "Token";
ALTER TABLE "new_Token" RENAME TO "Token";
CREATE UNIQUE INDEX "Token_mintAddress_key" ON "Token"("mintAddress");
CREATE INDEX "Token_mintAddress_idx" ON "Token"("mintAddress");
CREATE INDEX "Token_creatorId_idx" ON "Token"("creatorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
