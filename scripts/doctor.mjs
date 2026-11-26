// What is on this machine and what it unlocks. Reports presence only: it
// never prints a credential's value.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function version(cmd, args = ['--version']) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true, shell: process.platform === 'win32' });
  if (r.status !== 0 || r.error) return null;
  return String(r.stdout || r.stderr).trim().split('\n')[0].slice(0, 80);
}

function pluginInstalled(name) {
  const roots = [join(homedir(), '.claude', 'plugins', 'cache'), join(homedir(), '.claude', 'plugins', 'marketplaces')];
  return roots.some((r) => existsSync(r) && readdirSync(r).some((d) => d === name || d.startsWith(`${name}`)));
}

export function doctor() {
  const ffmpeg = version(process.env.UMS_FFMPEG || 'ffmpeg', ['-hide_banner', '-version']);
  const tools = {
    node: process.version,
    ffmpeg,
    ffprobe: version(process.env.UMS_FFPROBE || 'ffprobe', ['-hide_banner', '-version']),
    claude: version('claude'),
    whisper: version('whisper-ctranslate2') || version('whisper') || version('faster-whisper'),
    git: version('git'),
  };
  const plugins = {
    'ultimate-frontend-skills': pluginInstalled('ultimate-frontend-skills'),
    'video-watch': pluginInstalled('video-watch'),
    'usage-limits': pluginInstalled('usage-limits'),
  };
  const creds = {
    x: ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET'].every((k) => Boolean(process.env[k])),
    bluesky: ['BSKY_HANDLE', 'BSKY_APP_PASSWORD'].every((k) => Boolean(process.env[k])),
  };
  const unlocks = [];
  const libass = ffmpeg ? spawnSync(process.env.UMS_FFMPEG || 'ffmpeg', ['-hide_banner', '-filters'], { encoding: 'utf8', windowsHide: true, shell: process.platform === 'win32' }).stdout.split('\n').some((l) => /^\s*\S+\s+ass\s/.test(l)) : false;
  tools.libass = ffmpeg ? (libass ? 'yes (on-screen text)' : 'NO: text and captions cannot render; ' + 'brew install ffmpeg-full (macOS; the plain Homebrew ffmpeg has no libass, so no on-screen text)') : null;
  unlocks.push(ffmpeg ? (libass ? 'video build, export, check, sheet, frames and safezone' : 'video export, check, sheet and frames; NOT text or captions in video build until ffmpeg has libass (brew install ffmpeg-full (macOS; the plain Homebrew ffmpeg has no libass, so no on-screen text))') : 'NO video: install ffmpeg (winget install Gyan.FFmpeg, brew install ffmpeg-full (macOS; the plain Homebrew ffmpeg has no libass, so no on-screen text), or apt install ffmpeg)');
  unlocks.push(tools.whisper ? 'word-level captions from a voiceover (faster-whisper JSON into storyboard "captions")' : 'captions from scene text and SRT files only; install faster-whisper for word timings from a voiceover');
  unlocks.push(plugins['ultimate-frontend-skills'] ? 'UFS: landing pages, link-preview share cards, image deep research, Remotion video' : 'UFS not found: landing pages and share cards are written by hand; install ultimate-frontend-skills for them');
  unlocks.push(creds.x ? 'X: approved text posts and threads can publish in autopilot' : 'X: no API credentials; X posts are published by a person');
  unlocks.push(creds.bluesky ? 'Bluesky: approved posts can publish in autopilot' : 'Bluesky: no app password; posts are published by a person');
  return { tools, plugins, credentials: creds, unlocks };
}

export function formatDoctor(r) {
  const lines = ['UMS doctor'];
  for (const [k, v] of Object.entries(r.tools)) lines.push(`  ${k.padEnd(9)} ${v || 'not found'}`);
  for (const [k, v] of Object.entries(r.plugins)) lines.push(`  ${k.padEnd(25)} ${v ? 'installed' : 'not installed'}`);
  for (const [k, v] of Object.entries(r.credentials)) lines.push(`  ${k} credentials ${v ? 'present' : 'absent'}`);
  lines.push('', 'What that means:', ...r.unlocks.map((u) => `  - ${u}`));
  return lines.join('\n');
}
