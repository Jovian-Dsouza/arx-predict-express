# Arx Predict Express API Documentation

## Overview

The Arx Predict Express API provides endpoints for managing and retrieving prediction market data. This document outlines the available endpoints, request/response formats, and usage examples.

## Base URL

```
http://localhost:3001
```

## Authentication

Currently, no authentication is required for these endpoints.

## Market APIs

**Available Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/markets` | Get market list with sorting & pagination |
| `GET` | `/api/markets/:id` | Get specific market by ID (checks DB first, then blockchain) |
| `DELETE` | `/api/markets/cache` | Manage cache (invalidate specific market or all cache) |

---

### 1. Get Market List

Retrieves a paginated list of markets with sorting and filtering capabilities.

**Endpoint:** `GET /api/markets`

**Query Parameters:**

| Parameter | Type    | Default | Description                                    | Allowed Values                                    |
|-----------|---------|---------|------------------------------------------------|--------------------------------------------------|
| `sortBy`  | string  | `createdAt` | Field to sort by                              | `createdAt`, `updatedAt`, `marketUpdatedAt`, `tvl`, `numBuyEvents`, `numSellEvents`, `question`, `status` |
| `order`   | string  | `desc`   | Sort order                                    | `asc`, `desc`                                   |
| `limit`   | number  | `50`     | Number of markets to return (max 100)         | 1-100                                           |
| `offset`  | number  | `0`      | Number of markets to skip for pagination      | 0+                                              |
| `status`  | string  | -        | Filter by market status                        | `active`, `inactive`, `settled`                 |
| `authority` | string | -        | Filter by market authority address             | Any valid Solana address                        |
| `question` | string | -        | Filter by question text (case-insensitive)    | Any text string                                 |
| `mint`    | string  | -        | Filter by token mint address                  | Any valid Solana address                        |

**Response Format:**

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "authority": "string",
      "question": "string",
      "options": ["string"],
      "probs": [number],
      "votes": ["string"], // BigInt converted to strings
      "liquidityParameter": "string", // BigInt converted to string
      "mint": "string",
      "tvl": "string", // BigInt converted to string
      "status": "string",
      "marketUpdatedAt": "string", // BigInt converted to string
      "winningOption": number | null,
      "numBuyEvents": number,
      "numSellEvents": number,
      "lastSellSharesEventTimestamp": "string" | null,
      "lastBuySharesEventTimestamp": "string" | null,
      "lastClaimRewardsEventTimestamp": "string" | null,
      "lastRevealProbsEventTimestamp": "string" | null,
      "lastClaimMarketFundsEventTimestamp": "string" | null,
      "lastMarketSettledEventTimestamp": "string" | null,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "hasMore": boolean
  },
  "sort": {
    "field": "string",
    "order": "string"
  },
  "filters": {
    "status": "string" | null,
    "authority": "string" | null,
    "question": "string" | null,
    "mint": "string" | null
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "string",
  "error": "string"
}
```

**HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

**Example Requests:**

