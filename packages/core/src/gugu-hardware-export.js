import { buildHardwarePackFromReport, createCompatibilityReport } from "./gugu-hardware-compat.js";
import { createLaunchHardwarePayload } from "./gugu-launch-content.js";

export const HARDWARE_STUDIO_EXPORT_VERSION = "gugu_hardware_studio_export_v1";

export const HARDWARE_STUDIO_EXPORT_REQUIRED_FILES = [
  "manifest.json",
  "payload/story.json",
  "compatibility-report.json",
  "checksums.sha256",
];

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function rotateRight(value, bits) {
  return (value >>> bits) | (value << (32 - bits));
}

function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;
  const withOne = bytes.length + 1;
  const paddedLength = Math.ceil((withOne + 8) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4);
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + SHA256_K[index] + words[index]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return [...hash].map((word) => word.toString(16).padStart(8, "0")).join("");
}

export function createHardwareStudioChecksum(value) {
  return `sha256:${sha256Hex(stableJson(value))}`;
}

function createFileEntry(path, value, mediaType = "application/json") {
  const content = mediaType === "application/json" ? stableJson(value) : String(value);
  return {
    path,
    mediaType,
    bytes: new TextEncoder().encode(content).length,
    checksum: `sha256:${sha256Hex(content)}`,
  };
}

function exportReadme(bundle) {
  return [
    `# Hardware Studio Export ${bundle.exportId}`,
    "",
    `HardwarePack: ${bundle.hardwarePackId}`,
    `SourcePack: ${bundle.sourcePackId}`,
    `TargetProfile: ${bundle.targetProfileId}`,
    "",
    "Import `manifest.json` into Gugu Flash Hardware Studio and verify `checksums.sha256` before native packaging.",
    "",
  ].join("\n");
}

export function createHardwareStudioExportBundle(pack = {}, options = {}) {
  const compatibilityReport = options.compatibilityReport || createCompatibilityReport(pack, {
    id: options.compatibilityReportId,
    timestamp: options.generatedAt || options.timestamp,
    targetProfileId: options.targetProfileId,
  });
  if (!compatibilityReport?.canCreateHardwarePack) {
    return {
      schemaVersion: HARDWARE_STUDIO_EXPORT_VERSION,
      exportId: options.exportId || `hw_export_${pack.id || "unknown"}`,
      status: "blocked",
      reason: "compatibility_failed",
      sourcePackId: pack.id || null,
      compatibilityReport,
    };
  }

  const provisionalHardwarePack = options.hardwarePack || buildHardwarePackFromReport(pack, compatibilityReport, {
    id: options.hardwarePackId || compatibilityReport.hardwarePackId,
    status: options.status || pack.hardwarePack?.status || "pack_review",
    version: options.version || pack.hardwarePack?.version || "1.0.0",
    checksum: "sha256:pending",
    downloadUrl: options.downloadUrl,
    updatedAt: options.generatedAt || compatibilityReport.updatedAt,
  });
  const payload = options.payload || createLaunchHardwarePayload(pack, provisionalHardwarePack, {
    generatedAt: options.generatedAt || compatibilityReport.updatedAt,
    renderMode: options.renderMode || "static_scene_graph",
  });
  const payloadChecksum = createHardwareStudioChecksum(payload);
  const hardwarePack = {
    ...provisionalHardwarePack,
    status: options.status || provisionalHardwarePack.status,
    checksum: payloadChecksum,
    downloadUrl: options.downloadUrl || `/hardware-studio/${provisionalHardwarePack.id}-${provisionalHardwarePack.version}.json`,
  };
  const exportId = options.exportId || `hw_export_${hardwarePack.id}_${hardwarePack.version}`;
  const generatedAt = options.generatedAt || compatibilityReport.updatedAt || Date.now();
  const manifest = {
    schemaVersion: HARDWARE_STUDIO_EXPORT_VERSION,
    exportId,
    generatedAt,
    sourcePackId: pack.id,
    sourceWorkId: hardwarePack.sourceWorkId,
    sourceWorkVersionId: hardwarePack.sourceWorkVersionId,
    hardwarePackId: hardwarePack.id,
    hardwarePackVersion: hardwarePack.version,
    targetProfileId: compatibilityReport.targetProfileId,
    formatVersion: hardwarePack.formatVersion,
    payloadPath: "payload/story.json",
    compatibilityReportPath: "compatibility-report.json",
    requiredFiles: [...HARDWARE_STUDIO_EXPORT_REQUIRED_FILES],
    hardwarePack,
  };
  const payloadFile = createFileEntry("payload/story.json", payload);
  const reportFile = createFileEntry("compatibility-report.json", compatibilityReport);
  const manifestFile = createFileEntry("manifest.json", manifest);
  const readmeFile = createFileEntry("README.md", exportReadme({ exportId, hardwarePackId: hardwarePack.id, sourcePackId: pack.id, targetProfileId: compatibilityReport.targetProfileId }), "text/markdown");
  const checksumsSha256 = [manifestFile, payloadFile, reportFile, readmeFile]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((file) => `${file.checksum.replace(/^sha256:/, "")}  ${file.path}`)
    .join("\n");
  const checksumFile = createFileEntry("checksums.sha256", `${checksumsSha256}\n`, "text/plain");
  const files = [manifestFile, payloadFile, reportFile, checksumFile, readmeFile];

  return {
    schemaVersion: HARDWARE_STUDIO_EXPORT_VERSION,
    exportId,
    generatedAt,
    status: "ready_for_hardware_studio",
    sourcePackId: pack.id,
    hardwarePackId: hardwarePack.id,
    targetProfileId: compatibilityReport.targetProfileId,
    formatVersion: hardwarePack.formatVersion,
    packageChecksum: manifestFile.checksum,
    hardwarePack,
    compatibilityReport,
    payload,
    files,
    checksumsSha256: `${checksumsSha256}\n`,
    studioImport: {
      entryFile: "manifest.json",
      payloadFile: "payload/story.json",
      checksumFile: "checksums.sha256",
      requiresNativePackaging: true,
    },
  };
}

