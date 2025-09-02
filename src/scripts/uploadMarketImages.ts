import { PrismaClient } from '@prisma/client';
import { UTApi } from 'uploadthing/server';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Initialize UploadThing API
const utapi = new UTApi();

/**
 * Check if a file exists and is a valid image
 */
function isValidImageFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return false;
  }

  // Check file extension
  const ext = path.extname(filePath).toLowerCase();
  const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  
  return validExtensions.includes(ext);
}

/**
 * Upload a single image file to UploadThing
 */
async function uploadImageToUploadThing(filePath: string, marketId: string): Promise<string | null> {
  try {
    console.log(`Uploading image for market ${marketId}: ${filePath}`);
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `${marketId}.png`; // Always use .png extension for consistency
    
    // Create a File object from the buffer
    const file = new File([fileBuffer], fileName, { type: 'image/png' });
    
    // Upload to UploadThing
    const uploadResult = await utapi.uploadFiles([file]);

    if (uploadResult && uploadResult.length > 0) {
      const result = uploadResult[0];
      if (result && result.error) {
        console.error(`❌ Upload error for market ${marketId}:`, result.error);
        return null;
      }
      
      if (result && result.data) {
        console.log(`✅ Successfully uploaded image for market ${marketId}: ${result.data.url}`);
        return result.data.url;
      }
    }
    
    console.error(`❌ No upload result for market ${marketId}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error uploading image for market ${marketId}:`, error);
    return null;
  }
}

/**
 * Main function to upload images for markets without image URLs
 */
async function uploadMarketImages(imagesDirectory: string = 'public/images/markets') {
  try {
    console.log('Starting market image upload process...');
    console.log(`Looking for images in: ${imagesDirectory}`);
    
    // Check if images directory exists
    const fullImagesPath = path.resolve(imagesDirectory);
    if (!fs.existsSync(fullImagesPath)) {
      console.error(`❌ Images directory does not exist: ${fullImagesPath}`);
      return;
    }

    // Find markets without images
    const marketsWithoutImages = await prisma.market.findMany({
      where: {
        OR: [
          { image: null },
          { image: '' }
        ]
      },
      select: {
        id: true,
        question: true,
        image: true
      }
    });

    console.log(`Found ${marketsWithoutImages.length} markets without images`);

    if (marketsWithoutImages.length === 0) {
      console.log('No markets need image uploads. Exiting.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each market
    for (const market of marketsWithoutImages) {
      console.log(`\nProcessing market ${market.id}: "${market.question}"`);
      
      // Look for image file with market ID
      const imageFileName = `${market.id}.png`;
      const imageFilePath = path.join(fullImagesPath, imageFileName);
      
      // Check if image file exists
      if (!isValidImageFile(imageFilePath)) {
        console.log(`⚠️  No valid image file found for market ${market.id} (looking for: ${imageFileName})`);
        skippedCount++;
        continue;
      }

      console.log(`📁 Found image file: ${imageFilePath}`);
      
      // Upload the image
      const imageUrl = await uploadImageToUploadThing(imageFilePath, market.id);
      
      if (imageUrl) {
        // Update the market with the new image URL
        await prisma.market.update({
          where: { id: market.id },
          data: { image: imageUrl }
        });
        
        console.log(`✅ Successfully updated market ${market.id} with image URL`);
        successCount++;
      } else {
        console.log(`❌ Failed to upload image for market ${market.id}`);
        errorCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n📊 Upload process completed!`);
    console.log(`✅ Successfully uploaded: ${successCount} images`);
    console.log(`❌ Failed uploads: ${errorCount} images`);
    console.log(`⚠️  Skipped (no image file): ${skippedCount} markets`);
    
  } catch (error) {
    console.error('Error in uploadMarketImages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Upload image for a specific market
 */
async function uploadImageForMarket(marketId: string, imagesDirectory: string = 'public/images/markets') {
  try {
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      select: {
        id: true,
        question: true,
        image: true
      }
    });

    if (!market) {
      console.error(`Market with ID ${marketId} not found`);
      return;
    }

    if (market.image) {
      console.log(`Market ${marketId} already has an image: ${market.image}`);
      return;
    }

    console.log(`Uploading image for market ${marketId}: "${market.question}"`);
    
    // Look for image file
    const fullImagesPath = path.resolve(imagesDirectory);
    const imageFileName = `${marketId}.png`;
    const imageFilePath = path.join(fullImagesPath, imageFileName);
    
    if (!isValidImageFile(imageFilePath)) {
      console.error(`❌ No valid image file found for market ${marketId} (looking for: ${imageFileName})`);
      return;
    }

    console.log(`📁 Found image file: ${imageFilePath}`);
    
    // Upload the image
    const imageUrl = await uploadImageToUploadThing(imageFilePath, market.id);
    
    if (imageUrl) {
      await prisma.market.update({
        where: { id: market.id },
        data: { image: imageUrl }
      });
      
      console.log(`✅ Successfully updated market ${market.id} with image URL`);
    } else {
      console.log(`❌ Failed to upload image for market ${market.id}`);
    }
    
  } catch (error) {
    console.error('Error uploading image for specific market:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * List all markets and their image status
 */
async function listMarketImageStatus() {
  try {
    console.log('📋 Market Image Status Report');
    console.log('=' .repeat(50));
    
    const allMarkets = await prisma.market.findMany({
      select: {
        id: true,
        question: true,
        image: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total markets: ${allMarkets.length}`);
    
    const marketsWithImages = allMarkets.filter(m => m.image && m.image.trim() !== '');
    const marketsWithoutImages = allMarkets.filter(m => !m.image || m.image.trim() === '');
    
    console.log(`Markets with images: ${marketsWithImages.length}`);
    console.log(`Markets without images: ${marketsWithoutImages.length}`);
    
    if (marketsWithoutImages.length > 0) {
      console.log('\n📝 Markets without images:');
      marketsWithoutImages.forEach(market => {
        console.log(`  - ${market.id}: "${market.question}"`);
      });
    }
    
  } catch (error) {
    console.error('Error listing market image status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const marketId = args[1];
  const imagesDir = args[2] || 'data/marketImages';
  
  switch (command) {
    case 'upload':
      if (marketId) {
        uploadImageForMarket(marketId, imagesDir);
      } else {
        uploadMarketImages(imagesDir);
      }
      break;
    case 'status':
      listMarketImageStatus();
      break;
    default:
      console.log('Usage:');
      console.log('  npm run upload:images                    # Upload all missing images');
      console.log('  npm run upload:images upload <marketId>  # Upload image for specific market');
      console.log('  npm run upload:images status             # Show image status report');
      break;
  }
}

export { uploadMarketImages, uploadImageForMarket, listMarketImageStatus };
