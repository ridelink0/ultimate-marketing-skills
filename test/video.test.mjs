import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { have, build, check, sheet, exportFor, safezone, assText, assTime, parseSrt, wordsToCues, parseSize } from '../scripts/video.mjs';

test('ASS helpers escape override braces and backslashes, format time', () => {
  assert.equal(assText('a {b} \\c\nd'), 'a (b) \u29f5c\\Nd');
  assert.equal(assTime(3725.456), '1:02:05.46');
  assert.throws(() => parseSize('1081x1920'), /even/);
  assert.throws(() => parseSize('big'), /1080x1920/);
});

test('SRT and word timings become cues', () => {
  const cues = parseSrt('1\n00:00:00,000 --> 00:00:01,500\nHello there\n\n2\n00:00:01,600 --> 00:00:03,000\nSecond line\n');
  assert.equal(cues.length, 2);
  assert.equal(cues[1].start, 1.6);
  const w = wordsToCues({ segments: [{ words: [{ word: 'One', start: 0, end: 0.3 }, { word: 'two', start: 0.3, end: 0.6 }, { word: 'three.', start: 0.6, end: 0.9 }, { word: 'Four', start: 2, end: 2.2 }] }] }, { maxWords: 3 });
  assert.deepEqual(w.map((c) => c.text), ['One two three.', 'Four']);
});

const ff = have('ffmpeg') && have('ffprobe');

test('storyboard builds a platform-valid video', { skip: !ff && 'ffmpeg not installed' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'ums-v-'));
  spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=s=640x360:d=1', '-frames:v', '1', '-y', join(dir, 'shot.png')]);
  spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=s=1280x720:r=30:d=3', '-f', 'lavfi', '-i', 'sine=f=300:d=3', '-shortest', '-y', join(dir, 'clip.mp4')]);
  spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=f=220:d=5', '-y', join(dir, 'vo.wav')]);
  writeFileSync(join(dir, 'cap.srt'), '1\n00:00:00,500 --> 00:00:02,000\nCaption {one}\n');
  writeFileSync(join(dir, 'sb.json'), JSON.stringify({
    platform: 'shorts', fps: 30, voiceover: 'vo.wav', captions: 'cap.srt',
    scenes: [
      { duration: 1.5, text: 'Hook line' },
      { duration: 1.5, image: 'shot.png' },
      { duration: 2, video: 'clip.mp4', start: 0.5, caption: 'Real footage' },
    ],
  }));
  const out = join(dir, 'out.mp4');
  const r = build(join(dir, 'sb.json'), out);
  assert.ok(existsSync(out));
  assert.equal(r.size, '1080x1920');
  const c = check(out, 'shorts');
  assert.equal(c.ok, true, JSON.stringify(c.findings));
  assert.equal(c.info.width, 1080);
  assert.ok(Math.abs(c.info.duration - 5) < 0.15, `duration ${c.info.duration}`);
  assert.ok(Math.abs(c.info.lufs - -14) < 1.5, `loudness ${c.info.lufs}`);
  const s = sheet(out, join(dir, 'sheet.png'), { cols: 3, rows: 2 });
  assert.ok(existsSync(s.out));
  const z = safezone('tiktok', join(dir, 'safe.png'));
  assert.ok(existsSync(z.out));
});

test('silent storyboard still gets an audio track; export refuses over-length without --trim', { skip: !ff && 'ffmpeg not installed' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'ums-v-'));
  writeFileSync(join(dir, 'sb.json'), JSON.stringify({ size: '720x1280', scenes: [{ duration: 1, text: 'Only text' }] }));
  const out = join(dir, 'a.mp4');
  build(join(dir, 'sb.json'), out);
  assert.ok(check(out, 'tiktok').info.acodec, 'has audio');
  writeFileSync(join(dir, 'long.json'), JSON.stringify({ size: '720x1280', scenes: [{ duration: 32, text: 'Long' }] }));
  const long = join(dir, 'long.mp4');
  build(join(dir, 'long.json'), long);
  assert.throws(() => exportFor(long, 'appstore-preview', join(dir, 'p.mp4')), /over/);
  const trimmed = exportFor(long, 'appstore-preview', join(dir, 'p.mp4'), { trim: true });
  const c = check(trimmed.out, 'appstore-preview');
  assert.ok(c.info.duration <= 30.1, `trimmed to ${c.info.duration}`);
  assert.equal(c.info.width, 886);
});

test('bad storyboards fail with a clear message', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ums-v-'));
  writeFileSync(join(dir, 'a.json'), JSON.stringify({ scenes: [] }));
  assert.throws(() => build(join(dir, 'a.json'), join(dir, 'x.mp4')), /at least one scene/);
  writeFileSync(join(dir, 'b.json'), JSON.stringify({ scenes: [{ duration: 1, image: 'missing.png' }] }));
  assert.throws(() => build(join(dir, 'b.json'), join(dir, 'x.mp4')), /not found/);
  writeFileSync(join(dir, 'c.json'), JSON.stringify({ scenes: [{ duration: -1 }] }));
  assert.throws(() => build(join(dir, 'c.json'), join(dir, 'x.mp4')), /duration/);
});
