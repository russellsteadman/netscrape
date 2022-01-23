import test from 'ava';
import Bot from '../src/index';

test('Bot#constructor()', (it) => {
  const bot = new Bot({ name: 'Test', version: '0.1' });
  it.is(typeof bot.makeRequest, 'function');
});
