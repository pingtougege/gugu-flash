import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const JSON_FLASH_STORE_BACKUP_SCHEMA_VERSION = "gugu_flash_json_backup_v1";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function digest(value) {
  return `sha256:${createHash("sha256").update(JSON.stringify(stable(value))).digest("hex")}`;
}

async function readJsonFile(path, fallback) {
  try {
    return {
      exists: true,
      json: JSON.parse(await readFile(path, "utf8")),
    };
  } catch (error) {
    if (error.code === "ENOENT") return { exists: false, json: fallback };
    throw error;
  }
}

function backupPayload(backup) {
  return {
    schemaVersion: backup.schemaVersion,
    createdAt: backup.createdAt,
    label: backup.label,
    source: backup.source,
    files: backup.files,
  };
}

export function validateJsonFlashStoreBackup(backup = {}) {
  const errors = [];
  if (backup.schemaVersion !== JSON_FLASH_STORE_BACKUP_SCHEMA_VERSION) {
    errors.push(`backup.schemaVersion must be ${JSON_FLASH_STORE_BACKUP_SCHEMA_VERSION}`);
  }
  if (!backup.createdAt) errors.push("backup.createdAt is required");
  for (const key of ["data", "state"]) {
    const file = backup.files?.[key];
    if (!file) {
      errors.push(`backup.files.${key} is required`);
      continue;
    }
    if (typeof file.exists !== "boolean") errors.push(`backup.files.${key}.exists must be boolean`);
    if (file.exists && file.json === undefined) errors.push(`backup.files.${key}.json is required when file exists`);
  }
  if (!backup.checksum) {
    errors.push("backup.checksum is required");
  } else if (backup.checksum !== digest(backupPayload(backup))) {
    errors.push("backup.checksum does not match payload");
  }
  return errors;
}

export async function createJsonFlashStoreBackup({
  dataPath,
  statePath,
  backupPath,
  label = "manual",
  createdAt = new Date().toISOString(),
} = {}) {
  if (!dataPath) throw new Error("dataPath is required");
  if (!statePath) throw new Error("statePath is required");
  if (!backupPath) throw new Error("backupPath is required");

  const payload = {
    schemaVersion: JSON_FLASH_STORE_BACKUP_SCHEMA_VERSION,
    createdAt,
    label,
    source: {
      dataPath,
      statePath,
    },
    files: {
      data: await readJsonFile(dataPath, []),
      state: await readJsonFile(statePath, {}),
    },
  };
  const backup = {
    ...payload,
    checksum: digest(payload),
  };

  await mkdir(dirname(backupPath), { recursive: true });
  await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`);
  return structuredClone(backup);
}

async function restoreFile(path, file) {
  await mkdir(dirname(path), { recursive: true });
  if (file.exists) {
    await writeFile(path, `${JSON.stringify(file.json, null, 2)}\n`);
  } else {
    await rm(path, { force: true });
  }
}

export async function restoreJsonFlashStoreBackup({ backupPath, dataPath, statePath } = {}) {
  if (!backupPath) throw new Error("backupPath is required");
  if (!dataPath) throw new Error("dataPath is required");
  if (!statePath) throw new Error("statePath is required");

  const backup = JSON.parse(await readFile(backupPath, "utf8"));
  const errors = validateJsonFlashStoreBackup(backup);
  if (errors.length) throw new Error(errors.join("\n"));

  await restoreFile(dataPath, backup.files.data);
  await restoreFile(statePath, backup.files.state);
  return structuredClone(backup);
}
