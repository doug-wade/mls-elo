const tap = require('tap');
const assert = require('assert');
const updateElo = require('../lib/updateElo');

tap.test('calculates wins properly for home teams', async (t) => {
  // TOR vs SJ 9/13/2017
  const expected = 1452.609494802525;
  const actual = updateElo({
    verbose: false,
    match: {
      homegoals: 4,
      awaygoals: 0,
      homeranking: 1447.0335054961922,
      awayranking: 1250.974781144293,
      k: 45
    },
    won: true,
    isHome: true
  });
  t.equal(expected, actual);
});

tap.test('calculates draws properly for home teams', async (t) => {
  // SEA vs LAG 9/10/2017
  const expected = 1348.5703850055895;
  const actual = updateElo({
    verbose: false,
    match: {
      homegoals: 1,
      awaygoals: 1,
      homeranking: 1363.1856121086255,
      awayranking: 1194.080438784517,
      k: 45
    },
    won: false,
    isHome: true
  });
  t.equal(expected, actual);
});

tap.test('calculates loses properly for home teams', async (t) => {
  // HOU vs COL 9/9/2017
  const expected = 1284.5718249611687;
  const actual = updateElo({
    verbose: false,
    match: {
      homegoals: 0,
      awaygoals: 1,
      homeranking: 1313.2838985620288,
      awayranking: 1185.1598345506943,
      k: 45
    },
    won: false,
    isHome: true
  });
  t.equal(expected, actual);
});

tap.test('calculates wins properly for away teams', async (t) => {
  // COL at HOU 9/9/2017
  const expected = 1213.8719081515544;
  const actual = updateElo({
    verbose: false,
    match: {
      homegoals: 0,
      awaygoals: 1,
      homeranking: 1313.2838985620288,
      awayranking: 1185.1598345506943,
      k: 45
    },
    won: true,
    isHome: false
  });
  t.equal(expected, actual);
});

tap.test('calculates draws properly for away teams', async (t) => {
  // SEA vs LAG 9/10/2017
  const expected = 1208.6956658875529;
  const actual = updateElo({
    verbose: false,
    match: {
      homegoals: 1,
      awaygoals: 1,
      homeranking: 1363.1856121086255,
      awayranking: 1194.080438784517,
      k: 45
    },
    won: false,
    isHome: false
  });
  t.equal(expected, actual);
});

tap.test('calculates loses properly for away teams', async (t) => {
  // NE at ATL 9/13/2017
  const expected = 1245.3987918379603;
  const actual = updateElo({
    verbose: false,
    match: {
      homegoals: 4,
      awaygoals: 0,
      homeranking: 1447.0335054961922,
      awayranking: 1250.974781144293,
      k: 45
    },
    won: false,
    isHome: false
  });
  t.equal(expected, actual);
});
