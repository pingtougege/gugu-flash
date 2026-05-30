import { ANIME_IP_COLLECTION_SOURCE } from "./anime-ip-collector.js";
import { GUGU_ZONES } from "./gugu-h5-pack.js";

export const WEBWIDE_IP_DISCOVERY_SOURCE = {
  id: "wikidata_live_ip_discovery",
  name: "实时全网公开知识库搜索",
  endpoint: "https://query.wikidata.org/sparql",
  rightsNotice: "实时发现结果来自公开知识库，仅用于二创归属、热度观察和审核线索；不代表官方授权，上架商店或硬件分发必须单独权利证明。",
};

const DEFAULT_LIMIT = 80;
const USER_AGENT = "GuguFlashOperator/0.1 (ip-discovery; local prototype)";

function normalizeText(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[：:'’"“”!！?？,，.。/／\\\-_\s·・]+/g, "");
}

function slugFromEntityUri(uri = "", fallback = "item") {
  const qid = String(uri).split("/").pop() || fallback;
  return qid.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function avatarForIndex(index) {
  return ["🎭", "📚", "🎮", "🎬", "🧩", "✨", "🗡️", "🌌"][index % 8];
}

function sameName(left = "", right = "") {
  return normalizeText(left) === normalizeText(right);
}

function findDuplicateIp(candidateEntry, existingIpPool = {}) {
  return Object.values(existingIpPool || {}).find((entry) => (
    entry.id === candidateEntry.id ||
    sameName(entry.name, candidateEntry.name) ||
    (candidateEntry.aliases || []).some((alias) => sameName(entry.name, alias) || (entry.aliases || []).some((item) => sameName(item, alias)))
  )) || null;
}

function wikidataSparqlQuery({ limit = DEFAULT_LIMIT, offset = 0 } = {}) {
  const rowLimit = Math.max(40, Math.min(Number(limit) * 6 || DEFAULT_LIMIT * 6, 500));
  return `
SELECT ?work ?workLabel ?workDescription ?character ?characterLabel ?characterDescription WHERE {
  ?work wdt:P31/wdt:P279* wd:Q196600 .
  ?work wdt:P674 ?character .
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "zh,en".
  }
}
LIMIT ${rowLimit}
OFFSET ${Math.max(0, Number(offset) || 0)}
`;
}

async function fetchWikidataRows({ fetchImpl = globalThis.fetch, limit = DEFAULT_LIMIT, offset = 0, signal } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("当前运行环境没有 fetch，无法实时联网搜索。");
  const url = `${WEBWIDE_IP_DISCOVERY_SOURCE.endpoint}?format=json&query=${encodeURIComponent(wikidataSparqlQuery({ limit, offset }))}`;
  const response = await fetchImpl(url, {
    headers: {
      Accept: "application/sparql-results+json, application/json",
      "User-Agent": USER_AGENT,
    },
    signal,
  });
  if (!response.ok) throw new Error(`公开知识库搜索失败：HTTP ${response.status}`);
  const payload = await response.json();
  return payload?.results?.bindings || [];
}

function rowValue(row, key) {
  return row?.[key]?.value || "";
}

function buildLiveSeeds(rows, { limit = DEFAULT_LIMIT } = {}) {
  const grouped = new Map();
  for (const row of rows) {
    const workUri = rowValue(row, "work");
    const workLabel = rowValue(row, "workLabel");
    if (!workUri || !workLabel || /^Q\d+$/.test(workLabel)) continue;
    const workId = `webwide_${slugFromEntityUri(workUri, workLabel)}`;
    if (!grouped.has(workId)) {
      grouped.set(workId, {
        sourceId: workUri,
        id: workId,
        name: workLabel,
        aliases: [workLabel],
        defaultZoneId: "adventure",
        heatScore: 7600,
        tags: ["实时发现", "公开知识库", "待权利核验"],
        description: rowValue(row, "workDescription") || `实时全网公开知识库发现的 IP/作品条目：${workLabel}。`,
        personas: [],
      });
    }
    const seed = grouped.get(workId);
    const characterUri = rowValue(row, "character");
    const characterLabel = rowValue(row, "characterLabel");
    if (characterUri && characterLabel && !/^Q\d+$/.test(characterLabel) && !seed.personas.some((item) => item.sourceUri === characterUri)) {
      const personaId = `${workId}_${slugFromEntityUri(characterUri, characterLabel)}`;
      seed.personas.push({
        id: personaId,
        sourceUri: characterUri,
        name: characterLabel,
        avatar: avatarForIndex(seed.personas.length),
        tagline: rowValue(row, "characterDescription") || `${workLabel} 公开知识库关联角色，需运营复核角色边界和权利状态。`,
      });
    }
  }

  return [...grouped.values()]
    .filter((seed) => seed.personas.length > 0)
    .sort((a, b) => b.personas.length - a.personas.length || a.name.localeCompare(b.name, "zh-CN"))
    .slice(0, Math.max(1, Number(limit) || DEFAULT_LIMIT))
    .map((seed) => ({
      ...seed,
      personas: seed.personas.slice(0, 12).map(({ sourceUri, ...persona }) => persona),
    }));
}

function buildPersona(seed, persona) {
  return {
    id: persona.id,
    ipId: seed.id,
    name: persona.name,
    avatar: persona.avatar,
    roleType: "external_reference",
    status: "active",
    tagline: persona.tagline,
    collectedFrom: WEBWIDE_IP_DISCOVERY_SOURCE.id,
  };
}

function buildIpEntry(seed, now = Date.now()) {
  const defaultZoneId = GUGU_ZONES[seed.defaultZoneId] ? seed.defaultZoneId : "adventure";
  return {
    id: seed.id,
    name: seed.name,
    type: "mainstream_external_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId,
    personaIds: seed.personas.map((persona) => persona.id),
    zoneStatus: "not_open",
    aliases: seed.aliases || [],
    tags: seed.tags || [],
    communityStats: {
      works: 0,
      creators: 0,
      heatScore: seed.heatScore || 0,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 0,
    },
    description: seed.description,
    rightsNotice: WEBWIDE_IP_DISCOVERY_SOURCE.rightsNotice,
    collectedFrom: WEBWIDE_IP_DISCOVERY_SOURCE.id,
    collectedAt: now,
  };
}

function buildCandidate(seed, { existingIpPool = {}, existingPersonas = {}, now = Date.now() } = {}) {
  const ipEntry = buildIpEntry(seed, now);
  const duplicate = findDuplicateIp(ipEntry, existingIpPool);
  const personas = seed.personas.map((persona) => buildPersona(seed, persona));
  const duplicatePersonaIds = new Set(duplicate?.personaIds || []);
  const missingFromDuplicate = duplicate
    ? personas.filter((persona) => !duplicatePersonaIds.has(persona.id))
    : personas.filter((persona) => !existingPersonas?.[persona.id]);

  return {
    id: `candidate_${seed.id}`,
    sourceId: seed.sourceId,
    sourceName: WEBWIDE_IP_DISCOVERY_SOURCE.name,
    ipId: seed.id,
    name: seed.name,
    aliases: seed.aliases || [],
    tags: seed.tags || [],
    score: seed.heatScore || 0,
    matchedBy: "实时全网发现",
    alreadyInPool: Boolean(duplicate),
    duplicateIpId: duplicate?.id || null,
    duplicateReason: duplicate ? `已存在：${duplicate.name}` : null,
    importable: !duplicate,
    supplementable: Boolean(duplicate && missingFromDuplicate.length),
    actionLabel: duplicate ? (missingFromDuplicate.length ? "补全角色" : "已完整") : "收集入池",
    ipEntry,
    personas,
    characters: personas.map((persona) => ({
      id: persona.id,
      name: persona.name,
      avatar: persona.avatar,
      tagline: persona.tagline,
    })),
    missingPersonaCount: personas.filter((persona) => !existingPersonas?.[persona.id]).length,
    missingPoolPersonaCount: missingFromDuplicate.length,
    rightsNotice: WEBWIDE_IP_DISCOVERY_SOURCE.rightsNotice,
  };
}

export async function discoverWebwideIpCandidates(options = {}) {
  const {
    fetchImpl = globalThis.fetch,
    limit = DEFAULT_LIMIT,
    offset = 0,
    existingIpPool = {},
    existingPersonas = {},
    now = Date.now(),
    signal,
  } = options;
  const rows = await fetchWikidataRows({ fetchImpl, limit, offset, signal });
  const seeds = buildLiveSeeds(rows, { limit });
  const candidates = seeds.map((seed) => buildCandidate(seed, { existingIpPool, existingPersonas, now }));
  return {
    items: candidates,
    source: WEBWIDE_IP_DISCOVERY_SOURCE.name,
    sourceId: WEBWIDE_IP_DISCOVERY_SOURCE.id,
    rightsNotice: WEBWIDE_IP_DISCOVERY_SOURCE.rightsNotice,
    fetchedRowCount: rows.length,
    discoveredIpCount: candidates.length,
    importableCount: candidates.filter((item) => item.importable).length,
    supplementableCount: candidates.filter((item) => item.supplementable).length,
  };
}

export function mergeCandidateLists(primary = [], fallback = []) {
  const seen = new Set();
  const merged = [];
  for (const candidate of [...primary, ...fallback]) {
    const key = normalizeText(candidate?.name || candidate?.ipId || candidate?.id);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(candidate);
  }
  return merged;
}
