import test from 'ava';
import Bot from '../index.js';
import { type Server } from 'http';
import { startServer, stopServer } from './_server.util.js';

let server: Server | undefined;

test('Bot#constructor()', (it) => {
  const bot = new Bot({ name: 'Test', version: '0.1' });
  it.is(typeof bot.makeRequest, 'function');
});

test('Bot disallow none', async (it) => {
  const start = await startServer('User-agent: *\nDisallow:');
  server = start.server;

  const bot = new Bot({ name: 'Test', version: '0.1' });

  let req = await bot.makeRequest(`http://127.0.0.1:${start.port}/`);
  it.is(req.body, 'Home');

  req = await bot.makeRequest(`http://127.0.0.1:${start.port}/a`);
  it.is(req.body, 'A');

  req = await bot.makeRequest(`http://127.0.0.1:${start.port}/a/b`);
  it.is(req.body, 'B');

  req = await bot.makeRequest(`http://127.0.0.1:${start.port}/a/b/c`);
  it.is(req.body, 'C');

  const [req1, req2, req3, req4, req5] = start.requests;

  console.log('Cache size', bot.cache.size);

  console.log(req1);

  it.is(req1.path, '/robots.txt');
  it.is(req2.path, '/');
  it.is(req3.path, '/a');
  it.is(req4.path, '/a/b');
  it.is(req5.path, '/a/b/c');
});

test('Bot allow all', async (it) => {
  const start = await startServer('User-agent: *\nAllow: /');
  server = start.server;

  const bot = new Bot({ name: 'Test', version: '0.1' });

  let req = await bot.makeRequest(`http://127.0.0.1:${start.port}/`);
  it.is(req.body, 'Home');

  req = await bot.makeRequest(`http://127.0.0.1:${start.port}/a`);
  it.is(req.body, 'A');

  req = await bot.makeRequest(`http://127.0.0.1:${start.port}/a/b`);
  it.is(req.body, 'B');

  req = await bot.makeRequest(`http://127.0.0.1:${start.port}/a/b/c`);
  it.is(req.body, 'C');
});

test('Bot disallow all', async (it) => {
  const start = await startServer('User-agent: *\nDisallow: /');
  server = start.server;

  const bot = new Bot({ name: 'Test', version: '0.1' });

  await it.throwsAsync(() =>
    bot.makeRequest(`http://127.0.0.1:${start.port}/`),
  );

  await it.throwsAsync(() =>
    bot.makeRequest(`http://127.0.0.1:${start.port}/a`),
  );

  await it.throwsAsync(() =>
    bot.makeRequest(`http://127.0.0.1:${start.port}/a/b`),
  );

  await it.throwsAsync(() =>
    bot.makeRequest(`http://127.0.0.1:${start.port}/a/b/c`),
  );
});

test.afterEach(async () => {
  if (server) {
    await stopServer(server);
  }
});
