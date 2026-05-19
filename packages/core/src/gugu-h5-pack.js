export const HARDWARE_STATUS_LABELS = {
  h5_only: "H5 内容",
  hardware_candidate: "硬件候选",
  hardware_ready: "硬件可下载",
};

export const TEMPLATE_PRESETS = {
  healing: {
    background: "linear-gradient(160deg, #0f172a 0%, #0e7490 58%, #a7f3d0 135%)",
    character: "🌙",
    tag: "治愈",
  },
  adventure: {
    background: "linear-gradient(160deg, #1f2937 0%, #b45309 62%, #fde68a 145%)",
    character: "🧭",
    tag: "冒险",
  },
  energy: {
    background: "linear-gradient(160deg, #ecfeff 0%, #22c55e 52%, #fb7185 138%)",
    character: "⚡",
    tag: "元气",
  },
};

export function hardwareStatusLabel(status) {
  return HARDWARE_STATUS_LABELS[status] || HARDWARE_STATUS_LABELS.h5_only;
}

export function formatNumber(value) {
  const n = Number(value) || 0;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function scorePack(pack) {
  const metrics = pack.metrics || {};
  return (
    (metrics.likes || 0) * 1.2 +
    (metrics.saves || 0) * 2 +
    (metrics.remixes || 0) * 4 +
    (metrics.plays || 0) * (metrics.completionRate || 0) * 0.15 -
    (metrics.reports || 0) * 20
  );
}

export function createDraftFromPrompt(prompt, template, timestamp = Date.now()) {
  const clean = prompt.trim() || "做一个会陪用户下班回家的电子吧唧小剧场";
  const title = clean.replace(/[，。！？,.!?\s].*$/, "").slice(0, 10) || "新咕咕剧场";
  const preset = TEMPLATE_PRESETS[template] || {
    background: "linear-gradient(160deg, #111827, #4f46e5)",
    character: "✨",
    tag: "共创",
  };
  const id = `h5_${Math.random().toString(36).slice(2, 9)}`;

  return {
    id,
    title,
    author: { id: "user_local", name: "你" },
    status: "public_h5",
    hardwareStatus: "h5_only",
    cover: { background: preset.background, character: preset.character },
    tags: [preset.tag, "AI草稿", "可二创"],
    metrics: { plays: 0, likes: 0, saves: 0, comments: 0, remixes: 0, completionRate: 0 },
    entrySceneId: "start",
    createdAt: timestamp,
    updatedAt: timestamp,
    remixOf: null,
    scenes: [
      {
        id: "start",
        background: preset.background,
        character: preset.character,
        speaker: title,
        text: `这个故事来自一句话：“${clean}”。它先以 H5 的方式出生，等大家喜欢，再去硬件里发光。`,
        actions: [
          { label: "靠近一点", goto: "near" },
          { label: "换个方向", goto: "twist" },
        ],
      },
      {
        id: "near",
        background: "linear-gradient(160deg, #164e63 0%, #0f766e 55%, #99f6e4 130%)",
        character: "✨",
        speaker: title,
        text: "它把一小段情绪打磨成可以点击的瞬间。不是大片，但很贴身。",
        actions: [{ label: "收尾", goto: "end" }],
      },
      {
        id: "twist",
        background: "linear-gradient(160deg, #3b0764 0%, #be185d 65%, #f9a8d4 145%)",
        character: "🎭",
        speaker: title,
        text: "如果有人来二创，这里可以变成另一个结局。共创的门先留着。",
        actions: [{ label: "收尾", goto: "end" }],
      },
      {
        id: "end",
        background: "linear-gradient(160deg, #020617 0%, #1e293b 70%, #38bdf8 150%)",
        character: "💫",
        speaker: title,
        text: "发布后，它会进入内容流。数据好的作品，再由官方适配成硬件包。",
        actions: [{ label: "重新播放", goto: "start" }],
      },
    ],
  };
}

export function cloneAsRemix(source, timestamp = Date.now()) {
  const copy = structuredClone(source);
  copy.id = `h5_${Math.random().toString(36).slice(2, 9)}`;
  copy.title = `${source.title} Remix`;
  copy.author = { id: "user_local", name: "你" };
  copy.status = "public_h5";
  copy.hardwareStatus = "h5_only";
  copy.remixOf = source.id;
  copy.createdAt = timestamp;
  copy.updatedAt = timestamp;
  copy.metrics = { plays: 0, likes: 0, saves: 0, comments: 0, remixes: 0, completionRate: 0 };
  copy.tags = Array.from(new Set([...(copy.tags || []), "Remix"]));
  return copy;
}

export function validatePack(pack) {
  const errors = [];
  if (!pack || typeof pack !== "object") return ["pack must be an object"];
  if (!pack.id) errors.push("pack missing id");
  if (!pack.title) errors.push(`${pack.id || "pack"} missing title`);
  if (!pack.entrySceneId) errors.push(`${pack.id || "pack"} missing entrySceneId`);
  if (!Array.isArray(pack.scenes) || pack.scenes.length === 0) {
    errors.push(`${pack.id || "pack"} missing scenes`);
    return errors;
  }

  const sceneIds = new Set(pack.scenes.map((scene) => scene.id));
  if (!sceneIds.has(pack.entrySceneId)) errors.push(`${pack.id} entrySceneId not found`);

  for (const scene of pack.scenes) {
    if (!scene.id) errors.push(`${pack.id} scene missing id`);
    if (!scene.text) errors.push(`${pack.id}/${scene.id || "scene"} missing text`);
    for (const action of scene.actions || []) {
      if (!action.label) errors.push(`${pack.id}/${scene.id} action missing label`);
      if (!sceneIds.has(action.goto)) errors.push(`${pack.id}/${scene.id} action goto not found: ${action.goto}`);
    }
  }

  return errors;
}

export function validatePacks(packs) {
  if (!Array.isArray(packs)) return ["root must be an array"];
  return packs.flatMap(validatePack);
}
