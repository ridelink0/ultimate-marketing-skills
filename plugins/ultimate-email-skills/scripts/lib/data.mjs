// Loads the JSON data that ships with the skill. One place, so the paths are
// right whether the scripts run from a clone, a plugin cache or a test.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
// UMS keeps data under skills/ultimate-marketing-skills; the standalone
// email plugin keeps it under skills/email-marketing.
export const SKILL = ['ultimate-marketing-skills', 'email-marketing'].map((s) => join(ROOT, 'skills', s)).find((p) => existsSync(join(p, 'data'))) || join(ROOT, 'skills', 'ultimate-marketing-skills');
export const DATA = join(SKILL, 'data');

const cache = new Map();

export function loadJson(name) {
  if (!cache.has(name)) cache.set(name, JSON.parse(readFileSync(join(DATA, name), 'utf8')));
  return cache.get(name);
}

export const loadPlatforms = () => loadJson('platforms.json');
export const loadTells = () => loadJson('copy-tells.json');
export const loadPlaybooks = () => loadJson('playbooks.json');
export const loadIntegrations = () => loadJson('integrations.json');
