const axios = require('axios');

/**
 * Cliente para a API não-oficial do Ingresso.com (api-content.ingresso.com).
 * Não há documentação pública oficial — este cliente foi montado a partir
 * de endpoints observados em integrações de terceiros (wrappers open-source,
 * componente do Home Assistant, etc). Pode quebrar sem aviso se a Ingresso
 * alterar a API; trate erros dela sempre com fallback (ver ingresso.service.js).
 */
const ingressoClient = axios.create({
    baseURL: 'https://api-content.ingresso.com/v0',
    timeout: 10000,
    headers: {
        // Endpoint não-oficial: em alguns momentos respondeu melhor com um
        // User-Agent de navegador do que com o padrão do axios/node.
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json',
    },
});

module.exports = ingressoClient;