```bash
# Get all markets (default sorting by createdAt desc)
curl -s "http://localhost:3001/api/markets" | jq .

# Sort by TVL in descending order
curl -s "http://localhost:3001/api/markets?sortBy=tvl&order=desc" | jq .

# Sort by number of buy events in ascending order
curl -s "http://localhost:3001/api/markets?sortBy=numBuyEvents&order=asc" | jq .

# Pagination example (limit 10, offset 0)
curl -s "http://localhost:3001/api/markets?limit=10&offset=0" | jq .

# Sort by question alphabetically
curl -s "http://localhost:3001/api/markets?sortBy=question&order=asc" | jq .

# Get markets sorted by market update timestamp (newest first)
curl -s "http://localhost:3001/api/markets?sortBy=marketUpdatedAt&order=desc" | jq .

# Filter by status
curl -s "http://localhost:3001/api/markets?status=active" | jq .

# Filter by question text (case-insensitive)
curl -s "http://localhost:3001/api/markets?question=SOL" | jq .

# Combine multiple filters
curl -s "http://localhost:3001/api/markets?status=active&question=SOL&sortBy=tvl&order=desc" | jq .

# Filter by authority address
curl -s "http://localhost:3001/api/markets?authority=9CtkxgXqNF3yvGr4u9jdVByyZknBH4SoqPgNpRbX2sjP" | jq .

# Filter by mint address
curl -s "http://localhost:3001/api/markets?mint=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" | jq .

---

### 2. Get Market by ID

Retrieves a specific market by its unique identifier. If the market is not found in the database, it will automatically attempt to fetch and create it from the Solana blockchain using the `checkOrCreateMarket` function.

**Endpoint:** `GET /api/markets/:id`

**Path Parameters:**

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| `id`      | string | Yes      | Unique market ID      |

**Response Format:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "authority": "string",
    "question": "string",
    "options": ["string"],
    "probs": [number],
    "votes": ["string"], // BigInt converted to strings
    "liquidityParameter": "string", // BigInt converted to string
    "mint": "string",
    "tvl": "string", // BigInt converted to string
    "status": "string",
    "marketUpdatedAt": "string", // BigInt converted to string
    "winningOption": number | null,
    "numBuyEvents": number,
    "numSellEvents": number,
    "lastSellSharesEventTimestamp": "string" | null,
    "lastBuySharesEventTimestamp": "string" | null,
    "lastClaimRewardsEventTimestamp": "string" | null,
    "lastRevealProbsEventTimestamp": "string" | null,
    "lastClaimMarketFundsEventTimestamp": "string" | null,
    "lastMarketSettledEventTimestamp": "string" | null,
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Market not found in database or blockchain"
}
```

**HTTP Status Codes:**

- `200` - Success (market found in database or blockchain)
- `400` - Bad Request (missing or invalid ID)
- `404` - Market not found in database or blockchain
- `500` - Internal Server Error

**Example Requests:**

```bash
# Get market with ID "1"
curl -s "http://localhost:3001/api/markets/1" | jq .

# Get market with ID "abc123" (will return 404 if not found)
curl -s "http://localhost:3001/api/markets/abc123" | jq .

# Test with invalid ID
curl -s "http://localhost:3001/api/markets/invalid-id" | jq .
```


---

### 3. Cache Management

Manage Redis cache for market data to improve performance and control data freshness.

**Endpoint:** `DELETE /api/markets/cache`

**Query Parameters:**

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| `marketId` | string | No       | Specific market ID to invalidate cache for |

**Response Format:**

```json
{
  "success": true,
  "message": "Cache invalidated for market 1"
}
```

**Example Requests:**

```bash
# Invalidate cache for specific market
curl -X DELETE "http://localhost:3001/api/markets/cache?marketId=1" | jq .

# Invalidate all market cache
curl -X DELETE "http://localhost:3001/api/markets/cache" | jq .
```

---

## Data Types

### Market Object

| Field                                | Type                | Description                                    |
|--------------------------------------|---------------------|------------------------------------------------|
| `id`                                 | string              | Unique market identifier                       |
| `authority`                          | string              | Market authority address                       |
| `question`                           | string              | Market question text                           |
| `options`                            | string[]            | Array of possible outcomes                     |
| `probs`                              | number[]            | Array of probability values                    |
| `votes`                              | string[]            | Array of vote counts (BigInt as strings)      |
| `liquidityParameter`                 | string              | Liquidity parameter (BigInt as string)        |
| `mint`                               | string              | Token mint address                             |
| `tvl`                                | string              | Total value locked (BigInt as string)          |
| `status`                             | string              | Current market status                          |
| `marketUpdatedAt`                    | string              | Last market update timestamp (BigInt as string) |
| `winningOption`                      | number \| null      | Index of winning option (if settled)          |
| `numBuyEvents`                       | number              | Number of buy share events                     |
| `numSellEvents`                      | number              | Number of sell share events                    |
| `lastSellSharesEventTimestamp`       | string \| null      | Last sell event timestamp                      |
| `lastBuySharesEventTimestamp`        | string \| null      | Last buy event timestamp                       |
| `lastClaimRewardsEventTimestamp`     | string \| null      | Last claim rewards event timestamp             |
| `lastRevealProbsEventTimestamp`      | string \| null      | Last probability reveal timestamp              |
| `lastClaimMarketFundsEventTimestamp` | string \| null      | Last market funds claim timestamp              |
| `lastMarketSettledEventTimestamp`    | string \| null      | Market settlement timestamp                    |
| `createdAt`                          | string              | Market creation timestamp                      |
| `updatedAt`                          | string              | Last update timestamp                          |

