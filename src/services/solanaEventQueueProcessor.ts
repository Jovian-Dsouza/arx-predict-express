import { Job } from 'bull';
import { getMarketData } from '../utils/solana';
import { prisma } from '../config/database';
import { BN, IdlEvents } from "@coral-xyz/anchor";
import { ArxPredict } from '../contract/arx_predict';
import { invalidateMarketCache } from '../routes/marketRoutes';

type Event = IdlEvents<ArxPredict>; // Commented out as it's not being used


interface SolanaEventJob {
  eventName: string;
  timestamp: string;
  data: any;
}

export const processSolanaEvent = async (job: Job<SolanaEventJob>): Promise<void> => {
  const { eventName, timestamp, data } = job.data;
  
  try {
    console.log(`[${timestamp}] 📡 Processing ${eventName} event:`, JSON.stringify(data, null, 2));
    switch (eventName) {
      case 'revealProbsEvent':
        await handleRevealProbsEvent(timestamp, data);
        break;
      case 'buySharesEvent':
        await handleBuySharesEvent(timestamp, data);
        break;
      case 'sellSharesEvent':
        await handleSellSharesEvent(timestamp, data);
        break;
      case 'initMarketStatsEvent':
        await handleInitMarketStatsEvent(data);
        break;
      case 'marketSettledEvent':
        await handleMarketSettledEvent(timestamp, data);
        break;
      default:
        console.warn(`Unknown event type: ${eventName}`);
    }
    
    console.log(`✅ Successfully processed ${eventName} event`);
    
  } catch (error) {
    console.error(`❌ Failed to process ${eventName} event:`, error);
    throw error;
  }
};

function solanaEnumToString(enumObj: any): string {
  return Object.keys(enumObj)[0] || '';
}

function convertBNToNumber(bn: BN): number {
  return new BN(bn.toString(), 16).toNumber();
}

async function handleRevealProbsEvent(timestamp: string, data: Event['revealProbsEvent']): Promise<void> {
  console.log('Processing reveal probabilities event:', data);
  const { marketId, probs, votes } = data;
  try {
    await checkOrCreateMarket(marketId);
    await prisma.market.update({
      where: { id: marketId.toString() },
      data: {
        probs: probs,
        votes: votes.map(v => convertBNToNumber(v)),
        lastRevealProbsEventTimestamp: new Date(timestamp)
      }
    });
    console.log(`✅ Updated market ${marketId} with reveal probabilities`);
    invalidateMarketCache(marketId.toString());
  } catch (error) {
    console.error(`❌ Failed to update market ${marketId} with reveal probabilities:`, error);
    throw error;
  }
}

async function handleBuySharesEvent(timestamp: string, data: Event['buySharesEvent']): Promise<void> {
  console.log('Processing buy shares event:', data);
  const { marketId, status, tvl } = data;
  if (status === 0) {
    return;
  }

  try {
    await checkOrCreateMarket(marketId);
    await prisma.market.update({
      where: { id: marketId.toString() },
      data: {
        tvl: convertBNToNumber(tvl),
        numBuyEvents: { increment: 1 },
        lastBuySharesEventTimestamp: new Date(timestamp)
      }
    });
    console.log(`✅ Updated market ${marketId} with buy shares event`);
    invalidateMarketCache(marketId.toString());
  } catch (error) {
    console.error(`❌ Failed to update market ${marketId} with buy shares event:`, error);
    throw error;
  }
}

async function handleSellSharesEvent(timestamp: string, data: Event['sellSharesEvent']): Promise<void> {
  console.log('Processing sell shares event:', data);
  const { marketId, status, tvl } = data;
  if (status === 0) {
    return;
  }

  try {
    await checkOrCreateMarket(marketId);
    await prisma.market.update({
      where: { id: marketId.toString() },
      data: {
        tvl: convertBNToNumber(tvl),
        numSellEvents: { increment: 1 },
        lastSellSharesEventTimestamp: new Date(timestamp)
      }
    });
    console.log(`✅ Updated market ${marketId} with sell shares event`);
    invalidateMarketCache(marketId.toString());
  } catch (error) {
    console.error(`❌ Failed to update market ${marketId} with sell shares event:`, error);
    throw error;
  }
}

export async function checkOrCreateMarket(marketId: number) {
  const marketData = await prisma.market.findUnique({
    where: { id: marketId.toString() },
  });
  if (marketData) {
    return marketData;
  }

  return await handleInitMarketStatsEvent({ marketId: marketId });
}


async function handleInitMarketStatsEvent(data: Event['initMarketStatsEvent']) {
  const { marketId } = data;
  const marketData = await getMarketData(marketId);
  try {
    const result = await prisma.market.upsert({
      where: { id: marketData.id.toString() },
      update: {
        authority: marketData.authority.toString(),
        question: marketData.question,
        options: marketData.options,
        probs: marketData.probsRevealed, 
        votes: marketData.votesRevealed.map(x => x.toNumber()),
        liquidityParameter: marketData.liquidityParameter.toNumber(),
        mint: marketData.mint.toString(),
        tvl: marketData.tvl.toNumber(),
        status: solanaEnumToString(marketData.status), //Inactive, Active, Settled
        marketUpdatedAt: marketData.updatedAt.toNumber(),
        winningOption: marketData.winningOutcome,
      },
      create: {
        id: marketData.id.toString(),
        authority: marketData.authority.toString(),
        question: marketData.question,
        options: marketData.options,
        probs: marketData.probsRevealed, 
        votes: marketData.votesRevealed.map(x => x.toNumber()),
        liquidityParameter: marketData.liquidityParameter.toNumber(),
        mint: marketData.mint.toString(),
        tvl: marketData.tvl.toNumber(),
        status: solanaEnumToString(marketData.status), //Inactive, Active, Settled
        marketUpdatedAt: marketData.updatedAt.toNumber(),
        winningOption: marketData.winningOutcome,
        numBuyEvents: 0,
        numSellEvents: 0,
        lastSellSharesEventTimestamp: null,
        lastBuySharesEventTimestamp: null,
        lastClaimRewardsEventTimestamp: null,
        lastRevealProbsEventTimestamp: null,
        lastClaimMarketFundsEventTimestamp: null,
        lastMarketSettledEventTimestamp: null,
      }
    });
    console.log(`✅ Upserted market ${marketData.id} successfully`);
    invalidateMarketCache(marketData.id.toString());
    return result;
  } catch (error) {
    console.error(`❌ Failed to upsert market ${marketData.id}:`, error);
    throw error;
  }
}

async function handleMarketSettledEvent(timestamp: string, data: Event['marketSettledEvent']): Promise<void> {
  console.log('Processing market settled event:', data);
  const { marketId, winningOutcome, probs, votes } = data;

  await checkOrCreateMarket(marketId);
  
  try {
    await prisma.market.update({
      where: { id: marketId.toString() },
      data: {
        winningOption: winningOutcome,
        probs: probs,
        votes: votes.map(v => convertBNToNumber(v)),
        status: 'settled', //TODO use enum
        lastMarketSettledEventTimestamp: new Date(timestamp)
      }
    });
    console.log(`✅ Updated market ${marketId} as settled`);
    invalidateMarketCache(marketId.toString());
  } catch (error) {
    console.error(`❌ Failed to update market ${marketId} as settled:`, error);
    throw error;
  }
}
