const ingressoClient = require('../clients/ingresso.client');
const cityService = require('./city.service');

// Slugs conhecidos de cinemas por cidade
const KNOWN_PARTNERSHIPS_BY_CITY = {
    'sorocaba': [
        'multiplex-pateo-ciane',
        'cinepolis-iguatemi-esplanada',
        'cinespace-sorocaba'
    ],
    'sao-paulo': [
        'cinemark-sp-market',
        'cinemark-patio-paulista',
        'uci-santana-parque-shopping'
    ]
};

/**
 * Normaliza strings para comparação flexível
 */
function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\b(3d|2d|dublado|legendado|imax|macro-xe|xd|4dx)\b/gi, '') // Remove tags de exibição
        .replace(/[^a-z0-9]/g, ''); // Remove pontuação e espaços
}

function flexibleTitlesMatch(titleA, titleB) {
    const normA = normalizeText(titleA);
    const normB = normalizeText(titleB);

    if (!normA || !normB) return false;
    return normA.includes(normB) || normB.includes(normA);
}

class IngressoService {

    async getEventsByPartnership(partnershipSlug) {
        try {
            const { data } = await ingressoClient.get(`/events/partnership/${partnershipSlug}`);
            if (!data) return [];
            return Array.isArray(data) ? data : (data.events || data.items || data.data || []);
        } catch (error) {
            console.error(`❌ Erro no Ingresso.com (${partnershipSlug}):`, error.response?.status || error.message);
            return [];
        }
    }

    extractTitle(event) {
        if (!event) return null;
        return (
            event.title ||
            event.name ||
            event.movieTitle ||
            event.originalTitle ||
            event.movie?.title ||
            event.movie?.name ||
            null
        );
    }

    async getMovieTitlesInCity(cityName) {
        if (!cityName) return null;

        const city = await cityService.findCityByName(cityName);
        const cityKey = city?.urlKey || normalizeText(cityName);

        const partnerships = KNOWN_PARTNERSHIPS_BY_CITY[cityKey] || KNOWN_PARTNERSHIPS_BY_CITY['sorocaba'];

        if (!partnerships || partnerships.length === 0) {
            return null;
        }

        const eventLists = await Promise.all(
            partnerships.map((slug) => this.getEventsByPartnership(slug))
        );

        const titles = eventLists
            .flat()
            .map(this.extractTitle)
            .filter(Boolean);

        if (titles.length === 0) return null;

        return Array.from(new Set(titles));
    }

    filterMoviesByTitles(movies, referenceTitles) {
        if (!Array.isArray(movies) || !Array.isArray(referenceTitles) || referenceTitles.length === 0) {
            return [];
        }

        return movies.filter((movie) =>
            referenceTitles.some((ref) =>
                flexibleTitlesMatch(movie.title, ref) ||
                flexibleTitlesMatch(movie.originalTitle, ref)
            )
        );
    }
}

const instance = new IngressoService();

// Exporta tanto a instância quanto os métodos soltos para evitar divergência de importação
module.exports = instance;
module.exports.getMovieTitlesInCity = instance.getMovieTitlesInCity.bind(instance);
module.exports.filterMoviesByTitles = instance.filterMoviesByTitles.bind(instance);