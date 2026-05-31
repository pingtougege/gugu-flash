import assert from "node:assert/strict";
import test from "node:test";

import {
  GUGU_STORY_AGENT_PIPELINE_VERSION,
  GUGU_STORY_PROJECT_SCHEMA_VERSION,
  auditStoryProjectWithTruth,
  createStoryAgentRuntimePlan,
  createStoryProjectAgentWorkup,
  createStoryRepairProposal,
  createStoryTruthBundle,
  enrichStoryProjectWithAgentWorkup,
} from "./index.js";

function makeStoryProject(overrides = {}) {
  return {
    id: "story_project_agent_slice",
    schemaVersion: GUGU_STORY_PROJECT_SCHEMA_VERSION,
    title: "雨夜便利店",
    status: "draft",
    author: { id: "user_local", name: "你" },
    origin: {
      contentOrigin: "original",
      ipId: "rain_gugu_universe",
      ipName: null,
      fanworkOf: null,
      remixOf: null,
      rightsAcknowledgedAt: null,
    },
    brief: {
      logline: "雨夜便利店里，主角遇到一只会预言明天的猫。",
      genre: "adventure",
      audience: "mobile_short_play",
      tone: "warm_mystery",
      sourcePrompt: "雨夜便利店遇到会预言的猫",
    },
    world: {
      setting: "雨夜便利店",
      rules: ["猫能预言明天", "停电后货架会改变顺序"],
      stakes: "主角必须在天亮前确认预言真假。",
    },
    zoneId: "adventure",
    persona: {
      id: "night_conductor",
      name: "零点列车长",
      avatar: "列",
      roleType: "official",
      tagline: "负责把犹豫检票进明天。",
    },
    characters: [
      {
        id: "night_conductor",
        name: "零点列车长",
        role: "社区分身 / 主角",
        motivation: "查清预言来源。",
        voice: "温和但有行动力。",
        avatar: "列",
      },
      {
        id: "prophet_cat",
        name: "预言猫",
        role: "线索提供者",
        motivation: "阻止错误的明天发生。",
        voice: "短句、神秘。",
        avatar: "猫",
      },
    ],
    cover: {
      background: "linear-gradient(160deg, #111827 0%, #7c2d12 60%, #fde68a 140%)",
      character: "列",
    },
    storyGraph: {
      entryNodeId: "start",
      nodes: [
        { id: "start", type: "scene", sceneId: "start", title: "雨夜开门" },
        { id: "ask_cat", type: "scene", sceneId: "ask_cat", title: "询问猫" },
        { id: "follow_shelf", type: "scene", sceneId: "follow_shelf", title: "跟随货架" },
        { id: "truth_end", type: "ending", sceneId: "truth_end", title: "真相结局" },
        { id: "warm_end", type: "ending", sceneId: "warm_end", title: "温柔结局" },
      ],
      edges: [
        { id: "start_ask", fromNodeId: "start", toNodeId: "ask_cat", label: "询问黑猫" },
        { id: "start_shelf", fromNodeId: "start", toNodeId: "follow_shelf", label: "检查货架" },
        { id: "ask_truth", fromNodeId: "ask_cat", toNodeId: "truth_end", label: "相信预言" },
        { id: "shelf_warm", fromNodeId: "follow_shelf", toNodeId: "warm_end", label: "留下纸条" },
      ],
    },
    script: {
      scenes: [
        {
          id: "start",
          title: "雨夜开门",
          background: "linear-gradient(160deg, #111827, #7c2d12)",
          character: "列",
          speaker: "零点列车长",
          text: "雨夜便利店的门铃响了三次，一只黑猫蹲在收银台上，盯着明天的报纸。",
        },
        {
          id: "ask_cat",
          title: "询问猫",
          background: "linear-gradient(160deg, #1f2937, #0f766e)",
          character: "猫",
          speaker: "预言猫",
          text: "黑猫把尾巴压在日期上：如果你现在相信我，明天会少一场遗憾。",
        },
        {
          id: "follow_shelf",
          title: "跟随货架",
          background: "linear-gradient(160deg, #12372a, #436850)",
          character: "列",
          speaker: "零点列车长",
          text: "货架自己挪开半步，露出一张写给未来顾客的便签。",
        },
        {
          id: "truth_end",
          title: "真相结局",
          background: "linear-gradient(160deg, #312e81, #4338ca)",
          character: "猫",
          speaker: "预言猫",
          text: "结局：你把报纸藏起，天亮后才发现那其实是你写给自己的提醒。",
        },
        {
          id: "warm_end",
          title: "温柔结局",
          background: "linear-gradient(160deg, #164e63, #99f6e4)",
          character: "列",
          speaker: "零点列车长",
          text: "结局：你留下便签，明天进店的人因此绕过了一场沉默的难过。",
        },
      ],
    },
    comicPanels: [],
    assets: [
      {
        id: "asset_cover",
        type: "cover",
        name: "雨夜便利店封面",
        usage: "cover",
        source: "ai_prompt",
        prompt: "雨夜便利店，暖光，黑猫，轻悬疑",
      },
    ],
    aiProvenance: [
      {
        provider: "local_rules",
        model: "clean_room_rules",
        generatedFields: ["brief", "storyGraph", "script", "assets"],
        prompt: "雨夜便利店里遇到会预言明天的猫",
        stage: "assemble_draft",
        generatedAt: 1760000000000,
      },
    ],
    tags: ["雨夜", "便利店", "预言"],
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
    ...overrides,
  };
}

