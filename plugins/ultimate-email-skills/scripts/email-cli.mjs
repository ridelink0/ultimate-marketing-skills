#!/usr/bin/env node
// Ultimate Email Skills command line. Node 22+, built-ins only.
//   email-cli sequence <welcome|onboarding|launch|game-launch|winback> --out <dir> [--name n]
//   email-cli check <draft.md>
//   email-cli build <draft.md> [--out dir]
import { readFileSync } from 'node:fs';
import { parseArgs, fail } from './lib/args.mjs';
import { checkDraft, buildFile, scaffoldSequence } from './email.mjs';

const args = parseArgs(process.argv.slice(2));
const [cmd, target] = args._;
const lines = (head, findings) => [head, ...findings.map((f) => '  ' + (f.level === 'error' ? 'ERROR' : 'warn ') + ' ' + f.code + ': ' + f.message)].join('\n');
try {
  if (cmd === 'check' && target) {
    const r = checkDraft(readFileSync(target, 'utf8'));
    console.log(lines(target + ': ' + (r.ok ? 'OK' : 'FAIL'), r.findings));
    process.exitCode = r.ok ? 0 : 1;
  } else if (cmd === 'build' && target) {
    const r = buildFile(target, args.out);
    console.log(lines('built ' + r.html + ' (' + r.bytes + ' bytes) and ' + r.text + ': ' + (r.check.ok ? 'OK' : 'FAIL'), r.check.findings));
    process.exitCode = r.check.ok ? 0 : 1;
  } else if (cmd === 'sequence' && target && args.out) {
    const r = scaffoldSequence(target, args.out, { name: args.name || 'the product' });
    console.log(r.name + ': ' + r.why + '\n' + r.files.join('\n'));
  } else if (cmd === 'needs') {
    console.log('Needs: Node 22+. To send: sign in to Klaviyo, Resend or MailerLite with /mcp (optional; otherwise paste the built HTML into your email service). On the sending domain: SPF, DKIM and DMARC, and an email service that adds one-click unsubscribe headers.');
  } else {
    console.log('email-cli sequence <welcome|onboarding|launch|game-launch|winback> --out <dir> [--name n]\nemail-cli check <draft.md>\nemail-cli build <draft.md> [--out dir]\nemail-cli needs');
  }
} catch (err) {
  fail(err.message || String(err));
}
