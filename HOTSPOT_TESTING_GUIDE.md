# Hotspot Scoring System - Testing & Examples

## Quick Start

### 1. Start the server
```bash
npm run dev
# Or build & run: npm run build && npm start
```

### 2. Verify health
```bash
curl http://localhost:3000/copilot/health
```

---

## API Testing with cURL

### Example 1: Ingest Delivery Session

```bash
curl -X POST http://localhost:3000/copilot/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "startLat": -23.5505,
    "startLng": -46.6333,
    "endLat": -23.5610,
    "endLng": -46.6445,
    "durationSec": 1200,
    "distanceMeters": 2150
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "cellId": "6gkzwgu",
    "pickupCount": 1,
    "confidence": 0.3,
    "message": "Session processed successfully"
  }
}
```

---

### Example 2: Get Hotspot Decision

```bash
curl -X POST http://localhost:3000/copilot/hotspot \
  -H "Content-Type: application/json" \
  -d '{
    "lat": -23.5505,
    "lng": -46.6333,
    "userId": "driver_001"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "target": {
      "lat": -23.550537,
      "lng": -46.633301
    },
    "cellId": "6gkzwgu",
    "score": 8.5,
    "confidence": 0.3,
    "pickupCount": 1,
    "message": "Área com poucos dados - use com cuidado",
    "responseTime": "45ms",
    "timestamp": "2026-04-25T14:30:00Z"
  }
}
```

---

### Example 3: Get Nearby Hotspots

```bash
curl "http://localhost:3000/copilot/nearby?lat=-23.5505&lng=-46.6333"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "query": {
      "lat": -23.5505,
      "lng": -46.6333
    },
    "nearby": [
      {
        "cellId": "6gkzwgu",
        "centerLat": -23.550537,
        "centerLng": -46.633301,
        "score": 8.5,
        "confidence": 0.3,
        "pickupCount": 1
      }
    ],
    "count": 1,
    "timestamp": "2026-04-25T14:30:00Z"
  }
}
```

---

### Example 4: Get System Statistics

```bash
curl http://localhost:3000/copilot/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalCells": 1,
    "totalPickups": 1,
    "totalSessions": 1,
    "avgPickupsPerCell": 1.0,
    "topCells": [
      {
        "cellId": "6gkzwgu",
        "centerLat": -23.550537,
        "centerLng": -46.633301,
        "pickupCount": 1,
        "confidence": 0.3
      }
    ],
    "timestamp": "2026-04-25T14:30:00Z"
  }
}
```

---

## Test Scenario 1: Single Cell Growth

**Goal:** Watch confidence grow as more sessions are added

### Steps:

```bash
# Session 1
curl -X POST http://localhost:3000/copilot/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "startLat": -23.5505,
    "startLng": -46.6333
  }'
# Response: pickupCount=1, confidence=0.3

# Session 2
curl -X POST http://localhost:3000/copilot/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "startLat": -23.5505,
    "startLng": -46.6333
  }'
# Response: pickupCount=2, confidence=0.3

# Session 3 (crosses MIN_PICKUP_THRESHOLD)
curl -X POST http://localhost:3000/copilot/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 3,
    "startLat": -23.5505,
    "startLng": -46.6333
  }'
# Response: pickupCount=3, confidence=0.5

# Session 10 (higher confidence)
# ... add 7 more sessions ...
# Response: pickupCount=10, confidence=0.6

# Session 50 (max confidence threshold)
# ... add 40 more sessions ...
# Response: pickupCount=50, confidence=0.8
```

**Expected Behavior:**
- Confidence grows with pickupCount
- Score in hotspot decision increases
- Message becomes more positive

---

## Test Scenario 2: Hourly Patterns

**Goal:** Test hourly distribution scoring

### Setup:
```bash
# Add sessions at different hours of the day
# Morning (7am) - should be busy
for i in {1..15}; do
  curl -X POST http://localhost:3000/copilot/session \
    -H "Content-Type: application/json" \
    -d '{
      "userId": '$i',
      "startLat": -23.5505,
      "startLng": -46.6333
    }'
  sleep 1
done

# Afternoon (2pm) - less busy
for i in {16..20}; do
  curl -X POST http://localhost:3000/copilot/session \
    -H "Content-Type: application/json" \
    -d '{
      "userId": '$i',
      "startLat": -23.5505,
      "startLng": -46.6333
    }'
  sleep 1
done

# Evening (6pm) - busy again
for i in {21..25}; do
  curl -X POST http://localhost:3000/copilot/session \
    -H "Content-Type: application/json" \
    -d '{
      "userId": '$i',
      "startLat": -23.5505,
      "startLng": -46.6333
    }'
  sleep 1
done
```

