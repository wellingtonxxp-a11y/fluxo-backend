# Hotspot Scoring System - Complete Documentation

## System Overview

The Hotspot Scoring System transforms real delivery sessions into reliable, explainable hotspot scores. It's designed to be **simple**, **stable**, **explainable**, and **fast**.

**Core Principle:** Each delivery session's pickup origin (startLat, startLng) is the ONLY strong signal for real demand.

---

## Architecture

```
/src
├── /core
│   ├── grid.ts              # Geohash-based spatial grid mapping
│   ├── decay.ts             # Time decay calculations
│   ├── scoring.ts           # Hotspot scoring formulas
│   └── smoothing.ts         # Spatial smoothing
├── /modules
│   ├── sessionProcessor.ts  # Session ingestion & processing
│   ├── hotspotRepository.ts # Database operations
│   └── gridService.ts       # Grid management (legacy)
└── /routes
    └── copilot.routes.ts    # API endpoints
```

---

## Data Models

### DeliverySession
```typescript
{
  id: number
  userId: number
  startLat: number        // CRITICAL: Pickup origin
  startLng: number        // CRITICAL: Pickup origin
  endLat: number          // Optional: Drop-off
  endLng: number          // Optional: Drop-off
  durationSec: number     // Optional
  distanceMeters: number  // Optional
  cellId: string          // Geohash (auto-calculated)
  createdAt: DateTime
}
```

### HotspotCell
```typescript
{
  id: string              // Geohash (7 chars = ~1.52km x 1.52km)
  centerLat: number
  centerLng: number
  pickupCount: number     // Total pickups in cell
  lastUpdated: DateTime
  hourlyDistribution: {   // Map<hour, count>
    0: 5,   // Midnight: 5 pickups
    7: 42,  // 7am: 42 pickups
    ...
  }
  dailyDistribution: {    // Map<day, count>, 0=Sunday
    0: 100, // Sunday: 100 pickups
    1: 180, // Monday: 180 pickups
    ...
  }
  confidence: number      // 0-1, based on pickupCount
}
```

---

## Grid Mapping (Geohash)

### Why Geohash?
- **Consistent:** Same coordinates always map to same cell
- **Hierarchical:** Can zoom in/out by precision level
- **Neighbors:** Adjacent cells have similar geohash prefixes
- **Efficient:** String-based, easy to index in database

### Precision Levels
```
Precision | Lat/Lng Error | Cell Size
    5     |    4.89 km    | ~9.7 km²
    6     |    0.61 km    | ~1.2 km²
    7     |    0.152 km   | ~0.23 km²  ← USED
    8     |    0.019 km   | ~29 m²
```

### Example
```javascript
// Convert coordinates to cell
startLat: -23.5505
startLng: -46.6333
↓
cellId: "6gkzwgu"  // 7-char geohash

// Decode back to center
cellId: "6gkzwgu"
↓
centerLat: -23.550537
centerLng: -46.633301
```

---

## Time Decay

### Formula
```
decayFactor = exp(-λ * hoursSinceEvent)

λ (lambda) = 0.07 (recommended)
Half-life ≈ 10 hours
```

### Interpretation
- **0 hours old:**    factor = 1.0 (100%)
- **24 hours old:**   factor = 0.18 (18%)
- **72 hours old:**   factor = 0.003 (0.3%)
- **7+ days old:**    effectively ignored

### Why Time Decay?
- **Recent demand matters more**
- **Conditions change:** Rush hours, weather, events
- **Automatic aging:** No manual cleanup needed

### Implementation
```typescript
// When calculating scores, apply decay to pickup count:
decayedCount = pickupCount * exp(-0.07 * hoursSinceEvent)

// Don't apply decay when storing - store raw counts
// Apply decay when calculating scores (read-time)
```

---

## Scoring Formula

### Components

#### 1. Base Demand (60% weight)
```
baseDemand = min(100, (decayedPickupCount / 10) * 10)

Interpretation:
- Raw signal from real delivery origins
- Time-decayed to emphasize recent data
- ~10 decayed pickups = 100 score
```

