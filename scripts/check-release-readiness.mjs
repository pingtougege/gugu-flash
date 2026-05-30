import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const CHECKLIST_URL = new URL("../docs/release-readiness.json", import.meta.url);
const VALID_STATUSES = new Set(["blocked", "in_progress", "ready", "waived"]);
const PASSING_STATUSES = new Set(["ready", "waived"]);
const gateArg = process.argv.find((arg) => arg.startsWith("--gate="));
const targetGate = gateArg?.split("=")[1] || "internal_prototype";

function looksLikeCommand(value) {
  return /^(npm|node|GET|POST|PATCH|DELETE)\b/.test(value);
}

async function pathExists(path) {
  try {
    await access(resolve(path));
    return true;
  } catch {
    return false;
  }
}

function statusCounts(items) {
  return items.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, {});
}

const checklist = JSON.parse(await readFile(CHECKLIST_URL, "utf8"));
const gate = checklist.gates?.[targetGate];
const errors = [];

if (!gate) {
  errors.push(`Unknown release gate: ${targetGate}`);
} else {
  const allowedStatuses = new Set(checklist.statusValues || []);
  for (const item of gate.items || []) {
    if (!item.id) errors.push(`${targetGate}: item missing id`);
    if (!item.area) errors.push(`${targetGate}.${item.id}: missing area`);
    if (!VALID_STATUSES.has(item.status) || (allowedStatuses.size && !allowedStatuses.has(item.status))) {
      errors.push(`${targetGate}.${item.id}: invalid status ${item.status}`);
    }
    if (!Array.isArray(item.evidence)) errors.push(`${targetGate}.${item.id}: evidence must be an array`);

    for (const evidence of item.evidence || []) {
      if (!evidence || looksLikeCommand(evidence)) continue;
      if (!(await pathExists(evidence))) {
        errors.push(`${targetGate}.${item.id}: evidence path does not exist: ${evidence}`);
      }
    }

    if (item.status !== "ready" && item.status !== "waived" && !item.needed) {
      errors.push(`${targetGate}.${item.id}: non-ready items must describe needed work`);
    }
  }

  if (gate.verdict === "ready") {
    for (const item of gate.items || []) {
      if (!PASSING_STATUSES.has(item.status)) {
        errors.push(`${targetGate}.${item.id}: gate verdict is ready but item is ${item.status}`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

if (gate) {
  const counts = statusCounts(gate.items || []);
  console.log(`Release gate ${targetGate}: ${gate.verdict}`);
  console.log(`Items: ready=${counts.ready || 0}, in_progress=${counts.in_progress || 0}, blocked=${counts.blocked || 0}, waived=${counts.waived || 0}`);
}
