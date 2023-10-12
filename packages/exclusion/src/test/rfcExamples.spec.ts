import test from 'ava';
import { RobotsTxt } from '../index.js';
import { loadText } from './_test.util.js';

const rfcOneRobots = loadText('./assets/rfc1Robots.txt');
const rfcTwoRobots = loadText('./assets/rfc2Robots.txt');
const rfcThreeRobots = loadText('./assets/rfc3Robots.txt');
const rfcFourRobots = loadText('./assets/rfc4Robots.txt');

test('RFC 9309 5.1: Catch all', (it) => {
  const robotsTxt = new RobotsTxt(rfcOneRobots);

  const ua = 'Test_1';

  it.is(robotsTxt.isPathAllowed('/', ua), true);
  it.is(robotsTxt.isPathAllowed('/foo', ua), true);
  it.is(robotsTxt.isPathAllowed('/foo/bar', ua), true);
  it.is(robotsTxt.isPathAllowed('/foo/bin.gif', ua), false);
  it.is(robotsTxt.isPathAllowed('/foo/bin.gif/baz', ua), true);
  it.is(robotsTxt.isPathAllowed('/example', ua), true);
  it.is(robotsTxt.isPathAllowed('/example/', ua), false);
  it.is(robotsTxt.isPathAllowed('/example/foo', ua), false);
  it.is(robotsTxt.isPathAllowed('/publications/', ua), true);
});

test('RFC 9309 5.1: Simple Case', (it) => {
  const robotsTxt = new RobotsTxt(rfcOneRobots);

  const ua = 'foobot';

  it.is(robotsTxt.isPathAllowed('/', ua), false);
  it.is(robotsTxt.isPathAllowed('/foo', ua), false);
  it.is(robotsTxt.isPathAllowed('/foo/bar', ua), false);
  it.is(robotsTxt.isPathAllowed('/example/page.html', ua), true);
  it.is(robotsTxt.isPathAllowed('/example/page.html/test', ua), true);
  it.is(robotsTxt.isPathAllowed('/example/allowed.gif', ua), true);
  it.is(robotsTxt.isPathAllowed('/example/allowed.gif/xyz', ua), true);
  it.is(robotsTxt.isPathAllowed('/example/', ua), false);
  it.is(robotsTxt.isPathAllowed('/publications/', ua), false);
});

test('RFC 9309 5.1: Multi UA', (it) => {
  const robotsTxt = new RobotsTxt(rfcOneRobots);

  const ua1 = 'barbot';
  const ua2 = 'bazbot';

  it.is(robotsTxt.isPathAllowed('/', ua1), true);
  it.is(robotsTxt.isPathAllowed('/foo', ua1), true);
  it.is(robotsTxt.isPathAllowed('/foo/bar', ua1), true);
  it.is(robotsTxt.isPathAllowed('/example/page.html', ua1), false);
  it.is(robotsTxt.isPathAllowed('/example/page.html/test', ua1), false);
  it.is(robotsTxt.isPathAllowed('/example/allowed.gif', ua1), true);
  it.is(robotsTxt.isPathAllowed('/example/allowed.gif/xyz', ua1), true);
  it.is(robotsTxt.isPathAllowed('/example/', ua1), true);
  it.is(robotsTxt.isPathAllowed('/publications/', ua1), true);

  it.is(robotsTxt.isPathAllowed('/', ua2), true);
  it.is(robotsTxt.isPathAllowed('/foo', ua2), true);
  it.is(robotsTxt.isPathAllowed('/foo/bar', ua2), true);
  it.is(robotsTxt.isPathAllowed('/example/page.html', ua2), false);
  it.is(robotsTxt.isPathAllowed('/example/page.html/test', ua2), false);
  it.is(robotsTxt.isPathAllowed('/example/allowed.gif', ua2), true);
  it.is(robotsTxt.isPathAllowed('/example/allowed.gif/xyz', ua2), true);
  it.is(robotsTxt.isPathAllowed('/example/', ua2), true);
  it.is(robotsTxt.isPathAllowed('/publications/', ua2), true);
});

test('RFC 9309 5.1: Empty UA field', (it) => {
  const robotsTxt = new RobotsTxt(rfcOneRobots);

  const ua = 'quxbot';

  it.is(robotsTxt.isPathAllowed('/', ua), true);
  it.is(robotsTxt.isPathAllowed('/foo', ua), true);
  it.is(robotsTxt.isPathAllowed('/foo/bar', ua), true);
  it.is(robotsTxt.isPathAllowed('/foo/bin.gif', ua), true);
  it.is(robotsTxt.isPathAllowed('/foo/bin.gif/baz', ua), true);
  it.is(robotsTxt.isPathAllowed('/example', ua), true);
  it.is(robotsTxt.isPathAllowed('/example/', ua), true);
  it.is(robotsTxt.isPathAllowed('/example/foo', ua), true);
  it.is(robotsTxt.isPathAllowed('/publications/', ua), true);
});

test('RFC 9309 5.2: Path length precedence', (it) => {
  const robotsTxt = new RobotsTxt(rfcTwoRobots);

  const ua = 'foobot';

  it.is(robotsTxt.isPathAllowed('/example/page/', ua), true);
  it.is(robotsTxt.isPathAllowed('/example/page/disallowed.gif', ua), false);
});

test('RFC 9309 2.2.2: Allow duplicate precedence', (it) => {
  const robotsTxt = new RobotsTxt(rfcThreeRobots);

  const ua = 'foobot';

  it.is(robotsTxt.isPathAllowed('/example/page/', ua), true);
});

test('RFC 9309 2.2.2: Allow duplicate precedence (reversed)', (it) => {
  const robotsTxt = new RobotsTxt(rfcFourRobots);

  const ua = 'foobot';

  it.is(robotsTxt.isPathAllowed('/example/page/', ua), true);
});