test("createStoryTruthBundle derives Gugu-native truth sections from a StoryProject", () => {
  const bundle = createStoryTruthBundle(makeStoryProject(), {
    generatedAt: 1760000000000,
  });

  assert.equal(bundle.version, GUGU_STORY_AGENT_PIPELINE_VERSION);
  assert.equal(bundle.authorIntent.sourcePrompt, "雨夜便利店遇到会预言的猫");
  assert.equal(bundle.worldState.rules.length, 2);
  assert.equal(bundle.characterMatrix.characters.length, 2);
  assert.equal(bundle.choiceLedger.length, 4);
  assert.ok(bundle.branchHookLedger.some((hook) => hook.hookId === "branch_start"));
  assert.ok(bundle.sceneSummaries.every((scene) => typeof scene.reachable === "boolean"));
});

test("createStoryAgentRuntimePlan compiles selected context and staged rules", () => {
  const project = makeStoryProject();
  const truthBundle = createStoryTruthBundle(project, { generatedAt: 1760000000000 });
  const plan = createStoryAgentRuntimePlan(project, {
    truthBundle,
    generatedAt: 1760000000000,
  });

  assert.equal(plan.version, GUGU_STORY_AGENT_PIPELINE_VERSION);
  assert.deepEqual(
    plan.stages.map((stage) => stage.id),
    [
      "brief_from_prompt",
      "cast_design",
      "scene_graph",
      "script_draft",
      "asset_prompt_plan",
      "quality_audit",
      "quality_repair",
    ],
  );
  assert.ok(plan.selectedContext.some((entry) => entry.source === "branch_hook_ledger"));
  assert.ok(plan.ruleStack.sections.hard.some((rule) => rule.includes("entryNodeId")));
});

test("auditStoryProjectWithTruth passes a playable, sourced project", () => {
  const audit = auditStoryProjectWithTruth(makeStoryProject(), {
    generatedAt: 1760000000000,
  });

  assert.equal(audit.status, "passed");
  assert.equal(audit.score, 100);
  assert.equal(audit.summary.criticalCount, 0);
  assert.equal(audit.summary.warningCount, 0);
  assert.equal(audit.playabilityReport.status, "passed");
});

test("auditStoryProjectWithTruth turns story issues into repair proposals", () => {
  const project = makeStoryProject({
    aiProvenance: [],
    assets: [],
    script: {
      scenes: makeStoryProject().script.scenes.map((scene) => (
        scene.id === "ask_cat"
          ? { ...scene, text: "短。" }
          : scene
      )),
    },
  });

  const audit = auditStoryProjectWithTruth(project, {
    generatedAt: 1760000000000,
  });
  const proposal = createStoryRepairProposal(project, audit, {
    generatedAt: 1760000000000,
  });

  assert.equal(audit.status, "blocked");
  assert.ok(audit.issues.some((issue) => issue.dimensionId === "asset_rights"));
  assert.ok(audit.issues.some((issue) => issue.dimensionId === "asset_rights" && issue.severity === "critical"));
  assert.ok(audit.issues.some((issue) => issue.dimensionId === "creative_provenance"));
  assert.ok(proposal.actions.some((action) => action.stage === "asset_prompt_plan"));
  assert.ok(proposal.actions.some((action) => action.stage === "quality_audit"));
  assert.ok(proposal.blockingCount > 0);
});

test("createStoryProjectAgentWorkup and enrichment attach audit evidence", () => {
  const project = makeStoryProject();
  const workup = createStoryProjectAgentWorkup(project, {
    generatedAt: 1760000000000,
  });
  const enriched = enrichStoryProjectWithAgentWorkup(project, {
    generatedAt: 1760000000000,
  });

  assert.equal(workup.truthBundle.projectId, project.id);
  assert.equal(workup.audit.status, "passed");
  assert.equal(workup.repairProposal.status, "no_action_needed");
  assert.equal(enriched.agentWorkup.audit.status, "passed");
  assert.ok(enriched.qualityReports.some((report) => report.type === "story_agent_audit"));
});

test("fanwork publish target blocks missing rights acknowledgement", () => {
  const project = makeStoryProject({
    origin: {
      contentOrigin: "fanwork",
      ipId: "soda_planet_fan",
      ipName: "汽水星球",
      fanworkOf: "汽水星球",
      remixOf: null,
      rightsAcknowledgedAt: null,
    },
  });
  const audit = auditStoryProjectWithTruth(project, {
    target: "publish",
    generatedAt: 1760000000000,
  });

  assert.equal(audit.status, "blocked");
  assert.ok(audit.issues.some((issue) => (
    issue.dimensionId === "asset_rights" &&
    issue.category === "fanwork_rights_ack_missing" &&
    issue.severity === "critical"
  )));
});
