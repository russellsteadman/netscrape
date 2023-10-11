import test from 'ava';
import Bot from '../index.js';
import * as Errors from '../errors.js';
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

  const ts1 = Date.now();
  let req = await bot.makeRequest(`http://127.0.0.1:${start.port}/`);
  it.is(req.body, 'Home');

  const ts2 = Date.now();
  req = await bot.makeRequest(`http://127.0.0.1:${start.port}/a`);
  it.is(req.body, 'A');

  const ts3 = Date.now();
  req = await bot.makeRequest(`http://127.0.0.1:${start.port}/a/b`);
  it.is(req.body, 'B');

  const ts4 = Date.now();
  req = await bot.makeRequest(`http://127.0.0.1:${start.port}/a/b/c`);
  it.is(req.body, 'C');

  const ts5 = Date.now();

  const [req1, req2, req3, req4, req5] = start.requests;

  it.is(req1.path, '/robots.txt');
  it.is(req2.path, '/');
  it.is(req3.path, '/a');
  it.is(req4.path, '/a/b');
  it.is(req5.path, '/a/b/c');

  it.true(ts2 - ts1 >= 900 && ts2 - ts1 <= 1200);
  it.true(ts3 - ts2 >= 900 && ts3 - ts2 <= 1200);
  it.true(ts4 - ts3 >= 900 && ts4 - ts3 <= 1200);
  it.true(ts5 - ts4 >= 900 && ts5 - ts4 <= 1200);
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

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Request blocked by robots.txt',
    },
  );

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/a`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Request blocked by robots.txt',
    },
  );

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/a/b`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Request blocked by robots.txt',
    },
  );

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/a/b/c`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Request blocked by robots.txt',
    },
  );
});

test('Bot responds to 400 errors', async (it) => {
  const start = await startServer('User-agent: *\nAllow: /', {
    robots400: true,
  });
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

test('Bot responds to 500 errors', async (it) => {
  const start = await startServer('User-agent: *\nAllow: /', {
    robots500: true,
  });
  server = start.server;

  const bot = new Bot({ name: 'Test', version: '0.1' });

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Request blocked by robots.txt',
    },
  );

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/a`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Request blocked by robots.txt',
    },
  );

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/a/b`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Request blocked by robots.txt',
    },
  );

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/a/b/c`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Request blocked by robots.txt',
    },
  );
});

test.afterEach(async () => {
  if (server) {
    await stopServer(server);
  }
});
