export interface ClusterPoint {
  lat: number;
  lng: number;
  flowId?: number;
}

export interface Cluster {
  points: ClusterPoint[];
  center: { lat: number; lng: number };
  total: number;
  radius: number;
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineDistance(a: ClusterPoint, b: ClusterPoint) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function groupNearbyPoints(points: ClusterPoint[], maxDistance = 250) {
  const used = new Array(points.length).fill(false);
  const clusters: Cluster[] = [];

  for (let i = 0; i < points.length; i += 1) {
    if (used[i]) continue;
    used[i] = true;

    const clusterPoints = [points[i]];
    let center = { lat: points[i].lat, lng: points[i].lng };

    for (let j = i + 1; j < points.length; j += 1) {
      if (used[j]) continue;
      if (haversineDistance(points[i], points[j]) <= maxDistance) {
        used[j] = true;
        clusterPoints.push(points[j]);
      }
    }

    const total = clusterPoints.length;
    const averageLat = clusterPoints.reduce((sum, item) => sum + item.lat, 0) / total;
    const averageLng = clusterPoints.reduce((sum, item) => sum + item.lng, 0) / total;

    center = { lat: averageLat, lng: averageLng };

    const radius = clusterPoints.reduce((max, item) => {
      const distance = haversineDistance({ lat: averageLat, lng: averageLng }, item);
      return Math.max(max, distance);
    }, 0);

    clusters.push({ points: clusterPoints, center, total, radius: Math.max(radius, 50) });
  }

  return clusters;
}

export function calculateDensityScore(cluster: Cluster) {
  const density = cluster.total / (Math.PI * Math.pow(cluster.radius / 2, 2) / 100000);
  return Math.round(Math.min(100, cluster.total * 12 + density * 6));
}
