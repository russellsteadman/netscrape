import fs from 'fs';

export const loadJSON = <T extends any>(path: string) =>
  JSON.parse(fs.readFileSync(new URL(path, import.meta.url)).toString()) as T;
