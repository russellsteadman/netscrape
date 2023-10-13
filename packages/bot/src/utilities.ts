export const normalizeHeaders = (headers: Record<string, string>) => {
  const standardHeaders = { ...headers };

  // Convert all headers to lowercase
  for (const key of Object.keys(standardHeaders)) {
    if (key !== key.toLowerCase()) {
      standardHeaders[key.toLowerCase()] = standardHeaders[key];
      delete standardHeaders[key];
    }
  }

  return standardHeaders;
};
