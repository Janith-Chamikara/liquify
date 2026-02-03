-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "tokenAReserve" REAL NOT NULL,
    "tokenBReserve" REAL NOT NULL,
    "txSignature" TEXT,
    "txType" TEXT NOT NULL DEFAULT 'swap',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceHistory_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "LiquidityPool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PriceHistory_poolId_idx" ON "PriceHistory"("poolId");

-- CreateIndex
CREATE INDEX "PriceHistory_timestamp_idx" ON "PriceHistory"("timestamp");

-- CreateIndex
CREATE INDEX "PriceHistory_poolId_timestamp_idx" ON "PriceHistory"("poolId", "timestamp");