export function validateHardwareStudioExportBundle(bundle = {}) {
  const errors = [];
  if (bundle.schemaVersion !== HARDWARE_STUDIO_EXPORT_VERSION) {
    errors.push(`schemaVersion must be ${HARDWARE_STUDIO_EXPORT_VERSION}`);
  }
  if (bundle.status === "blocked") return errors;
  if (bundle.status !== "ready_for_hardware_studio") errors.push("status must be ready_for_hardware_studio");
  if (!bundle.exportId) errors.push("exportId is required");
  if (!bundle.hardwarePackId) errors.push("hardwarePackId is required");
  if (!bundle.sourcePackId) errors.push("sourcePackId is required");
  if (!bundle.payload || bundle.payload.payloadVersion !== "gugu_hardware_payload_v1") errors.push("payload must be gugu_hardware_payload_v1");
  if (bundle.hardwarePack?.checksum !== createHardwareStudioChecksum(bundle.payload || {})) {
    errors.push("hardwarePack.checksum must match payload checksum");
  }
  const files = new Map((bundle.files || []).map((file) => [file.path, file]));
  for (const path of HARDWARE_STUDIO_EXPORT_REQUIRED_FILES) {
    if (!files.has(path)) errors.push(`files missing ${path}`);
  }
  for (const file of bundle.files || []) {
    if (!/^sha256:[a-f0-9]{64}$/.test(file.checksum || "")) errors.push(`${file.path}: checksum must be sha256`);
    if (!Number.isFinite(file.bytes) || file.bytes <= 0) errors.push(`${file.path}: bytes must be positive`);
  }
  if (!String(bundle.checksumsSha256 || "").includes("manifest.json")) errors.push("checksumsSha256 must include manifest.json");
  if (bundle.studioImport?.entryFile !== "manifest.json") errors.push("studioImport.entryFile must be manifest.json");
  if (bundle.studioImport?.requiresNativePackaging !== true) errors.push("studioImport.requiresNativePackaging must be true");
  return errors;
}
