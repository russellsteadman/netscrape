import test from 'ava';
import { RobotsTxt, RobotsTxtLine } from '../src/robotsParser';
import amazonRobots from './assets/amazonRobots.json';

test('RobotsTxt#constructor()', (it) => {
  const robotsTxt = new RobotsTxt(amazonRobots);
  it.is(robotsTxt.lines.length, 151, 'Line count incorrect');
});

// Equivalent per RFC
const LINE_EQUAL_TEST_CASES = new Map([
  ['/foo/bar?baz=quz', '/foo/bar?baz=quz'],
  ['/foo/bar?baz=http://foo.bar', '/foo/bar?baz=http%3A%2F%2Ffoo.bar'],
  ['/foo/bar/ツ', '/foo/bar/%E3%83%84'],
  ['/foo/bar/%E3%83%84', '/foo/bar/%E3%83%84'],
  ['/foo/bar/%62%61%7A', '/foo/bar/baz'],
]);

// Robots path -> fetch path, matching
const LINE_MATCH_TEST_CASES = new Map([
  ['/foo/bar', '/foo/bar/baz'],
  ['/foo/bar', '/foo/bar/'],
  ['/foo/bar', '/foo/bar?'],
]);

// Robots path -> fetch path, not matching
const LINE_MISMATCH_TEST_CASES = new Map([
  ['/foo/bar', '/foo/ba'],
  ['/foo/bar', '/foo/'],
  ['/foo/bar', '/foo'],
  ['/foo/bar', '/foo/baz/bar'],
  ['/foo/*/bar', '/foo/bar'],
  ['/foo/bar$', '/foo/bar/'],
  ['/foo/bar$', '/foo/bar/baz'],
  ['/foo/bar', '/foo/bar/baz'],
]);

test('RobotsTxtLine#constructor()', (it) => {
  for (const [line, result] of LINE_EQUAL_TEST_CASES) {
    it.is(new RobotsTxtLine('allow', line).value, result);
  }
});

test('RobotsTxtLine#isPathAllowedByLine()', (it) => {
  for (const [line, result] of LINE_EQUAL_TEST_CASES) {
    it.is(
      new RobotsTxtLine('allow', line).isPathAllowedByLine(result),
      true,
      `${line} matches 1`,
    );
    it.is(
      new RobotsTxtLine('allow', line).isPathAllowedByLine(line),
      true,
      `${line} matches 2`,
    );
  }
  for (const [robotsPath, attemptPath] of LINE_MATCH_TEST_CASES) {
    it.is(
      new RobotsTxtLine('allow', robotsPath).isPathAllowedByLine(attemptPath),
      true,
      `${robotsPath} -> ${attemptPath} matches`,
    );
  }
  for (const [robotsPath, attemptPath] of LINE_MISMATCH_TEST_CASES) {
    it.is(
      typeof new RobotsTxtLine('allow', robotsPath).isPathAllowedByLine(
        attemptPath,
      ),
      'undefined',
      `${robotsPath} -> ${attemptPath} does not match`,
    );
  }
});
