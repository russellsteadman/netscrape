import fs from 'fs';
import { resolve } from 'path';

export const loadText = (path: string) =>
  fs.readFileSync(resolve('src/test', path)).toString();

export const loadJSON = <T extends any>(path: string) =>
  JSON.parse(loadText(path)) as T;
