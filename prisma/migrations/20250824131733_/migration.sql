/*
  Warnings:

  - You are about to alter the column `liquidityParameter` on the `markets` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.
  - You are about to alter the column `tvl` on the `markets` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "markets" ALTER COLUMN "votes" SET DATA TYPE BIGINT[],
ALTER COLUMN "liquidityParameter" SET DATA TYPE BIGINT,
ALTER COLUMN "tvl" SET DATA TYPE BIGINT;
