// Normalize the URL paths
export const normalizePath = (rawPath: string) => {
  const hasStartSlash = rawPath[0] === '/';

  const url = new URL(rawPath, 'http://localhost');

  url.pathname = decodeURI(url.pathname).normalize('NFC');

  const params = new URLSearchParams();
  for (const [name, value] of url.searchParams) {
    params.append(name.normalize('NFC'), value.normalize('NFC'));
  }
  url.search = params.toString() ? `?${params.toString()}` : '';

  return `${hasStartSlash ? url.pathname : url.pathname.substring(1)}${
    url.search
  }`;
};

// Future ideas for improving normalization:

// const UNENCODED_ENTITIES =
//   /^[a-zA-Z0-9\-\_\.\~\!\#\$\&\'\(\)\*\+\,\/\:\;\=\?\@\[\]]$/u;

// const correctPercentEncoding = (pattern: string) => {
//   return pattern.replace(/((?:\%[a-zA-Z0-9]{2})+)/, (percentSeries) => {
//     let encodedString = '';

//     const chars = Buffer.from(percentSeries.replace(/\%/g, '')).toString(
//       'utf8',
//     ).split('');

//     for (const char of chars) {
//       encodedString += UNENCODED_ENTITIES.test(char) ? encodeURIComponent()
//     }

//     return chars;
//   });
// };
