const cache = new Map();

function getCache(lat, lng) {
  const key = `${lat}:${lng}`;
  const entry = cache.get(key);

  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function setCache(lat, lng, value) {
  const key = `${lat}:${lng}`;
  cache.set(key, {
    value,
    expiresAt: Date.now() + 1000 * 60 * 30
  });
}

module.exports = { getCache, setCache };