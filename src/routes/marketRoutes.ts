import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { checkOrCreateMarket } from '../services/solanaEventQueueProcessor';

const router = Router();

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

    return res.json({
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
    });

  } catch (error) {
    console.error('Error fetching markets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch markets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get market by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Market ID is required'
      });
    }

    const market = await prisma.market.findUnique({
      where: { id }
    });

    if (!market) {
      return res.status(404).json({
        success: false,
        message: 'Market not found'
      });
    }

    // Convert BigInt fields to strings for JSON serialization
    const serializedMarket = {
      ...market,
      votes: market.votes.map(vote => vote.toString()),
      liquidityParameter: market.liquidityParameter.toString(),
      tvl: market.tvl.toString(),
      marketUpdatedAt: market.marketUpdatedAt.toString()
    };

    return res.json({
      success: true,
      data: serializedMarket
    });

  } catch (error) {
    console.error('Error fetching market:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch market',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check or create market by ID
router.post('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Market ID is required'
      });
    }

    // Convert string ID to number for checkOrCreateMarket function
    const marketId = parseInt(id);
    
    if (isNaN(marketId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid market ID. Must be a valid number'
      });
    }

    console.log(`🔍 Checking or creating market with ID: ${marketId}`);
    
    // Call the checkOrCreateMarket function
    const market = await checkOrCreateMarket(marketId);

    if (!market) {
      return res.status(404).json({
        success: false,
        message: 'Failed to check or create market'
      });
    }

    // Convert BigInt fields to strings for JSON serialization
    const serializedMarket = {
      ...market,
      votes: market.votes.map(vote => vote.toString()),
      liquidityParameter: market.liquidityParameter.toString(),
      tvl: market.tvl.toString(),
      marketUpdatedAt: market.marketUpdatedAt.toString()
    };

    return res.json({
      success: true,
      message: 'Market checked/created successfully',
      data: serializedMarket
    });

  } catch (error) {
    console.error('Error checking or creating market:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check or create market',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
