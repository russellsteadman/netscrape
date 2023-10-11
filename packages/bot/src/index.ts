import QuickLRU from 'quick-lru';
import CacheableLookup from 'cacheable-lookup';
import * as Errors from './errors.js';
import { RobotsTxt } from 'exclusion';
import got, { Options, type Request, type Response } from 'got';

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

type BotRequestOptions = Partial<{
  stream: boolean;
  headers: Record<string, string>;
  overrides: Partial<Options>;
}>;

class Bot {
  private robotsTxt = {} as Record<string, RobotsTxt>;
  readonly userAgent!: string;
  readonly botName!: string;
  private requestDelay = {} as Record<string, number>;
  private requestTime = {} as Record<string, Date>;
  cache!: QuickLRU<unknown, unknown>;
  dnsCachable!: CacheableLookup;
  private options!: BotOptions;

  constructor(options: BotOptions) {
    // Validate the options
    if (!options || typeof options !== 'object') {
      throw new Errors.ConfigError('Missing or misformatted Bot options');
    }

    // Validate the bot name
    if (!options.name || typeof options.name !== 'string') {
      throw new Errors.ConfigError('Bot name must be a string');
    } else if (!/^[a-zA-Z_-]+$/.test(options.name)) {
      throw new Errors.ConfigError('Bot name must only contain a-zA-Z_-');
    }

    // Validate the bot version
    if (
      !options.version ||
      typeof options.version !== 'string' ||
      !/^\d+(\.\d+){0,2}$/.test(options.version)
    ) {
      throw new Errors.ConfigError(
        'Version must be a string formatted as #, #.#, or #.#.#',
      );
    }

    // Validate the policy URL
    try {
      if (options.policyURL) {
        new URL(options.policyURL);
      }
    } catch (err) {
      throw new Errors.ConfigError('Invalid policy URL');
    }

    // Ensure the minimum and maximum request delays are valid
    if (
      options.minimumRequestDelay &&
      (typeof options.minimumRequestDelay !== 'number' ||
        options.minimumRequestDelay < 0)
    ) {
      throw new Errors.ConfigError(
        'Minimum request delay must be a positive number',
      );
    } else if (
      options.maximumRequestDelay &&
      (typeof options.maximumRequestDelay !== 'number' ||
        options.maximumRequestDelay < 0)
    ) {
      throw new Errors.ConfigError(
        'Maximum request delay must be a positive number',
      );
    } else if (
      options.minimumRequestDelay &&
      options.maximumRequestDelay &&
      options.minimumRequestDelay > options.maximumRequestDelay
    ) {
      throw new Errors.ConfigError(
        'Minimum request delay cannot be greater than maximum request delay',
      );
    }

    // Set the options
    this.options = options;

    // Set the bot name and user agent
    this.botName = options.name;
    this.userAgent =
      options.userAgent ??
      `${this.botName}/${options.version} (+${
        options.policyURL ?? 'https://npm.im/netscrape'
      })${options.hideLibraryAgent ? '' : ' NetScrape/0.1'}`;

    // Initialize the request cache and DNS cache
    this.cache = new QuickLRU({ maxSize: 50 });
    this.dnsCachable = new CacheableLookup({
      cache: new QuickLRU({ maxSize: 1000 }),
    });

    // Set the DNS servers
    this.dnsCachable.servers = [
      '1.1.1.1',
      '[2606:4700:4700::1111]',
      '1.0.0.1',
      '[2606:4700:4700::1001]',
      '8.8.8.8',
      '[2001:4860:4860::8844]',
    ];
  }

