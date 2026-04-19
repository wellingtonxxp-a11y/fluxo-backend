const prisma = require("../../prisma");

const SP_BOUNDARY = {
  north: -23.318, // latitude max (less negative)
  south: -24.050,
  west: -46.825,
  east: -46.312
};

const ZONE_NAMES = ["zona_sul", "zona_norte", "zona_leste", "zona_oeste", "centro"] as const;

type ZoneName = typeof ZONE_NAMES[number];

function validateInsideSP(lat: number, lng: number) {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  return lat <= SP_BOUNDARY.north && lat >= SP_BOUNDARY.south && lng >= SP_BOUNDARY.west && lng <= SP_BOUNDARY.east;
}

function getZoneNameFromPoint(lat: number, lng: number): ZoneName {
  if (!validateInsideSP(lat, lng)) {
    throw new Error("Ponto fora da cidade de São Paulo");
  }

  const centerLat = -23.55;
  const centerLng = -46.65;
  const latDelta = Math.abs(lat - centerLat);
  const lngDelta = Math.abs(lng - centerLng);

  if (latDelta < 0.05 && lngDelta < 0.05) {
    return "centro";
  }

  const isNorth = lat >= centerLat;
  const isEast = lng >= centerLng;

  if (isNorth && isEast) return "zona_leste";
  if (isNorth && !isEast) return "zona_norte";
  if (!isNorth && isEast) return "zona_sul";
  return "zona_oeste";
}

async function getZoneFromPoint(lat: number, lng: number) {
  const name = getZoneNameFromPoint(lat, lng);

  const zone = await prisma.zone.upsert({
    where: { name },
    create: { name, demand: 0 },
    update: {}
  });

  return zone;
}

export { validateInsideSP, getZoneFromPoint, getZoneNameFromPoint, ZONE_NAMES };