### Test at different times:
```bash
# Query at 7am → should see higher score
curl -X POST http://localhost:3000/copilot/hotspot \
  -H "Content-Type: application/json" \
  -d '{"lat": -23.5505, "lng": -46.6333}'

# Query at 2pm → should see lower score
curl -X POST http://localhost:3000/copilot/hotspot \
  -H "Content-Type: application/json" \
  -d '{"lat": -23.5505, "lng": -46.6333}'
```

**Expected Behavior:**
- Morning (7am): High hourlyBoost → Higher score
- Afternoon (2pm): Low hourlyBoost → Lower score
- Evening (6pm): High hourlyBoost → Higher score

---

## Test Scenario 3: Multiple Cells

**Goal:** Test geohash grid and neighbor relationships

### Setup:
```bash
# Create neighboring cells in a grid
# Rio de Janeiro center area: ~-23.55, -46.63

# Cell 1 (center)
for i in {1..10}; do
  curl -X POST http://localhost:3000/copilot/session \
    -H "Content-Type: application/json" \
    -d '{
      "userId": '$i',
      "startLat": -23.5505,
      "startLng": -46.6333
    }'
done

# Cell 2 (north) - ~1km away
for i in {11..8}; do
  curl -X POST http://localhost:3000/copilot/session \
    -H "Content-Type: application/json" \
    -d '{
      "userId": '$i',
      "startLat": -23.5405,
      "startLng": -46.6333
    }'
done

# Cell 3 (east) - ~1km away
for i in {21..30}; do
  curl -X POST http://localhost:3000/copilot/session \
    -H "Content-Type: application/json" \
    -d '{
      "userId": '$i',
      "startLat": -23.5505,
      "startLng": -46.6233
    }'
done
```

### Test nearby query:
```bash
curl "http://localhost:3000/copilot/nearby?lat=-23.5505&lng=-46.6333"
```

**Expected Response:**
```json
{
  "nearby": [
    { "cellId": "...", "pickupCount": 10, "score": ... },
    { "cellId": "...", "pickupCount": 8, "score": ... },
    { "cellId": "...", "pickupCount": 10, "score": ... }
  ],
  "count": 3
}
```

**Expected Behavior:**
- Returns all 3 nearby cells
- Cells are within ~2km radius
- Scores ranked by demand

---

## Test Scenario 4: Time Decay

**Goal:** Verify that older data decays properly

### Observation:
The system automatically applies time decay when calculating scores. You can observe this by:

1. Adding sessions now
2. Checking score
3. Waiting 24 hours
4. Checking score again (should be ~18% of original)

### Simulation (in code):
```typescript
// src/core/decay.ts
import { calculateDecay } from './decay';

const now = Date.now();
const oneHourAgo = now - (1000 * 60 * 60);
const oneDayAgo = now - (1000 * 60 * 60 * 24);

console.log('1 hour ago:', calculateDecay(oneHourAgo, now));   // ~0.93
console.log('1 day ago:', calculateDecay(oneDayAgo, now));     // ~0.18
console.log('7 days ago:', calculateDecay(now - 1000*60*60*24*7, now)); // ~0.00034
```

---

## Test Scenario 5: Error Handling

### Test Invalid Coordinates:
```bash
curl -X POST http://localhost:3000/copilot/hotspot \
  -H "Content-Type: application/json" \
  -d '{"lat": "invalid", "lng": 46.6333}'
  
# Expected: 400 error - "Invalid coordinates"
```

### Test Missing Fields:
```bash
curl -X POST http://localhost:3000/copilot/session \
  -H "Content-Type: application/json" \
  -d '{"userId": 123}'

# Expected: 400 error - "Missing required fields"
```

### Test Out of Bounds:
```bash
curl -X POST http://localhost:3000/copilot/session \
  -H "Content-Type: application/json" \
  -d '{"userId": 123, "startLat": 181, "startLng": 200}'

# Should still work - geohash handles any coordinates
```

---

## Performance Testing

### Load Test: 100 Sessions
```bash
#!/bin/bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/copilot/session \
    -H "Content-Type: application/json" \
    -d '{
      "userId": '$i',
      "startLat": -23.5505,
      "startLng": -46.6333
    }' &
done
wait

# Expected: All complete in < 5 seconds
# Each write should be < 100ms
```

### Load Test: 50 Hotspot Queries
```bash
#!/bin/bash
for i in {1..50}; do
  curl -X POST http://localhost:3000/copilot/hotspot \
    -H "Content-Type: application/json" \
    -d '{"lat": -23.5505, "lng": -46.6333}' &
done
wait

# Expected: All complete in < 5 seconds
# Each query should be < 50ms
```

