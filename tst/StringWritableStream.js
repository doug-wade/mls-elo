const tap = require('tap');
const assert = require('assert');
const StringWritableStream = require('../lib/StringWritableStream');

tap.test('constructor does not throw', async (t) => {
  t.doesNotThrow(() => {
    new StringWritableStream();
  });
});
