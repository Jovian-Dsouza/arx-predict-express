import { Job } from 'bull';
import { IdlEvents } from "@coral-xyz/anchor";
import { ArxPredict } from "../contract/arx_predict";
import { getMarketData } from './solanaEventMonitor';
type Event = IdlEvents<ArxPredict>;

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
  // Handle reveal probabilities event logic
  console.log('Processing reveal probabilities event:', data);
  const { marketId, probs, votes } = data;
  //update db table 

  //Store in db
}

async function handleBuySharesEvent(timestamp: string, data: Event['buySharesEvent']): Promise<void> {
  // Handle buy shares event logic
  console.log('Processing buy shares event:', data);
  const { marketId, status, amount, tvl } = data;
  if (status === 0) {
    return;
  }

  //update db table 
}

async function handleSellSharesEvent(timestamp: string, data: Event['sellSharesEvent']): Promise<void> {
  // Handle sell shares event logic
  console.log('Processing sell shares event:', data);
  const { marketId, status, amount, tvl } = data;
  if (status === 0) {
    return;
  }

  //update db table 
}


async function handleInitMarketStatsEvent(timestamp: string, data: Event['initMarketStatsEvent']): Promise<void> {
  console.log('Processing init market stats event:', data);
  const { marketId } = data;
  const marketData = await getMarketData(marketId);
  const dbData = {
    id: marketData.id,
    authority: marketData.authority.toString(),
    question: marketData.question,
    options: marketData.options,
    probs: marketData.probsRevealed, 
    votes: marketData.votesRevealed.map(x => x.toNumber()),
    liquidityParameter: marketData.liquidityParameter,
    mint: marketData.mint.toString(),
    tvl: marketData.tvl.toNumber(),
    status: marketData.status.toString(), //Inactive, Active, Settled
    updatedAt: marketData.updatedAt.toNumber(),
    winningOption: marketData.winningOutcome,
    numBuyEvents: 0,
    numSellEvents:0,
    lastSellSharesEventTimestamp: null,
    lastBuySharesEventTimestamp: null,
    lastClaimRewardsEventTimestamp: null,
    lastRevealProbsEventTimestamp: null,
    lastClaimMarketFundsEventTimestamp: null,
    lastMarketSettledEventTimestamp: null,
  }
  console.log(`Market data=> ${JSON.stringify(dbData)}`);
  //Store in db
}

async function handleMarketSettledEvent(timestamp: string, data: Event['marketSettledEvent']): Promise<void> {
  // Handle market settled event logic
  console.log('Processing market settled event:', data);
  const { marketId, winningOutcome, probs, votes } = data;
  //update db table 
}
