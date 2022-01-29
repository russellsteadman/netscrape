import test from 'ava';
import { RobotsTxtLine } from '../src/index';
import {
  LINE_EQUAL_TEST_CASES,
  LINE_MATCH_TEST_CASES,
  LINE_MISMATCH_TEST_CASES,
} from './assets/testCases.json';

test('RobotsTxtLine#constructor()', (it) => {
  for (const [line, result] of LINE_EQUAL_TEST_CASES) {
    it.is(new RobotsTxtLine('allow', line).value, result);
  }

  it.is(new RobotsTxtLine('crawl-delay', '5').delay, 5000);
});

test('RobotsTxtLine#isOwnUserAgent()', (it) => {
  it.is(new RobotsTxtLine('crawl-delay', '5').isOwnUserAgent('Test_1'), 0);
  it.is(new RobotsTxtLine('user-agent', 'Test_2').isOwnUserAgent('Test_1'), 0);
  it.is(new RobotsTxtLine('user-agent', '*').isOwnUserAgent('Test_1'), 1);
  it.is(new RobotsTxtLine('user-agent', 'Test_1').isOwnUserAgent('Test_1'), 2);
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
      new RobotsTxtLine('allow', robotsPath).isPathAllowedByLine(attemptPath),
      undefined,
      `${robotsPath} -> ${attemptPath} does not match`,
    );
  }

  it.is(
    new RobotsTxtLine('user-agent', '/abc').isPathAllowedByLine('/abc'),
    false,
  );

  it.is(new RobotsTxtLine('allow', '/exactly$').strictEOL, true);
  it.is(new RobotsTxtLine('allow', '/kinda').strictEOL, undefined);

  it.is(
    new RobotsTxtLine('allow', '/exactly$').isPathAllowedByLine('/exactly'),
    true,
  );
  it.is(
    new RobotsTxtLine('allow', '/exactly$').isPathAllowedByLine('/exactly/'),
    undefined,
  );
  it.is(
    new RobotsTxtLine('allow', '/exactly$').isPathAllowedByLine(
      '/exactly/kinda',
    ),
    undefined,
  );
  it.is(
    new RobotsTxtLine('allow', '/exactly$').isPathAllowedByLine('/exactly?a=1'),
    undefined,
  );

  it.is(new RobotsTxtLine('disallow', '').value, '');
  it.is(new RobotsTxtLine('disallow', '').isPathAllowedByLine('/'), undefined);
});