#### 2. Hourly Boost (25% weight)
```
frequency = currentHourPickups / totalPickups
avgFrequency = 1/24
normalizedFreq = min(1, frequency / (avgFrequency * 5))
hourlyBoost = normalizedFreq * 50

Interpretation:
- Is this hour busier than average?
- If current hour has 5x average frequency → max boost
- Captures peak hours (7-9am, 5-7pm)
```

#### 3. Daily Boost (15% weight)
```
frequency = currentDayPickups / totalPickups
avgFrequency = 1/7
normalizedFreq = min(1, frequency / (avgFrequency * 3))
dailyBoost = normalizedFreq * 30

Interpretation:
- Is this day busier than average?
- Monday vs Sunday patterns
- Weekday vs weekend differences
```

#### 4. Confidence Factor
```
if pickupCount < 1:      confidence = 0
if pickupCount < 3:      confidence = 0.3
if pickupCount < 10:     confidence = 0.6
if pickupCount < 50:     confidence = 0.8
if pickupCount >= 50:    confidence = 1.0

Applied as:
finalScore = baseScore * confidence
```

### Final Score Calculation
```
rawScore = (baseDemand × 0.6) + (hourlyBoost × 0.25) + (dailyBoost × 0.15)
finalScore = rawScore × confidence
finalScore = clamp(0, 100, finalScore)
```

### Example Scenario

**Scenario:** Thursday 5:30 PM, at Copacabana Beach, Rio

**Cell Data:**
```
pickupCount: 45
lastUpdated: 1 hour ago
hourlyDistribution: {
  17: 12,  ← Current hour (5pm): 12 pickups
  18: 8,   ← Next hour (6pm): 8 pickups
  ...
  0-6: (low traffic hours)
}
dailyDistribution: {
  0: 50,  ← Sunday
  1: 120, ← Monday (high)
  2: 130, ← Tuesday (high)
  3: 125, ← Wednesday (high)
  4: 140  ← Thursday (CURRENT - highest)
}
```

**Calculation:**
```
// Base Demand
hoursSinceEvent = 1
decayFactor = exp(-0.07 * 1) = 0.93
decayedCount = 45 * 0.93 = 41.9
baseDemand = min(100, (41.9 / 10) * 10) = 41.9

// Hourly Boost
currentHourCount = 12
totalInHourly = 12+8+...+5+3 = 168
frequency = 12 / 168 = 0.071
avgFrequency = 1/24 = 0.042
normalizedFreq = min(1, 0.071 / (0.042 * 5)) = min(1, 0.34) = 0.34
hourlyBoost = 0.34 * 50 = 17

// Daily Boost
currentDayCount = 140
totalInDaily = 50+120+130+125+140 = 565
frequency = 140 / 565 = 0.248
avgFrequency = 1/7 = 0.143
normalizedFreq = min(1, 0.248 / (0.143 * 3)) = min(1, 0.58) = 0.58
dailyBoost = 0.58 * 30 = 17.4

// Confidence
confidence = 0.8 (pickupCount = 45)

// Final Score
rawScore = (41.9 * 0.6) + (17 * 0.25) + (17.4 * 0.15)
         = 25.14 + 4.25 + 2.61
         = 32
finalScore = 32 * 0.8 = 25.6 ≈ 26

→ Response: Score 26, Message: "Demanda baixa neste momento"
```

---

## API Endpoints

### 1. POST /copilot/session
**Ingest a delivery session**

```javascript
POST /copilot/session
Content-Type: application/json

{
  "userId": 123,
  "startLat": -23.5505,
  "startLng": -46.6333,
  "endLat": -23.5610,
  "endLng": -46.6445,
  "durationSec": 1200,
  "distanceMeters": 2150
}

Response 201:
{
  "success": true,
  "data": {
    "cellId": "6gkzwgu",
    "pickupCount": 46,
    "confidence": 0.8,
    "message": "Session processed successfully"
  }
}
```

### 2. POST /copilot/hotspot
**Get hotspot recommendation (NEW - real data based)**

