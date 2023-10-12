# Exclusion

A simple and RFC 9309 compliant `robots.txt` parser for Node.js.

![](https://img.shields.io/librariesio/release/npm/exclusion?style=flat-square)
![](https://img.shields.io/npm/l/exclusion?style=flat-square) ![](https://img.shields.io/snyk/vulnerabilities/npm/exclusion?style=flat-square)

## Get Started

```sh
npm install --save exclusion
```

```sh
yarn add exclusion
```

This is the `robots.txt` parser used by the
[`netscrape`](https://www.npmjs.com/packages/netscrape) package. You may want to
check out
[NetScrape](https://github.com/russellsteadman/netscrape/tree/main/packages/bot#readme)
for most simple bot use-cases.

## Usage

```js
const { RobotsTxt } = require('exclusion');

// Fetch a robots.txt file...

// Pass a robots.txt string to initialize the parser
const robotsTxt = new RobotsTxt(myRobotsTxtString);

// Check a path
robotsTxt.isPathAllowed('/certain/path', 'MyUserAgent');
// returns boolean

// Check a delay
robotsTxt.getDelay('MyUserAgent');
// returns delay in milliseconds or undefined
```

## License

MIT (C) 2023 [Russell Steadman](https://github.com/russellsteadman). See LICENSE file. Visit [Google
deps.dev](https://deps.dev/npm/exclusion) for dependency license information.
