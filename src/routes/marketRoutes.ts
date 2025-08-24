import { Router, Request, Response } from 'express';
import { prisma, redisClient } from '../config/database';
import { checkOrCreateMarket } from '../services/solanaEventQueueProcessor';

const router = Router();

// Cache configuration
const CACHE_TTL = 60; // 1 minute in seconds
const CACHE_PREFIX = 'market:';

// Helper function to generate cache keys
function generateCacheKey(endpoint: string, params: any): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${CACHE_PREFIX}${endpoint}:${sortedParams}`;
}

// Helper function to get cached data
async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn(`Failed to get cached data for key ${key}:`, error);
    return null;
  }
}

// Helper function to set cached data
async function setCachedData(key: string, data: any, ttl: number = CACHE_TTL): Promise<void> {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to set cached data for key ${key}:`, error);
  }
}

// Helper function to invalidate market cache
async function invalidateMarketCache(marketId: string): Promise<void> {
  try {
    const pattern = `${CACHE_PREFIX}*`;
    const keys = await redisClient.keys(pattern);
    
    // Invalidate all cache entries for this market
    const keysToDelete = keys.filter(key => 
      key.includes(`:id:${marketId}`) || 
      key.includes(`:list:`) // Invalidate list cache when individual markets change
    );
    
    if (keysToDelete.length > 0) {
      await redisClient.del(keysToDelete);
      console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries for market ${marketId}`);
    }
  } catch (error) {
    console.warn(`Failed to invalidate cache for market ${marketId}:`, error);
  }
}

// Get market list - returns markets in sorted order
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      sortBy = 'createdAt', 
      order = 'desc', 
      limit = '50', 
      offset = '0',
      status,
      authority,
      question,
      mint
    } = req.query;
    
    // Validate sortBy parameter
    const allowedSortFields = [
      'createdAt', 'updatedAt', 'marketUpdatedAt', 'tvl', 'numBuyEvents', 
      'numSellEvents', 'question', 'status'
    ];
    
    if (!allowedSortFields.includes(sortBy as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sortBy parameter',
        allowedFields: allowedSortFields
      });
    }

    // Validate order parameter
    if (!['asc', 'desc'].includes(order as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order parameter. Must be "asc" or "desc"'
      });
    }

    // Parse limit and offset
    const limitNum = Math.min(parseInt(limit as string) || 50, 100); // Max 100
    const offsetNum = parseInt(offset as string) || 0;

    // Build orderBy object
    const orderBy: any = {};
    orderBy[sortBy as string] = order as string;

    // Build where clause for filtering
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (authority) {
      where.authority = authority;
    }
    
    if (question) {
      where.question = {
        contains: question as string,
        mode: 'insensitive' // Case-insensitive search
      };
    }
    
    if (mint) {
      where.mint = mint;
    }

    // Generate cache key for this request
    const cacheKey = generateCacheKey('list', {
      sortBy,
      order,
      limit: limitNum,
      offset: offsetNum,
      status,
      authority,
      question,
      mint
    });

    // Try to get cached data first
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      console.log(`📦 Serving market list from cache: ${cacheKey}`);
      return res.json(cachedResult);
    }

    console.log(`🔍 Fetching market list from database: ${cacheKey}`);

    const markets = await prisma.market.findMany({
      where,
      orderBy,
      take: limitNum,
      skip: offsetNum
    });

    // Convert BigInt fields to strings for JSON serialization
    const serializedMarkets = markets.map(market => ({
      ...market,
      votes: market.votes.map(vote => vote.toString()),
      liquidityParameter: market.liquidityParameter.toString(),
      tvl: market.tvl.toString(),
      marketUpdatedAt: market.marketUpdatedAt.toString()
    }));

    // Get total count for pagination (with same filters)
    const totalCount = await prisma.market.count({ where });

    const result = {
      success: true,
      data: serializedMarkets,
      pagination: {
        total: totalCount,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < totalCount
      },
      sort: {
        field: sortBy,
        order: order
      },
      filters: {
        status: status || null,
        authority: authority || null,
        question: question || null,
        mint: mint || null
      }
    };

    // Cache the result
    await setCachedData(cacheKey, result);

    return res.json(result);

  } catch (error) {
    console.error('Error fetching markets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch markets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get market by ID - checks database first, then blockchain if not found
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Market ID is required'
      });
    }

    // Generate cache key for this market
    const cacheKey = generateCacheKey('id', { id });

    // Try to get cached data first
    const cachedResult = await getCachedData(cacheKey);
    if (cachedResult) {
      console.log(`📦 Serving market ${id} from cache`);
      return res.json(cachedResult);
    }

    console.log(`🔍 Fetching market ${id} from database/blockchain`);

    // First try to find market in database
    let market = await prisma.market.findUnique({
      where: { id }
    });

    let marketSource = 'database';
    // If market not found in database, try to check/create from blockchain
    if (!market) {
      // Convert string ID to number for checkOrCreateMarket function
      const marketId = parseInt(id);
      
      if (isNaN(marketId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid market ID. Must be a valid number'
        });
      }

      console.log(`🔍 Market ${id} not found in database, checking blockchain...`);
      
      try {
        // Call the checkOrCreateMarket function
        market = await checkOrCreateMarket(marketId);
        
        if (!market) {
          return res.status(404).json({
            success: false,
            message: 'Market not found in database or blockchain'
          });
        }
        marketSource = 'blockchain';
        console.log(`✅ Market ${id} retrieved/created from blockchain successfully`);
      } catch (blockchainError) {
        console.error(`❌ Failed to retrieve/create market ${id} from blockchain:`, blockchainError);
        return res.status(404).json({
          success: false,
          message: 'Market not found in database or blockchain',
          error: blockchainError instanceof Error ? blockchainError.message : 'Unknown blockchain error'
        });
      }
    }

    // Convert BigInt fields to strings for JSON serialization
    const serializedMarket = {
      ...market,
      votes: market.votes.map(vote => vote.toString()),
      liquidityParameter: market.liquidityParameter.toString(),
      tvl: market.tvl.toString(),
      marketUpdatedAt: market.marketUpdatedAt.toString()
    };

    const result = {
      success: true,
      data: serializedMarket,
      source: marketSource
    };

    
    await setCachedData(cacheKey, result);
    return res.json(result);

  } catch (error) {
    console.error('Error fetching market:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch market',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cache management endpoint
router.delete('/cache', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.query;
    
    if (marketId) {
      // Invalidate cache for specific market
      await invalidateMarketCache(marketId as string);
      return res.json({
        success: true,
        message: `Cache invalidated for market ${marketId}`
      });
    } else {
      // Invalidate all market cache
      try {
        const pattern = `${CACHE_PREFIX}*`;
        const keys = await redisClient.keys(pattern);
        
        if (keys.length > 0) {
          await redisClient.del(keys);
          console.log(`🗑️ Invalidated all market cache (${keys.length} entries)`);
        }
        
        return res.json({
          success: true,
          message: `All market cache invalidated (${keys.length} entries)`
        });
      } catch (cacheError) {
        console.error('Failed to invalidate all cache:', cacheError);
        return res.status(500).json({
          success: false,
          message: 'Failed to invalidate all cache'
        });
      }
    }
  } catch (error) {
    console.error('Error managing cache:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to manage cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
