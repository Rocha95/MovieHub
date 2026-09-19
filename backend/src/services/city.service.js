
const ingressoClient = require('../clients/ingresso.client');
const { normalize } = require('../utils/text.util');
const TtlCache = require('../utils/cache');

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MT', 'MA', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
];

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new TtlCache(CACHE_TTL_MS);

async function fetchAllCities() {
  const results = await Promise.allSettled(
    UFS.map((uf) => ingressoClient.get(`/states/${uf}`))
  );

  const cities = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      cities.push(...(result.value.data?.cities || []));
    } else {
      console.error(
        `Erro no Ingresso.com (states/${UFS[index]}):`,
        result.reason?.response?.status || result.reason?.message
      );
    }
  });

  const unique = new Map();
  for (const city of cities) {
    if (city?.id != null) unique.set(String(city.id), city);
  }
  return [...unique.values()];
}

async function getAllCities() {
  return cache.getOrSet('all-cities', fetchAllCities, CACHE_TTL_MS);
}

async function findCityByName(cityName) {
  if (!cityName?.trim()) return null;

  const target = normalize(cityName);
  const cities = await getAllCities();

  return cities.find(
    (city) =>
      normalize(city.name) === target ||
      normalize(city.urlKey) === target
  ) || null;
}

async function findCityById(cityId) {
  if (!cityId) return null;
  const cities = await getAllCities();
  return cities.find((city) => String(city.id) === String(cityId)) || null;
}

module.exports = {
  getAllCities,
  findCityByName,
  findCityById,
};
