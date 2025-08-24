import { Job } from 'bull';
import { IdlEvents } from "@coral-xyz/anchor";
import { ArxPredict } from "../contract/arx_predict";
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
      case 'voteEvent':
        await handleVoteEvent(data);
        break;
      case 'revealResultEvent':
        await handleRevealResultEvent(data);
        break;
      case 'revealProbsEvent':
        await handleRevealProbsEvent(data);
        break;
      case 'buySharesEvent':
        await handleBuySharesEvent(data);
        break;
      case 'sellSharesEvent':
        await handleSellSharesEvent(data);
        break;
      case 'claimRewardsEvent':
        await handleClaimRewardsEvent(data);
        break;
      case 'initMarketStatsEvent':
        await handleInitMarketStatsEvent(data);
        break;
      case 'claimMarketFundsEvent':
        await handleClaimMarketFundsEvent(data);
        break;
      case 'marketSettledEvent':
        await handleMarketSettledEvent(data);
        break;
      default:
        console.warn(`Unknown event type: ${eventName}`);
    }
    
    console.log(`✅ Successfully processed ${eventName} event`);
    
  } catch (error) {
    console.error(`❌ Failed to process ${eventName} event:`, error);
    throw error; // This will trigger the retry mechanism
  }
};

// Event handler functions - implement your business logic here
async function handleVoteEvent(data: Event['voteEvent']): Promise<void> {
  // Handle vote event logic
  console.log('Processing vote event:', data);
}

async function handleRevealResultEvent(data: Event['revealResultEvent']): Promise<void> {
  // Handle reveal result event logic
  console.log('Processing reveal result event:', data);
}

async function handleRevealProbsEvent(data: Event['revealProbsEvent']): Promise<void> {
  // Handle reveal probabilities event logic
  console.log('Processing reveal probabilities event:', data);
}

async function handleBuySharesEvent(data: Event['buySharesEvent']): Promise<void> {
  // Handle buy shares event logic
  console.log('Processing buy shares event:', data);
}

async function handleSellSharesEvent(data: Event['sellSharesEvent']): Promise<void> {
  // Handle sell shares event logic
  console.log('Processing sell shares event:', data);
}

async function handleClaimRewardsEvent(data: Event['claimRewardsEvent']): Promise<void> {
  // Handle claim rewards event logic
  console.log('Processing claim rewards event:', data);
}

async function handleInitMarketStatsEvent(data: Event['initMarketStatsEvent']): Promise<void> {
  // Handle init market stats event logic
  console.log('Processing init market stats event:', data);
}

async function handleClaimMarketFundsEvent(data: Event['claimMarketFundsEvent']): Promise<void> {
  // Handle claim market funds event logic
  console.log('Processing claim market funds event:', data);
}

async function handleMarketSettledEvent(data: Event['marketSettledEvent']): Promise<void> {
  // Handle market settled event logic
  console.log('Processing market settled event:', data);
}
