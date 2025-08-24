import { Router } from 'express';
import { PriceService } from '../services/priceService';

const router = Router();

/**
 * GET /api/prices/markets/:marketId
 * Get all price history for a specific market
 */
router.get('/markets/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;
    const { option } = req.query;
    
    if (option !== undefined) {
      // Get prices for a specific option
      const optionIndex = parseInt(option as string);
      if (isNaN(optionIndex) || optionIndex < 0) {
        return res.status(400).json({ 
          error: 'Invalid option index. Must be a non-negative integer.' 
        });
      }
      
      const prices = await PriceService.getMarketOptionPrices(marketId, optionIndex);
      return res.json({
        marketId,
        optionIndex,
        prices,
        count: prices.length
      });
    } else {
      // Get all prices for the market
      const prices = await PriceService.getMarketPrices(marketId);
      return res.json({
        marketId,
        prices,
        count: prices.length
      });
    }
  } catch (error) {
    console.error('❌ Error fetching market prices:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch market prices',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/prices/markets
 * Get list of all markets with price data
 */
router.get('/markets', async (_req, res) => {
  try {
    const marketIds = await PriceService.getAllMarketIds();
    const marketCount = await PriceService.getMarketCount();
    
    return res.json({
      markets: marketIds,
      count: marketCount
    });
  } catch (error) {
    console.error('❌ Error fetching market list:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch market list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/prices/markets/:marketId
 * Clear price data for a specific market
 */
router.delete('/markets/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;
    await PriceService.clearMarketPrices(marketId);
    
    return res.json({ 
      message: `Price data cleared for market ${marketId}`,
      marketId 
    });
  } catch (error) {
    console.error('❌ Error clearing market prices:', error);
    return res.status(500).json({ 
      error: 'Failed to clear market prices',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/prices/health
 * Health check endpoint for price service
 */
router.get('/health', async (_req, res) => {
  try {
    const marketCount = await PriceService.getMarketCount();
    return res.json({
      status: 'healthy',
      marketCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Price service health check failed:', error);
    return res.status(503).json({
      status: 'unhealthy',
      error: 'Price service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