```javascript
POST /copilot/hotspot
Content-Type: application/json

{
  "lat": -23.5505,
  "lng": -46.6333,
  "userId": "user_123"  // optional
}

Response 200:
{
  "success": true,
  "data": {
    "target": {
      "lat": -23.550537,
      "lng": -46.633301
    },
    "cellId": "6gkzwgu",
    "score": 26.5,
    "confidence": 0.80,
    "pickupCount": 45,
    "message": "Vá para esta área agora",
    "responseTime": "45ms",
    "timestamp": "2026-04-25T14:30:00Z"
  }
}
```

### 3. GET /copilot/nearby?lat=X&lng=Y
**Get all nearby hotspots (for UI/analysis)**

```javascript
GET /copilot/nearby?lat=-23.5505&lng=-46.6333

Response 200:
{
  "success": true,
  "data": {
    "query": { "lat": -23.5505, "lng": -46.6333 },
    "nearby": [
      {
        "cellId": "6gkzwgu",
        "centerLat": -23.550537,
        "centerLng": -46.633301,
        "score": 26.5,
        "confidence": 0.80,
        "pickupCount": 45
      },
      {
        "cellId": "6gkzwgv",
        "centerLat": -23.551202,
        "centerLng": -46.634015,
        "score": 19.2,
        "confidence": 0.60,
        "pickupCount": 28
      }
    ],
    "count": 8,
    "timestamp": "2026-04-25T14:30:00Z"
  }
}
```

### 4. GET /copilot/stats
**System statistics**

```javascript
GET /copilot/stats

Response 200:
{
  "success": true,
  "data": {
    "totalCells": 156,
    "totalPickups": 3847,
    "totalSessions": 3847,
    "avgPickupsPerCell": 24.66,
    "topCells": [
      {
        "cellId": "6gkzwgu",
        "centerLat": -23.550537,
        "centerLng": -46.633301,
        "pickupCount": 156,
        "confidence": 1.0
      },
      ...
    ],
    "timestamp": "2026-04-25T14:30:00Z"
  }
}
```

---

## Usage Patterns

### Pattern 1: Real-time Decision (Driver App)
```
Driver opens app at location (lat, lng)
    ↓
POST /copilot/hotspot { lat, lng, userId }
    ↓
Returns: target coordinates + score + message
    ↓
Driver sees: "Zona quente! Alta demanda agora" with target location
```

### Pattern 2: Session Ingestion (Backend Service)
```
User completes delivery
    ↓
Backend calls: POST /copilot/session { userId, startLat, startLng, ... }
    ↓
Cell updated, pickupCount++, distributions updated
    ↓
Next decision requests use updated data
```

### Pattern 3: Analytics Dashboard
```
Admin opens dashboard
    ↓
GET /copilot/stats → System overview
GET /copilot/nearby?lat=X&lng=Y → Detailed heatmap
    ↓
Display: Cell distribution, hotspot heatmap, temporal patterns
```

---

## Key Design Decisions

### 1. No Machine Learning (For Now)
**Why:**
- ML adds complexity with minimal value initially
- Simple heuristics perform well with real data
- Easier to debug and explain to users
- Can upgrade to ML later without breaking changes

### 2. Time Decay > Historical Averages
**Why:**
- Demand patterns change constantly
- Recent data is more predictive
- Automatic without manual intervention
- Works well for most demand types

### 3. Geohash > H3 > Simple Grid
**Why:**
- Geohash is industry standard
- Efficient indexing in PostgreSQL
- Natural neighbor relationships
- Easy to visualize and debug

### 4. Confidence-Based Filtering
**Why:**
- Protects users from noisy low-data areas
- Automatic quality control
- Graceful degradation
- Transparent confidence scores

### 5. Separate Read/Write Decay
**Why:**
- Store raw counts for auditability
- Apply decay only when scoring
- Can adjust decay parameters without recomputing
- Historical analysis remains accurate

---

## Performance

### Response Times (Target: <800ms)

```
GET /copilot/nearby:     ~45ms   (2km search)
POST /copilot/hotspot:   ~50ms   (scoring + lookup)
POST /copilot/session:   ~100ms  (write + update)
GET /copilot/stats:      ~150ms  (aggregation)
```