  private fetchURL(
    rawURL: string,
    options?: BotRequestOptions & { stream?: false },
  ): Promise<Response<string>>;
  private fetchURL(
    rawURL: string,
    asStream: BotRequestOptions & { stream: true },
  ): Promise<Request>;
  private async fetchURL(
    rawURL: string,
    options?: BotRequestOptions,
  ): Promise<Request | Response<string>> {
    // Parse URL
    const url = new URL(rawURL);

    // Initialize the headers
    const standardHeaders = { ...options?.headers };

    // Convert all headers to lowercase
    for (const key of Object.keys(standardHeaders)) {
      if (key !== key.toLowerCase()) {
        standardHeaders[key.toLowerCase()] = standardHeaders[key];
        delete standardHeaders[key];
      }
    }

    // Initialize the default request options
    const defaultOptions: Partial<Options> = {
      timeout: {
        lookup: 6e4,
        socket: 6e4,
        connect: 6e4,
        secureConnect: 6e4,
        send: 6e4,
        response: 6e4,
        read: 6e4,
        request: 6e4,
      },
      headers: {
        'user-agent': this.userAgent,
        accept: 'text/html;q=0.9,image/webp,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.5',
        'cache-control': 'max-age=86400',
        host: url.host,
        referer: url.origin,
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-ch-ua': '"NetScrape";v="1"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': 'Windows',
        'upgrade-insecure-requests': '1',
        ...standardHeaders,
      },
      cache: this.options.disableCaching ? false : this.cache,
      cacheOptions: {
        shared: false,
        immutableMinTimeToLive: 3600 * 1000,
      },
      dnsCache: this.options.disableCaching ? false : this.dnsCachable,
      ...options?.overrides,
    };

    // Fetch the URL as a stream if requested
    if (options?.stream === true) {
      return got.stream(rawURL, { ...defaultOptions, isStream: true });
    }

    // Fetch the URL as a string if requested
    return got.get(rawURL, {
      ...defaultOptions,
      responseType: 'text',
    }) as Request | Response<string>;
  }

  private async fetchRobotsTxt(origin: string) {
    // Fetch the robots.txt
    const robotsTxt = await this.fetchURL(`${origin}/robots.txt`, {
      overrides: { throwHttpErrors: false },
    });

    if (robotsTxt.statusCode >= 400 && robotsTxt.statusCode < 500) {
      // RFC 9309 2.3.1.3, allow all for 400 errors
      this.robotsTxt[origin] = new RobotsTxt('User-agent: *\nDisallow:');

      // 400 Errors are not cached
      return;
    } else if (robotsTxt.statusCode >= 500) {
      // RFC 9309 2.3.1.4, must reject 500 errors
      throw new Errors.RobotsRejection('Robots.txt server error');
    }

    // Parse the robots.txt
    this.robotsTxt[origin] = new RobotsTxt(robotsTxt.body);

    // Wait for the required delay if not cached
    if (!robotsTxt.isFromCache) {
      await this.waitForRequestDelay(origin);
    }
  }

  private getDelay(origin: string) {
    // Establish a minimum request delay (default 1 second)
    const minimumRequestDelay = this.options.minimumRequestDelay ?? 1000;

    // Calculate the delay for the origin based on the robots.txt
    return Math.max(this.requestDelay[origin] ?? 0, minimumRequestDelay);
  }

  private async waitForRequestDelay(origin: string) {
    // Get the delay for the origin
    const delay = this.getDelay(origin);

    // Calculate the wait time for the origin
    const waitTime =
      delay - (Date.now() - (this.requestTime[origin]?.getTime() ?? 0));

    // Wait for the required delay
    if (this.requestTime[origin] && waitTime > 0) {
      // Check if the wait time is too long
      if (waitTime <= (this.options.maximumRequestDelay ?? 10000)) {
        await new Promise((res) => {
          setTimeout(res, waitTime);
        });
      } else {
        throw new Errors.DelayError('Wait time too long');
      }
    }

    // Set the request time for the next delay
    this.requestTime[origin] = new Date();
  }

  makeRequest(rawURL: string, asStream?: false): Promise<Response<string>>;
  makeRequest(rawURL: string, asStream: true): Promise<Request>;
  async makeRequest(rawURL: string, asStream = false) {
    // Parse URL
    const url = new URL(rawURL);

    // Get the robots.txt for the origin
    await this.fetchRobotsTxt(url.origin);

    // Check if the path is allowed
    const allowedByRobots = this.robotsTxt[url.origin].isPathAllowed(
      `${url.pathname}${url.search}`,
      this.botName,
    );

    // If not allowed, throw a rejection
    if (!allowedByRobots) {
      throw new Errors.RobotsRejection('Request blocked by robots.txt');
    }

    // Wait for the required delay
    await this.waitForRequestDelay(url.origin);

    // Fetch the URL as a stream if requested
    if (asStream) {
      return this.fetchURL(rawURL, { stream: true });
    }

    // Fetch the URL as a string if requested
    return this.fetchURL(rawURL);
  }
}

export default Bot;