---

## Database Inspection

### Check cells and sessions:
```sql
-- All cells
SELECT id, centerLat, centerLng, pickupCount, confidence, lastUpdated
FROM HotspotCell
ORDER BY pickupCount DESC;

-- Recent sessions
SELECT id, userId, cellId, startLat, startLng, createdAt
FROM DeliverySession
ORDER BY createdAt DESC
LIMIT 20;

-- Hourly distribution for a cell
SELECT hourlyDistribution
FROM HotspotCell
WHERE id = '6gkzwgu';

-- Cell statistics
SELECT 
  COUNT(*) as total_cells,
  SUM(pickupCount) as total_pickups,
  AVG(pickupCount) as avg_pickups,
  MAX(pickupCount) as max_pickups,
  COUNT(CASE WHEN confidence >= 0.8 THEN 1 END) as high_confidence_cells
FROM HotspotCell;
```

---

## Debugging

### Enable verbose logging:
```javascript
// In sessionProcessor.ts
console.log(`[HOTSPOT] Session processed`, {
  userId: session.userId,
  cellId,
  pickupCount: updatedCell.pickupCount,
  timestamp: new Date().toISOString()
});

// Check terminal output for detailed logs
```

### Check geohash mapping:
```typescript
import { mapToCell, getCellCenter } from './core/grid';

const cellId = mapToCell(-23.5505, -46.6333);
console.log('Cell ID:', cellId); // e.g., "6gkzwgu"

const center = getCellCenter(cellId);
console.log('Center:', center); // e.g., { lat: -23.550537, lng: -46.633301 }
```

### Calculate expected score manually:
```typescript
import { calculateCellScore, HotspotCell, Context } from './core/scoring';

const cell: HotspotCell = {
  id: '6gkzwgu',
  pickupCount: 45,
  lastUpdated: Date.now(),
  hourlyDistribution: { 17: 12, 18: 8, ...},
  dailyDistribution: { 4: 140, ...}
};

const context: Context = {
  hour: 17,
  dayOfWeek: 4,
  currentTime: Date.now()
};

const score = calculateCellScore(cell, context);
console.log('Calculated score:', score);
```

---

## Cleanup

### Reset database (delete all data):
```sql
DELETE FROM DeliverySession;
DELETE FROM HotspotCell;
-- Auto-increment sequences remain
```

### Archive old sessions:
```sql
DELETE FROM DeliverySession
WHERE createdAt < NOW() - INTERVAL '90 days';
```

---

## Integration Testing

### Test with Node.js/TypeScript:
```typescript
// test/hotspot.integration.test.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

describe('Hotspot Scoring System', () => {
  test('should process session and increase pickup count', async () => {
    const response = await axios.post(`${BASE_URL}/copilot/session`, {
      userId: 123,
      startLat: -23.5505,
      startLng: -46.6333
    });

    expect(response.status).toBe(201);
    expect(response.data.data.pickupCount).toBeGreaterThan(0);
  });

  test('should return hotspot decision', async () => {
    const response = await axios.post(`${BASE_URL}/copilot/hotspot`, {
      lat: -23.5505,
      lng: -46.6333
    });

    expect(response.status).toBe(200);
    expect(response.data.data).toHaveProperty('score');
    expect(response.data.data.score).toBeGreaterThanOrEqual(0);
    expect(response.data.data.score).toBeLessThanOrEqual(100);
  });

  test('should get nearby hotspots', async () => {
    const response = await axios.get(
      `${BASE_URL}/copilot/nearby?lat=-23.5505&lng=-46.6333`
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data.data.nearby)).toBe(true);
  });
});
```

### Run tests:
```bash
npm test -- test/hotspot.integration.test.ts
```

---

## Real-World Usage

### Production Deployment Checklist

- [ ] Database migrations applied (`npm run migrate`)
- [ ] Prisma Client generated (`npm run build`)
- [ ] Environment variables set (.env)
- [ ] API endpoints tested with real data
- [ ] Response times verified (< 800ms)
- [ ] Error handling verified
- [ ] Logging configured
- [ ] Database backups configured
- [ ] Monitoring/alerting configured
- [ ] Rate limiting applied if needed

---

## Support & Questions

For issues or questions:
1. Check [HOTSPOT_SCORING_SYSTEM.md](./HOTSPOT_SCORING_SYSTEM.md) for detailed documentation
2. Review test scenarios above
3. Check logs: `tail -f src/logs/*.log`
4. Query database for statistics

---

**Last Updated:** 2026-04-25
