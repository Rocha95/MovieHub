
const test = require('node:test');
const assert = require('node:assert/strict');
const ingressoService = require('../src/services/ingresso.service');

test('filtro de sessões reconhece títulos com variações de exibição', () => {
  const movies = [
    { id: 1, title: 'Duna: Parte Dois' },
    { id: 2, title: 'Oppenheimer' },
    { id: 3, title: 'Avatar 2' },
  ];

  const result = ingressoService.filterMoviesByTitles(movies, [
    'Duna Parte Dois IMAX',
    'Avatar 2 3D',
  ]);

  assert.deepEqual(result.map((movie) => movie.id), [1, 3]);
});
