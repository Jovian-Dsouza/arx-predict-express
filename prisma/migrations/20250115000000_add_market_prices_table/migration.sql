-- CreateTable
CREATE TABLE "market_prices" (
    "id" SERIAL,
    "marketId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "prob" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_prices_marketId_idx" ON "market_prices"("marketId");
CREATE INDEX "market_prices_timestamp_idx" ON "market_prices"("timestamp");
CREATE INDEX "market_prices_marketId_timestamp_idx" ON "market_prices"("marketId", "timestamp");

-- AddForeignKey
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
