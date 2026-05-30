import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  GUGU_H5_SCHEMA_VERSION,
  GUGU_STORY_PROJECT_SCHEMA_VERSION,
} from "../../../packages/core/src/index.js";
import { createHttpFlashApi } from "../../../packages/api-client/src/http-flash-api.js";
import { createFlashHttpServer } from "./flash-http-server.js";

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function withStoryProjectBackend(callback) {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-story-project-api-"));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  const { server } = createFlashHttpServer({ dataPath, statePath });
  const baseUrl = await listen(server);
  const api = createHttpFlashApi({ baseUrl });

  try {
    await callback(api, baseUrl);
  } finally {
    await close(server);
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function postRaw(baseUrl, path, body = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((response) => response.json());
}

function makeStoryProject(overrides = {}) {
  return {
    id: "story_project_backend_slice",
    schemaVersion: GUGU_STORY_PROJECT_SCHEMA_VERSION,
    title: "Backend Slice Mystery",
    status: "draft",
    author: { id: "user_local", name: "Creator" },
    origin: {
      contentOrigin: "original",
      ipId: null,
      fanworkOf: null,
      remixOf: null,
      rightsAcknowledgedAt: null,
    },
    brief: {
      logline: "A small mystery with one meaningful choice.",
      genre: "mystery",
      audience: "mobile_short_play",
      tone: "warm",
    },
    zoneId: "adventure",
    persona: {
      id: "field_editor",
      name: "Field Editor",
      avatar: "F",
      roleType: "creator_original",
      tagline: "Keeps every branch playable.",
    },
    storyGraph: {
      entryNodeId: "start",
      nodes: [
        { id: "start", type: "scene", sceneId: "start", title: "Start" },
        { id: "inspect", type: "scene", sceneId: "inspect", title: "Inspect" },
        { id: "call", type: "scene", sceneId: "call", title: "Call" },
        { id: "solve_end", type: "ending", sceneId: "solve_end", title: "Solved" },
        { id: "quiet_end", type: "ending", sceneId: "quiet_end", title: "Quiet" },
      ],
      edges: [
        { id: "start_inspect", fromNodeId: "start", toNodeId: "inspect", label: "Inspect note" },
        { id: "start_call", fromNodeId: "start", toNodeId: "call", label: "Call friend" },
        { id: "inspect_solve", fromNodeId: "inspect", toNodeId: "solve_end", label: "Name truth" },
        { id: "call_quiet", fromNodeId: "call", toNodeId: "quiet_end", label: "Wait until dawn" },
      ],
    },
    script: {
      scenes: [
        {
          id: "start",
          title: "Start",
          background: "linear-gradient(160deg, #172554, #0f766e)",
          character: "F",
          speaker: "Field Editor",
          text: "A folded note waits under the studio door, already stamped with tomorrow's date.",
        },
        {
          id: "inspect",
          title: "Inspect",
          background: "linear-gradient(160deg, #1f2937, #155e75)",
          character: "N",
          speaker: "Narrator",
          text: "The ink is fresh, but the warning describes a mistake you have not made yet.",
        },
        {
          id: "call",
          title: "Call",
          background: "linear-gradient(160deg, #312e81, #075985)",
          character: "P",
          speaker: "Phone",
          text: "Your friend answers before the first ring finishes and asks why the lights are still on.",
        },
        {
          id: "solve_end",
          title: "Solved",
          background: "linear-gradient(160deg, #064e3b, #84cc16)",
          character: "T",
          speaker: "Field Editor",
          text: "Ending: you rewrite the note into a checklist, and the future loses its trap.",
        },
        {
          id: "quiet_end",
          title: "Quiet",
          background: "linear-gradient(160deg, #1e1b4b, #38bdf8)",
          character: "D",
          speaker: "Narrator",
          text: "Ending: you wait together until dawn, and the warning becomes only a story.",
        },
      ],
    },
    comicPanels: [],
    assets: [],
    tags: ["backend", "playable"],
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
    ...overrides,
  };
}

test("StoryProject HTTP slice creates, fetches, snapshots, records jobs, and compiles H5", async () => {
  await withStoryProjectBackend(async (api) => {
    const created = await api.createStoryProject(makeStoryProject());
    assert.equal(created.item.id, "story_project_backend_slice");
    assert.equal(created.item.authorUserId, "user_local");
    assert.equal(created.item.contentOrigin, "original");

    const listed = await api.listStoryProjects();
    assert.equal(listed.items.some((item) => item.id === created.item.id), true);

    const fetched = await api.getStoryProject(created.item.id);
    assert.equal(fetched.item.title, "Backend Slice Mystery");

    const version = await api.createStoryProjectVersion(created.item.id, {
      label: "Phase 0 snapshot",
      reason: "Prove project snapshots persist.",
    });
    assert.match(version.item.id, /^spv_/);
    assert.equal(version.item.storyProjectId, created.item.id);
    assert.equal(version.item.projectSnapshot.title, "Backend Slice Mystery");

    const job = await api.createStoryProjectAiJob(created.item.id, {
      stage: "outline",
      prompt: "Make the middle branch clearer.",
    });
    assert.match(job.item.id, /^ai_job_/);
    assert.equal(job.item.storyProjectId, created.item.id);
    assert.equal(job.item.inputSnapshotId, version.item.id);

    const fetchedJob = await api.getAiGenerationJob(job.item.id);
    assert.equal(fetchedJob.item.prompt, "Make the middle branch clearer.");

    const compiled = await api.compileStoryProjectH5(created.item.id);
    assert.equal(compiled.item.targetType, "WorkDraft");
    assert.equal(compiled.item.status, "ready_to_preview");
    assert.equal(compiled.item.pack.schemaVersion, GUGU_H5_SCHEMA_VERSION);
    assert.equal(compiled.h5Pack.sourceProjectId, created.item.id);
    assert.equal(compiled.h5Pack.entrySceneId, "start");
    assert.equal(compiled.h5Pack.scenes.length, 5);
    assert.deepEqual(compiled.report.errors, []);
    assert.equal(["blocked", "warning", "passed"].includes(compiled.item.publishStatus), true);
  });
});

test("StoryProject HTTP slice rejects invalid project graphs with 400", async () => {
  await withStoryProjectBackend(async (api, baseUrl) => {
    const invalidCreate = await postRaw(baseUrl, "/flash/story-projects", {
      project: makeStoryProject({
        id: "story_project_invalid_create",
        storyGraph: {
          entryNodeId: "start",
          nodes: [{ id: "start", type: "scene", sceneId: "start", title: "Start" }],
          edges: [],
        },
        script: {
          scenes: [{
            id: "start",
            title: "Start",
            text: "This scene has no ending and should fail.",
          }],
        },
      }),
    });
    assert.equal(invalidCreate.code, 400);
    assert.equal(invalidCreate.message, "story_project_invalid");
    assert.ok(invalidCreate.data.errors.some((error) => error.includes("dead_end_node")));

    const created = await api.createStoryProject(makeStoryProject({ id: "story_project_compile_guard" }));
    const invalidCompile = await postRaw(baseUrl, `/flash/story-projects/${created.item.id}/compile/h5`, {
      project: {
        ...created.item,
        storyGraph: {
          ...created.item.storyGraph,
          edges: [
            ...created.item.storyGraph.edges,
            { id: "broken_edge", fromNodeId: "start", toNodeId: "missing", label: "Break graph" },
          ],
        },
      },
    });
    assert.equal(invalidCompile.code, 400);
    assert.equal(invalidCompile.message, "story_project_invalid");
    assert.ok(invalidCompile.data.errors.some((error) => error.includes("invalid_edge_target")));
  });
});
