export const HARDWARE_STATUS_LABELS = {
  h5_only: "H5 内容",
  hardware_candidate: "硬件候选",
  hardware_ready: "硬件可下载",
};

export const GUGU_H5_SCHEMA_VERSION = "gugu_h5_pack_v1";

export const GUGU_H5_CAPABILITIES = {
  scene_graph: "多场景和跳转",
  branching: "用户选择分支",
  uploaded_assets: "用户上传素材",
  basic_audio: "基础音频",
  timed_events: "定时事件",
  variables: "变量和条件判断",
  animation: "动画效果",
  network_asset: "运行时远程素材",
  external_link: "外部链接",
};

export const MAX_H5_SCENES = 30;

export const CONTENT_ORIGIN_LABELS = {
  original: "原创",
  fanwork: "二创",
};

export const STORE_STATUS_LABELS = {
  not_applied: "未申请上架",
  submitted: "已提交上架",
  rights_review: "上架审核中",
  production_queued: "等待制作设备包",
  producing: "正在制作设备包",
  pack_review: "设备包复核中",
  listed: "商店已上架",
  rejected: "上架被拒",
  delisted: "已下架",
  frozen: "权利争议中",
};

export const HARDWARE_PACK_STATUS_LABELS = {
  draft: "设备包草稿",
  building: "制作中",
  reviewing: "复核中",
  ready: "待发布",
  available: "可下载到设备",
  paused: "暂停下载",
  deprecated: "已过期",
  removed: "已移除",
};

export const STORE_STATUS_FLOW = [
  "not_applied",
  "rights_review",
  "production_queued",
  "producing",
  "pack_review",
  "listed",
];

export const STORE_STATUS_ADVANCE = {
  rights_review: "production_queued",
  production_queued: "producing",
  producing: "pack_review",
  pack_review: "listed",
};

export const HARDWARE_PACK_STATUS_BY_STORE_STATUS = {
  production_queued: "draft",
  producing: "building",
  pack_review: "reviewing",
  listed: "available",
  frozen: "paused",
  delisted: "removed",
};

export const GUGU_ZONES = {
  healing: {
    id: "healing",
    name: "情绪陪伴区",
    shortName: "陪伴",
    description: "睡前、下雨、低电量时也能贴住心情的小剧场。",
  },
  workday: {
    id: "workday",
    name: "摸鱼上班区",
    shortName: "摸鱼",
    description: "把通勤、工位和下班倒计时变成可互动的电子吧唧。",
  },
  duo: {
    id: "duo",
    name: "同频搭子区",
    shortName: "同频",
    description: "适合双人共创、互相点亮和同步到两块徽章的作品。",
  },
  adventure: {
    id: "adventure",
    name: "像素冒险区",
    shortName: "冒险",
    description: "列车、星球、迷宫和小游戏式分支故事。",
  },
};

export const ROLE_PERSONAS = {
  rain_gugu: {
    id: "rain_gugu",
    name: "雨天咕咕",
    avatar: "☔",
    roleType: "official",
    tagline: "轻声陪你把今天过完。",
  },
  soda_gugu: {
    id: "soda_gugu",
    name: "汽水咕咕",
    avatar: "🥤",
    roleType: "official",
    tagline: "把无聊摇到冒泡。",
  },
  night_conductor: {
    id: "night_conductor",
    name: "零点列车长",
    avatar: "🚃",
    roleType: "official",
    tagline: "负责把犹豫检票进明天。",
  },
  office_sprite: {
    id: "office_sprite",
    name: "工位小闪",
    avatar: "💡",
    roleType: "official",
    tagline: "上班时低调发光，下班时大胆逃跑。",
  },
  starlight_mage_luna: {
    id: "starlight_mage_luna",
    name: "露娜",
    avatar: "🌙",
    roleType: "official",
    tagline: "星光魔法学院的夜巡生，擅长把心事折成星星。",
  },
  starlight_mage_noel: {
    id: "starlight_mage_noel",
    name: "诺艾",
    avatar: "⭐",
    roleType: "official",
    tagline: "总把咒语念反，却能误打误撞点亮全场。",
  },
  mecha_tide_ren: {
    id: "mecha_tide_ren",
    name: "莲",
    avatar: "🤖",
    roleType: "official",
    tagline: "海岸机甲驾驶员，冷静到连警报都会小声一点。",
  },
  mecha_tide_mika: {
    id: "mecha_tide_mika",
    name: "米卡",
    avatar: "🛠️",
    roleType: "official",
    tagline: "维修舱里的天才后勤，能把废零件拼成奇迹。",
  },
  cat_town_momo: {
    id: "cat_town_momo",
    name: "桃桃",
    avatar: "🐾",
    roleType: "official",
    tagline: "海盐猫耳町的甜点店看板娘，情报都藏在小鱼饼里。",
  },
  cat_town_shiro: {
    id: "cat_town_shiro",
    name: "白羽",
    avatar: "🐱",
    roleType: "official",
    tagline: "巡夜邮差，专门投递迟到的道歉和没说出口的喜欢。",
  },
  dragon_sleep_detective_aki: {
    id: "dragon_sleep_detective_aki",
    name: "秋也",
    avatar: "🕵️",
    roleType: "official",
    tagline: "龙眠侦探社社长，越困越能发现线索。",
  },
  dragon_sleep_rin: {
    id: "dragon_sleep_rin",
    name: "凛",
    avatar: "🐉",
    roleType: "official",
    tagline: "负责守住梦境入口的小龙，脾气比尾巴还直。",
  },
  pokemon_pikachu: {
    id: "pokemon_pikachu",
    name: "皮卡丘",
    avatar: "⚡",
    roleType: "external_reference",
    tagline: "电气系代表角色，适合活泼、陪伴和冒险开场。",
  },
  pokemon_eevee: {
    id: "pokemon_eevee",
    name: "伊布",
    avatar: "🦊",
    roleType: "external_reference",
    tagline: "有多种进化可能的伙伴，适合成长线和分支选择。",
  },
  one_piece_luffy: {
    id: "one_piece_luffy",
    name: "路飞",
    avatar: "🏴‍☠️",
    roleType: "external_reference",
    tagline: "草帽海贼团船长，适合热血、冒险和伙伴主题。",
  },
  one_piece_zoro: {
    id: "one_piece_zoro",
    name: "索隆",
    avatar: "🗡️",
    roleType: "external_reference",
    tagline: "剑士担当，适合修行、守护和迷路喜剧桥段。",
  },
  naruto_uzumaki: {
    id: "naruto_uzumaki",
    name: "漩涡鸣人",
    avatar: "🍥",
    roleType: "external_reference",
    tagline: "木叶忍者代表角色，适合成长、羁绊和不服输主题。",
  },
  naruto_sasuke: {
    id: "naruto_sasuke",
    name: "宇智波佐助",
    avatar: "🌀",
    roleType: "external_reference",
    tagline: "冷静的宿命型角色，适合对决、追寻和暗线选择。",
  },
  demon_slayer_tanjiro: {
    id: "demon_slayer_tanjiro",
    name: "灶门炭治郎",
    avatar: "🌊",
    roleType: "external_reference",
    tagline: "温柔坚定的斩鬼少年，适合守护、修行和亲情主题。",
  },
  demon_slayer_nezuko: {
    id: "demon_slayer_nezuko",
    name: "灶门祢豆子",
    avatar: "🎋",
    roleType: "external_reference",
    tagline: "沉默但强韧的妹妹角色，适合陪伴和保护桥段。",
  },
  demon_slayer_zenitsu: {
    id: "demon_slayer_zenitsu",
    name: "我妻善逸",
    avatar: "⚡",
    roleType: "external_reference",
    tagline: "胆怯但爆发力强的剑士，适合喜剧反差和瞬间高光。",
  },
  demon_slayer_inosuke: {
    id: "demon_slayer_inosuke",
    name: "嘴平伊之助",
    avatar: "🐗",
    roleType: "external_reference",
    tagline: "野性直接的战斗角色，适合冲突、竞争和成长桥段。",
  },
  demon_slayer_giyu: {
    id: "demon_slayer_giyu",
    name: "富冈义勇",
    avatar: "🌊",
    roleType: "external_reference",
    tagline: "水柱角色，适合沉默守护、规则判断和关键援手。",
  },
  demon_slayer_shinobu: {
    id: "demon_slayer_shinobu",
    name: "胡蝶忍",
    avatar: "🦋",
    roleType: "external_reference",
    tagline: "虫柱角色，适合药理、微笑压迫感和复仇暗线。",
  },
  demon_slayer_rengoku: {
    id: "demon_slayer_rengoku",
    name: "炼狱杏寿郎",
    avatar: "🔥",
    roleType: "external_reference",
    tagline: "炎柱角色，适合信念、守护和高情绪燃点。",
  },
  demon_slayer_mitsuri: {
    id: "demon_slayer_mitsuri",
    name: "甘露寺蜜璃",
    avatar: "💗",
    roleType: "external_reference",
    tagline: "恋柱角色，适合温柔力量、保护和情绪鼓励。",
  },
  demon_slayer_tengen: {
    id: "demon_slayer_tengen",
    name: "宇髄天元",
    avatar: "💎",
    roleType: "external_reference",
    tagline: "音柱角色，适合潜入、华丽行动和团队作战。",
  },
  demon_slayer_muichiro: {
    id: "demon_slayer_muichiro",
    name: "时透无一郎",
    avatar: "🌫️",
    roleType: "external_reference",
    tagline: "霞柱角色，适合记忆、天才感和安静高光。",
  },
  demon_slayer_obanai: {
    id: "demon_slayer_obanai",
    name: "伊黑小芭内",
    avatar: "🐍",
    roleType: "external_reference",
    tagline: "蛇柱角色，适合严厉判断、守护和复杂情感线。",
  },
  demon_slayer_sanemi: {
    id: "demon_slayer_sanemi",
    name: "不死川实弥",
    avatar: "🍃",
    roleType: "external_reference",
    tagline: "风柱角色，适合冲突、兄弟线和强硬守护。",
  },
  demon_slayer_gyomei: {
    id: "demon_slayer_gyomei",
    name: "悲鸣屿行冥",
    avatar: "📿",
    roleType: "external_reference",
    tagline: "岩柱角色，适合沉稳压场、祈愿和终局战斗。",
  },
  demon_slayer_kanao: {
    id: "demon_slayer_kanao",
    name: "栗花落香奈乎",
    avatar: "🪙",
    roleType: "external_reference",
    tagline: "沉静剑士角色，适合自我选择、训练和温柔成长。",
  },
  demon_slayer_genya: {
    id: "demon_slayer_genya",
    name: "不死川玄弥",
    avatar: "🔫",
    roleType: "external_reference",
    tagline: "特殊战斗方式的队员，适合兄弟关系、执念和逆境成长。",
  },
  demon_slayer_tamayo: {
    id: "demon_slayer_tamayo",
    name: "珠世",
    avatar: "🧪",
    roleType: "external_reference",
    tagline: "医者型角色，适合药理、情报和与鬼相关的复杂立场。",
  },
  demon_slayer_yushiro: {
    id: "demon_slayer_yushiro",
    name: "愈史郎",
    avatar: "👁️",
    roleType: "external_reference",
    tagline: "辅助与视觉能力角色，适合侦察、吐槽和守护。",
  },
  demon_slayer_muzan: {
    id: "demon_slayer_muzan",
    name: "鬼舞辻无惨",
    avatar: "🩸",
    roleType: "external_reference",
    tagline: "核心反派角色，适合压迫感、追踪和终局风险。",
  },
  demon_slayer_akaza: {
    id: "demon_slayer_akaza",
    name: "猗窝座",
    avatar: "🥊",
    roleType: "external_reference",
    tagline: "上弦之鬼角色，适合强者对决、执念和战斗哲学。",
  },
  demon_slayer_doma: {
    id: "demon_slayer_doma",
    name: "童磨",
    avatar: "❄️",
    roleType: "external_reference",
    tagline: "上弦之鬼角色，适合危险微笑、教团暗线和心理压迫。",
  },
  demon_slayer_kokushibo: {
    id: "demon_slayer_kokushibo",
    name: "黑死牟",
    avatar: "🌙",
    roleType: "external_reference",
    tagline: "上弦之鬼角色，适合宿命、剑术压迫和终局对决。",
  },
  demon_slayer_rui: {
    id: "demon_slayer_rui",
    name: "累",
    avatar: "🕸️",
    roleType: "external_reference",
    tagline: "下弦之鬼角色，适合家庭执念、蛛丝战斗和早期高压事件。",
  },
  jujutsu_yuji: {
    id: "jujutsu_yuji",
    name: "虎杖悠仁",
    avatar: "👊",
    roleType: "external_reference",
    tagline: "咒术高专学生，适合热血、责任和战斗选择。",
  },
  jujutsu_gojo: {
    id: "jujutsu_gojo",
    name: "五条悟",
    avatar: "🕶️",
    roleType: "external_reference",
    tagline: "人气咒术师角色，适合强者登场和轻松反差。",
  },
  attack_titan_eren: {
    id: "attack_titan_eren",
    name: "艾伦·耶格尔",
    avatar: "🕊️",
    roleType: "external_reference",
    tagline: "围墙内外命运线代表，适合抉择、自由和反转剧情。",
  },
  attack_titan_mikasa: {
    id: "attack_titan_mikasa",
    name: "三笠·阿克曼",
    avatar: "🧣",
    roleType: "external_reference",
    tagline: "冷静强大的守护者，适合保护、行动和高光战斗。",
  },
  dragon_ball_goku: {
    id: "dragon_ball_goku",
    name: "孙悟空",
    avatar: "🐉",
    roleType: "external_reference",
    tagline: "经典热血战斗角色，适合训练、突破和友情对战。",
  },
  dragon_ball_vegeta: {
    id: "dragon_ball_vegeta",
    name: "贝吉塔",
    avatar: "🔥",
    roleType: "external_reference",
    tagline: "骄傲的战士角色，适合竞争、修炼和反差日常。",
  },
  mha_deku: {
    id: "mha_deku",
    name: "绿谷出久",
    avatar: "💚",
    roleType: "external_reference",
    tagline: "少年英雄成长线代表，适合鼓励、训练和救援主题。",
  },
  mha_bakugo: {
    id: "mha_bakugo",
    name: "爆豪胜己",
    avatar: "💥",
    roleType: "external_reference",
    tagline: "爆发力十足的竞争型角色，适合冲突和燃点互动。",
  },
};

