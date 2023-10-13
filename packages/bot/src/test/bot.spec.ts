import test from 'ava';
import Bot from '../index.js';
import * as Errors from '../errors.js';
import { startServer, stopServer } from './_server.util.js';

test('Bot#constructor()', (it) => {
  const bot = new Bot({ name: 'Test', version: '0.1' });
  it.is(typeof bot.makeRequest, 'function');
});

test('Bot disallow none', async (it) => {
  const start = await startServer('User-agent: *\nDisallow:');
  it.teardown(async () => await stopServer(start.server));

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
  it.teardown(async () => await stopServer(start.server));

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
  it.teardown(async () => await stopServer(start.server));

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

test('RFC 9309 2.3.1.3: Responds to 400 errors', async (it) => {
  const start = await startServer('User-agent: *\nAllow: /', {
    robots400: true,
  });
  it.teardown(async () => await stopServer(start.server));

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

test('RFC 9309 2.3.1.4: Responds to 500 errors', async (it) => {
  const start = await startServer('User-agent: *\nAllow: /', {
    robots500: true,
  });
  it.teardown(async () => await stopServer(start.server));

  const bot = new Bot({ name: 'Test', version: '0.1' });

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Robots.txt server error',
    },
  );

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/a`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Robots.txt server error',
    },
  );

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/a/b`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Robots.txt server error',
    },
  );

  await it.throwsAsync(
    () => bot.makeRequest(`http://127.0.0.1:${start.port}/a/b/c`),
    {
      instanceOf: Errors.RobotsRejection,
      message: 'Robots.txt server error',
    },
  );
});

test('Bot#makeRequestWithBody()', async (it) => {
  const bot = new Bot({ name: 'Test', version: '0.1' });
  const start = await startServer('User-agent: *\nAllow: /');
  it.teardown(async () => await stopServer(start.server));

  it.is(typeof bot.makeRequestWithBody, 'function');

  let res = await bot.makeRequestWithBody(
    `http://127.0.0.1:${start.port}/`,
    'Hello, world!',
  );
  it.is(res.body, 'Home POST');

  res = await bot.makeRequestWithBody(
    `http://127.0.0.1:${start.port}/a`,
    'Hello, world!',
  );

  it.is(res.body, 'A POST');

  res = await bot.makeRequestWithBody(
    `http://127.0.0.1:${start.port}/a/b`,
    'Hello, world!',
  );

  it.is(res.body, 'B POST');

  res = await bot.makeRequestWithBody(
    `http://127.0.0.1:${start.port}/a/b/c`,
    'Hello, world!',
  );

  it.is(res.body, 'C POST');

  let req = start.requests[1];
  it.is(req.method, 'POST');
  it.is(req.headers['content-type'], 'text/plain');
  it.is(req.headers['content-length'], '13');

  res = await bot.makeRequestWithBody(
    `http://127.0.0.1:${start.port}/`,
    '<p></p>',
    { 'Content-Type': 'text/html' },
  );

  req = start.requests[5];

  it.is(res.body, 'Home POST');

  it.is(req.method, 'POST');
  it.is(req.headers['content-type'], 'text/html');
  it.is(req.headers['content-length'], '7');

  res = await bot.makeRequestWithBody(`http://127.0.0.1:${start.port}/`, {
    hello: 'world',
  });

  req = start.requests[6];

  it.is(res.body, 'Home POST');

  it.is(req.method, 'POST');
  it.is(req.headers['content-type'], 'application/json');
  it.is(req.headers['content-length'], '17');
});
