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
```

---

### 2. Get Market by ID

Retrieves a specific market by its unique identifier.

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
  "message": "Market not found"
}
```

**HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (missing ID)
- `404` - Market not found
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
