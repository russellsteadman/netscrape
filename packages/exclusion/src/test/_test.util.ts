import fs from 'fs';
import { resolve } from 'path';

export const loadJSON = <T extends any>(path: string) =>
  JSON.parse(fs.readFileSync(resolve('src/test', path)).toString()) as T;
