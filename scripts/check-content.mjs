import { readFile } from "node:fs/promises";
import { validatePacks } from "../packages/core/src/index.js";

const raw = await readFile(new URL("../data/seed-packs.json", import.meta.url), "utf-8");
const packs = JSON.parse(raw);
const errors = validatePacks(packs);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Checked ${packs.length} GuguH5Pack seed items.`);