export const GUGU_IP_POOL = {
  rain_gugu_universe: {
    id: "rain_gugu_universe",
    name: "雨天咕咕宇宙",
    type: "platform_original",
    governanceStatus: "active",
    supportedOrigins: ["original", "fanwork"],
    defaultZoneId: "healing",
    personaIds: ["rain_gugu"],
    zoneStatus: "open",
    communityStats: {
      works: 18,
      creators: 5,
      heatScore: 22800,
      hardwarePacks: 2,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 4,
    },
    description: "平台原创陪伴企划，适合睡前、雨天和低电量情绪。",
  },
  midnight_train_project: {
    id: "midnight_train_project",
    name: "零点列车原创企划",
    type: "platform_original",
    governanceStatus: "active",
    supportedOrigins: ["original", "fanwork"],
    defaultZoneId: "adventure",
    personaIds: ["night_conductor"],
    zoneStatus: "not_open",
    communityStats: {
      works: 2,
      creators: 1,
      heatScore: 1800,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 1,
    },
    description: "夜间列车、选择和重新开始主题的原创企划。",
  },
  workday_flash_project: {
    id: "workday_flash_project",
    name: "工位小闪原创企划",
    type: "platform_original",
    governanceStatus: "active",
    supportedOrigins: ["original"],
    defaultZoneId: "workday",
    personaIds: ["office_sprite"],
    zoneStatus: "not_open",
    communityStats: {
      works: 6,
      creators: 3,
      heatScore: 7200,
      hardwarePacks: 1,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 3,
    },
    description: "通勤、工位、下班倒计时和轻松摸鱼日常。",
  },
  soda_planet_fan: {
    id: "soda_planet_fan",
    name: "汽水星球原创企划",
    type: "community_fan_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "duo",
    personaIds: ["soda_gugu"],
    zoneStatus: "not_open",
    communityStats: {
      works: 1,
      creators: 1,
      heatScore: 2100,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 1,
    },
    description: "社区申请加入 IP 池的清爽日常世界观，暂未开专区。",
  },
  midnight_train_fan: {
    id: "midnight_train_fan",
    name: "零点列车同人支线",
    type: "community_fan_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "adventure",
    personaIds: ["night_conductor"],
    zoneStatus: "not_open",
    communityStats: {
      works: 1,
      creators: 1,
      heatScore: 900,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 0,
    },
    description: "基于零点列车世界观的用户二创支线池。",
  },
  anime_starlight_academy: {
    id: "anime_starlight_academy",
    name: "星光魔法学院",
    type: "local_anime_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "healing",
    personaIds: ["starlight_mage_luna", "starlight_mage_noel"],
    zoneStatus: "not_open",
    communityStats: {
      works: 4,
      creators: 2,
      heatScore: 6400,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 2,
    },
    description: "本地动漫 IP 池：魔法校园、夜巡社团和星光契约主题。",
  },
  anime_mecha_tide: {
    id: "anime_mecha_tide",
    name: "机甲潮汐线",
    type: "local_anime_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "adventure",
    personaIds: ["mecha_tide_ren", "mecha_tide_mika"],
    zoneStatus: "not_open",
    communityStats: {
      works: 3,
      creators: 2,
      heatScore: 5800,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 2,
    },
    description: "本地动漫 IP 池：海岸防线、轻机甲搭档和热血出击主题。",
  },
  anime_cat_ear_town: {
    id: "anime_cat_ear_town",
    name: "海盐猫耳町",
    type: "local_anime_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "duo",
    personaIds: ["cat_town_momo", "cat_town_shiro"],
    zoneStatus: "not_open",
    communityStats: {
      works: 5,
      creators: 3,
      heatScore: 8600,
      hardwarePacks: 1,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 3,
    },
    description: "本地动漫 IP 池：海边小镇、猫耳居民和轻喜剧日常主题。",
  },
  anime_dragon_sleep_agency: {
    id: "anime_dragon_sleep_agency",
    name: "龙眠侦探社",
    type: "local_anime_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "adventure",
    personaIds: ["dragon_sleep_detective_aki", "dragon_sleep_rin"],
    zoneStatus: "not_open",
    communityStats: {
      works: 2,
      creators: 2,
      heatScore: 3900,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 1,
    },
    description: "本地动漫 IP 池：梦境推理、迷你龙搭档和单元剧案件主题。",
  },
  mainstream_pokemon: {
    id: "mainstream_pokemon",
    name: "Pokémon / 宝可梦",
    type: "mainstream_external_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "adventure",
    personaIds: ["pokemon_pikachu", "pokemon_eevee"],
    zoneStatus: "not_open",
    communityStats: {
      works: 0,
      creators: 0,
      heatScore: 9800,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 0,
    },
    description: "主流外部 IP：游戏、动画、卡牌和角色商品长期跨媒介运营。",
    rightsNotice: "仅用于二创归属和审核演示，不代表官方授权；上架商店或硬件分发需单独权利证明。",
  },
  mainstream_one_piece: {
    id: "mainstream_one_piece",
    name: "One Piece / 海贼王",
    type: "mainstream_external_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "adventure",
    personaIds: ["one_piece_luffy", "one_piece_zoro"],
    zoneStatus: "not_open",
    communityStats: {
      works: 0,
      creators: 0,
      heatScore: 9600,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 0,
    },
    description: "主流外部 IP：长篇少年漫画和动画代表，冒险、伙伴和航海主题鲜明。",
    rightsNotice: "仅用于二创归属和审核演示，不代表官方授权；上架商店或硬件分发需单独权利证明。",
  },
  mainstream_naruto: {
    id: "mainstream_naruto",
    name: "Naruto / 火影忍者",
    type: "mainstream_external_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "adventure",
    personaIds: ["naruto_uzumaki", "naruto_sasuke"],
    zoneStatus: "not_open",
    communityStats: {
      works: 0,
      creators: 0,
      heatScore: 9400,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 0,
    },
    description: "主流外部 IP：忍者、成长、师徒和羁绊主题的全球人气系列。",
    rightsNotice: "仅用于二创归属和审核演示，不代表官方授权；上架商店或硬件分发需单独权利证明。",
  },
  mainstream_demon_slayer: {
    id: "mainstream_demon_slayer",
    name: "Demon Slayer / 鬼灭之刃",
    type: "mainstream_external_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "healing",
    personaIds: [
      "demon_slayer_tanjiro",
      "demon_slayer_nezuko",
      "demon_slayer_zenitsu",
      "demon_slayer_inosuke",
      "demon_slayer_giyu",
      "demon_slayer_shinobu",
      "demon_slayer_rengoku",
      "demon_slayer_mitsuri",
      "demon_slayer_tengen",
      "demon_slayer_muichiro",
      "demon_slayer_obanai",
      "demon_slayer_sanemi",
      "demon_slayer_gyomei",
      "demon_slayer_kanao",
      "demon_slayer_genya",
      "demon_slayer_tamayo",
      "demon_slayer_yushiro",
      "demon_slayer_muzan",
      "demon_slayer_akaza",
      "demon_slayer_doma",
      "demon_slayer_kokushibo",
      "demon_slayer_rui",
    ],
    zoneStatus: "not_open",
    communityStats: {
      works: 0,
      creators: 0,
      heatScore: 9300,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 0,
    },
    description: "主流外部 IP：斩鬼、亲情、修行和视觉化战斗风格突出。",
    rightsNotice: "仅用于二创归属和审核演示，不代表官方授权；上架商店或硬件分发需单独权利证明。",
  },
  mainstream_jujutsu_kaisen: {
    id: "mainstream_jujutsu_kaisen",
    name: "Jujutsu Kaisen / 咒术回战",
    type: "mainstream_external_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "adventure",
    personaIds: ["jujutsu_yuji", "jujutsu_gojo"],
    zoneStatus: "not_open",
    communityStats: {
      works: 0,
      creators: 0,
      heatScore: 9500,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 0,
    },
    description: "主流外部 IP：现代咒术、校园战斗和高话题度角色群像。",
    rightsNotice: "仅用于二创归属和审核演示，不代表官方授权；上架商店或硬件分发需单独权利证明。",
  },
  mainstream_attack_on_titan: {
    id: "mainstream_attack_on_titan",
    name: "Attack on Titan / 进击的巨人",
    type: "mainstream_external_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "adventure",
    personaIds: ["attack_titan_eren", "attack_titan_mikasa"],
    zoneStatus: "not_open",
    communityStats: {
      works: 0,
      creators: 0,
      heatScore: 9200,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 0,
    },
    description: "主流外部 IP：末世墙内外、自由抉择和群像冲突主题。",
    rightsNotice: "仅用于二创归属和审核演示，不代表官方授权；上架商店或硬件分发需单独权利证明。",
  },
  mainstream_dragon_ball: {
    id: "mainstream_dragon_ball",
    name: "Dragon Ball / 龙珠",
    type: "mainstream_external_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "adventure",
    personaIds: ["dragon_ball_goku", "dragon_ball_vegeta"],
    zoneStatus: "not_open",
    communityStats: {
      works: 0,
      creators: 0,
      heatScore: 9700,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 0,
    },
    description: "主流外部 IP：经典热血战斗、修炼升级和跨世代角色认知。",
    rightsNotice: "仅用于二创归属和审核演示，不代表官方授权；上架商店或硬件分发需单独权利证明。",
  },
  mainstream_my_hero_academia: {
    id: "mainstream_my_hero_academia",
    name: "My Hero Academia / 我的英雄学院",
    type: "mainstream_external_ip",
    governanceStatus: "active",
    supportedOrigins: ["fanwork"],
    defaultZoneId: "duo",
    personaIds: ["mha_deku", "mha_bakugo"],
    zoneStatus: "not_open",
    communityStats: {
      works: 0,
      creators: 0,
      heatScore: 9000,
      hardwarePacks: 0,
      recentViolationRate: 0,
      foundingInviteAcceptedCount: 0,
    },
    description: "主流外部 IP：英雄学校、个性能力、训练和救援主题。",
    rightsNotice: "仅用于二创归属和审核演示，不代表官方授权；上架商店或硬件分发需单独权利证明。",
  },
};

