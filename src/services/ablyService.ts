import Ably from 'ably';

// Ably configuration - use environment variable or fallback
const ABLY_API_KEY = process.env.ABLY_API_KEY || '';

// Create Ably realtime instance
export const ably = new Ably.Realtime(ABLY_API_KEY);

// Store the latest reveal probabilities data for each market
interface RevealProbsData {
  probs: number[];
  votes: number[];
  timestamp: string;
}

// Map to store latest data for each market
const latestRevealProbsDataMap = new Map<string, RevealProbsData>();

// Initialize Ably connection
export async function initializeAbly(): Promise<void> {
  try {
    await ably.connection.once('connected');
    console.log('Connected to Ably!');
    
    console.log('✅ Ably service initialized successfully');
  } catch (error) {
    console.error('Failed to connect to Ably:', error);
    throw error;
  }
}

// Set up presence handling for a specific market channel
export function setupMarketChannelPresence(marketId: string): void {
  try {
    const channel = getRevealProbsChannel(marketId);
    
    // Handle new client subscriptions using presence enter events
    channel.presence.subscribe('enter', (member) => {
      const latestData = getLatestRevealProbs(marketId);
      if (latestData) {
        // Send the latest data to the new client
        channel.publish('latest-reveal-probs', latestData);
        console.log(`📡 Sent latest reveal probs data to new client ${member.clientId} for market ${marketId}`);
      }
    });
    
    console.log(`✅ Presence handling set up for market ${marketId}`);
  } catch (error) {
    console.error(`Failed to set up presence handling for market ${marketId}:`, error);
  }
}

// Broadcast reveal probabilities data to all clients for a specific market
export async function broadcastRevealProbs(
  marketId: string, 
  probs: number[], 
  votes: number[], 
  timestamp: string
): Promise<void> {
  try {
    const channel = getRevealProbsChannel(marketId)
    
    // Create the data object
    const revealProbsData: RevealProbsData = {
      probs,
      votes,
      timestamp
    };
    
    // Store the latest data for this market
    latestRevealProbsDataMap.set(marketId, revealProbsData);
    
    // Set up presence handling for this market if not already done
    setupMarketChannelPresence(marketId);
    
    // Broadcast to all clients on this market's channel
    await channel.publish('reveal-probs-update', revealProbsData);
    
    console.log(`📡 Broadcasted reveal probs for market ${marketId} to all clients`);
  } catch (error) {
    console.error('Failed to broadcast reveal probs:', error);
    throw error;
  }
}

// Get the latest reveal probabilities data for a specific market
export function getLatestRevealProbs(marketId: string): RevealProbsData | null {
  return latestRevealProbsDataMap.get(marketId) || null;
}

// Graceful shutdown
export async function closeAblyConnection(): Promise<void> {
  try {
    ably.close();
    console.log('Ably connection closed gracefully');
  } catch (error) {
    console.error('Error closing Ably connection:', error);
  }
}

// Health check
export async function checkAblyHealth(): Promise<boolean> {
  try {
    return ably.connection.state === 'connected';
  } catch (error) {
    console.error('Ably health check failed:', error);
    return false;
  }
}

// Get the reveal probs channel for a specific market
export function getRevealProbsChannel(marketId: string) {
  const channelName = `reveal-probs-${marketId}`;
  return ably.channels.get(channelName);
}
