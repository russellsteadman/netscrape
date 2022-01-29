import type Request from 'got/dist/source/core';
import type { Response } from 'got/dist/source/core/response';
import QuickLRU from 'quick-lru';
import CacheableLookup from 'cacheable-lookup';
import * as APIError from './errors';
import { RobotsTxt } from 'exclusion';

type BotOptions = {
  name: string;
  version: string;
  minimumRequestDelay?: number;
  disableCaching?: boolean;
  policyURL?: string;
  hideLibraryAgent?: boolean;
  userAgent?: string;
};

type BotRequestOptions = Partial<{
  stream: boolean;
  headers: Record<string, string>;
}>;

class Bot {
  private robotsTxt = {} as Record<string, RobotsTxt>;
  private robotsTxtString = {} as Record<string, string>;
  readonly userAgent!: string;
  readonly botName!: string;
  private requestDelay = {} as Record<string, number>;
  private requestTime = {} as Record<string, Date>;
  private cache!: QuickLRU<unknown, unknown>;
  private dnsCachable!: CacheableLookup;
  private options!: BotOptions;

  constructor(options: BotOptions) {
    if (!options || typeof options !== 'object') {
      throw new Error('Missing or misformatted Bot options');
    }

    if (!options.name || typeof options.name !== 'string') {
      throw new Error('Bot name must be a string');
    } else if (!/^[a-zA-Z_-]+$/.test(options.name)) {
      throw new Error('Bot name must only contain a-zA-Z_-');
    }

    if (
      !options.version ||
      typeof options.version !== 'string' ||
      !/^\d+(\.\d+){0,2}$/.test(options.version)
    ) {
      throw new Error('Version must be a string formatted as #, #.#, or #.#.#');
    }

    try {
      if (options.policyURL) {
        new URL(options.policyURL);
      }
    } catch (err) {
      throw new Error('Invalid policy URL');
    }

    this.options = options;

    this.botName = options.name;
    this.userAgent =
      options.userAgent ??
      `${this.botName}/${options.version} (+${
        options.policyURL ?? 'https://j.mp/engine-source'
      }) ${options.hideLibraryAgent ? '' : 'NetScrape/0.1'}`;

    this.cache = new QuickLRU({ maxSize: 50 });
    this.dnsCachable = new CacheableLookup({
      cache: new QuickLRU({ maxSize: 1000 }),
    });
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
    const url = new URL(rawURL);
    const got = (await import('got')).default;

    const standardHeaders = { ...options?.headers };

    for (const key of Object.keys(standardHeaders)) {
      if (key !== key.toLowerCase()) {
        standardHeaders[key.toLowerCase()] = standardHeaders[key];
        delete standardHeaders[key];
      }
    }

    const defaultOptions = {
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
        'cache-control': 'max-age=0',
        host: url.host,
        referer: url.origin,
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'upgrade-insecure-requests': '1',
      },
      cache: this.cache,
      cacheOptions: {
        shared: false,
      },
      dnsCache: this.dnsCachable,
    };

    if (options?.stream === true) {
      return got.stream(rawURL, { ...defaultOptions, isStream: true });
    }

    return got.get(rawURL, {
      ...defaultOptions,
      responseType: 'text',
    });
  }

  private async fetchRobotsTxt(origin: string) {
    const robotsTxtURL = `${origin}/robots.txt`;

    try {
      const robotsTxt = await this.fetchURL(robotsTxtURL);

      if (this.robotsTxtString[origin] !== robotsTxt.body) {
        this.robotsTxtString[origin] = robotsTxt.body;
        this.robotsTxt[origin] = new RobotsTxt(robotsTxt.body);
      }
    } catch (err) {
      console.error(err);
    }
  }

  private getDelay(origin: string) {
    const minimumRequestDelay = this.options.minimumRequestDelay ?? 1000;
    return (this.requestDelay[origin] ?? 0) > minimumRequestDelay
      ? this.requestDelay[origin]
      : minimumRequestDelay;
  }

  makeRequest(rawURL: string, asStream?: false): Promise<Response<string>>;
  makeRequest(rawURL: string, asStream: true): Promise<Request>;
  async makeRequest(rawURL: string, asStream = false) {
    const url = new URL(rawURL);

    await this.fetchRobotsTxt(url.origin);

    const allowedByRobots = this.robotsTxt[origin].isPathAllowed(
      `${url.pathname}${url.search}`,
      this.botName,
    );

    if (!allowedByRobots) {
      throw new APIError.BadGateway('Request blocked by robots.txt');
    }

    const delay = this.getDelay(url.origin);
    const waitTime =
      delay - (Date.now() - (this.requestTime[url.origin]?.getTime() ?? 0));

    if (this.requestTime[url.origin] && waitTime > 0) {
      if (waitTime <= 10000) {
        await new Promise((res) => {
          setTimeout(res, waitTime);
        });
      } else {
        console.error('Wait time rejected');
        throw new APIError.BadGateway('Wait time too long');
      }
    }

    this.requestTime[url.origin] = new Date();

    if (asStream) {
      return this.fetchURL(rawURL, { stream: true });
    }

    const content = await this.fetchURL(rawURL);

    return content;
  }
}

export default Bot;
