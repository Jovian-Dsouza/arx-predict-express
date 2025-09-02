# Market Image Upload Script

This script uploads local market images to UploadThing and updates the database with the image URLs.

## Features

- **Database Integration**: Reads markets without images from the database
- **File Validation**: Checks for valid image files in the specified directory
- **UploadThing Integration**: Uploads images to UploadThing cloud storage
- **Database Updates**: Updates market records with the uploaded image URLs
- **Batch Processing**: Can process all markets or specific markets
- **Status Reporting**: Shows detailed status of market images
- **Error Handling**: Robust error handling with detailed logging

## Prerequisites

1. **UploadThing Account**: You need an UploadThing account and API credentials
2. **Environment Variables**: Add your UploadThing credentials to your `.env` file
3. **Database**: Ensure your database is running and migrations are applied
4. **Image Files**: Place market images in the specified directory with naming pattern `{marketId}.png`

## Setup

1. **Create UploadThing Account**:
   - Go to [UploadThing](https://uploadthing.com/)
   - Create an account and get your API credentials

2. **Add UploadThing credentials to your `.env` file**:
   ```
   UPLOADTHING_SECRET=your_uploadthing_secret_here
   UPLOADTHING_APP_ID=your_uploadthing_app_id_here
   ```

3. **Prepare Image Files**:
   - Create a directory for your market images (default: `public/images/markets/`)
   - Name your image files using the pattern: `{marketId}.png`
   - Supported formats: PNG, JPG, JPEG, GIF, WebP

4. **Ensure database migration is applied**:
   ```bash
   npm run db:migrate
   ```

## Usage

### Upload images for all markets without images:
```bash
npm run upload:images upload
```

### Upload image for a specific market:
```bash
npm run upload:images upload <marketId>
```

Example:
```bash
npm run upload:images upload "market_123"
```

### Check status of all market images:
```bash
npm run upload:images status
```

### Upload from custom directory:
```bash
npm run upload:images upload "" "/path/to/custom/images"
```

### Upload with custom database URL:
```bash
npm run upload:images upload "" "data/marketImages" "postgresql://user:pass@localhost:5432/dbname"
```

### Check status with custom database URL:
```bash
npm run upload:images status "" "" "postgresql://user:pass@localhost:5432/dbname"
```

## How It Works

1. **Database Connection**: The script first checks if it can connect to the database using the provided URL
2. **Market Detection**: Finds all markets where the `image` field is null or empty
3. **File Lookup**: For each market, looks for an image file named `{marketId}.png` in the specified directory
4. **File Validation**: Validates that the file exists and is a valid image format
5. **Upload Process**: Uploads the image to UploadThing with metadata
6. **Database Update**: Updates the market record with the UploadThing URL
7. **Progress Tracking**: Provides detailed logging and progress updates

## File Structure

```
public/
└── images/
    └── markets/
        ├── market-123.png
        ├── market-456.png
        └── ...
```

## Supported Image Formats

- PNG (recommended)
- JPG/JPEG
- GIF
- WebP

## Error Handling

- **Missing Files**: Logs warnings for markets without image files
- **Upload Failures**: Logs errors and continues with other markets
- **Database Errors**: Provides detailed error messages
- **Rate Limiting**: Includes delays between uploads to avoid rate limits

## Cost Considerations

- UploadThing offers free tier with usage limits
- Check UploadThing pricing for your usage needs
- The script includes a 500ms delay between uploads to avoid rate limiting

## Troubleshooting

### Common Issues:

1. **Missing UploadThing Credentials**: Ensure `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` are set in your `.env` file
2. **Database Connection**: Verify your database is running and accessible
3. **File Permissions**: Ensure the script has read permissions for the image directory
4. **Invalid Image Files**: Check that image files are valid and not corrupted
5. **Rate Limiting**: If you hit rate limits, the script will log errors and continue

### Debug Mode:

To see more detailed logging, you can modify the script to include additional console.log statements.

## Integration

The uploaded images are stored as UploadThing URLs in the database and can be accessed directly via the URLs returned by UploadThing. These URLs are CDN-optimized and provide fast global access to your images.

## Example Output

```
Starting market image upload process...
Looking for images in: public/images/markets
Found 5 markets without images

Processing market market_123: "Will Bitcoin reach $100k by end of 2024?"
📁 Found image file: public/images/markets/market_123.png
Uploading image for market market_123: public/images/markets/market_123.png
✅ Successfully uploaded image for market market_123: https://utfs.io/f/abc123...
✅ Successfully updated market market_123 with image URL

📊 Upload process completed!
✅ Successfully uploaded: 3 images
❌ Failed uploads: 0 images
⚠️  Skipped (no image file): 2 markets
```

## Status Report Example

```
📋 Market Image Status Report
==================================================
Total markets: 10
Markets with images: 7
Markets without images: 3

📝 Markets without images:
  - market_123: "Will Bitcoin reach $100k by end of 2024?"
  - market_456: "Who will win the 2024 election?"
  - market_789: "Will AI replace developers by 2025?"
```
