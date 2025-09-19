import { prisma } from '../config/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function clearMarkets() {
  try {
    console.log('Starting to clear market data...');
    
    // First, clear market_prices table (due to foreign key constraints)
    console.log('Clearing market_prices table...');
    const deletedPrices = await prisma.marketPrice.deleteMany({});
    console.log(`✅ Deleted ${deletedPrices.count} entries from market_prices table`);
    
    // Then, clear markets table
    console.log('Clearing markets table...');
    const deletedMarkets = await prisma.market.deleteMany({});
    console.log(`✅ Deleted ${deletedMarkets.count} entries from markets table`);
    
    console.log('🎉 Successfully cleared all market data!');
    
    // Verify tables are empty
    const remainingPrices = await prisma.marketPrice.count();
    const remainingMarkets = await prisma.market.count();
    
    console.log(`\nVerification:`);
    console.log(`- market_prices entries remaining: ${remainingPrices}`);
    console.log(`- markets entries remaining: ${remainingMarkets}`);
    
  } catch (error) {
    console.error('❌ Error clearing market data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  clearMarkets()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export default clearMarkets;
