import assert from "node:assert/strict";
import test from "node:test";

import {
  discoverWebwideIpCandidates,
  mergeCandidateLists,
} from "./index.js";

function wikidataResponse(bindings) {
  return {
    ok: true,
    json: async () => ({
      results: { bindings },
    }),
  };
}

function row(workQid, workLabel, workDescription, characterQid, characterLabel, characterDescription) {
  return {
    work: { value: `http://www.wikidata.org/entity/${workQid}` },
    workLabel: { value: workLabel },
    workDescription: { value: workDescription },
    character: { value: `http://www.wikidata.org/entity/${characterQid}` },
    characterLabel: { value: characterLabel },
    characterDescription: { value: characterDescription },
  };
}

test("discoverWebwideIpCandidates builds importable IP candidates from live knowledge rows", async () => {
  const fetchImpl = async () => wikidataResponse([
    row("Q100", "Example Saga", "fictional media franchise", "Q101", "Hero One", "main protagonist"),
    row("Q100", "Example Saga", "fictional media franchise", "Q102", "Rival Two", "recurring rival"),
    row("Q200", "Another Quest", "video game series", "Q201", "Guide Three", "support character"),
  ]);

  const result = await discoverWebwideIpCandidates({
    fetchImpl,
    limit: 10,
    existingIpPool: {},
    existingPersonas: {},
    now: 1760000000000,
  });

  assert.equal(result.source, "实时全网公开知识库搜索");
  assert.equal(result.fetchedRowCount, 3);
  assert.equal(result.discoveredIpCount, 2);
  assert.equal(result.items[0].name, "Example Saga");
  assert.equal(result.items[0].ipEntry.id, "webwide_q100");
  assert.equal(result.items[0].personas.length, 2);
  assert.equal(result.items[0].personas[0].tagline, "main protagonist");
  assert.match(result.items[0].rightsNotice, /不代表官方授权/);
});

test("discoverWebwideIpCandidates marks existing live IPs as supplementable", async () => {
  const fetchImpl = async () => wikidataResponse([
    row("Q100", "Example Saga", "fictional media franchise", "Q101", "Hero One", "main protagonist"),
    row("Q100", "Example Saga", "fictional media franchise", "Q102", "Rival Two", "recurring rival"),
  ]);

  const result = await discoverWebwideIpCandidates({
    fetchImpl,
    existingIpPool: {
      webwide_q100: {
        id: "webwide_q100",
        name: "Example Saga",
        personaIds: ["webwide_q100_q101"],
      },
    },
    existingPersonas: {
      webwide_q100_q101: { id: "webwide_q100_q101", name: "Hero One" },
    },
  });

  assert.equal(result.items[0].importable, false);
  assert.equal(result.items[0].supplementable, true);
  assert.equal(result.items[0].missingPoolPersonaCount, 1);
});

test("mergeCandidateLists keeps live candidates before local fallbacks", () => {
  const merged = mergeCandidateLists(
    [{ name: "Live IP", ipId: "live" }, { name: "Shared IP", ipId: "live_shared" }],
    [{ name: "Shared IP", ipId: "fallback_shared" }, { name: "Fallback IP", ipId: "fallback" }],
  );

  assert.deepEqual(merged.map((item) => item.ipId), ["live", "live_shared", "fallback"]);
});
