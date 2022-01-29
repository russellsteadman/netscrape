// Modified from MDN to allow astrisks to encode [^\n]*?
const escapeRegularExpression = (preExpression: string) =>
  preExpression
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/[*]/g, '[^\\n]*?');

// Create a regular expression from line value
export const prematch = (
  rawPattern: string,
  options?: { isStrictEOL?: boolean },
) => {
  let pattern = rawPattern;

  return new RegExp(
    `^${escapeRegularExpression(pattern)}${options?.isStrictEOL ? '$' : ''}`,
    'u',
  );
};

// Match a path to the regular expression
export const match = (prematch: RegExp, path: string) => prematch.test(path);
