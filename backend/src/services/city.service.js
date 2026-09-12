const ingressoClient = require('../clients/ingresso.client');
const { normalize } = require('../utils/text.util');

// As 27 UFs do Brasil. O Ingresso.com não expõe um endpoint único que
// liste todos os estados de uma vez, então percorremos as 27 UFs para
// montar o catálogo completo de cidades (confirmado: GET /states/{UF}).
const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MT', 'MA', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO',
];

// A lista de cidades praticamente não muda, então cacheamos por 24h em
// memória para não bater 27 vezes no Ingresso a cada requisição.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let citiesCache = null;
let cachedAt = 0;

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
                `❌ Erro no Ingresso.com (states/${UFS[index]}):`,
                result.reason?.response?.status || result.reason?.message
            );
        }
    });

    return cities;
}

async function getAllCities() {
    const isStale = Date.now() - cachedAt > CACHE_TTL_MS;

    if (!citiesCache || isStale) {
        citiesCache = await fetchAllCities();
        cachedAt = Date.now();
    }

    return citiesCache;
}

/**
 * Encontra a cidade correspondente ao nome informado
 * (ex.: "São Paulo", "sao paulo", "Sorocaba").
 * Retorna null se nenhuma cidade do Ingresso.com bater com o nome.
 */
async function findCityByName(cityName) {
    if (!cityName) return null;

    const cities = await getAllCities();
    const target = normalize(cityName);

    return (
        cities.find(
            (city) =>
                normalize(city.name) === target || normalize(city.urlKey) === target
        ) || null
    );
}

module.exports = { getAllCities, findCityByName };