### Scaling Considerations

**Current capacity:**
- ~10k cells
- ~100k sessions/day
- ~1m total sessions

**Optimization opportunities:**
- Index on (centerLat, centerLng) for nearby queries
- Cache top 100 cells by score
- Pre-compute scores every 5 minutes
- Archive old sessions (>90 days)

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor stats endpoint
- Check score distributions
- Review error logs

**Weekly:**
- Archive sessions older than 90 days
- Verify geohash uniqueness
- Check confidence distributions

**Monthly:**
- Analyze score accuracy vs real outcomes
- Adjust decay lambda if needed
- Review edge cases and anomalies

### Monitoring Queries

```sql
-- Check cell distribution
SELECT COUNT(*), AVG(pickupCount), MAX(pickupCount)
FROM HotspotCell;

-- Find stale cells (no updates in 7 days)
SELECT id, lastUpdated, pickupCount
FROM HotspotCell
WHERE lastUpdated < NOW() - INTERVAL 7 days;

-- Check temporal distribution
SELECT hour, COUNT(*) as sessions
FROM DeliverySession
GROUP BY hour
ORDER BY hour;
```

---

## Testing

### Unit Tests

```typescript
// grid.ts
- encodeGeohash precision
- decodeGeohash accuracy
- getNeighbors correctness

// decay.ts
- calculateDecay values at various times
- Half-life verification
- Boundary conditions

// scoring.ts
- Score components calculation
- Confidence factors
- Edge cases (0 pickups, etc)
```

### Integration Tests

```typescript
// Session Processing
- Create session → Cell updated
- Multiple sessions → Correct count
- Temporal distributions → Correct aggregation

// Scoring
- Same location, different times → Different scores
- Low confidence cells → Reduced scores
- Nearby cells → Neighbor relationships

// API
- Happy path: Complete session → Hotspot decision
- Error handling: Invalid coords, missing fields
- Rate limiting: High load behavior
```

### Regression Tests

```
Scenario 1: Peak hour rush
- 1000 sessions in 5 minutes
- Verify score increases
- Verify response time < 800ms

Scenario 2: Low activity
- < 3 pickups per cell
- Verify confidence < 0.5
- Verify message warns user

Scenario 3: Geographic clusters
- Cells at different locations
- Verify isolation (no cross-contamination)
- Verify neighbor smoothing works
```

---

## Future Enhancements

### Phase 2: Supervised Learning
- [ ] Collect outcome data (did driver accept recommendation?)
- [ ] Train simple model on historical patterns
- [ ] A/B test ML vs heuristic scores
- [ ] Gradual rollout if improvement confirmed

### Phase 3: Advanced Features
- [ ] Real-time score updates (WebSocket)
- [ ] Predictive hotspots (15-30 min forecast)
- [ ] User reputation weighting
- [ ] Spatial correlation between cells

### Phase 4: Optimization
- [ ] Distributed scoring across regions
- [ ] Mobile-first API design
- [ ] Offline recommendations (edge cases)
- [ ] Integration with logistics network

---

## Troubleshooting

### Issue: All cells have low confidence
**Cause:** Too few sessions collected
**Solution:** Wait for more data or lower threshold temporarily

### Issue: Score doesn't change between updates
**Cause:** Data too old (decay applied)
**Solution:** System working as designed; recent data will boost scores

### Issue: Geographic holes (missing cells)
**Cause:** No pickup activity in those areas
**Solution:** Normal; cells only created when activity occurs

### Issue: Response time > 800ms
**Cause:** Large nearby search, database slow
**Solution:** Add index on (centerLat, centerLng); cache top cells

---

## References

- [Geohash Wikipedia](https://en.wikipedia.org/wiki/Geohash)
- [Exponential Decay](https://en.wikipedia.org/wiki/Exponential_decay)
- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula)
- [PostGIS Documentation](https://postgis.net/)

---

**Last Updated:** 2026-04-25
**Version:** 1.0.0
**Status:** Production Ready