export const ZONE_APPLICATION_THRESHOLDS = {
  works: 3,
  creators: 2,
  heatScore: 5000,
  maxRecentViolationRate: 0.05,
  foundingInviteAcceptedCount: 2,
};

export const TEMPLATE_PRESETS = {
  healing: {
    background: "linear-gradient(160deg, #0f172a 0%, #0e7490 58%, #a7f3d0 135%)",
    character: "🌙",
    tag: "治愈",
    personaId: "rain_gugu",
    zoneId: "healing",
  },
  adventure: {
    background: "linear-gradient(160deg, #1f2937 0%, #b45309 62%, #fde68a 145%)",
    character: "🧭",
    tag: "冒险",
    personaId: "night_conductor",
    zoneId: "adventure",
  },
  energy: {
    background: "linear-gradient(160deg, #ecfeff 0%, #22c55e 52%, #fb7185 138%)",
    character: "⚡",
    tag: "元气",
    personaId: "soda_gugu",
    zoneId: "duo",
  },
};

export function hardwareStatusLabel(status) {
  return HARDWARE_STATUS_LABELS[status] || HARDWARE_STATUS_LABELS.h5_only;
}

export function contentOriginLabel(originType) {
  return CONTENT_ORIGIN_LABELS[originType] || CONTENT_ORIGIN_LABELS.original;
}

export function storeStatusLabel(status) {
  return STORE_STATUS_LABELS[status] || STORE_STATUS_LABELS.not_applied;
}

export function hardwarePackStatusLabel(status) {
  return HARDWARE_PACK_STATUS_LABELS[status] || "";
}

export function getZone(zoneId) {
  return GUGU_ZONES[zoneId] || GUGU_ZONES.healing;
}

export function getPersona(personaId) {
  return ROLE_PERSONAS[personaId] || ROLE_PERSONAS.rain_gugu;
}

export function getIpEntry(ipId) {
  return GUGU_IP_POOL[ipId] || null;
}

export function getIpEntriesForOrigin(originType = "original") {
  return Object.values(GUGU_IP_POOL).filter((entry) => entry.supportedOrigins.includes(originType));
}

export function getDefaultIpForOrigin(originType = "original") {
  if (originType === "fanwork") return null;
  return getIpEntriesForOrigin(originType)[0] || null;
}

export function findIpEntryByName(ipName) {
  if (!ipName) return null;
  return Object.values(GUGU_IP_POOL).find((entry) => entry.name === ipName) || null;
}

