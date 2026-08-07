const axios = require('axios');

const omdbClient = axios.create({
    baseURL: 'http://www.omdbapi.com',
    params: {
        apikey: process.env.OMDB_API_KEY
    }
});

module.exports = omdbClient;
