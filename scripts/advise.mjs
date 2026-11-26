// The advisor: picks a tactic ladder for a project type, inside the hours and
// budget the person actually has. Data in data/playbooks.json.

import { loadPlaybooks } from './lib/data.mjs';

export function advise({ type, stage = 'prelaunch', hours = 5, budget = 0 }) {
  const pb = loadPlaybooks();
  const t = pb.types[type];
  if (!t) throw new Error(`unknown type "${type}"; one of ${Object.keys(pb.types).join(', ')}`);
  if (!pb.stages[stage]) throw new Error(`unknown stage "${stage}"; one of ${Object.keys(pb.stages).join(', ')}`);
  const picked = [];
  const later = [];
  let used = 0;
  let spend = 0;
  for (const id of t.order) {
    const tac = pb.tactics[id];
    if (!tac) throw new Error(`playbooks.json: type ${type} names missing tactic ${id}`);
    const fitsTime = used + tac.hours <= Math.max(hours, 1);
    const fitsMoney = spend + tac.cost <= budget;
    if (fitsTime && fitsMoney) {
      picked.push({ id, ...tac });
      used += tac.hours;
      spend += tac.cost;
    } else {
      later.push({ id, name: tac.name, why: !fitsMoney ? `needs about $${tac.cost}/month` : `needs about ${tac.hours} h/week` });
    }
  }
  return { type, typeName: t.name, goal: t.goal, stage, stageNote: pb.stages[stage], hours, budget, hoursUsed: used, spend, picked, later, checked: pb.checked };
}

export function formatAdvice(r) {
  const lines = [
    `${r.typeName}, ${r.stage}: aim for ${r.goal}.`,
    r.stageNote,
    `Inside ${r.hours} h/week and $${r.budget}/month, in this order:`,
    '',
  ];
  r.picked.forEach((t, i) => {
    lines.push(`${i + 1}. ${t.name}  (${t.hours} h/week${t.cost ? `, about $${t.cost}/month` : ''}; UMS mode: ${t.autonomy}; channels: ${t.channels.join(', ')})`);
    for (const s of t.steps) lines.push(`   - ${s}`);
    lines.push(`   evidence (${t.evidence.kind}): ${t.evidence.source}${t.evidence.note ? `. ${t.evidence.note}` : ''}`);
  });
  if (!r.picked.length) lines.push('Nothing fits that time and budget; raise hours to at least 2 a week.');
  if (r.later.length) {
    lines.push('', 'Later, when there is more time or money:');
    for (const l of r.later) lines.push(`  - ${l.name} (${l.why})`);
  }
  lines.push('', `Playbook data checked ${r.checked}. "reported" means a team's own claim; "practice" means common advice without data.`);
  return lines.join('\n');
}
