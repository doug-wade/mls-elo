const tap = require('tap');
const assert = require('assert');
const getBirthdateFromAgeString = require('../lib/getBirthdateFromAgeString');

tap.test('converts \n21 (07/06/1996) properly', async (t) => {
  t.equals(836636400000, getBirthdateFromAgeString('\n21 (07/06/1996)'));
});

tap.test('ignores excess spaces', async (t) => {
  t.equals(1355299200000, getBirthdateFromAgeString(' \n21 (12/12/2012) '));
});

tap.test('ignores excess carriage returns', async (t) => {
  t.equals(684831600000, getBirthdateFromAgeString('\n \n21 \n (09/14/1991) \n'));
});
