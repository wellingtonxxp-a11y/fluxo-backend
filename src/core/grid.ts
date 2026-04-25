/**
 * Grid Module - Geohash-based spatial grid for hotspot cells
 * 
 * Converts lat/lng coordinates to geohash for consistent cell identification.
 * Each cell represents a geographic area (~1km at precision 7).
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encode lat/lng to geohash
 * 
 * @param lat - Latitude
 * @param lng - Longitude  
 * @param precision - Geohash precision (7 = ~1.52km x 1.52km)
 * @returns Geohash string
 */
export function encodeGeohash(lat: number, lng: number, precision: number = 7): string {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  const latMin = -90, latMax = 90;
  const lngMin = -180, lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lngMid = (lngMin + lngMax) / 2;
      if (lng > lngMid) {
        idx = (idx << 1) + 1;
        lngMin = lngMid;
      } else {
        idx = idx << 1;
        lngMax = lngMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat > latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = idx << 1;
        latMax = latMid;
      }
    }

    evenBit = !evenBit;

    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/**
 * Decode geohash to center lat/lng
 * 
 * @param geohash - Geohash string
 * @returns Center coordinates of the cell
 */
export function decodeGeohash(geohash: string): { lat: number; lng: number } {
  const lngMinMax = [-180, 180];
  const latMinMax = [-90, 90];

  let isEven = true;

  for (let i = 0; i < geohash.length; i++) {
    const idx = BASE32.indexOf(geohash[i]);

    for (let mask = 16; mask > 0; mask >>= 1) {
      if (isEven) {
        const lngMid = (lngMinMax[0] + lngMinMax[1]) / 2;
        if (idx & mask) {
          lngMinMax[0] = lngMid;
        } else {
          lngMinMax[1] = lngMid;
        }
      } else {
        const latMid = (latMinMax[0] + latMinMax[1]) / 2;
        if (idx & mask) {
          latMinMax[0] = latMid;
        } else {
          latMinMax[1] = latMid;
        }
      }
      isEven = !isEven;
    }
  }

  const lat = (latMinMax[0] + latMinMax[1]) / 2;
  const lng = (lngMinMax[0] + lngMinMax[1]) / 2;

  return { lat, lng };
}

/**
 * Get adjacent geohashes for spatial smoothing
 * 
 * @param geohash - Geohash string
 * @returns Array of adjacent geohashes
 */
export function getAdjacentGeohashes(geohash: string): string[] {
  const neighbors = [
    'p0r21436x8zb9dcf5h7kjnmqesgutwvy',
    'bc01fg45238967deuvhjyznpkmstqrwx'
  ];
  const borders = [
    'prxz',
    'bcfguvyz'
  ];

  const neighbors_idx = [
    { right: 1, left: 0, top: 0, bottom: 1 },
    { right: 1, left: 0, top: 2, bottom: 3 },
    { right: 3, left: 2, top: 0, bottom: 1 },
    { right: 3, left: 2, top: 2, bottom: 3 }
  ];

  if (!geohash) return [];

  const lastChar = geohash[geohash.length - 1];
  const parent = geohash.slice(0, -1);
  const type = geohash.length % 2;

  const base = parent + neighbors[type][neighbors_idx[type].right];
  const result = [
    parent + neighbors[type][neighbors_idx[type].left],
    parent + neighbors[type][neighbors_idx[type].top],
    parent + neighbors[type][neighbors_idx[type].bottom],
    base
  ];

  return result;
}

/**
 * Map lat/lng to grid cell ID
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Cell ID (geohash)
 */
export function mapToCell(lat: number, lng: number): string {
  return encodeGeohash(lat, lng, 7);
}

/**
 * Get cell center coordinates
 * 
 * @param cellId - Geohash cell ID
 * @returns Center coordinates
 */
export function getCellCenter(cellId: string): { lat: number; lng: number } {
  return decodeGeohash(cellId);
}

/**
 * Get nearby cells within radius
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @param precisionLevel - Geohash precision (lower = larger cells, more neighbors)
 * @returns Array of nearby cell IDs
 */
export function getNearbyCell(lat: number, lng: number): string {
  return mapToCell(lat, lng);
}

/**
 * Get neighbor cells for smoothing
 * 
 * @param cellId - Cell ID (geohash)
 * @returns Array of neighbor cell IDs
 */
export function getNeighborCells(cellId: string): string[] {
  return getAdjacentGeohashes(cellId);
}

/**
 * Calculate distance between two points in kilometers (Haversine)
 * 
 * @param lat1 - First latitude
 * @param lng1 - First longitude
 * @param lat2 - Second latitude
 * @param lng2 - Second longitude
 * @returns Distance in kilometers
 */
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
