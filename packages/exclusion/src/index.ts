import { match, prematch } from './match';
import { normalizePath } from './normalize';

// Based on RFC Draft: https://www.ietf.org/archive/id/draft-koster-rep-06.txt
// With additional support for Crawl-Delay

export type RobotsTxtKey = 'user-agent' | 'allow' | 'disallow' | 'crawl-delay';

enum AgentSpecificity {
  NotSpecified,
  CatchAll,
  Specified,
}

export class RobotsTxtLine {
  key!: RobotsTxtKey;
  value!: string;
  priority?: number;
  protected prematch?: RegExp;
  next?: RobotsTxtLine;
  previous?: RobotsTxtLine;
  delay?: number;
  strictEOL?: boolean;

  constructor(key: RobotsTxtKey, value: string) {
    this.key = key;
    this.value = value;

    // Parse out the crawl delay and convert to milliseconds
    if (this.key === 'crawl-delay') {
      const delay = parseInt(this.value, 10);
      this.delay = Number.isNaN(delay) ? undefined : delay * 1000;
    }

    if (this.key === 'allow' || this.key === 'disallow') {
      const finalChar = this.value.substring(this.value.length - 1);

      // Accept strict EOL character
      if (finalChar === '$') {
        this.value = this.value.substring(this.value.length - 1, 0);
        this.strictEOL = true;
      }

      // Normalize the path
      this.value = normalizePath(this.value);
      this.prematch = prematch(this.value, { isStrictEOL: this.strictEOL });
      this.priority = Buffer.byteLength(this.value);
    }
  }

  // Allow for detection of rules for multiple user-agents
  get isAdditionalUserAgent() {
    if (
      this.key === 'user-agent' &&
      this.previous &&
      this.previous.key === 'user-agent'
    )
      return true;
    return false;
  }

  // Check if a user-agent rule applies
  isOwnUserAgent(self: string) {
    if (this.key !== 'user-agent') return AgentSpecificity.NotSpecified;
    if (
      self.toLowerCase() === this.value.toLowerCase() ||
      /netscrape/i.test(this.value)
    ) {
      return AgentSpecificity.Specified;
    } else if (this.value === '*') {
      return AgentSpecificity.CatchAll;
    }
    return AgentSpecificity.NotSpecified;
  }

  // True if allowed, false if disallowed, undefined if unmatched
  isPathAllowedByLine(path: string): boolean | undefined {
    if (this.key !== 'allow' && this.key !== 'disallow') return false;

    if (this.value === '') return;

    const normalizedPath = normalizePath(path);

    const isLineAllowed = this.key === 'allow';
    const doesPathMatch =
      !!this.prematch && match(this.prematch, normalizedPath);

    if (doesPathMatch) {
      return isLineAllowed;
    }
  }
}

export class RobotsTxt {
  text!: string;
  lines: RobotsTxtLine[] = [];

  constructor(text: string) {
    this.text = text;
    const lines = this.text
      .replace(/(?:\r(?=\n)|#[^\n]*)/g, '') // Remove comments, CRLF to LF
      .replace(/\r/g, '\n') // CR to LF
      .split(/\n/);

    for (const line of lines) {
      const key = line.substring(0, line.indexOf(':')).trim();
      const value = line.substring(line.indexOf(':') + 1).trim();
      if (!key) continue;

      const keyLowerCase = key.toLowerCase();
      if (
        ['user-agent', 'allow', 'disallow', 'crawl-delay'].indexOf(
          keyLowerCase,
        ) === -1
      )
        continue;

      this.lines.push(new RobotsTxtLine(keyLowerCase as RobotsTxtKey, value));

      const next = this.lines[this.lines.length - 1];
      const previous = this.lines[this.lines.length - 2];

      if (next && previous) {
        next.previous = previous;
        previous.next = next;
      }
    }
  }

  //  Per RFC: To evaluate if access to a URL is allowed, a robot must attempt
  //  to match the paths in Allow and Disallow lines against the URL, in the
  //  order they occur in the record. The first match found is used. If no match
  //  is found, the default assumption is that the URL is allowed.
  isPathAllowed(path: string, userAgent: string) {
    let ownUserAgent: AgentSpecificity = AgentSpecificity.NotSpecified;

    const status = new Map<AgentSpecificity, Map<number, boolean>>();

    for (const line of this.lines) {
      if (line.key === 'user-agent') {
        // If the line is an additional UA, it can be allowed by the current
        // line OR prior line(s)
        ownUserAgent = line.isAdditionalUserAgent
          ? Math.max(ownUserAgent, line.isOwnUserAgent(userAgent))
          : line.isOwnUserAgent(userAgent);
      } else if (
        (line.key === 'allow' || line.key === 'disallow') &&
        ownUserAgent
      ) {
        const lineStatus = line.isPathAllowedByLine(path);
        if (
          typeof lineStatus === 'boolean' &&
          typeof line.priority === 'number'
        ) {
          const lineResult =
            status.get(ownUserAgent) ?? new Map<number, boolean>();
          if (!lineResult.has(line.priority))
            lineResult.set(line.priority, lineStatus);
          status.set(ownUserAgent, lineResult);
        }
      }
    }

    const maxStatus =
      status.get(Math.max(...status.keys())) ?? new Map<number, boolean>();

    return maxStatus.get(Math.max(...maxStatus.keys())) ?? true;
  }

  getDelay(userAgent: string) {
    let ownUserAgent: AgentSpecificity = AgentSpecificity.NotSpecified;

    const delay = new Map<AgentSpecificity, number>();

    for (const line of this.lines) {
      if (line.key === 'user-agent') {
        // If the line is an additional UA, it can be allowed by the current
        // line OR prior line(s)
        ownUserAgent = line.isAdditionalUserAgent
          ? Math.max(ownUserAgent, line.isOwnUserAgent(userAgent))
          : line.isOwnUserAgent(userAgent);
      } else if (line.key === 'crawl-delay' && ownUserAgent && line.delay) {
        delay.set(ownUserAgent, line.delay);
      }
    }

    return delay.get(Math.max(...delay.keys()));
  }
}
