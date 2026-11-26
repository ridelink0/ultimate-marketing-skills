// Small argument parser shared by every UMS script. Built-ins only.
//
//   parseArgs(['build', 'a.json', '--out', 'x.mp4', '--dry-run'])
//   -> { _: ['build', 'a.json'], out: 'x.mp4', 'dry-run': true }
//
// A flag followed by another flag, or by nothing, is a boolean. `--key=value`
// is accepted too. Repeated flags keep the last value, except the keys named
// in `lists`, which collect every value in order.

export function parseArgs(argv, { lists = [] } = {}) {
  const out = { _: [] };
  for (const key of lists) out[key] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') {
      out._.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith('--') && a.length > 2) {
      let key = a.slice(2);
      let value;
      const eq = key.indexOf('=');
      if (eq !== -1) {
        value = key.slice(eq + 1);
        key = key.slice(0, eq);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        value = argv[++i];
      } else {
        value = true;
      }
      if (lists.includes(key)) out[key].push(value);
      else out[key] = value;
    } else {
      out._.push(a);
    }
  }
  return out;
}

export function num(value, fallback) {
  if (value === undefined || value === true) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function fail(message, code = 1) {
  process.stderr.write(`ums: ${message}\n`);
  process.exit(code);
}
