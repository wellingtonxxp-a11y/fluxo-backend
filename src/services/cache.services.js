const cache = new Map();

// tempo de vida (5 minutos)
const TTL = 5 * 60 * 1000;

function generateKey(lat, lng) {
  // 🔥 arredondar reduz chamadas duplicadas
  const latKey = Number(lat).toFixed(3);
  const lngKey = Number(lng).toFixed(3);

  return `${latKey}:${lngKey}`;
}

function getCache(lat, lng) {
  const key = generateKey(lat, lng);

  const data = cache.get(key);

  if (!data) return null;

  const isExpired = Date.now() - data.timestamp > TTL;

  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return data.value;
}

function setCache(lat, lng, value) {
  const key = generateKey(lat, lng);

  cache.set(key, {
    value,
    timestamp: Date.now()
  });
}

module.exports = {
  getCache,
  setCache
};