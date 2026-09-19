
const cityService = require('../services/city.service');

class CityController {
  list = async (req, res, next) => {
    try {
      const search = String(req.query.search || '').trim().toLowerCase();
      const cities = await cityService.getAllCities();
      const filtered = search
        ? cities.filter((city) =>
            `${city.name} ${city.urlKey}`.toLowerCase().includes(search)
          )
        : cities;

      res.json(
        filtered
          .slice(0, 50)
          .map((city) => ({
            id: city.id,
            name: city.name,
            uf: city.uf,
            urlKey: city.urlKey,
          }))
      );
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new CityController();
