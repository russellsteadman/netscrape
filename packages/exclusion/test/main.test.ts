import test from 'ava';
import { RobotsTxt } from '../src/index';
import amazonRobots from './assets/amazonRobots.json';
import { LINE_EQUAL_TEST_CASES } from './assets/testCases.json';

const robotsTxtSourceOne = `User-Agent: Hello
${LINE_EQUAL_TEST_CASES.map(([line]) => `Disallow: ${line}`).join('\n')}
Crawl-Delay: 23

User-Agent: *
${LINE_EQUAL_TEST_CASES.map(([line]) => `Allow: ${line}`).join('\n')}
Disallow: /
Crawl-Delay: 1

User-Agent: Goodbye
${LINE_EQUAL_TEST_CASES.map(([line]) => `Disallow: ${line}`).join('\n')}
Disallow: /
Crawl-Delay: 7`;

test('RobotsTxt#constructor()', (it) => {
  const robotsTxt = new RobotsTxt(amazonRobots);
  it.is(robotsTxt.lines.length, 154, 'Line count incorrect');
});

test('RobotsTxt#getDelay()', (it) => {
  const robotsTxt = new RobotsTxt(amazonRobots);
  it.is(robotsTxt.getDelay('Not_an_agent'), 5000);
  it.is(robotsTxt.getDelay('Test_1'), 10000);
  it.is(robotsTxt.getDelay('EtaoSpider'), 10000);

  const robotsTxtBlank = new RobotsTxt(
    'Sitemap: https://example.com/sitemap.xml',
  );
  it.is(robotsTxtBlank.getDelay('Not_an_agent'), undefined);

  const robotsTxtBadDelay = new RobotsTxt('User-Agent: *\nCrawl-Delay: a');
  it.is(robotsTxtBadDelay.getDelay('Not_an_agent'), undefined);
});

test('RobotsTxt#isPathAllowed()', (it) => {
  const robotsTxt = new RobotsTxt(robotsTxtSourceOne);

  for (const [line, result] of LINE_EQUAL_TEST_CASES) {
    it.is(robotsTxt.isPathAllowed(line, 'Hello'), false, line);
    it.is(robotsTxt.isPathAllowed(line, 'Not_an_agent'), true, line);
    it.is(robotsTxt.isPathAllowed(line, 'Goodbye'), false, line);
    it.is(robotsTxt.isPathAllowed(result, 'Hello'), false, result);
    it.is(robotsTxt.isPathAllowed(result, 'Not_an_agent'), true, result);
    it.is(robotsTxt.isPathAllowed(result, 'Goodbye'), false, result);
  }

  it.is(robotsTxt.isPathAllowed('/random', 'Hello'), false);
  it.is(robotsTxt.isPathAllowed('/random', 'Not_an_agent'), false);
  it.is(robotsTxt.isPathAllowed('/random', 'Goodbye'), false);

  it.is(robotsTxt.isPathAllowed('/', 'Hello'), false);
  it.is(robotsTxt.isPathAllowed('/', 'Not_an_agent'), false);
  it.is(robotsTxt.isPathAllowed('/', 'Goodbye'), false);

  it.is(new RobotsTxt('').isPathAllowed('/', 'Test_1'), true);
  it.is(
    new RobotsTxt(
      'User-agent: Hi\nUser-Agent: *\nUser-Agent: Test_1\nDisallow:',
    ).isPathAllowed('/', 'Test_1'),
    true,
  );

  const robotsTxtAmz = new RobotsTxt(amazonRobots);

  it.is(robotsTxtAmz.isPathAllowed('/b?node=9052533011', 'Test_1'), false);
  it.is(
    robotsTxtAmz.isPathAllowed('/b?hello&node=9052533011', 'Test_1'),
    false,
  );
});
