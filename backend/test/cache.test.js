
const test = require('node:test');
const assert = require('node:assert/strict');
const TtlCache = require('../src/utils/cache');

test('TtlCache reutiliza valor antes do vencimento', async () => {
  const cache = new TtlCache(1000);
  let calls = 0;
  const loader = async () => ++calls;

  assert.equal(await cache.getOrSet('a', loader), 1);
  assert.equal(await cache.getOrSet('a', loader), 1);
  assert.equal(calls, 1);
});

test('TtlCache deduplica chamadas simultâneas', async () => {
  const cache = new TtlCache(1000);
  let calls = 0;
  const loader = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return 'ok';
  };

  const results = await Promise.all([
    cache.getOrSet('a', loader),
    cache.getOrSet('a', loader),
    cache.getOrSet('a', loader),
  ]);

  assert.deepEqual(results, ['ok', 'ok', 'ok']);
  assert.equal(calls, 1);
});
