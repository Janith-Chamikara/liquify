-- CreateTable
CREATE TABLE "LiquidityPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolAddress" TEXT NOT NULL,
    "tokenAMint" TEXT NOT NULL,
    "tokenBMint" TEXT NOT NULL,
    "lpMintAddress" TEXT NOT NULL,
    "vaultAAddress" TEXT NOT NULL,
    "vaultBAddress" TEXT NOT NULL,
    "tokenAReserve" REAL NOT NULL DEFAULT 0,
    "tokenBReserve" REAL NOT NULL DEFAULT 0,
    "lpTotalSupply" REAL NOT NULL DEFAULT 0,
    "creatorWallet" TEXT NOT NULL,
    "txSignature" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LiquidityPool_tokenAMint_fkey" FOREIGN KEY ("tokenAMint") REFERENCES "Token" ("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LiquidityPool_tokenBMint_fkey" FOREIGN KEY ("tokenBMint") REFERENCES "Token" ("mintAddress") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LiquidityPool_creatorWallet_fkey" FOREIGN KEY ("creatorWallet") REFERENCES "User" ("walletAddress") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPool_poolAddress_key" ON "LiquidityPool"("poolAddress");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPool_lpMintAddress_key" ON "LiquidityPool"("lpMintAddress");

-- CreateIndex
CREATE INDEX "LiquidityPool_poolAddress_idx" ON "LiquidityPool"("poolAddress");

-- CreateIndex
CREATE INDEX "LiquidityPool_tokenAMint_idx" ON "LiquidityPool"("tokenAMint");

-- CreateIndex
CREATE INDEX "LiquidityPool_tokenBMint_idx" ON "LiquidityPool"("tokenBMint");

-- CreateIndex
CREATE INDEX "LiquidityPool_creatorWallet_idx" ON "LiquidityPool"("creatorWallet");
