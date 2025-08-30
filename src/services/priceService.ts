import { prisma, redisClient } from '../config/database';

interface PriceEntry {
  timestamp: string;
  prob: number;
}

export class PriceService {
  private static readonly MAX_ENTRIES = 100;
  private static readonly KEY_PREFIX = 'market';

  /**
   * Add a new price entry for a market
   * @param marketId - The market ID
   * @param timestamp - The timestamp of the price
   * @param probs - Array of probabilities
   */
  static async addMarketPrices(marketId: string, timestamp: string, probs: number[]): Promise<void> {
    try {
      const key = this.getMarketKey(marketId);
      
      // Create price entries for each probability
      const priceEntry: PriceEntry = {
        timestamp,
        prob: probs[0]!
      }

      // Add new entries to the beginning of the list
      await redisClient.lPush(key, JSON.stringify(priceEntry));

      // Trim to keep only the latest MAX_ENTRIES
      await redisClient.lTrim(key, 0, this.MAX_ENTRIES - 1);

      console.log(`✅ Added price entry for market ${marketId}`);
    } catch (error) {
      console.error(`❌ Failed to add market prices for ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Get price history for a market
   * @param marketId - The market ID
   * @returns Array of price entries
   */
  static async getMarketPrices(marketId: string): Promise<PriceEntry[]> {
    const marketData = await prisma.market.findUnique({
      where: { id: marketId.toString() },
    });
    if (!marketData) {
      throw new Error('Market not found');
    }
    
    try {
      const creationTime = marketData.createdAt.toISOString();
      const initialPice = {
        timestamp: creationTime,
        prob: 0.5,
      } 
      const key = this.getMarketKey(marketId);
      const rawEntries = await redisClient.lRange(key, 0, -1);
      const prices = rawEntries.map(entry => JSON.parse(entry) as PriceEntry);
      return [initialPice, ...prices];
    } catch (error) {
      console.error(`❌ Failed to get market prices for ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Get price history for a specific option in a market
   * @param marketId - The market ID
   * @param optionIndex - The option index (0-based)
   * @returns Array of price entries for the specific option
   */
  static async getMarketOptionPrices(marketId: string, optionIndex: number): Promise<PriceEntry[]> {
    try {
      const allPrices = await this.getMarketPrices(marketId);
      
      // Group by timestamp and extract the specific option
      const optionPrices: PriceEntry[] = [];
      const seenTimestamps = new Set<string>();
      
      for (const entry of allPrices) {
        if (!seenTimestamps.has(entry.timestamp)) {
          seenTimestamps.add(entry.timestamp);
          
          // Find the entry for this specific option at this timestamp
          const optionEntry = allPrices.find(p => 
            p.timestamp === entry.timestamp && 
            allPrices.indexOf(p) % allPrices.length === optionIndex
          );
          
          if (optionEntry) {
            optionPrices.push(optionEntry);
          }
        }
      }
      
      return optionPrices;
    } catch (error) {
      console.error(`❌ Failed to get option prices for market ${marketId}, option ${optionIndex}:`, error);
      throw error;
    }
  }

  /**
   * Clear all price data for a market
   * @param marketId - The market ID
   */
  static async clearMarketPrices(marketId: string): Promise<void> {
    try {
      const key = this.getMarketKey(marketId);
      await redisClient.del(key);
      console.log(`✅ Cleared price data for market ${marketId}`);
    } catch (error) {
      console.error(`❌ Failed to clear price data for market ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Get the total number of markets with price data
   */
  static async getMarketCount(): Promise<number> {
    try {
      const keys = await redisClient.keys(`${this.KEY_PREFIX}:*:prices`);
      return keys.length;
    } catch (error) {
      console.error('❌ Failed to get market count:', error);
      throw error;
    }
  }

  /**
   * Get all market IDs that have price data
   */
  static async getAllMarketIds(): Promise<string[]> {
    try {
      const keys = await redisClient.keys(`${this.KEY_PREFIX}:*:prices`);
      return keys.map(key => key.replace(`${this.KEY_PREFIX}:`, '').replace(':prices', ''));
    } catch (error) {
      console.error('❌ Failed to get all market IDs:', error);
      throw error;
    }
  }

  private static getMarketKey(marketId: string): string {
    return `${this.KEY_PREFIX}:${marketId}:prices`;
  }
}