export function getPersonasForIp(ipId) {
  const entry = getIpEntry(ipId);
  if (!entry) return [getPersona("rain_gugu")];
  const personaIds = entry.personaIds || [];
  return personaIds.map(getPersona);
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

function compactText(value, fallback) {
  return String(value || fallback || "")
    .replace(/\s+/g, " ")
    .trim();
}

const PROMPT_META_PATTERNS = [
  /完整文字游戏/,
  /提示词/,
  /玩家目标/,
  /素材要求/,
  /限制条件/,
  /归属\/?IP/i,
  /玩法模板/,
  /关键角色/,
  /关键选择/,
  /结尾/,
  /每场/,
  /背景/,
  /对白/,
  /选项/,
  /选项跳转/,
  /情绪标签/,
  /场景(?:到|数)?\d+个/,
  /设计\d*场/,
  /\d+个结局/,
];

const STORY_KEYWORD_RULES = [
  [/Demon\s*Slayer|鬼灭之刃|鬼灭/i, "鬼灭"],
  [/宝可梦|Pokemon|Pokémon/i, "宝可梦"],
  [/雨夜/, "雨夜"],
  [/便利店/, "便利店"],
  [/预言.*猫|猫.*预言/, "预言猫"],
  [/穿越/, "穿越"],
  [/冒险/, "冒险"],
  [/悬疑|调查|线索|真相/, "悬疑"],
  [/反转/, "反转"],
  [/治愈|陪伴|睡前/, "治愈"],
  [/反应|挑战|限时|快节奏/, "挑战"],
  [/茶馆/, "茶馆"],
  [/赛博|霓虹/, "赛博"],
  [/列车|车站/, "列车"],
  [/校园|大学生|学校/, "校园"],
];

function isPromptMetaPhrase(text) {
  return !text || PROMPT_META_PATTERNS.some((pattern) => pattern.test(text));
}

function storyKeywordCandidates(prompt) {
  const text = compactText(prompt, "");
  const keywords = [];
  const add = (word) => {
    const clean = String(word || "")
      .replace(/[“”「」《》"'：:；;，。！？,.!?、/|]/g, "")
      .trim();
    if (!clean || clean.length > 8 || isPromptMetaPhrase(clean)) return;
    if (!keywords.includes(clean)) keywords.push(clean);
  };

  STORY_KEYWORD_RULES.forEach(([pattern, tag]) => {
    if (pattern.test(text)) add(tag);
  });

  text
    .replace(/完整文字游戏向文字游戏[:：]?/g, "")
    .replace(/(?:玩家目标|素材要求|限制条件|归属\/?IP|玩法模板)[:：]?[^；;。！？]*[；;。！？]?/gi, " ")
    .split(/[，。！？,.!?\s、/|；;]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && word.length <= 8 && !isPromptMetaPhrase(word))
    .slice(0, 8)
    .forEach(add);

  return keywords;
}

function promptTitle(prompt, fallback = "新咕咕剧场") {
  const text = compactText(prompt, fallback);
  const explicit = text.match(/(?:标题|作品名|名字)[：:]\s*([^，。；;,.!?！？\n]{2,14})/)?.[1];
  if (explicit && !isPromptMetaPhrase(explicit)) return explicit.slice(0, 10);

  const quoted = text.match(/[“「《](.*?)[”」》]/)?.[1];
  const candidates = [
    quoted,
    ...text
      .replace(/完整文字游戏向文字游戏[:：]?/g, "")
      .split(/[；;。！？!?]/)
      .map((part) => part.trim())
      .filter((part) => part && !isPromptMetaPhrase(part)),
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate || "")
      .replace(/完整文字游戏|文字游戏|主角|玩家|故事|一个|在|进入|来到|穿越到|穿越|世界|和主角们一起|一起|经历|地点|有明确视觉记忆点的/g, "")
      .replace(/[，。！？,.!?\s“”「」《》"'：:；;、/|]/g, "")
      .replace(/的$/g, "")
      .trim();
    if (normalized.length >= 2 && !isPromptMetaPhrase(normalized)) return normalized.slice(0, 10);
  }

  const keywordTitle = storyKeywordCandidates(text).slice(0, 3).join("");
  return keywordTitle.slice(0, 10) || fallback;
}

function promptKeywords(prompt, preset, zone) {
  return Array.from(new Set([
    ...storyKeywordCandidates(prompt),
    preset.tag,
    zone.shortName,
  ])).slice(0, 5);
}

function templateMood(template) {
  return {
    healing: { genre: "陪伴小剧场", mood: "温柔、安心、轻互动", goal: "让用户通过当前分身完成一段可点击的陪伴瞬间" },
    adventure: { genre: "选择冒险", mood: "探索、转折、轻悬念", goal: "让用户通过当前分身发现一个小小秘密" },
    energy: { genre: "反应挑战", mood: "明亮、元气、短节奏", goal: "让用户通过当前分身完成一次情绪充电" },
  }[template] || { genre: "互动短剧", mood: "清晰、轻量、适合手机", goal: "把描述变成可由分身参与的短分支故事" };
}

function inferStoryPlan(clean, template, persona, ipName) {
  const text = compactText(clean, "");
  const parts = text.split(/[，。！？,.!?、]+/).map((part) => part.trim()).filter(Boolean);
  const quoted = text.match(/[“「《](.*?)[”」》]/)?.[1];
  const placePrefixMatch = text.match(/^([^，。！？,.!?]{2,18}?)(?:里|中|内)(?:，|,|。|$)/);
  const travelMatch = text.match(/(?:穿越到|来到|进入)(.+?)(?:和|与|跟|，|。|！|？|,|\.|$)/);
  const settingMatch = text.match(/(?:在|到|进入|穿越到|来到)([^，。！？,.!?和与跟]{2,18})(?:里|中|世界|宇宙|学院|便利店|车站|街|城|村|店)?/);
  const togetherMatch = text.match(/(?:和|与|跟)(.+?)(?:一起|共同)(.+?)(?:的故事|$|，|。|！|？)/);
  const meetMatch = text.match(/(?:遇到|遇见|碰到)([^，。！？,.!?]{2,18})/);
  const goalMatch = text.match(/(?:拯救|寻找|调查|守护|逃离|修复|预言|冒险|比赛|告白|回家|阻止|解开)([^，。！？,.!?的故事]{0,18})/);
  const hasTravel = /穿越|来到|进入/.test(text);
  const hasMystery = /预言|秘密|谜|调查|真相|失踪|异常/.test(text);
  const hasBattle = /战斗|忍者|鬼|怪|拯救|守护|逃离|冒险/.test(text);
  const hasCompanion = /陪|朋友|主角们|伙伴|一起|相遇/.test(text);
  const keywordSetting = /便利店/.test(text)
    ? (/雨夜/.test(text) ? "雨夜便利店" : "便利店")
    : /宝可梦中心|Pokemon Center|Pokémon Center/i.test(text)
      ? "宝可梦中心"
      : /车站|列车|站台|月台/.test(text)
        ? (/夜|末班/.test(text) ? "末班车站" : "车站")
        : /学校|学院|教室/.test(text)
          ? "学校教室"
          : /医院|诊所/.test(text)
            ? "夜间诊所"
            : "";
  const setting = quoted || placePrefixMatch?.[1] || travelMatch?.[1] || settingMatch?.[1] || keywordSetting || ipName || (hasTravel ? "陌生世界" : "故事现场");
  const ally = togetherMatch?.[1] || meetMatch?.[1] || (hasCompanion ? "同行伙伴" : "关键角色");
  const togetherGoal = togetherMatch ? `和${togetherMatch[1]}一起${togetherMatch[2]}` : "";
  const objective = togetherGoal || goalMatch?.[0] || (hasMystery ? "查清预言背后的真相" : hasBattle ? "完成一次危险但重要的冒险" : "把眼前的异常处理好");
  const source = meetMatch?.[1] || togetherMatch?.[1] || parts[0] || text;
  const incitingIncident = parts[1] || (hasTravel
    ? `${persona.name}突然来到${setting}，必须先确认自己能相信谁。`
    : `${persona.name}在${setting}发现一件不该出现的小事。`);
  const dilemma = hasBattle
    ? "立刻出手会暴露身份，先观察又可能错过救人的时机。"
    : hasMystery
      ? "相信线索会改变明天，不相信线索又会让异常继续扩大。"
      : "直接前进能更快抵达结局，停下来倾听也许会得到更好的答案。";
  const stakes = hasBattle
    ? "如果判断错误，伙伴会受伤，分身也会失去社区里的信任。"
    : hasMystery
      ? "如果预兆成真，故事现场会在明天变成另一副样子。"
      : "如果处理不好，这个故事会只剩一个没被完成的愿望。";
  const twist = hasTravel
    ? `${persona.name}不是旁观者，而是这个世界临时承认的分身身份。`
    : `${ally}知道一部分真相，但只会在正确选择后开口。`;

  return {
    template,
    setting,
    ally,
    objective,
    source,
    incitingIncident,
    dilemma,
    stakes,
    twist,
    tags: [
      hasTravel ? "穿越" : null,
      hasMystery ? "悬疑" : null,
      hasBattle ? "冒险" : null,
      hasCompanion ? "伙伴" : null,
      template === "healing" ? "陪伴" : null,
    ].filter(Boolean),
  };
}

function makeCreationBrief(clean, title, template, zone, originType, ipName, story) {
  const mood = templateMood(template);
  return {
    input: clean,
    title,
    logline: `${story.setting}里，${story.ally}把“${personaSafeObjective(story.objective)}”这件事推到当前分身面前；用户要通过当前分身做出选择。`,
    genre: mood.genre,
    playerGoal: mood.goal,
    tone: mood.mood,
    targetLength: "5-8 个场景，1-3 分钟可完成",
    audience: "喜欢轻量文字互动和电子吧唧短剧的用户",
    publishingScope: "先发布 H5，商店上架和硬件化单独审核",
    originNote: originType === "fanwork"
      ? `基于「${ipName || "所选 IP"}」的二创草稿，发布前保留来源和权利提示。`
      : `归属「${zone.name}」的原创企划草稿，可开放 Remix。`,
  };
}

function personaSafeObjective(objective) {
  return objective || "一个必须处理的事件";
}

function sameNarrativeName(left = "", right = "") {
  return compactText(left, "")
    .replace(/[「」《》“”\s]/g, "")
    .toLowerCase() === compactText(right, "")
      .replace(/[「」《》“”\s]/g, "")
      .toLowerCase();
}

function isConcreteStoryCharacterName(name = "") {
  const value = compactText(name, "");
  if (!value) return false;
  return !new Set([
    "玩家",
    "用户",
    "主角",
    "主角们",
    "当前分身",
    "分身",
    "他们",
    "她们",
    "他",
    "她",
    "关键角色",
    "关键同伴",
    "同行伙伴",
    "线索提供者",
  ]).has(value);
}

function concreteAllyName(story = {}) {
  const setting = compactText(story.setting, "");
  const objective = compactText(story.objective, "");
  if (/鬼灭|Demon Slayer|藤花|鬼杀|斩鬼/.test(`${setting}${objective}`)) return "藤花信使";
  if (/便利店|店/.test(setting)) return "夜班店员";
  if (/车站|列车|站台|月台/.test(setting)) return "末班列车员";
  if (/学校|学院|教室/.test(setting)) return "值日同学";
  if (/医院|诊所|护士/.test(setting)) return "值班护士";
  if (/宝可梦|Pokemon|Pokémon|中心/.test(`${setting}${objective}`)) return "值班护士";
  if (/预言|秘密|谜|调查|真相|失踪|异常|线索/.test(objective)) return "档案管理员";
  if (/拯救|守护|战斗|逃离|冒险/.test(objective)) return "任务委托人";
  return "陌生来信人";
}

function avoidPersonaAsAlly(story, persona) {
  if (!isConcreteStoryCharacterName(story.ally)) {
    const ally = concreteAllyName(story);
    return {
      ...story,
      ally,
      twist: `${ally}知道一部分真相，但只会在正确选择后开口。`,
    };
  }
  if (!sameNarrativeName(story.ally, persona.name)) return story;
  const objectiveTarget = compactText(story.objective, "").match(/(?:找回|寻找|守护|拯救)([^，。！？,.!?]{2,12})/)?.[1];
  const ally = objectiveTarget && isConcreteStoryCharacterName(objectiveTarget) && !sameNarrativeName(objectiveTarget, persona.name)
    ? objectiveTarget
    : concreteAllyName(story);
  return {
    ...story,
    ally,
    twist: `真正需要回应的不是${persona.name}自己，而是${ally}带来的事件。`,
  };
}

function makeWorldPlan(clean, template, zone, story) {
  const mood = templateMood(template);
  return {
    setting: story.setting,
    rule: "用户以当前分身参与故事，每次点击都会把故事推向更靠近、转向或收束的节点。",
    conflict: `${story.objective}。${story.dilemma}`,
    stakes: story.stakes,
    twist: story.twist,
    visualMood: `${zone.shortName}气质，${mood.mood}`,
  };
}

function makePersonaUsage(persona, originType, ipName) {
  return {
    role: "community_avatar",
    label: "社区分身 / 故事主角",
    summary: `「${persona.name}」会作为这个故事的主角，也可以成为你在社区、好友动态和设备里的当前形象。`,
    communityUse: "评论、好友动态、共创邀请和个人展示会优先使用这个分身形象。",
    deviceUse: "当设备选择这个故事时，你在社区内会以这个分身出现和活动。",
    originScope: originType === "fanwork" ? `分身归属所选 IP：${ipName || "未填写 IP"}。` : "分身归属原创企划，可随作品进入社区身份体系。",
  };
}

function makeCharacterCards(clean, persona, preset, story) {
  const cards = [
    {
      id: persona.id,
      name: persona.name,
      role: "社区分身 / 主角",
      motivation: persona.tagline || "作为用户在社区和故事里的当前分身完成这次文字游戏。",
      voice: persona.roleType === "creator_original" ? "跟随用户设定的身份和口吻" : "沿用项目生态圈分身的性格和口吻",
      avatar: persona.avatar || preset.character,
      visualPrompt: `${persona.name}，${persona.tagline || "社区分身和文字游戏主角"}，电子吧唧贴纸风，小屏清晰`,
    },
    {
      id: "story_npc",
      name: story.ally,
      role: "配角",
      motivation: `${story.ally}掌握事件的一部分真相，会推动当前分身做出选择。`,
      voice: "贴合用户输入的题材，不使用平台分身口吻",
      visualPrompt: `${story.ally}，来自${clean}，文字游戏立绘，小屏清晰`,
    },
  ];
  return cards.filter((character) => isConcreteStoryCharacterName(character.name));
}

function makeAssetPlan(clean, title, preset, persona, template, story) {
  const mood = templateMood(template);
  return [
    {
      id: "cover",
      type: "cover",
      name: `${title}封面`,
      usage: "内容流封面和作品预览",
      source: "ai_prompt",
      prompt: `${story.setting}，${story.ally}，${story.objective}，${mood.genre}封面，电子吧唧 H5，主体清晰，手机竖屏构图`,
      status: "draft_prompt",
    },
    {
      id: "bg_start",
      type: "background",
      name: `${story.setting}背景`,
      usage: "入口场景和主要分支背景",
      source: "template",
      prompt: `保留当前模板色彩：${preset.background}`,
      status: "usable_h5",
    },
    {
      id: "role_main",
      type: "character",
      name: persona.name,
      usage: "引导角色头像或贴纸",
      source: "platform_persona",
      prompt: `${persona.name}，${persona.avatar || preset.character}，${persona.tagline || "社区分身和故事主角"}`,
      status: "usable_h5",
    },
    {
      id: "sfx_choice",
      type: "audio",
      name: "轻点击反馈",
      usage: "选择按钮反馈",
      source: "platform_library",
      prompt: "短促、柔和、不打断阅读的点击音效",
      status: "optional",
    },
  ];
}

function sceneLocationFromStory(story, scene, index) {
  const setting = compactText(story.setting, "故事现场");
  const title = compactText(scene.title, "");
  if (/入口|开场|倒计时/.test(title)) return `${setting}入口`;
  if (/观察|线索|第一拍/.test(title)) return `${setting}内侧线索点`;
  if (/靠近|倾听|回应/.test(title)) return `${setting}对话角落`;
  if (/分岔|选择|第二拍/.test(title)) return `${setting}关键分岔处`;
  if (/结局|尾声|成功|重试|稳住/.test(title)) return `${setting}出口`;
  return `${setting}第${index + 1}处`;
}

function shortSceneTitle(scene, story, index) {
  const title = compactText(scene.title, "");
  if (/入口|开场|倒计时/.test(title)) return "入口";
  if (/观察|线索|第一拍/.test(title)) return "线索";
  if (/靠近|倾听|回应/.test(title)) return "对话";
  if (/分岔|选择|第二拍/.test(title)) return "选择";
  if (/真相/.test(title)) return "真相";
  if (/解决|成功/.test(title)) return "解决";
  if (/开放|安静/.test(title)) return "余韵";
  if (/陪伴|温柔/.test(title)) return "回应";
  if (/重试/.test(title)) return "重试";
  if (/稳住/.test(title)) return "稳住";
  const compact = title.replace(story.setting || "", "").replace(/[的之]/g, "");
  return compact.slice(0, 6) || `场景${index + 1}`;
}

function sceneTimeFromStory(story, scene, index) {
  const source = `${story.setting || ""}${scene.title || ""}${scene.text || ""}`;
  if (/雨夜|夜|月|晚|凌晨/.test(source)) return index < 2 ? "雨夜 22:40" : index < 4 ? "雨夜 23:05" : "深夜 23:30";
  if (/黄昏|傍晚/.test(source)) return index < 2 ? "黄昏 18:10" : "入夜 19:00";
  if (/清晨|早晨/.test(source)) return index < 2 ? "清晨 06:30" : "上午 08:00";
  return index < 2 ? "当日 下午" : index < 4 ? "当日 傍晚" : "当日 夜晚";
}

function sceneBeatLabel(scene, index) {
  if (/start|入口|开场|倒计时/.test(`${scene.id || ""}${scene.title || ""}`)) return "事件引爆";
  if (/investigate|观察|线索|第一拍/.test(`${scene.id || ""}${scene.title || ""}`)) return "收集线索";
  if (/approach|listen|comfort|靠近|倾听|回应/.test(`${scene.id || ""}${scene.title || ""}`)) return "角色交锋";
  if (/decision|分岔|选择/.test(`${scene.id || ""}${scene.title || ""}`)) return "关键选择";
  if (/_end|结局|尾声|成功|重试|稳住/.test(`${scene.id || ""}${scene.title || ""}`)) return "结局收束";
  return `推进段落 ${index + 1}`;
}

function sceneEmotionLabel(scene, story) {
  const text = `${scene.title || ""}${scene.text || ""}${story.objective || ""}`;
  if (/重试|失败|犹豫/.test(text)) return "紧张、短促";
  if (/结局|尾声|陪伴|温柔|安静/.test(text)) return "温柔、收束";
  if (/分岔|选择|真相|隐藏/.test(text)) return "悬疑、压迫";
  if (/挑战|节奏|倒计时/.test(text)) return "明快、急促";
  return story.template === "healing" ? "安静、靠近" : "探索、轻悬念";
}

function sceneStageDirection(story, scene, persona, index) {
  const location = sceneLocationFromStory(story, scene, index);
  const actor = scene.speaker && scene.speaker !== "旁白" && scene.speaker !== "结局" && scene.speaker !== "尾声"
    ? scene.speaker
    : persona.name;
  return `${location}里，${actor}停在能看见${story.source}的位置；${story.ally}避开正面视线，手边有一个能被点击或注意到的道具。`;
}

function sceneDramaticQuestion(story, scene, persona) {
  const text = `${scene.id || ""}${scene.title || ""}`;
  if (/start|入口|开场|倒计时/.test(text)) return `${persona.name}能否在第一眼判断${story.source}是不是陷阱？`;
  if (/investigate|观察|线索|第一拍/.test(text)) return `${persona.name}能否从${story.source}里找出真正有用的线索？`;
  if (/approach|listen|comfort|靠近|倾听|回应/.test(text)) return `${story.ally}会不会把关键真相告诉${persona.name}？`;
  if (/decision|分岔|选择/.test(text)) return `${persona.name}要相信线索，还是保护眼前的人？`;
  if (/_end|结局|尾声|成功|重试|稳住/.test(text)) return "这个选择留下的是解决、遗憾，还是下一次冒险的入口？";
  return `${persona.name}能否把局面推进到下一步？`;
}

function sceneObstacle(story, scene) {
  const text = `${scene.id || ""}${scene.title || ""}${scene.text || ""}`;
  if (/线索|观察|调查|真相/.test(text)) return "线索不完整，而且越靠近真相越容易误判。";
  if (/靠近|倾听|回应/.test(text)) return `${story.ally}只愿意透露一半，另一半必须靠选择换来。`;
  if (/分岔|选择/.test(text)) return "两个选项都会带来损失，区别只在于先失去信息还是先失去信任。";
  if (/结局|尾声|成功|重试|稳住/.test(text)) return "结局必须回收前面的线索，否则玩家会觉得选择没有重量。";
  return `${story.source}看起来像线索，也可能是把人引错方向的诱饵。`;
}

function sceneTurningPoint(story, scene, persona) {
  const text = `${scene.id || ""}${scene.title || ""}`;
  if (/start|入口|开场|倒计时/.test(text)) return `${persona.name}发现${story.source}不是背景细节，而是事件入口。`;
  if (/investigate|观察|线索|第一拍/.test(text)) return "一条线索被确认，但它指向的不是最安全的路线。";
  if (/approach|listen|comfort|靠近|倾听|回应/.test(text)) return `${story.ally}的态度松动，第一次把风险交给主角判断。`;
  if (/decision|分岔|选择/.test(text)) return "玩家必须用一个选择锁定后续结局方向。";
  if (/_end|结局|尾声|成功|重试|稳住/.test(text)) return "前面的选择被结算，同时留下可被 Remix 的余波。";
  return "本场结束时，信息、关系或风险至少改变一项。";
}

function enrichSceneActions(actions = [], story, scene) {
  return actions.map((action, index) => ({
    ...action,
    stakes: action.stakes || (index % 2
      ? `保留关系安全，但可能错过${story.source}背后的真相。`
      : `推进${personaSafeObjective(story.objective)}，但会让${story.ally}承受更大压力。`),
    feedback: action.feedback || (/_end|结局|尾声/.test(action.goto || "")
      ? "选择后立即进入结局结算。"
      : "选择后立刻改变下一场的线索焦点。"),
  }));
}

function sceneDialogueLines(story, scene, persona) {
  const speaker = scene.speaker || persona.name;
  const lines = [];
  if (speaker === "旁白" || speaker === "提示" || speaker === "线索" || speaker === "挑战") {
    lines.push({ speaker: "旁白", text: scene.text });
    lines.push({ speaker: persona.name, text: `先别急着选。${story.source}和${personaSafeObjective(story.objective)}之间一定有联系。` });
  } else if (/结局|尾声|反馈|隐藏线索/.test(speaker)) {
    lines.push({ speaker: "旁白", text: scene.text });
    lines.push({ speaker: story.ally, text: `我到现在才敢说：${story.twist}` });
  } else {
    lines.push({ speaker, text: scene.text });
    lines.push({ speaker: persona.name, text: `如果现在判断错了，${story.setting}会把我们带到完全不同的结局。` });
  }
  return lines.filter((line) => compactText(line.text, ""));
}

function enrichDraftScenesForScript(scenes, story, persona) {
  return scenes.map((scene, index) => ({
    ...scene,
    title: shortSceneTitle(scene, story, index),
    location: scene.location || sceneLocationFromStory(story, scene, index),
    time: scene.time || sceneTimeFromStory(story, scene, index),
    beat: scene.beat || sceneBeatLabel(scene, index),
    emotion: scene.emotion || sceneEmotionLabel(scene, story),
    stageDirection: scene.stageDirection || sceneStageDirection(story, scene, persona, index),
    dramaticQuestion: scene.dramaticQuestion || sceneDramaticQuestion(story, scene, persona),
    obstacle: scene.obstacle || sceneObstacle(story, scene),
    turningPoint: scene.turningPoint || sceneTurningPoint(story, scene, persona),
    characters: scene.characters || [persona.name, story.ally].filter(Boolean),
    dialogue: scene.dialogue || sceneDialogueLines(story, scene, persona),
    actions: enrichSceneActions(scene.actions || [], story, scene),
    sfx: scene.sfx || (/雨夜|雨/.test(`${story.setting}${scene.text}`) ? "雨声、门铃、轻点击反馈" : "环境底噪、轻点击反馈"),
  }));
}

function makeHealingScenes(clean, preset, persona, originType, ipName, story) {
  const lead = persona.avatar || preset.character;
  return [
    {
      id: "start",
      title: `${story.setting}的轻声开场`,
      background: preset.background,
      character: lead,
      speaker: "旁白",
      text: `${persona.name}来到${story.setting}。${story.incitingIncident} 这一次，最重要的不是赢，而是陪${story.ally}把心里的结慢慢放下。`,
      actions: [
        { label: "先陪对方坐一会儿", goto: "listen" },
        { label: "轻声问发生了什么", goto: "comfort" },
      ],
    },
    {
      id: "listen",
      title: "安静倾听",
      background: "linear-gradient(160deg, #0f172a 0%, #0e7490 62%, #cffafe 145%)",
      character: lead,
      speaker: persona.name,
      text: `${persona.name}没有急着追问，只把${story.source}放到灯下。${story.ally}终于愿意说出害怕的部分：${story.dilemma}`,
      actions: [
        { label: "回应这份不安", goto: "comfort" },
        { label: "给对方一点空间", goto: "quiet_end" },
      ],
    },
    {
      id: "comfort",
      title: "温柔回应",
      background: "linear-gradient(160deg, #164e63 0%, #2dd4bf 70%, #ecfeff 150%)",
      character: "☔",
      speaker: persona.name,
      text: `${persona.name}把目标换成更小的一步：先守住此刻，再一起面对${personaSafeObjective(story.objective)}。${story.ally}的声音慢慢稳定下来。`,
      actions: [
        { label: "一起完成小小约定", goto: "warm_end" },
        { label: "把未说完的话留下", goto: "quiet_end" },
      ],
    },
    {
      id: "warm_end",
      title: "陪伴结局",
      background: "linear-gradient(160deg, #042f2e 0%, #0f766e 70%, #ccfbf1 150%)",
      character: "🌙",
      speaker: "结局",
      text: `${persona.name}和${story.ally}一起完成了那件小事。${originType === "fanwork" ? `这段二创归属「${ipName || "所选 IP"}」，` : ""}${story.setting}没有完全改变，但今晚已经不再那么难熬。`,
      actions: [{ label: "重新播放", goto: "start" }],
    },
    {
      id: "quiet_end",
      title: "安静结局",
      background: "linear-gradient(160deg, #111827 0%, #475569 70%, #e2e8f0 150%)",
      character: "🫧",
      speaker: "尾声",
      text: `${persona.name}没有强行解决一切，只把${story.source}留成明天还能继续的约定。${story.ally}点点头，像终于能好好呼吸。`,
      actions: [{ label: "重新播放", goto: "start" }],
    },
  ];
}

function makeEnergyScenes(clean, preset, persona, originType, ipName, story) {
  const lead = persona.avatar || preset.character;
  return [
    {
      id: "start",
      title: `${story.setting}的倒计时`,
      background: preset.background,
      character: lead,
      speaker: "提示",
      text: `${persona.name}刚进入${story.setting}，警示灯就亮了三下。目标只有一个：在节奏乱掉前完成${story.objective}。`,
      challenge: { type: "warmup", beat: "3 秒内判断方向", successLabel: "快速判断" },
      actions: [
        { label: "立刻判断信号", goto: "signal_one" },
        { label: "先稳住节奏", goto: "signal_two" },
      ],
    },
    {
      id: "signal_one",
      title: "第一拍反应",
      background: "linear-gradient(160deg, #064e3b 0%, #22c55e 58%, #fef08a 145%)",
      character: "⚡",
      speaker: "挑战",
      text: `${story.source}突然靠近。${persona.name}必须在两种提示里抓住正确节奏，慢一步就会进入重试。`,
      challenge: { type: "quick_choice", limitSeconds: 5, successGoto: "signal_two", failGoto: "retry_end" },
      actions: [
        { label: "抓住亮起的提示", goto: "signal_two" },
        { label: "犹豫半拍", goto: "retry_end" },
      ],
    },
    {
      id: "signal_two",
      title: "第二拍连击",
      background: "linear-gradient(160deg, #0f766e 0%, #06b6d4 62%, #f0fdfa 145%)",
      character: lead,
      speaker: persona.name,
      text: `${story.ally}喊出最后一个节拍。${persona.name}要么连续跟上，要么选择稳妥收束，把风险降下来。`,
      challenge: { type: "combo", comboCount: 2, successGoto: "success_end", safeGoto: "recharge_end" },
      actions: [
        { label: "连续跟上节拍", goto: "success_end" },
        { label: "稳妥收束", goto: "recharge_end" },
      ],
    },
    {
      id: "success_end",
      title: "成功结局",
      background: "linear-gradient(160deg, #022c22 0%, #16a34a 70%, #bbf7d0 150%)",
      character: "🏁",
      speaker: "结局",
      text: `${persona.name}抢在节奏断掉前完成挑战。${story.ally}笑着确认：${story.twist} 这次反应足够漂亮。`,
      actions: [{ label: "重新挑战", goto: "start" }],
    },
    {
      id: "retry_end",
      title: "重试结局",
      background: "linear-gradient(160deg, #7f1d1d 0%, #fb7185 70%, #ffe4e6 150%)",
      character: "⏱",
      speaker: "反馈",
      text: `${persona.name}慢了半拍，${story.setting}里的提示重新洗牌。失败不是结束，而是下一轮更快的开始。`,
      actions: [{ label: "重新挑战", goto: "start" }],
    },
    {
      id: "recharge_end",
      title: "稳住结局",
      background: "linear-gradient(160deg, #1e1b4b 0%, #6366f1 70%, #e0e7ff 150%)",
      character: "🔋",
      speaker: "尾声",
      text: `${persona.name}没有追求满分，而是把节奏稳住。${originType === "fanwork" ? `这段二创归属「${ipName || "所选 IP"}」，` : ""}下一次可以挑战更快路线。`,
      actions: [{ label: "重新挑战", goto: "start" }],
    },
  ];
}

function makeDraftScenes(clean, preset, persona, originType, ipName, story) {
  if (story.template === "healing") {
    return enrichDraftScenesForScript(
      expandScenesToRequestedCount(makeHealingScenes(clean, preset, persona, originType, ipName, story), clean, preset, persona, story),
      story,
      persona,
    );
  }
  if (story.template === "energy") {
    return enrichDraftScenesForScript(
      expandScenesToRequestedCount(makeEnergyScenes(clean, preset, persona, originType, ipName, story), clean, preset, persona, story),
      story,
      persona,
    );
  }
  const lead = persona.avatar || preset.character;
  return enrichDraftScenesForScript(expandScenesToRequestedCount([
    {
      id: "start",
      title: `${story.setting}的入口`,
      background: preset.background,
      character: lead,
      speaker: "旁白",
      text: `${persona.name}进入${story.setting}。${story.incitingIncident} 现在的目标很明确：${story.objective}。`,
      actions: [
        { label: "先观察现场", goto: "investigate" },
        { label: `靠近${story.ally}`, goto: "approach" },
      ],
    },
    {
      id: "investigate",
      title: "观察现场",
      background: "linear-gradient(160deg, #11324d 0%, #1f7a8c 58%, #bfdbf7 135%)",
      character: "🔎",
      speaker: "线索",
      text: `${story.setting}里最不对劲的细节浮出来：${story.source}。${persona.name}意识到，${story.stakes}`,
      actions: [
        { label: "带着线索行动", goto: "decision" },
        { label: "回到入口", goto: "start" },
      ],
    },
    {
      id: "approach",
      title: `靠近${story.ally}`,
      background: "linear-gradient(160deg, #12372a 0%, #436850 58%, #fbfada 135%)",
      character: lead,
      speaker: story.ally,
      text: `${story.ally}没有立刻给答案，只提醒${persona.name}：${story.dilemma} 这不是旁观者能解决的事。`,
      actions: [
        { label: "相信对方", goto: "decision" },
        { label: "继续查证", goto: "investigate" },
      ],
    },
    {
      id: "decision",
      title: "分岔选择",
      background: "linear-gradient(160deg, #2f184b 0%, #6247aa 62%, #ffcad4 145%)",
      character: "✨",
      speaker: persona.name,
      text: originType === "fanwork"
        ? `${persona.name}决定以「${ipName || "所选 IP"}」里的分身身份行动。${story.twist} 接下来只能选择一种解决方式。`
        : `${persona.name}确认了自己的分身身份。${story.twist} 接下来只能选择一种解决方式。`,
      actions: [
        { label: "正面解决", goto: "resolve_end" },
        { label: "留下伏笔", goto: "open_end" },
        { label: "追问隐藏真相", goto: "secret_end" },
      ],
    },
    {
      id: "secret_end",
      title: "真相结局",
      background: "linear-gradient(160deg, #312e81 0%, #7c3aed 70%, #ddd6fe 150%)",
      character: "🗝",
      speaker: "隐藏线索",
      text: `${persona.name}没有急着结束，而是追问${story.ally}没有说完的部分。真相打开后，${story.setting}露出另一条可以继续 Remix 的支线。`,
      actions: [{ label: "重新播放", goto: "start" }],
    },
    {
      id: "resolve_end",
      title: "解决结局",
      background: "linear-gradient(160deg, #020617 0%, #155e75 70%, #a7f3d0 150%)",
      character: "💫",
      speaker: "结局",
      text: `${persona.name}选择正面处理：${story.objective}。${story.ally}终于说出隐藏的那句话，${story.setting}恢复了短暂的平静。`,
      actions: [{ label: "重新播放", goto: "start" }],
    },
    {
      id: "open_end",
      title: "开放结局",
      background: "linear-gradient(160deg, #111827 0%, #be123c 70%, #fde68a 150%)",
      character: "🎭",
      speaker: "尾声",
      text: `${persona.name}没有立刻结束事件，而是把${story.source}留给下一个分身继续追。这个尾声可以被 Remix 成新的支线。`,
      actions: [{ label: "重新播放", goto: "start" }],
    },
  ], clean, preset, persona, story), story, persona);
}

function parseSimpleChineseNumber(value = "") {
  const digits = {
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };
  if (/^\d+$/.test(value)) return Number(value);
  if (value === "十") return 10;
  const tenParts = value.split("十");
  if (tenParts.length === 2) {
    const tens = tenParts[0] ? digits[tenParts[0]] || 0 : 1;
    const ones = tenParts[1] ? digits[tenParts[1]] || 0 : 0;
    return tens * 10 + ones;
  }
  return digits[value] || 0;
}

function extractRequestedSceneCount(prompt = "") {
  const numberPattern = "(\\d{1,2}|[一二两三四五六七八九十]{1,3})";
  const beforeUnit = new RegExp(`${numberPattern}\\s*(?:个)?\\s*(?:场景|场|幕)`);
  const afterUnit = new RegExp("(?:场景|场|幕)\\s*(?:到|加到|扩到|扩展到|做成|生成|设为|设置为)\\s*" + numberPattern + "\\s*(?:个)?");
  const match = prompt.match(beforeUnit) || prompt.match(afterUnit);
  const raw = match?.[1] || match?.[2] || "";
  const count = parseSimpleChineseNumber(raw);
  return count ? Math.max(2, Math.min(MAX_H5_SCENES, count)) : 0;
}

function expandScenesToRequestedCount(scenes, prompt, preset, persona, story) {
  const targetCount = extractRequestedSceneCount(prompt);
  if (!targetCount || scenes.length >= targetCount) return scenes;
  const nextScenes = structuredClone(scenes);
  const hubScene = nextScenes.find((scene) => scene.id === "decision")
    || nextScenes.find((scene) => /_end$|end/.test(scene.id))
    || nextScenes[nextScenes.length - 1];
  const hubId = hubScene?.id || nextScenes[nextScenes.length - 1]?.id;
  if (!hubId) return scenes;
  const extraCount = targetCount - nextScenes.length;
  const extraIds = Array.from({ length: extraCount }, (_, index) => `expanded_scene_${index + 1}`);
  for (const scene of nextScenes) {
    if (scene.id === hubId) continue;
    for (const action of scene.actions || []) {
      if (action.goto === hubId) action.goto = extraIds[0];
    }
  }
  const extraScenes = extraIds.map((id, index) => ({
    id,
    title: `补充场景 ${index + 1}`,
    background: index % 2
      ? "linear-gradient(160deg, #1f2937 0%, #0f766e 68%, #ccfbf1 145%)"
      : preset.background,
    character: index % 2 ? "🧩" : persona.avatar || preset.character,
    speaker: index % 2 ? story.ally : persona.name,
    text: `${persona.name}继续推进${story.setting}里的第 ${index + 1} 个补充段落。${story.source}带来新的线索，${story.dilemma}`,
    actions: [
      { label: index + 1 === extraIds.length ? "进入关键选择" : "继续追查", goto: extraIds[index + 1] || hubId },
      { label: "重新确认线索", goto: nextScenes[0]?.id || hubId },
    ],
  }));
  const hubIndex = nextScenes.findIndex((scene) => scene.id === hubId);
  nextScenes.splice(hubIndex >= 0 ? hubIndex : nextScenes.length, 0, ...extraScenes);
  return nextScenes;
}

function endingScenes(pack = {}) {
  const entrySceneId = pack.entrySceneId;
  return (pack.scenes || []).filter((scene) => {
    const actions = scene.actions || [];
    if (!actions.length) return true;
    return actions.some((action) => action.goto === entrySceneId || /重新|再玩|重来/.test(action.label || ""));
  });
}

function normalizeNarrativeText(value) {
  return compactText(value, "")
    .replace(/[，。！？,.!?、\s]/g, "")
    .toLowerCase();
}

function repeatedSceneTextCount(pack = {}) {
  const seen = new Set();
  let repeated = 0;
  for (const scene of pack.scenes || []) {
    const key = normalizeNarrativeText(scene.text).slice(0, 36);
    if (!key) continue;
    if (seen.has(key)) repeated += 1;
    seen.add(key);
  }
  return repeated;
}

function promptSignalWords(prompt) {
  const generic = new Set(["一个", "做一个", "故事", "小剧场", "主角", "用户", "互动", "文字游戏", "电子吧唧"]);
  return compactText(prompt, "")
    .split(/[，。！？,.!?\s、/|：:；;]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !generic.has(word))
    .slice(0, 6);
}

function promptSpecificity(pack = {}) {
  const prompt = pack.aiAssistance?.prompt || pack.creationBrief?.input || "";
  const words = promptSignalWords(prompt);
  if (!prompt) return { status: "passed", detail: "人工或种子内容已有作者留痕，不强制匹配提示词。" };
  if (compactText(prompt).length < 8) return { status: "warning", detail: "提示词过短，建议补充地点、事件或角色。" };
  if (!words.length) return { status: "warning", detail: "提示词缺少可追踪的故事关键词。" };

  const corpus = normalizeNarrativeText([
    pack.title,
    pack.creationBrief?.logline,
    pack.world?.setting,
    pack.world?.conflict,
    ...(pack.scenes || []).map((scene) => scene.text),
  ].filter(Boolean).join(" "));
  const matched = words.filter((word) => corpus.includes(normalizeNarrativeText(word)));
  return matched.length
    ? { status: "passed", detail: `已把「${matched.slice(0, 3).join("、")}」等提示词写进剧本。` }
    : { status: "warning", detail: "剧本还没有明显承接用户提示词，建议重写开场或关键线索。" };
}

function personaVoiceStatus(pack = {}) {
  const personaName = pack.persona?.name || "";
  const personaAvatar = pack.persona?.avatar || "";
  if (!personaName) return { status: "warning", detail: "缺少社区分身，角色口吻难以复核。" };

  const scenes = pack.scenes || [];
  const speakerHits = scenes.filter((scene) => scene.speaker === personaName).length;
  const textHits = scenes.filter((scene) => String(scene.text || "").includes(personaName)).length;
  const characterHits = scenes.filter((scene) => personaAvatar && scene.character === personaAvatar).length;
  const totalHits = speakerHits + textHits + characterHits;
  if (totalHits >= 2) return { status: "passed", detail: `「${personaName}」已作为主角或叙事中心出现。` };
  return { status: "warning", detail: `建议让「${personaName}」在说话人、选择或关键场景里更明确。` };
}

function creativeProvenanceStatus(pack = {}) {
  if (pack.aiAssistance?.assisted || pack.aiProvider?.status) {
    const provider = pack.aiProvider?.provider || pack.aiAssistance?.provider || "AI";
    return { status: "passed", detail: `已记录 ${provider} 辅助、生成字段和时间。` };
  }
  if (pack.author?.id && pack.createdAt) {
    return { status: "passed", detail: "已有作者、创建时间和作品来源，可进入人工审核链路。" };
  }
  return { status: "warning", detail: "建议补齐作者、AI 辅助或素材来源留痕。" };
}

export function createDraftQualityChecks(pack = {}) {
  const errors = validatePack(pack);
  const sceneIds = new Set((pack.scenes || []).map((scene) => scene.id).filter(Boolean));
  const reachable = new Set();
  const stack = pack.entrySceneId && sceneIds.has(pack.entrySceneId) ? [pack.entrySceneId] : [];
  while (stack.length) {
    const sceneId = stack.pop();
    if (reachable.has(sceneId)) continue;
    reachable.add(sceneId);
    const scene = (pack.scenes || []).find((item) => item.id === sceneId);
    for (const action of scene?.actions || []) {
      if (sceneIds.has(action.goto) && !reachable.has(action.goto)) stack.push(action.goto);
    }
  }
  const endings = endingScenes(pack);
  const endingCount = endings.length;
  const uniqueEndingCount = new Set(endings.map((scene) => normalizeNarrativeText(scene.text).slice(0, 48)).filter(Boolean)).size;
  const longTextCount = (pack.scenes || []).filter((scene) => String(scene.text || "").length > 120).length;
  const unreachableCount = Math.max(0, sceneIds.size - reachable.size);
  const assetPlan = Array.isArray(pack.assetPlan) ? pack.assetPlan : [];
  const branchingSceneCount = (pack.scenes || []).filter((scene) => (scene.actions || []).length >= 2).length;
  const repeatedCount = repeatedSceneTextCount(pack);
  const specificity = promptSpecificity(pack);
  const personaVoice = personaVoiceStatus(pack);
  const provenance = creativeProvenanceStatus(pack);
  const fanworkReviewReady = pack.contentOrigin !== "fanwork" || (pack.ipId && pack.ipName);

  return [
    {
      id: "schema",
      label: "内容结构",
      status: errors.length ? "blocked" : "passed",
      detail: errors.length ? `发现 ${errors.length} 个结构问题。` : "入口、场景和跳转结构有效。",
    },
    {
      id: "ending",
      label: "结局",
      status: endingCount >= 2 ? "passed" : "warning",
      detail: endingCount >= 2 ? `已有 ${endingCount} 个可收束结局。` : "建议至少准备 2 个结局。",
    },
    {
      id: "ending_payoff",
      label: "结局差异",
      status: uniqueEndingCount >= 2 ? "passed" : "warning",
      detail: uniqueEndingCount >= 2 ? "不同结局有独立反馈，适合试玩和 Remix。" : "建议让不同结局给出不同情绪或剧情回报。",
    },
    {
      id: "reachability",
      label: "可达性",
      status: unreachableCount ? "warning" : "passed",
      detail: unreachableCount ? `${unreachableCount} 个场景暂时不可达。` : "所有场景都能从入口抵达。",
    },
    {
      id: "branch_depth",
      label: "分支密度",
      status: branchingSceneCount >= 2 ? "passed" : "warning",
      detail: branchingSceneCount >= 2 ? `已有 ${branchingSceneCount} 个关键分岔场景。` : "建议至少设置 2 个真正会改变路径的分岔。",
    },
    {
      id: "mobile_copy",
      label: "小屏文案",
      status: longTextCount ? "warning" : "passed",
      detail: longTextCount ? `${longTextCount} 个场景超过 120 字，建议压缩。` : "单场台词适合手机阅读。",
    },
    {
      id: "copy_repetition",
      label: "文案重复",
      status: repeatedCount ? "warning" : "passed",
      detail: repeatedCount ? `${repeatedCount} 个场景文本过于相似，建议改写。` : "场景台词没有明显重复。",
    },
    {
      id: "prompt_specificity",
      label: "提示承接",
      status: specificity.status,
      detail: specificity.detail,
    },
    {
      id: "persona_voice",
      label: "分身主角",
      status: personaVoice.status,
      detail: personaVoice.detail,
    },
    {
      id: "assets",
      label: "素材计划",
      status: assetPlan.length >= 3 ? "passed" : "warning",
      detail: assetPlan.length >= 3 ? `已有 ${assetPlan.length} 项素材来源记录。` : "建议补齐封面、背景和角色素材来源。",
    },
    {
      id: "creative_provenance",
      label: "创作留痕",
      status: provenance.status,
      detail: provenance.detail,
    },
    {
      id: "review_readiness",
      label: "审核准备",
      status: fanworkReviewReady ? "passed" : "warning",
      detail: fanworkReviewReady ? "原创/二创归属字段可供发布审核使用。" : "二创作品需补齐 IP 归属后再进入发布审核。",
    },
    {
      id: "hardware",
      label: "硬件潜力",
      status: (pack.scenes || []).length <= 12 ? "passed" : "warning",
      detail: (pack.scenes || []).length <= 12 ? "短作品结构适合后续硬件候选。" : "H5 可发布，但硬件化前可能需要删减。",
    },
  ];
}

export function isStoreProductionStatus(status) {
  return Boolean(HARDWARE_PACK_STATUS_BY_STORE_STATUS[status]);
}

export function derivePackLifecycle(pack) {
  const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
  const workId = pack.work?.id || `work_${pack.id}`;
  const workVersionId = pack.workVersion?.id || `wv_${pack.id}_${pack.updatedAt || pack.createdAt || 0}`;
  const hardwarePackStatus = HARDWARE_PACK_STATUS_BY_STORE_STATUS[storeStatus] || pack.hardwarePack?.status || null;
  const hasHardwarePack = Boolean(hardwarePackStatus);
  const hardwarePackId = pack.hardwarePack?.id || (hasHardwarePack ? `hw_${pack.id}` : null);
  const workVersionStatus = hasHardwarePack || storeStatus === "rights_review" ? "locked" : "active";
  const storeListingId = pack.storeListing?.id || `listing_${pack.id}`;

  return {
    work: {
      id: workId,
      status: pack.work?.status || "public",
      currentVersionId: workVersionId,
      ...pack.work,
    },
    workVersion: {
      id: workVersionId,
      workId,
      status: pack.workVersion?.status || workVersionStatus,
      schemaVersion: pack.schemaVersion || GUGU_H5_SCHEMA_VERSION,
      createdAt: pack.createdAt || Date.now(),
      ...pack.workVersion,
    },
    storeListing: {
      ...pack.storeListing,
      id: storeListingId,
      workId,
      workVersionId,
      status: storeStatus,
      rightsAcknowledgedAt: pack.rightsAcknowledgedAt || pack.storeListing?.rightsAcknowledgedAt || null,
      hardwarePackId,
      submittedAt: pack.storeListing?.submittedAt || null,
      updatedAt: pack.storeListing?.updatedAt || pack.updatedAt || pack.createdAt || null,
      status: storeStatus,
      hardwarePackId,
    },
    hardwarePack: hasHardwarePack ? {
      id: hardwarePackId,
      sourceWorkId: pack.id,
      sourceWorkVersionId: workVersionId,
      sourceSchemaVersion: pack.schemaVersion || GUGU_H5_SCHEMA_VERSION,
      storeListingId,
      version: pack.hardwarePack?.version || "1.0.0",
      formatVersion: pack.hardwarePack?.formatVersion || "hw_pack_v1",
      compatibilityReportId: pack.hardwarePack?.compatibilityReportId || `compat_${pack.id}`,
      status: hardwarePackStatus,
      targetDeviceModels: pack.hardwarePack?.targetDeviceModels || ["Circle 185"],
      minFirmwareVersion: pack.hardwarePack?.minFirmwareVersion || "1.2.0",
      checksum: pack.hardwarePack?.checksum || `sha256:${pack.id}`,
      downloadUrl: pack.hardwarePack?.downloadUrl || `/packs/${hardwarePackId}.bin`,
      ...pack.hardwarePack,
      status: hardwarePackStatus,
    } : null,
  };
}

export function normalizePack(pack) {
  const preset = TEMPLATE_PRESETS.healing;
  const originType = pack.contentOrigin === "fanwork" ? "fanwork" : "original";
  const matchedIp = getIpEntry(pack.ipId) || findIpEntryByName(pack.ipName) || getDefaultIpForOrigin(originType);
  const zone = getZone(pack.zoneId || matchedIp?.defaultZoneId || preset.zoneId);
  const persona = pack.persona?.id ? pack.persona : getPersona(pack.personaId || matchedIp?.personaIds?.[0] || preset.personaId);
  const capabilities = Array.isArray(pack.capabilities) && pack.capabilities.length
    ? pack.capabilities
    : ["scene_graph", "branching"];
  const lifecycle = derivePackLifecycle({
    ...pack,
    schemaVersion: pack.schemaVersion || GUGU_H5_SCHEMA_VERSION,
    storeStatus: pack.storeListing?.status || pack.storeStatus || "not_applied",
  });
  let hardwareStatus = pack.hardwareStatus || "h5_only";
  if (lifecycle.hardwarePack?.status === "available") {
    hardwareStatus = "hardware_ready";
  } else if (["production_queued", "producing", "pack_review"].includes(lifecycle.storeListing.status)) {
    hardwareStatus = "hardware_candidate";
  } else if (["delisted", "frozen", "rejected"].includes(lifecycle.storeListing.status)) {
    hardwareStatus = "h5_only";
  }

  return {
    ...pack,
    schemaVersion: pack.schemaVersion || GUGU_H5_SCHEMA_VERSION,
    capabilities,
    work: lifecycle.work,
    workVersion: lifecycle.workVersion,
    storeListing: lifecycle.storeListing,
    hardwarePack: lifecycle.hardwarePack,
    contentOrigin: originType,
    ipId: matchedIp?.id || pack.ipId || null,
    ipName: originType === "fanwork" ? (pack.ipName || matchedIp?.name || pack.title || "未命名 IP") : null,
    zoneId: zone.id,
    zoneName: zone.name,
    persona: {
      id: persona.id,
      name: persona.name,
      avatar: persona.avatar,
      roleType: persona.roleType,
      tagline: persona.tagline,
      cloneOf: pack.persona?.cloneOf || null,
    },
    fanworkOf: pack.fanworkOf || null,
    rightsAcknowledgedAt: pack.rightsAcknowledgedAt || null,
    storeStatus: lifecycle.storeListing.status,
    hardwareStatus,
  };
}

export function createDraftFromPrompt(prompt, template, options = {}, timestamp = Date.now()) {
  if (typeof options === "number") {
    timestamp = options;
    options = {};
  }

  const clean = compactText(prompt, "做一个会陪用户下班回家的电子吧唧小剧场");
  const title = promptTitle(clean);
  const preset = TEMPLATE_PRESETS[template] || {
    background: "linear-gradient(160deg, #111827, #4f46e5)",
    character: "✨",
    tag: "共创",
    personaId: "rain_gugu",
    zoneId: "healing",
  };
  const originType = options.originType === "fanwork" ? "fanwork" : "original";
  const ipEntry = getIpEntry(options.ipId) || findIpEntryByName(options.ipName) || getDefaultIpForOrigin(originType);
  const ipName = originType === "fanwork" ? (ipEntry?.name || options.ipName || "").trim() : null;
  const zone = getZone(options.zoneId || ipEntry?.defaultZoneId || preset.zoneId);
  const customPersona = options.customPersona?.name ? {
    id: options.customPersona.id || `custom_${options.customPersona.name.slice(0, 12)}`,
    name: options.customPersona.name,
    avatar: options.customPersona.avatar || options.customPersona.name.slice(0, 1) || "原",
    roleType: "creator_original",
    tagline: options.customPersona.tagline || "用户原创社区分身",
  } : null;
  const persona = customPersona || getPersona(options.personaId || ipEntry?.personaIds?.[0] || preset.personaId);
  const id = `h5_${Math.random().toString(36).slice(2, 9)}`;
  const story = avoidPersonaAsAlly(inferStoryPlan(clean, template, persona, ipName), persona);
  const creationBrief = makeCreationBrief(clean, title, template, zone, originType, ipName, story);
  const world = makeWorldPlan(clean, template, zone, story);
  const personaUsage = makePersonaUsage(persona, originType, ipName);
  const characters = makeCharacterCards(clean, persona, preset, story);
  const assetPlan = makeAssetPlan(clean, title, preset, persona, template, story);
  const scenes = makeDraftScenes(clean, preset, persona, originType, ipName, story);
  const tags = Array.from(new Set([
    ...promptKeywords(clean, preset, zone),
  ]));

  const draft = {
    id,
    schemaVersion: GUGU_H5_SCHEMA_VERSION,
    title,
    author: { id: "user_local", name: "你" },
    capabilities: ["scene_graph", "branching"],
    status: "public_h5",
    hardwareStatus: "h5_only",
    storeStatus: "not_applied",
    contentOrigin: originType,
    ipId: ipEntry?.id || null,
    ipName,
    zoneId: zone.id,
    zoneName: zone.name,
    persona: {
      id: persona.id,
      name: persona.name,
      avatar: persona.avatar,
      roleType: persona.roleType,
      tagline: persona.tagline,
      cloneOf: customPersona ? null : null,
    },
    fanworkOf: null,
    rightsAcknowledgedAt: null,
    cover: { background: preset.background, character: persona.avatar || preset.character },
    creationBrief,
    world,
    personaUsage,
    characters,
    assetPlan,
    aiAssistance: {
      assisted: true,
      provider: "mock_gugu_creator",
      generatedFields: ["creationBrief", "world", "personaUsage", "characters", "scenes", "assetPlan", "title", "tags"],
      prompt: clean,
      generatedAt: timestamp,
    },
    tags,
    metrics: { plays: 0, likes: 0, saves: 0, comments: 0, remixes: 0, completionRate: 0 },
    entrySceneId: "start",
    createdAt: timestamp,
    updatedAt: timestamp,
    remixOf: null,
    scenes,
  };
  draft.qualityChecks = createDraftQualityChecks(draft);
  return draft;
}

export function cloneAsRemix(source, timestamp = Date.now()) {
  const copy = structuredClone(source);
  copy.id = `h5_${Math.random().toString(36).slice(2, 9)}`;
  copy.title = `${source.title} Remix`;
  copy.author = { id: "user_local", name: "你" };
  copy.status = "public_h5";
  copy.hardwareStatus = "h5_only";
  copy.storeStatus = "not_applied";
  copy.contentOrigin = "fanwork";
  copy.ipId = source.ipId || findIpEntryByName(source.ipName)?.id || null;
  copy.ipName = source.ipName || getIpEntry(copy.ipId)?.name || source.title;
  copy.fanworkOf = source.id;
  copy.rightsAcknowledgedAt = null;
  copy.remixOf = source.id;
  copy.createdAt = timestamp;
  copy.updatedAt = timestamp;
  copy.metrics = { plays: 0, likes: 0, saves: 0, comments: 0, remixes: 0, completionRate: 0 };
  copy.persona = copy.persona || getPersona("rain_gugu");
  copy.persona = {
    ...copy.persona,
    cloneOf: source.persona?.id || copy.persona.cloneOf || null,
  };
  copy.tags = Array.from(new Set([...(copy.tags || []), "二创", copy.ipName, "Remix"]));
  return copy;
}

export function validatePack(pack) {
  const errors = [];
  if (!pack || typeof pack !== "object") return ["pack must be an object"];
  if (!pack.id) errors.push("pack missing id");
  if (!pack.title) errors.push(`${pack.id || "pack"} missing title`);
  if (pack.schemaVersion !== GUGU_H5_SCHEMA_VERSION) {
    errors.push(`${pack.id || "pack"} invalid schemaVersion`);
  }
  if (!Array.isArray(pack.capabilities)) {
    errors.push(`${pack.id || "pack"} capabilities must be an array`);
  } else {
    for (const capability of pack.capabilities) {
      if (!GUGU_H5_CAPABILITIES[capability]) errors.push(`${pack.id || "pack"} invalid capability: ${capability}`);
    }
  }
  if (!["original", "fanwork"].includes(pack.contentOrigin || "original")) errors.push(`${pack.id || "pack"} invalid contentOrigin`);
  if ((pack.contentOrigin || "original") === "fanwork" && !pack.ipName) errors.push(`${pack.id || "pack"} fanwork missing ipName`);
  if ((pack.contentOrigin || "original") === "fanwork" && !pack.ipId) errors.push(`${pack.id || "pack"} fanwork missing ipId`);
  if (pack.ipId && !GUGU_IP_POOL[pack.ipId]) errors.push(`${pack.id || "pack"} invalid ipId`);
  if (pack.ipId && GUGU_IP_POOL[pack.ipId] && !GUGU_IP_POOL[pack.ipId].supportedOrigins.includes(pack.contentOrigin || "original")) {
    errors.push(`${pack.id || "pack"} ipId does not support ${pack.contentOrigin || "original"}`);
  }
  if (pack.storeStatus && !STORE_STATUS_LABELS[pack.storeStatus]) errors.push(`${pack.id || "pack"} invalid storeStatus`);
  if (pack.hardwareStatus && !HARDWARE_STATUS_LABELS[pack.hardwareStatus]) errors.push(`${pack.id || "pack"} invalid hardwareStatus`);
  if (pack.storeListing?.status && !STORE_STATUS_LABELS[pack.storeListing.status]) errors.push(`${pack.id || "pack"} invalid storeListing.status`);
  if (pack.hardwarePack?.status && !HARDWARE_PACK_STATUS_LABELS[pack.hardwarePack.status]) errors.push(`${pack.id || "pack"} invalid hardwarePack.status`);
  if (pack.hardwarePack && !pack.hardwarePack.sourceWorkVersionId) errors.push(`${pack.id || "pack"} hardwarePack missing sourceWorkVersionId`);
  if (pack.hardwarePack && !pack.hardwarePack.formatVersion) errors.push(`${pack.id || "pack"} hardwarePack missing formatVersion`);
  if (pack.hardwarePack && !pack.hardwarePack.compatibilityReportId) errors.push(`${pack.id || "pack"} hardwarePack missing compatibilityReportId`);
  if (!pack.entrySceneId) errors.push(`${pack.id || "pack"} missing entrySceneId`);
  if (!Array.isArray(pack.scenes) || pack.scenes.length === 0) {
    errors.push(`${pack.id || "pack"} missing scenes`);
    return errors;
  }
  if (pack.scenes.length > MAX_H5_SCENES) errors.push(`${pack.id || "pack"} exceeds max scenes: ${MAX_H5_SCENES}`);

  const sceneIds = new Set();
  for (const scene of pack.scenes) {
    if (scene.id && sceneIds.has(scene.id)) errors.push(`${pack.id} duplicate scene id: ${scene.id}`);
    if (scene.id) sceneIds.add(scene.id);
  }
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
