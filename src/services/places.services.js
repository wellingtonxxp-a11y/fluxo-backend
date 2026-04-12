const axios = require("axios");
const { getCache, setCache } = require("./cache.service");

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// normaliza coordenadas para melhorar cache (evita infinitas variações)
function normalizeCoord(value) {
  return Number.parseFloat(value).toFixed(4);
}

async function getHotspotPlace(lat, lng) {
  try {

    if (!lat || !lng) {
      return {
        name: "Localização indisponível",
        address: "",
        lat,
        lng
      };
    }

    if (!API_KEY) {
      console.warn("GOOGLE_MAPS_API_KEY não definida");
      return {
        name: "API não configurada",
        address: "",
        lat,
        lng
      };
    }

    const normLat = normalizeCoord(lat);
    const normLng = normalizeCoord(lng);

    // 🔥 1. CACHE
    const cached = getCache(normLat, normLng);
    if (cached) return cached;

    // 🔥 2. REQUEST
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;

    const response = await axios.get(url, {
      params: {
        location: `${normLat},${normLng}`,
        radius: 200,
        type: "restaurant",
        key: API_KEY
      },
      timeout: 5000
    });

    const places = response.data?.results;

    let result;

    if (!places || places.length === 0) {
      result = {
        name: "Ponto ativo",
        address: "",
        lat,
        lng
      };
    } else {
      const best = places[0];

      result = {
        name: best.name || "Local popular",
        address: best.vicinity || "",
        lat: best.geometry?.location?.lat || lat,
        lng: best.geometry?.location?.lng || lng
      };
    }

    // 🔥 3. SALVAR CACHE
    setCache(normLat, normLng, result);

    return result;

  } catch (err) {
    console.error("Places error:", err.message);

    return {
      name: "Erro localização",
      address: "",
      lat,
      lng
    };
  }
}

module.exports = { getHotspotPlace };