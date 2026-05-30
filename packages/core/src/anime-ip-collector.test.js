import assert from "node:assert/strict";
import test from "node:test";

import {
  collectAnimeIpCandidates,
  collectAnimeIpCharacterCandidates,
  importAnimeIpCandidates,
} from "./index.js";

test("collectAnimeIpCandidates matches anime IP and character aliases", () => {
  const candidates = collectAnimeIpCandidates({
    query: "芙莉莲",
    existingIpPool: {},
    existingPersonas: {},
    now: 1760000000000,
  });

  assert.equal(candidates[0].ipId, "mainstream_frieren");
  assert.equal(candidates[0].characters[0].name, "芙莉莲");
  assert.equal(candidates[0].importable, true);
  assert.equal(candidates[0].ipEntry.supportedOrigins[0], "fanwork");
  assert.match(candidates[0].rightsNotice, /不代表官方授权/);
});

test("collectAnimeIpCandidates skips duplicates already in the IP pool", () => {
  const candidates = collectAnimeIpCandidates({
    query: "Spy Family",
    existingIpPool: {
      mainstream_spy_family: { id: "mainstream_spy_family", name: "Spy x Family / 间谍过家家" },
    },
    existingPersonas: {},
  });

  assert.deepEqual(candidates, []);
});

test("importAnimeIpCandidates adds IP entries and personas to the target pool", () => {
  const targetIpPool = {};
  const targetPersonas = {};
  const candidates = collectAnimeIpCandidates({
    query: "排球",
    existingIpPool: targetIpPool,
    existingPersonas: targetPersonas,
    now: 1760000000000,
  });

  const result = importAnimeIpCandidates(candidates, {
    targetIpPool,
    targetPersonas,
    now: 1760000000001,
  });

  assert.equal(result.addedIpCount, 1);
  assert.equal(result.addedPersonaCount, 6);
  assert.equal(targetIpPool.mainstream_haikyu.name, "Haikyu!! / 排球少年");
  assert.deepEqual(targetIpPool.mainstream_haikyu.personaIds, [
    "haikyu_hinata",
    "haikyu_kageyama",
    "haikyu_tsukishima",
    "haikyu_nishinoya",
    "haikyu_daichi",
    "haikyu_sugawara",
  ]);
  assert.equal(targetPersonas.haikyu_hinata.ipId, "mainstream_haikyu");
});

test("importAnimeIpCandidates supplements existing IP character rosters", () => {
  const targetIpPool = {
    mainstream_naruto: {
      id: "mainstream_naruto",
      name: "Naruto / 火影忍者",
      personaIds: ["naruto_uzumaki", "naruto_sasuke"],
    },
  };
  const targetPersonas = {
    naruto_uzumaki: { id: "naruto_uzumaki", name: "漩涡鸣人" },
    naruto_sasuke: { id: "naruto_sasuke", name: "宇智波佐助" },
  };
  const candidates = collectAnimeIpCandidates({
    query: "火影",
    includeExisting: true,
    existingIpPool: targetIpPool,
    existingPersonas: targetPersonas,
    now: 1760000000000,
  });

  const result = importAnimeIpCandidates(candidates, {
    targetIpPool,
    targetPersonas,
    now: 1760000000001,
  });

  assert.equal(result.addedIpCount, 0);
  assert.equal(result.supplementedIpCount, 1);
  assert.equal(result.addedPersonaCount, 7);
  assert.ok(targetIpPool.mainstream_naruto.personaIds.includes("naruto_kakashi"));
  assert.equal(targetPersonas.naruto_kakashi.tagline, "第七班导师，适合任务引导、冷幽默和关键提示。");
});

test("collectAnimeIpCandidates can sweep the complete web-wide catalog", () => {
  const candidates = collectAnimeIpCandidates({
    query: "",
    limit: "all",
    sweepAll: true,
    includeExisting: true,
    existingIpPool: {
      mainstream_one_piece: {
        id: "mainstream_one_piece",
        name: "One Piece / 海贼王",
        personaIds: ["one_piece_luffy", "one_piece_zoro"],
      },
    },
    existingPersonas: {
      one_piece_luffy: { id: "one_piece_luffy", name: "路飞" },
      one_piece_zoro: { id: "one_piece_zoro", name: "索隆" },
    },
  });

  assert.ok(candidates.length >= 200);
  const onePiece = candidates.find((candidate) => candidate.ipId === "mainstream_one_piece");
  assert.equal(onePiece.supplementable, true);
  assert.equal(onePiece.missingPoolPersonaCount, 5);
  assert.ok(onePiece.personas.some((persona) => persona.id === "one_piece_robin"));
});

test("collectAnimeIpCharacterCandidates deepens one IP character roster", () => {
  const candidate = collectAnimeIpCharacterCandidates("mainstream_demon_slayer", {
    existingIpPool: {
      mainstream_demon_slayer: {
        id: "mainstream_demon_slayer",
        name: "Demon Slayer / 鬼灭之刃",
        personaIds: ["demon_slayer_tanjiro", "demon_slayer_nezuko"],
      },
    },
    existingPersonas: {
      demon_slayer_tanjiro: { id: "demon_slayer_tanjiro", name: "灶门炭治郎" },
      demon_slayer_nezuko: { id: "demon_slayer_nezuko", name: "灶门祢豆子" },
    },
  });

  assert.equal(candidate.matchedBy, "二级角色深挖");
  assert.ok(candidate.personas.length > 6);
  assert.ok(candidate.missingPoolPersonaCount >= 20);
  assert.ok(candidate.personas.some((persona) => persona.id === "demon_slayer_rengoku"));
  assert.ok(candidate.personas.some((persona) => persona.id === "demon_slayer_muzan"));
});

test("collectAnimeIpCharacterCandidates deepens Pokemon beyond the initial roster", () => {
  const candidate = collectAnimeIpCharacterCandidates("mainstream_pokemon", {
    existingIpPool: {
      mainstream_pokemon: {
        id: "mainstream_pokemon",
        name: "Pokémon / 宝可梦",
        personaIds: ["pokemon_pikachu", "pokemon_eevee"],
      },
    },
    existingPersonas: {
      pokemon_pikachu: { id: "pokemon_pikachu", name: "皮卡丘" },
      pokemon_eevee: { id: "pokemon_eevee", name: "伊布" },
    },
  });

  assert.equal(candidate.matchedBy, "二级角色深挖");
  assert.ok(candidate.personas.length >= 1000);
  assert.ok(candidate.missingPoolPersonaCount >= 1000);
  assert.ok(candidate.personas.some((persona) => persona.id === "pokemon_lucario"));
  assert.ok(candidate.personas.some((persona) => persona.id === "pokemon_cynthia"));
  assert.ok(candidate.personas.some((persona) => persona.name === "铁臂膀"));
  assert.ok(candidate.personas.some((persona) => persona.name === "桃歹郎"));
});
