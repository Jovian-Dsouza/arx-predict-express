import { Job } from 'bull';
import { getMarketData } from './solanaEventMonitor';
import { prisma } from '../config/database';
import { IdlEvents } from "@coral-xyz/anchor";
import { ArxPredict } from '../contract/arx_predict';

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
        await handleInitMarketStatsEvent(timestamp, data);
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

async function handleRevealProbsEvent(timestamp: string, data: Event['revealProbsEvent']): Promise<void> {
  console.log('Processing reveal probabilities event:', data);
  const { marketId, probs, votes } = data;
  
  try {
    await prisma.market.update({
      where: { id: marketId.toString() },
      data: {
        probs: probs,
        votes: votes.map(v => v.toNumber()),
        lastRevealProbsEventTimestamp: new Date(timestamp)
      }
    });
    console.log(`✅ Updated market ${marketId} with reveal probabilities`);
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
    await prisma.market.update({
      where: { id: marketId.toString() },
      data: {
        tvl: tvl.toNumber(),
        numBuyEvents: { increment: 1 },
        lastBuySharesEventTimestamp: new Date(timestamp)
      }
    });
    console.log(`✅ Updated market ${marketId} with buy shares event`);
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
    await prisma.market.update({
      where: { id: marketId.toString() },
      data: {
        tvl: tvl.toNumber(),
        numSellEvents: { increment: 1 },
        lastSellSharesEventTimestamp: new Date(timestamp)
      }
    });
    console.log(`✅ Updated market ${marketId} with sell shares event`);
  } catch (error) {
    console.error(`❌ Failed to update market ${marketId} with sell shares event:`, error);
    throw error;
  }
}


async function handleInitMarketStatsEvent(timestamp: string, data: Event['initMarketStatsEvent']): Promise<void> {
  const { marketId } = data;
  const marketData = await getMarketData(marketId);
  try {
    await prisma.market.upsert({
      where: { id: marketData.id.toString() },
      update: {
        authority: marketData.authority.toString(),
        question: marketData.question,
        options: marketData.options,
        probs: marketData.probsRevealed, 
        votes: marketData.votesRevealed.map(x => x.toNumber()),
        liquidityParameter: marketData.liquidityParameter,
        mint: marketData.mint.toString(),
        tvl: marketData.tvl.toNumber(),
        status: marketData.status.toString(), //Inactive, Active, Settled
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
        liquidityParameter: marketData.liquidityParameter,
        mint: marketData.mint.toString(),
        tvl: marketData.tvl.toNumber(),
        status: marketData.status.toString(), //Inactive, Active, Settled
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
  } catch (error) {
    console.error(`❌ Failed to upsert market ${marketData.id}:`, error);
    throw error;
  }
}

async function handleMarketSettledEvent(timestamp: string, data: Event['marketSettledEvent']): Promise<void> {
  console.log('Processing market settled event:', data);
  const { marketId, winningOutcome, probs, votes } = data;
  
  try {
    await prisma.market.update({
      where: { id: marketId.toString() },
      data: {
        winningOption: winningOutcome,
        probs: probs,
        votes: votes.map(v => v.toNumber()),
        status: 'Settled',
        lastMarketSettledEventTimestamp: new Date(timestamp)
      }
    });
    console.log(`✅ Updated market ${marketId} as settled`);
  } catch (error) {
    console.error(`❌ Failed to update market ${marketId} as settled:`, error);
    throw error;
  }
}
