// The video engine. ffmpeg and ffprobe only, no npm packages.
//
//   ums video build storyboard.json --out launch.mp4     storyboard -> finished vertical video
//   ums video export in.mp4 --platform reels --out r.mp4 reframe, cap, normalise for one platform
//   ums video check in.mp4 --platform tiktok             probe against the platform's limits
//   ums video sheet in.mp4 --out sheet.png               contact sheet to look at a render
//   ums video frames in.mp4 --at 0,1.5,3 --out dir       stills, for the hook frame and the cover
//   ums video safezone tiktok --out overlay.png          margin guide for on-screen text
//
// Text is rendered through an ASS subtitle file written next to the job, so
// no path or caption ever has to be escaped inside an ffmpeg filter string.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename, extname } from 'node:path';
import { loadPlatforms } from './lib/data.mjs';

const BIN = {
  ffmpeg: process.env.UMS_FFMPEG || 'ffmpeg',
  ffprobe: process.env.UMS_FFPROBE || 'ffprobe',
};

export function have(tool) {
  const r = spawnSync(BIN[tool] || tool, ['-version'], { encoding: 'utf8' });
  return r.status === 0;
}

function run(tool, args, { cwd } = {}) {
  const r = spawnSync(BIN[tool], args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  if (r.error) throw new Error(`${tool} could not start: ${r.error.message}. Install ffmpeg (it includes ffprobe) or set UMS_FFMPEG / UMS_FFPROBE.`);
  if (r.status !== 0) {
    const tail = String(r.stderr || '').trim().split('\n').slice(-6).join('\n');
    throw new Error(`${tool} failed (exit ${r.status}):\n${tail}`);
  }
  return r;
}

export function probe(file) {
  const r = run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]);
  const data = JSON.parse(r.stdout);
  const v = data.streams.find((s) => s.codec_type === 'video');
  const a = data.streams.find((s) => s.codec_type === 'audio');
  const rate = (s) => {
    if (!s) return 0;
    const [n, d] = String(s).split('/').map(Number);
    return d ? n / d : n;
  };
  return {
    file,
    duration: Number(data.format.duration || v?.duration || 0),
    size: Number(data.format.size || statSync(file).size),
    width: v?.width || 0,
    height: v?.height || 0,
    fps: Math.round(rate(v?.avg_frame_rate || v?.r_frame_rate) * 100) / 100,
    vcodec: v?.codec_name || null,
    pixfmt: v?.pix_fmt || null,
    acodec: a?.codec_name || null,
    sampleRate: a ? Number(a.sample_rate) : null,
  };
}

