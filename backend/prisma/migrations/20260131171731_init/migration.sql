/*
  Warnings:

  - You are about to alter the column `symbol` on the `Token` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mintAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" INTEGER NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "supply" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 6,
    "website" TEXT,
    "twitter" TEXT,
    "telegram" TEXT,
    "discord" TEXT,
    "isListed" BOOLEAN NOT NULL DEFAULT false,
    "creatorWallet" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Token_creatorWallet_fkey" FOREIGN KEY ("creatorWallet") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Token" ("createdAt", "creatorWallet", "decimals", "description", "discord", "id", "imageUrl", "isListed", "mintAddress", "name", "supply", "symbol", "telegram", "twitter", "updatedAt", "website") SELECT "createdAt", "creatorWallet", "decimals", "description", "discord", "id", "imageUrl", "isListed", "mintAddress", "name", "supply", "symbol", "telegram", "twitter", "updatedAt", "website" FROM "Token";
DROP TABLE "Token";
ALTER TABLE "new_Token" RENAME TO "Token";
CREATE UNIQUE INDEX "Token_mintAddress_key" ON "Token"("mintAddress");
CREATE INDEX "Token_mintAddress_idx" ON "Token"("mintAddress");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