### Pagination Object

| Field      | Type    | Description                                    |
|------------|---------|------------------------------------------------|
| `total`    | number  | Total number of markets                        |
| `limit`    | number  | Number of markets per page                     |
| `offset`   | number  | Number of markets skipped                      |
| `hasMore`  | boolean | Whether there are more markets available       |

### Sort Object

| Field   | Type   | Description                                    |
|---------|--------|------------------------------------------------|
| `field` | string | Field used for sorting                          |
| `order` | string | Sort direction (asc/desc)                       |

---

## Error Handling

All endpoints return consistent error responses with the following structure:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (when available)"
}
```

### Common Error Scenarios

1. **Invalid Sort Field**: Returns `400` with list of allowed fields
2. **Invalid Sort Order**: Returns `400` if order is not "asc" or "desc"
3. **Market Not Found**: Returns `404` for non-existent market IDs
4. **Server Error**: Returns `500` for internal server errors

---

## Rate Limiting

Currently, no rate limiting is applied to these endpoints.

## CORS

CORS is enabled for development and production environments:

- **Development**: `http://localhost:3000`, `http://localhost:3001`
- **Production**: Configurable via environment variables

---

## Examples

### Complete Market List Response

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "authority": "9CtkxgXqNF3yvGr4u9jdVByyZknBH4SoqPgNpRbX2sjP",
      "question": "$SOL to 500?",
      "options": ["Yes", "No"],
      "probs": [0.3687842586220975, 0.6312157413779025],
      "votes": ["10980193", "16354552"],
      "liquidityParameter": "16",
      "mint": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      "tvl": "20965483",
      "status": "active",
      "marketUpdatedAt": "100227355923",
      "winningOption": null,
      "numBuyEvents": 1,
      "numSellEvents": 0,
      "lastSellSharesEventTimestamp": null,
      "lastBuySharesEventTimestamp": "2025-08-24T13:18:39.632Z",
      "lastClaimRewardsEventTimestamp": null,
      "lastRevealProbsEventTimestamp": "2025-08-24T13:18:34.623Z",
      "lastClaimMarketFundsEventTimestamp": null,
      "lastMarketSettledEventTimestamp": null,
      "createdAt": "2025-08-24T13:18:35.075Z",
      "updatedAt": "2025-08-24T13:18:39.645Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  },
  "sort": {
    "field": "createdAt",
    "order": "desc"
  }
}
```

### Error Response Example

```json
{
  "success": false,
  "message": "Invalid sortBy parameter",
  "allowedFields": [
    "createdAt", "updatedAt", "marketUpdatedAt", "tvl", 
    "numBuyEvents", "numSellEvents", "question", "status"
  ]
}
```

---

## Notes

- **BigInt Fields**: All BigInt fields are automatically converted to strings in responses for JSON compatibility
- **Timestamps**: All timestamp fields are returned in ISO 8601 format
- **Pagination**: Maximum limit is enforced at 100 items per request
- **Sorting**: Default sorting is by `createdAt` in descending order (newest first)
- **Validation**: Input parameters are validated and appropriate error messages are returned
- **Filtering**: Multiple filters can be combined and work with sorting and pagination
- **Question Search**: Question filtering is case-insensitive and uses partial matching
- **Filter Persistence**: Applied filters are included in the response for transparency
- **Caching**: Redis caching is implemented for improved performance (5-minute TTL)
- **Cache Invalidation**: Cache can be manually invalidated for specific markets or all data
- **Smart Caching**: Only database results are cached; blockchain results are not cached