// Integrated loudness and true peak, measured with ffmpeg's loudnorm filter.
export function loudness(file) {
  const r = spawnSync(BIN.ffmpeg, ['-hide_banner', '-nostats', '-i', file, '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true });
  const m = String(r.stderr || '').match(/\{[^{}]*"input_i"[^{}]*\}/s);
  if (!m) return null;
  const j = JSON.parse(m[0]);
  const i = Number(j.input_i);
  return Number.isFinite(i) ? { lufs: i, truePeak: Number(j.input_tp) } : null;
}

export function videoSpec(platform) {
  const p = loadPlatforms().platforms[platform];
  if (!p || !p.video) throw new Error(`no video spec for "${platform}"; one of ${Object.entries(loadPlatforms().platforms).filter(([, v]) => v.video).map(([k]) => k).join(', ')}`);
  return p.video;
}

export function check(file, platform) {
  const spec = videoSpec(platform);
  const info = probe(file);
  const out = [];
  const add = (level, code, message) => out.push({ level, code, message });
  if (!info.width || !info.height) {
    add('error', 'no-video', 'no video stream in this file');
    return { info, platform, findings: out, ok: false };
  }
  const ratio = info.width / info.height;
  const [aw, ah] = spec.aspect.split(':').map(Number);
  if (Math.abs(ratio - aw / ah) > 0.02) add(spec.aspectHard ? 'error' : 'warning', 'aspect', `${info.width}x${info.height} is not ${spec.aspect}`);
  const recShort = Math.min(...spec.recommended.split('x').map(Number));
  if (Math.min(info.width, info.height) < recShort) add('warning', 'resolution', `${info.width}x${info.height} is below the recommended ${spec.recommended}`);
  if (spec.maxSeconds && info.duration > spec.maxSeconds + 0.05) add('error', 'too-long', `${info.duration.toFixed(1)}s is over the ${spec.maxSeconds}s limit`);
  if (spec.minSeconds && info.duration < spec.minSeconds) add('error', 'too-short', `${info.duration.toFixed(1)}s is under the ${spec.minSeconds}s minimum`);
  if (spec.maxBytes && info.size > spec.maxBytes) add('error', 'too-big', `${(info.size / 1e6).toFixed(1)} MB is over ${(spec.maxBytes / 1e6).toFixed(0)} MB`);
  if (info.vcodec !== 'h264') add('warning', 'codec', `video codec is ${info.vcodec}; H.264 is the safe choice everywhere`);
  if (info.pixfmt && info.pixfmt !== 'yuv420p') add('warning', 'pixfmt', `pixel format ${info.pixfmt}; use yuv420p or some players show black`);
  if (info.fps > (spec.maxFps || 60) + 0.5) add('warning', 'fps', `${info.fps} fps is above ${spec.maxFps || 60}`);
  if (!info.acodec) add('warning', 'no-audio', 'no audio track; most feeds autoplay muted, but an absent track can still be rejected or deprioritised. Add a quiet bed or silence.');
  if (info.acodec) {
    const l = loudness(file);
    if (l) {
      info.lufs = l.lufs;
      info.truePeak = l.truePeak;
      if (Math.abs(l.lufs - -14) > 2) add('warning', 'loudness', `integrated loudness ${l.lufs.toFixed(1)} LUFS; UMS targets -14 LUFS, -1 dBTP (a working target, not a published platform rule)`);
      if (l.truePeak > -0.5) add('warning', 'peak', `true peak ${l.truePeak.toFixed(1)} dBTP; keep it at or below -1`);
    }
  }
  return { info, platform, findings: out, ok: !out.some((f) => f.level === 'error') };
}

// ---------- storyboard -> video ----------

export function parseSize(size) {
  const m = /^(\d{2,5})x(\d{2,5})$/.exec(String(size || ''));
  if (!m) throw new Error(`size must look like 1080x1920, got "${size}"`);
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (w % 2 || h % 2) throw new Error('width and height must be even numbers for H.264');
  return { w, h };
}

function hexColor(c, fallback = '0x0c0a03') {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(c || ''));
  return m ? `0x${m[1]}` : fallback;
}

// ASS colours are &HAABBGGRR.
function assColor(hex, alpha = '00') {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || '#ffffff'));
  if (!m) return `&H${alpha}FFFFFF`;
  return `&H${alpha}${m[3]}${m[2]}${m[1]}`.toUpperCase();
}

export function assTime(t) {
  const cs = Math.max(0, Math.round(t * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

export function assText(s) {
  return String(s)
    .replace(/\r/g, '')
    .replace(/\\/g, '⧵')
    .replace(/\{/g, '(')
    .replace(/\}/g, ')')
    .replace(/\n/g, '\\N');
}

export function parseSrt(text) {
  const out = [];
  const blocks = String(text).replace(/\r/g, '').split(/\n\s*\n/);
  const ts = (s) => {
    const m = /(\d+):(\d{2}):(\d{2})[,.](\d{1,3})/.exec(s);
    return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, '0')) / 1000 : NaN;
  };
  for (const b of blocks) {
    const lines = b.split('\n').filter(Boolean);
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i === -1) continue;
    const [a, z] = lines[i].split('-->');
    const start = ts(a);
    const end = ts(z);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) out.push({ start, end, text: lines.slice(i + 1).join('\n') });
  }
  return out;
}

// Word timings (faster-whisper / whisper JSON with word_timestamps, or a
// plain [{word,start,end}] list) grouped into short caption chunks.
export function wordsToCues(json, { maxWords = 3, maxGap = 0.6 } = {}) {
  let words = [];
  if (Array.isArray(json)) words = json;
  else if (Array.isArray(json?.words)) words = json.words;
  else if (Array.isArray(json?.segments)) words = json.segments.flatMap((s) => s.words || []);
  words = words
    .map((w) => ({ word: String(w.word ?? w.text ?? '').trim(), start: Number(w.start), end: Number(w.end) }))
    .filter((w) => w.word && Number.isFinite(w.start) && Number.isFinite(w.end) && w.end >= w.start);
  const cues = [];
  let cur = null;
  for (const w of words) {
    const breakHere = !cur || cur.n >= maxWords || w.start - cur.end > maxGap || /[.!?]$/.test(cur.text);
    if (breakHere) {
      if (cur) cues.push({ start: cur.start, end: cur.end, text: cur.text });
      cur = { start: w.start, end: w.end, text: w.word, n: 1 };
    } else {
      cur.end = w.end;
      cur.text += ` ${w.word}`;
      cur.n++;
    }
  }
  if (cur) cues.push({ start: cur.start, end: cur.end, text: cur.text });
  return cues;
}

