const tap = require('tap');
const assert = require('assert');
const heightToInches = require('../lib/heightToInches');

tap.test('converts 6\' 1" properly', async (t) => {
  t.equals(73, heightToInches('6\' 1"'));
});

tap.test('ignores excess spaces', async (t) => {
  t.equals(71, heightToInches(' 5\'  11" '));
});

tap.test('ignores excess carriage returns', async (t) => {
  t.equals(56, heightToInches('\n 4\' \n 8" \n'));
});
