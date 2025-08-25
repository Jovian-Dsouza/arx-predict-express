-- CreateTable
CREATE TABLE "markets" (
    "id" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "probs" DOUBLE PRECISION[],
    "votes" INTEGER[],
    "liquidityParameter" DOUBLE PRECISION NOT NULL,
    "mint" TEXT NOT NULL,
    "tvl" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "marketUpdatedAt" BIGINT NOT NULL,
    "winningOption" INTEGER,
    "numBuyEvents" INTEGER NOT NULL DEFAULT 0,
    "numSellEvents" INTEGER NOT NULL DEFAULT 0,
    "lastSellSharesEventTimestamp" TIMESTAMP(3),
    "lastBuySharesEventTimestamp" TIMESTAMP(3),
    "lastClaimRewardsEventTimestamp" TIMESTAMP(3),
    "lastRevealProbsEventTimestamp" TIMESTAMP(3),
    "lastClaimMarketFundsEventTimestamp" TIMESTAMP(3),
    "lastMarketSettledEventTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);
