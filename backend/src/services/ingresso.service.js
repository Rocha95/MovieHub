
const ingressoClient = require('../clients/ingresso.client');
const cityService = require('./city.service');
const TtlCache = require('../utils/cache');

const cache = new TtlCache(10 * 60 * 1000);

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(3d|2d|dublado|legendado|imax|macro-xe|xd|4dx)\b/gi, '')
    .replace(/[^a-z0-9]/g, '');
}

function flexibleTitlesMatch(titleA, titleB) {
  const normA = normalizeText(titleA);
  const normB = normalizeText(titleB);
  if (!normA || !normB) return false;
  return normA === normB || normA.includes(normB) || normB.includes(normA);
}

function getPartnerships() {
  const configured = process.env.INGRESSO_PARTNERSHIPS || process.env.INGRESSO_PARTNERSHIP || '';
  return configured
    .split(',')
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

class IngressoService {
  async getNowPlayingByCity(city) {
    if (!city?.id) return [];
    const partnerships = getPartnerships();

    if (!partnerships.length) {
      throw new Error(
        'INGRESSO_PARTNERSHIPS não configurado. Informe as parcerias separadas por vírgula.'
      );
    }

    const results = await Promise.allSettled(
      partnerships.map(async (partnership) => {
        const key = `now-playing:${city.id}:${partnership}`;
        return cache.getOrSet(key, async () => {
          const { data } = await ingressoClient.get(
            `/templates/nowplaying/${city.id}`,
            { params: { partnership } }
          );
          return Array.isArray(data) ? data : (data?.events || data?.items || data?.data || []);
        });
      })
    );

    const successful = results.filter((result) => result.status === 'fulfilled');

    if (!successful.length) {
      const firstError = results.find((result) => result.status === 'rejected')?.reason;
      throw firstError || new Error('Não foi possível consultar o Ingresso.com para esta cidade.');
    }

    return successful
      .flatMap((result) => result.value)
      .filter(Boolean);
  }


  async getHighlightsByCity(city) {
    if (!city?.id) return [];
    const partnerships = getPartnerships();
    if (!partnerships.length) return [];

    const results = await Promise.allSettled(
      partnerships.map(async (partnership) => {
        const key = `highlights:${city.id}:${partnership}`;
        return cache.getOrSet(key, async () => {
          const { data } = await ingressoClient.get(
            `/templates/highlights/${city.id}`,
            { params: { partnership } }
          );
          return Array.isArray(data) ? data : [];
        });
      })
    );

    const successful = results.filter((result) => result.status === 'fulfilled');

    if (!successful.length) {
      const firstError = results.find((result) => result.status === 'rejected')?.reason;
      throw firstError || new Error('Não foi possível consultar as sessões desta cidade.');
    }

    return successful
      .flatMap((result) => result.value)
      .filter(Boolean);
  }

  normalizeShowtimes(highlights) {
    return highlights.flatMap((highlight) => {
      const event = highlight?.event || {};
      return (highlight?.showtimes || []).flatMap((theater) =>
        (theater?.rooms || []).flatMap((room) =>
          (room?.sessions || []).map((session) => ({
            movieTitle: event.title || event.originalTitle || null,
            movieOriginalTitle: event.originalTitle || null,
            cinema: theater.name || null,
            address: [theater.address, theater.number].filter(Boolean).join(', '),
            neighborhood: theater.neighborhood || null,
            room: room.name || null,
            time: session.time || session.date?.hour || null,
            date: session.realDate?.localDate || session.date?.localDate || null,
            price: session.price ?? null,
            url: session.siteURL || theater.siteURL || event.siteURL || null,
            type: session.types?.filter((item) => item.display !== false).map((item) => item.name) || [],
          }))
        )
      );
    }).filter((session) => session.movieTitle && session.time);
  }

  extractTitle(event) {
    return event?.title ||
      event?.name ||
      event?.movieTitle ||
      event?.originalTitle ||
      event?.movie?.title ||
      event?.movie?.name ||
      null;
  }

  async getMovieTitlesInCity(cityName) {
    const city = await cityService.findCityByName(cityName);
    if (!city) return { city: null, titles: [], reason: 'CITY_NOT_FOUND' };

    const events = await this.getNowPlayingByCity(city);
    const titles = [...new Set(events.map((event) => this.extractTitle(event)).filter(Boolean))];

    return { city, titles, reason: titles.length ? null : 'NO_SESSIONS' };
  }

  filterMoviesByTitles(movies, referenceTitles) {
    if (!Array.isArray(movies) || !Array.isArray(referenceTitles) || !referenceTitles.length) {
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
module.exports = instance;
