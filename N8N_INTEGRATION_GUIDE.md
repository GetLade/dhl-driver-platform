# n8n Integration Guide – DHL Driver Platform

This guide explains how to connect your n8n workflows to the DHL Driver Platform so that transformed data automatically updates the site in real-time.

## Overview

The DHL Driver Platform now includes:
- **Webhook endpoint** at `/api/webhook/n8n` that receives data from n8n
- **Database storage** for webhook data with automatic updates
- **Real-time polling** on the frontend (every 5 seconds) to fetch latest data
- **Auto-update** of dashboard, ODIN, and GT-Liste pages when new data arrives

## Architecture

```
n8n Workflow
    ↓
    (Transform data)
    ↓
POST /api/webhook/n8n
    ↓
Backend saves to database
    ↓
Frontend polls every 5 seconds
    ↓
Dashboard/ODIN/GT-Liste auto-updates
```

## Step 1: Get Your Webhook URL

Your webhook endpoint is:

```
https://[YOUR_DOMAIN]/api/webhook/n8n
```

Replace `[YOUR_DOMAIN]` with your actual Manus domain (e.g., `dhl-driver-platform.manus.space`).

## Step 2: Set Up n8n Webhook Node

In your n8n workflow:

1. **Add a Webhook node** (or HTTP Request node set to POST)
2. **Configure the endpoint:**
   - **URL:** `https://[YOUR_DOMAIN]/api/webhook/n8n`
   - **Method:** POST
   - **Headers:** 
     ```
     Content-Type: application/json
     ```

## Step 3: Send Data in the Correct Format

The webhook expects a JSON payload with this structure:

```json
{
  "dataType": "flight",
  "data": {
    "etaDate": "2026-03-01",
    "eta": "14:35",
    "cny": 1247,
    "flyers": 384,
    "ulds": 12,
    "earlyUlds": 3,
    "ddTd": 5
  }
}
```

### Supported Data Types

| dataType | Purpose | Expected Fields |
|----------|---------|-----------------|
| `flight` | Flight overview data | `etaDate`, `eta`, `cny`, `flyers`, `ulds`, `earlyUlds`, `ddTd` |
| `odin` | Route performance data | Array of routes with `route`, `deliveries`, `pickups` |
| `gtliste` | Package list data | Array of packages with `postalCode`, `address`, `packages`, `weight`, `volume` |

### Example: Flight Data

```json
{
  "dataType": "flight",
  "data": {
    "etaDate": "2026-03-01",
    "eta": "14:35",
    "cny": 1247,
    "flyers": 384,
    "ulds": 12,
    "earlyUlds": 3,
    "ddTd": 5
  }
}
```

### Example: ODIN Route Performance Data

```json
{
  "dataType": "odin",
  "data": [
    {
      "route": "R01 – København N",
      "deliveries": {
        "onTime": 87,
        "early": 5,
        "late": 8
      },
      "pickups": {
        "onTime": 91,
        "early": 3,
        "late": 6
      }
    },
    {
      "route": "R02 – Frederiksberg",
      "deliveries": {
        "onTime": 92,
        "early": 4,
        "late": 4
      },
      "pickups": {
        "onTime": 88,
        "early": 5,
        "late": 7
      }
    }
  ]
}
```

### Example: GT-Liste Package Data

```json
{
  "dataType": "gtliste",
  "data": [
    {
      "postalCode": "2100",
      "address": "Østerbrogade 45, 2100 København Ø",
      "packages": 12,
      "weight": 48.5,
      "volume": 52.0
    },
    {
      "postalCode": "2200",
      "address": "Nørrebrogade 112, 2200 København N",
      "packages": 8,
      "weight": 31.2,
      "volume": 28.5
    }
  ]
}
```

## Step 4: Test the Webhook

### Using cURL

```bash
curl -X POST https://[YOUR_DOMAIN]/api/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "flight",
    "data": {
      "etaDate": "2026-03-01",
      "eta": "14:35",
      "cny": 1247,
      "flyers": 384,
      "ulds": 12,
      "earlyUlds": 3,
      "ddTd": 5
    }
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Webhook data received for flight"
}
```

## Step 5: Verify Data Updates

1. Send a test webhook request (see Step 4)
2. Open the DHL Driver Platform dashboard
3. The data should auto-update within 5 seconds
4. You'll see a toast notification: "Flydata opdateret fra n8n"

## Frontend Auto-Update Behavior

The frontend automatically:
- Polls for new data every 5 seconds
- Detects when n8n has sent new data
- Updates the page without requiring a manual refresh
- Shows a toast notification confirming the update
- Saves data to localStorage for persistence

## Troubleshooting

### Webhook Not Receiving Data

1. **Check the URL:** Ensure you're using the correct domain (e.g., `dhl-driver-platform.manus.space`)
2. **Check the payload:** Ensure `dataType` and `data` fields are present
3. **Check CORS:** The webhook accepts POST requests from any origin

### Data Not Updating on Frontend

1. **Check browser console:** Look for any error messages
2. **Verify polling:** Open DevTools → Network tab → filter by `/api/trpc`
3. **Check database:** The data should be stored in the `n8n_webhook_data` table

### Common Errors

| Error | Solution |
|-------|----------|
| `Missing dataType or data` | Ensure your JSON includes both `dataType` and `data` fields |
| `Failed to process webhook` | Check server logs for detailed error messages |
| `404 Not Found` | Verify the webhook URL is correct |

## Advanced: Query Webhook Data via API

You can also query the latest webhook data directly:

```typescript
// Get all latest data
const response = await fetch('/api/trpc/n8n.getLatest');
const allData = await response.json();

// Get specific data type
const response = await fetch('/api/trpc/n8n.getByType?input="flight"');
const flightData = await response.json();
```

## Rate Limiting

- No rate limiting is currently enforced
- Webhooks are processed immediately
- Frontend polls every 5 seconds (configurable in `client/src/hooks/useN8nData.ts`)

## Security Notes

- The webhook endpoint is **public** (no authentication required)
- Anyone with the URL can send data to your dashboard
- For production, consider adding authentication (contact support)
- All data is stored in the database with timestamps

## Next Steps

1. Set up your n8n workflow with the webhook node
2. Test with the cURL example above
3. Monitor the dashboard for automatic updates
4. Adjust polling interval if needed (see `useN8nData.ts`)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check server logs in the Management UI
4. Contact Manus support at https://help.manus.im