export function buildAss({ w, h, scenes, cues = [], style = {} }) {
  const font = style.font || 'Arial';
  const titleSize = style.titleSize || Math.round(h * 0.045);
  const capSize = style.captionSize || Math.round(h * 0.034);
  const color = assColor(style.color || '#ffffff');
  const outline = assColor(style.outline || '#000000');
  const marginX = Math.round(w * 0.08);
  // Bottom captions sit above the platform's caption and button area.
  const capMarginV = Math.round(h * (style.captionLift ?? 0.22));
  const lines = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${w}`,
    `PlayResY: ${h}`,
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Title,${font},${titleSize},${color},${color},${outline},&H64000000,-1,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(titleSize / 14))},0,5,${marginX},${marginX},0,1`,
    `Style: Top,${font},${titleSize},${color},${color},${outline},&H64000000,-1,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(titleSize / 14))},0,8,${marginX},${marginX},${Math.round(h * 0.12)},1`,
    `Style: Caption,${font},${capSize},${color},${color},${outline},&H64000000,-1,0,0,0,100,100,0,0,1,${Math.max(2, Math.round(capSize / 12))},0,2,${marginX},${marginX},${capMarginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];
  let t = 0;
  for (const s of scenes) {
    const end = t + s.duration;
    if (s.text) lines.push(`Dialogue: 1,${assTime(t)},${assTime(end)},${s.align === 'top' ? 'Top' : 'Title'},,0,0,0,,${assText(s.text)}`);
    if (s.caption) lines.push(`Dialogue: 0,${assTime(t)},${assTime(end)},Caption,,0,0,0,,${assText(s.caption)}`);
    t = end;
  }
  for (const c of cues) lines.push(`Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,${assText(c.text)}`);
  return lines.join('\n') + '\n';
}

export function readStoryboard(file) {
  const abs = resolve(file);
  const sb = JSON.parse(readFileSync(abs, 'utf8'));
  const base = dirname(abs);
  const at = (p) => (p ? resolve(base, p) : null);
  let size = sb.size;
  if (!size && sb.platform) size = videoSpec(sb.platform).recommended;
  const { w, h } = parseSize(size || '1080x1920');
  const fps = Number(sb.fps || 30);
  if (!(fps >= 12 && fps <= 60)) throw new Error('fps must be between 12 and 60');
  if (!Array.isArray(sb.scenes) || !sb.scenes.length) throw new Error('a storyboard needs at least one scene');
  const scenes = sb.scenes.map((s, i) => {
    const duration = Number(s.duration);
    if (!(duration > 0 && duration <= 600)) throw new Error(`scene ${i + 1}: duration must be a number of seconds above 0`);
    const scene = { ...s, duration, image: at(s.image), video: at(s.video) };
    for (const k of ['image', 'video']) if (scene[k] && !existsSync(scene[k])) throw new Error(`scene ${i + 1}: ${k} not found: ${scene[k]}`);
    return scene;
  });
  const media = { voiceover: at(sb.voiceover), music: at(sb.music), captions: at(sb.captions), fontFile: at(sb.fontFile) };
  for (const [k, v] of Object.entries(media)) if (v && !existsSync(v)) throw new Error(`${k} not found: ${v}`);
  return { ...sb, w, h, fps, scenes, ...media, base };
}

function sceneArgs(scene, i, { w, h, fps, background }) {
  const d = scene.duration.toFixed(3);
  const frames = Math.max(1, Math.round(scene.duration * fps));
  // `fit: "contain"` keeps the whole picture (logos, icons, screenshots) and
  // pads with the scene colour; the default fills the frame and crops.
  const pad = hexColor(scene.background || background);
  const fill = (fw, fh) => (scene.fit === 'contain'
    ? `scale=${fw}:${fh}:force_original_aspect_ratio=decrease,pad=${fw}:${fh}:(ow-iw)/2:(oh-ih)/2:color=${pad}`
    : `scale=${fw}:${fh}:force_original_aspect_ratio=increase,crop=${fw}:${fh}`);
  const cover = `${fill(w, h)},setsar=1`;
  const out = `seg${String(i).padStart(3, '0')}.mp4`;
  const enc = ['-r', String(fps), '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-an', '-y', out];
  if (scene.video) {
    const ss = String(Number(scene.start || 0));
    return { out, args: ['-hide_banner', '-loglevel', 'error', '-ss', ss, '-t', d, '-i', scene.video, '-vf', `${cover},fps=${fps}`, ...enc] };
  }
  if (scene.image) {
    if (scene.zoom === false) {
      return { out, args: ['-hide_banner', '-loglevel', 'error', '-loop', '1', '-t', d, '-i', scene.image, '-vf', `${cover},fps=${fps}`, ...enc] };
    }
    // Slow push-in. Scale up first so the zoom does not shimmer.
    const zoom = `${fill(w * 2, h * 2)},zoompan=z='1+0.10*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${w}x${h}:fps=${fps},setsar=1`;
    return { out, args: ['-hide_banner', '-loglevel', 'error', '-i', scene.image, '-vf', zoom, '-frames:v', String(frames), ...enc] };
  }
  const color = hexColor(scene.background || background);
  return { out, args: ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=${color}:s=${w}x${h}:r=${fps}:d=${d}`, ...enc] };
}

export function build(storyboardFile, outFile, { keep = false, dryRun = false } = {}) {
  const sb = readStoryboard(storyboardFile);
  const total = sb.scenes.reduce((s, x) => s + x.duration, 0);
  let cues = [];
  if (sb.captions) {
    const raw = readFileSync(sb.captions, 'utf8');
    cues = extname(sb.captions).toLowerCase() === '.srt' ? parseSrt(raw) : wordsToCues(JSON.parse(raw), sb.captionWords ? { maxWords: Number(sb.captionWords) } : {});
  }
  const work = mkdtempSync(join(tmpdir(), 'ums-video-'));
  const plan = [];
  try {
    const segs = sb.scenes.map((s, i) => sceneArgs(s, i, sb));
    for (const s of segs) plan.push(['ffmpeg', ...s.args]);
    writeFileSync(join(work, 'list.txt'), segs.map((s) => `file '${s.out}'`).join('\n') + '\n');
    const style = { ...(sb.style || {}), font: sb.font || sb.style?.font };
    writeFileSync(join(work, 'text.ass'), buildAss({ w: sb.w, h: sb.h, scenes: sb.scenes, cues, style }));
    let assFilter = 'ass=text.ass';
    if (sb.fontFile) {
      mkdirSync(join(work, 'fonts'), { recursive: true });
      copyFileSync(sb.fontFile, join(work, 'fonts', basename(sb.fontFile)));
      assFilter = 'ass=text.ass:fontsdir=fonts';
    }
    const concatArgs = ['-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', '-y', 'joined.mp4'];
    plan.push(['ffmpeg', ...concatArgs]);

    const target = Number(sb.loudness ?? -14);
    const inputs = ['-i', 'joined.mp4'];
    let n = 1;
    let vo = null;
    let mu = null;
    if (sb.voiceover) { inputs.push('-i', sb.voiceover); vo = n++; }
    if (sb.music) { inputs.push('-stream_loop', '-1', '-i', sb.music); mu = n++; }
    const mv = Number(sb.musicVolume ?? (vo !== null ? 0.18 : 0.6));
    let fc = `[0:v]${assFilter}[v]`;
    let amap = null;
    const norm = `loudnorm=I=${target}:TP=-1:LRA=11,aresample=48000`;
    if (vo !== null && mu !== null) {
      fc += `;[${mu}:a]volume=${mv},aformat=channel_layouts=stereo[m];[${vo}:a]aformat=channel_layouts=stereo,asplit=2[vo1][vo2];[m][vo1]sidechaincompress=threshold=0.04:ratio=8:attack=20:release=400[duck];[vo2][duck]amix=inputs=2:duration=longest:normalize=0,${norm}[a]`;
      amap = '[a]';
    } else if (vo !== null) {
      fc += `;[${vo}:a]aformat=channel_layouts=stereo,${norm}[a]`;
      amap = '[a]';
    } else if (mu !== null) {
      fc += `;[${mu}:a]volume=${mv},aformat=channel_layouts=stereo,${norm}[a]`;
      amap = '[a]';
    } else {
      inputs.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo');
      amap = `${n++}:a`;
    }
    const outAbs = resolve(outFile);
    mkdirSync(dirname(outAbs), { recursive: true });
    const finalArgs = ['-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', fc, '-map', '[v]', '-map', amap, '-t', total.toFixed(3), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(sb.fps), '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-y', outAbs];
    plan.push(['ffmpeg', ...finalArgs]);
    if (dryRun) return { out: outAbs, duration: total, plan, work };
    for (const s of segs) run('ffmpeg', s.args, { cwd: work });
    run('ffmpeg', concatArgs, { cwd: work });
    run('ffmpeg', finalArgs, { cwd: work });
    return { out: outAbs, duration: total, size: `${sb.w}x${sb.h}`, fps: sb.fps, scenes: sb.scenes.length, cues: cues.length, work: keep ? work : null };
  } finally {
    if (!keep) rmSync(work, { recursive: true, force: true });
  }
}

// ---------- export, frames, sheet, safe zone ----------

export function exportFor(input, platform, outFile, { fit = 'cover', trim = false } = {}) {
  const spec = videoSpec(platform);
  const { w, h } = parseSize(spec.recommended);
  const info = probe(input);
  if (spec.maxSeconds && info.duration > spec.maxSeconds + 0.05 && !trim) {
    throw new Error(`${info.duration.toFixed(1)}s is over ${platform}'s ${spec.maxSeconds}s limit; cut it, or pass --trim to keep the first ${spec.maxSeconds}s`);
  }
  const vf = fit === 'contain'
    ? `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`
    : `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`;
  const fps = Math.min(info.fps || 30, spec.maxFps || 60);
  const outAbs = resolve(outFile);
  mkdirSync(dirname(outAbs), { recursive: true });
  const args = ['-hide_banner', '-loglevel', 'error', '-i', input];
  if (!info.acodec) args.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo');
  args.push('-vf', `${vf},fps=${fps}`);
  if (info.acodec) args.push('-af', 'loudnorm=I=-14:TP=-1:LRA=11,aresample=48000');
  args.push('-map', '0:v:0', '-map', info.acodec ? '0:a:0' : '1:a:0');
  if (trim && spec.maxSeconds) args.push('-t', String(spec.maxSeconds));
  else args.push('-t', info.duration.toFixed(3));
  args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-y', outAbs);
  run('ffmpeg', args);
  return { out: outAbs, platform, size: `${w}x${h}` };
}

