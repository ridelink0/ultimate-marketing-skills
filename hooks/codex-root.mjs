#!/usr/bin/env node
/* ultimate-marketing-skills, Codex SessionStart hook.
   The skills and commands write their script paths as ${CLAUDE_PLUGIN_ROOT}.
   Claude Code fills that in; Codex does not, so a command copied from a skill
   would run `node "/scripts/ums.mjs"` and fail. Codex gives a plugin's hooks
   the plugin folder as PLUGIN_ROOT, and a SessionStart hook's output reaches
   the model, so this says once, at the start of the session, which folder to
   put in its place. Prints one short paragraph. Never blocks, never fails. */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const here = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fromEnv = process.env.PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT || '';
const entry = existsSync(resolve(here, 'scripts', 'ums.mjs')) ? 'ums.mjs' : 'email-cli.mjs';
const root = (fromEnv && existsSync(resolve(fromEnv, 'scripts', entry)) ? resolve(fromEnv) : here).replace(/\\/g, '/');
const name = entry === 'ums.mjs' ? 'ultimate-marketing-skills' : 'ultimate-email-skills';

process.stdin.on('data', () => {});
process.stdin.on('error', () => {});

process.stdout.write(
  `${name} is installed at ${root}. Its skills and commands write ` +
    '`${CLAUDE_PLUGIN_ROOT}` in their commands; Codex leaves that empty, so put ' +
    `${root} in its place every time (for example: node "${root}/scripts/${entry}" ${entry === 'ums.mjs' ? 'doctor' : 'needs'}).\n`,
);
process.exit(0);
