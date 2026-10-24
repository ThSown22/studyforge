import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const frontendOutput = resolve(root, 'dist/frontend');