export function frames(input, outDir, { at = [0] } = {}) {
  const dir = resolve(outDir);
  mkdirSync(dir, { recursive: true });
  const outs = [];
  for (const t of at) {
    const out = join(dir, `frame-${String(t).replace('.', '_')}s.png`);
    run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', String(t), '-i', input, '-frames:v', '1', '-y', out]);
    outs.push(out);
  }
  return outs;
}

export function sheet(input, outFile, { cols = 4, rows = 3, width = 270 } = {}) {
  const info = probe(input);
  const count = cols * rows;
  const rate = count / Math.max(info.duration, 0.1);
  const outAbs = resolve(outFile);
  mkdirSync(dirname(outAbs), { recursive: true });
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', input, '-vf', `fps=${rate.toFixed(6)},scale=${width}:-2,tile=${cols}x${rows}:padding=4:margin=4:color=0x111111`, '-frames:v', '1', '-y', outAbs]);
  return { out: outAbs, tiles: count, every: `${(1 / rate).toFixed(2)}s` };
}

export function safezone(platform, outFile) {
  const spec = videoSpec(platform);
  const { w, h } = parseSize(spec.recommended);
  const z = spec.safeArea;
  if (!z) throw new Error(`no safe-area guide for ${platform}`);
  const box = (x, y, bw, bh) => `drawbox=x=${Math.round(x)}:y=${Math.round(y)}:w=${Math.round(bw)}:h=${Math.round(bh)}:color=red@0.35:t=fill`;
  const top = h * z.top;
  const bottom = h * z.bottom;
  const left = w * z.left;
  const right = w * z.right;
  const vf = [box(0, 0, w, top), box(0, h - bottom, w, bottom), box(0, top, left, h - top - bottom), box(w - right, top, right, h - top - bottom)].join(',');
  const outAbs = resolve(outFile);
  mkdirSync(dirname(outAbs), { recursive: true });
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=0x202020:s=${w}x${h}:d=1`, '-vf', vf, '-frames:v', '1', '-y', outAbs]);
  return { out: outAbs, platform, note: z.note };
}
