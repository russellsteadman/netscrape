# NetScrape

Web scraping for Node.js made efficient, simple, and compliant. NetScrape complies with the [Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html).

## Installation

```bash
npm install netscrape
```

## Usage

Netscrape is designed to be simple, but also extensible enough for advanced use cases. The following example demonstrates how to make a simple request to a website.

```js
import Bot from 'netscrape';

const exampleBot = new Bot({ name: 'ExampleBot', version: '1.0' });

try {
  const response = await exampleBot.makeRequest('https://www.example.com/path');
  console.log(response.body);
} catch (error) {
  console.error(error);
}
```

### Bot#constructor

```ts
import Bot from 'netscrape';

type BotOptions = {
  name: string;
  version: string;
  minimumRequestDelay?: number;
  maximumRequestDelay?: number;
  disableCaching?: boolean;
  policyURL?: string;
  hideLibraryAgent?: boolean;
  userAgent?: string;
};

const exampleBot = new Bot({
  name: 'ExampleBot' /* required, Name of your bot */,
  version: '1.0' /* required, Version of your bot */,
  minimumRequestDelay: 1000 /* optional, Minimum delay between requests in milliseconds */,
  maximumRequestDelay: 5000 /* optional, Maximum delay between requests in milliseconds (default 10000) */,
  disableCaching:
    true /* optional, Disable caching of responses (default false) */,
  policyURL:
    'https://www.example.com/robots.txt' /* optional, URL to robots.txt file (default https://npm.im/netscrape) */,
  hideLibraryAgent:
    true /* optional, Hide the library agent from the user agent (default false) */,
  userAgent:
    'ExampleBot/1.0' /* optional, Custom user agent, overrides all other user agent fields */,
});
```

### Bot#makeRequest

```ts
import Bot from 'netscrape';

const exampleBot = new Bot({ name: 'ExampleBot', version: '1.0' });

try {
  /* Note: Bot#makeRequest automatically requests /robots.txt in the background */
  const response = await exampleBot.makeRequest(
    'https://www.example.com/path' /* required, well-formatted URL to make request to */,
    false /* optional, should you return a byte stream instead of utf8 text */,
  );

  /* Bot#makeRequest returns the raw npm.im/got package request response */
  console.log(response.body);
} catch (error) {
  /* Robots.txt rejection, robots.txt 500 error, etc. */
  console.error(error);
}
```

## License

MIT (C) 2023 [Russell Steadman](https://github.com/russellsteadman). See LICENSE file. Visit [Google
deps.dev](https://deps.dev/npm/netscrape) for dependency information.
