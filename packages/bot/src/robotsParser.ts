import micromatch from 'micromatch';

// Based on RFC Draft: https://www.ietf.org/archive/id/draft-koster-rep-06.txt
// With additional support for Crawl-Delay

export type RobotsTxtKey = 'user-agent' | 'allow' | 'disallow' | 'crawl-delay';

export const normalizePath = (rawPath: string) => {
  const url = new URL(rawPath, 'http://localhost');

  url.pathname = decodeURI(url.pathname).normalize('NFC');

  const params = new URLSearchParams();
  for (const [name, value] of url.searchParams) {
    params.append(name.normalize('NFC'), value.normalize('NFC'));
  }
  url.search = params.toString() ? `?${params.toString()}` : '';

  return `${url.pathname}${url.search}`;
};

export class RobotsTxtLine {
  key!: RobotsTxtKey;
  value!: string;
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

    //
    if (this.key === 'allow' || this.key === 'disallow') {
      const finalChar = this.value.substring(this.value.length - 1);

      // Accept strict EOL character
      if (finalChar === '$') {
        this.value = this.value.substring(this.value.length - 1, 0);
        this.strictEOL = true;
      }

      // Normalize the path
      this.value = normalizePath(this.value);
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
    if (this.key !== 'user-agent') return false;
    if (
      self.toLowerCase() === this.value.toLowerCase() ||
      /netscrape/i.test(this.value) ||
      this.value === '*'
    )
      return true;
    return false;
  }

  // True if allowed, false if disallowed, undefined if unmatched
  isPathAllowedByLine(path: string): boolean | undefined {
    if (this.key !== 'allow' && this.key !== 'disallow') return false;

    const normalizedPath = normalizePath(path);

    const isLineAllowed = this.key === 'allow';
    const doesPathMatch = micromatch.isMatch(normalizedPath, `${this.value}*`, {
      nobrace: true,
      nobracket: true,
      noquantifiers: true,
      nonegate: true,
      nocase: true,
    });

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
      const [key, value] = line.split(':', 2).map((p) => p.trim());
      if (!key) continue;

      const keyLowerCase = key.toLowerCase();
      if (
        ['user-agent', 'allow', 'disallow', 'crawl-delay'].indexOf(
          keyLowerCase,
        ) === -1
      )
        continue;

      this.lines.push(
        new RobotsTxtLine(keyLowerCase as RobotsTxtKey, value ?? ''),
      );

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
    let ownUserAgent = false;

    for (const line of this.lines) {
      if (line.key === 'user-agent') {
        // If the line is an additional UA, it can be allowed by the current
        // line OR prior line(s)
        ownUserAgent = line.isAdditionalUserAgent
          ? ownUserAgent || line.isOwnUserAgent(userAgent)
          : line.isOwnUserAgent(userAgent);
      } else if (
        (line.key === 'allow' || line.key === 'disallow') &&
        ownUserAgent
      ) {
        const status = line.isPathAllowedByLine(path);
        if (typeof status === 'boolean') return status;
      }
    }

    return true;
  }
}
