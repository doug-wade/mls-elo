const tap = require('tap');
const assert = require('assert');
const calculateFantasyPoints = require('../lib/calculateFantasyPoints');

tap.test('calculates outfield player points correctly', async (t) => {
  const expected = 14;
  const actual = calculateFantasyPoints({
    appearance: 'Started',
    assists: 0,
    foulsssuffered: 5,
    goals: 2,
    minutes: 90,
    position: 'Midfielder',
    reds: 0,
    shots: 5,
    yellows: 0
  });
  t.equals(expected, actual);
});

tap.test('calculates outfield player points correctly', async (t) => {
  const expected = 8;
  const actual = calculateFantasyPoints({
    appearance: 'Started',
    position: 'Goalkeeper',
    minutes: 90,
    goalsfor: 0,
    goalsagainst: 0,
    shotsongoal: 3,
    saves: 3,
    penaltykicksagainst: 0,
    penaltykickgoals: 0,
    penaltykicksaves: 0,
  });
  t.equals(expected, actual);
});
