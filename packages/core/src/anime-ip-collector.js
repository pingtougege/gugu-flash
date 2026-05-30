import { GUGU_IP_POOL, GUGU_ZONES, ROLE_PERSONAS } from "./gugu-h5-pack.js";
import { ONE_CLICK_IP_INTAKE_CATALOG } from "./one-click-ip-intake-catalog.js";
import { POKEMON_DEX_NAMES } from "./pokemon-dex-names.js";

export const ANIME_IP_COLLECTION_SOURCE = {
  id: "webwide_ip_catalog_2026_05",
  name: "全网 IP 搜索候选库",
  rightsNotice: "仅用于二创归属和审核演示，不代表官方授权；上架商店或硬件分发需单独权利证明。",
};

export const ANIME_IP_COLLECTION_SEEDS = [
  {
    sourceId: "web:ip:pokemon",
    id: "mainstream_pokemon",
    name: "Pokémon / 宝可梦",
    aliases: ["宝可梦", "精灵宝可梦", "口袋妖怪", "Pokemon", "Pokémon", "皮卡丘"],
    defaultZoneId: "adventure",
    heatScore: 9800,
    tags: ["游戏", "动画", "伙伴", "收集"],
    description: "全网 IP 候选：宝可梦长期覆盖游戏、动画、卡牌和角色商品，角色生态庞大，适合伙伴收集、冒险和成长分支二创归属。",
    personas: [
      { id: "pokemon_pikachu", name: "皮卡丘", avatar: "⚡", tagline: "电气系代表角色，适合活泼、陪伴和冒险开场。" },
      { id: "pokemon_eevee", name: "伊布", avatar: "🦊", tagline: "有多种进化可能的伙伴，适合成长线和分支选择。" },
      { id: "pokemon_charizard", name: "喷火龙", avatar: "🔥", tagline: "高人气火焰系伙伴，适合飞行、对战和高燃突破。" },
      { id: "pokemon_bulbasaur", name: "妙蛙种子", avatar: "🌱", tagline: "温和的草系伙伴，适合陪伴、培育和探索桥段。" },
      { id: "pokemon_squirtle", name: "杰尼龟", avatar: "💧", tagline: "水系初始伙伴，适合轻喜剧、守护和团队协作。" },
      { id: "pokemon_mewtwo", name: "超梦", avatar: "🧬", tagline: "强大且带有自我追问的角色，适合悬念、力量和身份主题。" },
      { id: "pokemon_ash", name: "小智", avatar: "🧢", tagline: "长期冒险主角，适合伙伴成长、比赛目标和旅行日常。" },
      { id: "pokemon_misty", name: "小霞", avatar: "💦", tagline: "水系训练家，适合吐槽、同行和队伍平衡桥段。" },
      { id: "pokemon_brock", name: "小刚", avatar: "🪨", tagline: "可靠照顾者和岩石系训练家，适合补给、料理和团队照料。" },
      { id: "pokemon_meowth", name: "喵喵", avatar: "🐾", tagline: "会说话的反差角色，适合轻喜剧、计划失误和角色吐槽。" },
    ],
  },
  {
    sourceId: "web:ip:naruto",
    id: "mainstream_naruto",
    name: "Naruto / 火影忍者",
    aliases: ["火影忍者", "火影", "Naruto", "鸣人", "佐助", "卡卡西"],
    defaultZoneId: "adventure",
    heatScore: 9400,
    tags: ["忍者", "成长", "羁绊", "热血"],
    description: "全网 IP 候选：忍者成长、师徒羁绊和村落阵营构成高识别度角色群像，适合修行、守护和对决二创归属。",
    personas: [
      { id: "naruto_uzumaki", name: "漩涡鸣人", avatar: "🍥", tagline: "木叶忍者代表角色，适合成长、羁绊和不服输主题。" },
      { id: "naruto_sasuke", name: "宇智波佐助", avatar: "🌀", tagline: "冷静的宿命型角色，适合对决、追寻和暗线选择。" },
      { id: "naruto_sakura", name: "春野樱", avatar: "🌸", tagline: "医疗忍者与怪力担当，适合成长、守护和情绪爆发。" },
      { id: "naruto_kakashi", name: "旗木卡卡西", avatar: "📘", tagline: "第七班导师，适合任务引导、冷幽默和关键提示。" },
      { id: "naruto_hinata", name: "日向雏田", avatar: "👁️", tagline: "温柔坚韧的白眼忍者，适合鼓励、守护和内心成长。" },
      { id: "naruto_gaara", name: "我爱罗", avatar: "🏜️", tagline: "砂隐风影，适合孤独、和解和责任主题。" },
      { id: "naruto_itachi", name: "宇智波鼬", avatar: "🪶", tagline: "背负秘密的兄长角色，适合牺牲、真相和暗线反转。" },
      { id: "naruto_jiraiya", name: "自来也", avatar: "📜", tagline: "豪放导师角色，适合修行、情报和临别托付。" },
      { id: "naruto_shikamaru", name: "奈良鹿丸", avatar: "♟️", tagline: "策略型忍者，适合战术推演、懒散吐槽和关键决策。" },
    ],
  },
  {
    sourceId: "web:ip:one_piece",
    id: "mainstream_one_piece",
    name: "One Piece / 海贼王",
    aliases: ["海贼王", "航海王", "One Piece", "路飞", "草帽海贼团"],
    defaultZoneId: "adventure",
    heatScore: 9600,
    tags: ["航海", "冒险", "伙伴", "热血"],
    description: "全网 IP 候选：长篇航海冒险、伙伴羁绊和岛屿篇章结构突出，适合冒险分支、团队成长和角色陪伴二创归属。",
    personas: [
      { id: "one_piece_luffy", name: "路飞", avatar: "🏴‍☠️", tagline: "草帽海贼团船长，适合热血、冒险和伙伴主题。" },
      { id: "one_piece_zoro", name: "索隆", avatar: "🗡️", tagline: "剑士担当，适合修行、守护和迷路喜剧桥段。" },
      { id: "one_piece_nami", name: "娜美", avatar: "🧭", tagline: "航海士角色，适合地图、财务、天气和团队推进。" },
      { id: "one_piece_sanji", name: "山治", avatar: "🍳", tagline: "厨师与骑士型角色，适合料理、守护和动作桥段。" },
      { id: "one_piece_usopp", name: "乌索普", avatar: "🎯", tagline: "狙击手和故事家，适合胆怯成长、机智和喜剧反差。" },
      { id: "one_piece_chopper", name: "乔巴", avatar: "🩺", tagline: "船医伙伴，适合治愈、照顾和可爱误会。" },
      { id: "one_piece_robin", name: "罗宾", avatar: "📚", tagline: "考古学者，适合历史线索、冷静解读和隐藏真相。" },
    ],
  },
  {
    sourceId: "web:ip:demon_slayer",
    id: "mainstream_demon_slayer",
    name: "Demon Slayer / 鬼灭之刃",
    aliases: ["鬼灭之刃", "鬼灭", "Demon Slayer", "炭治郎", "祢豆子"],
    defaultZoneId: "healing",
    heatScore: 9300,
    tags: ["斩鬼", "亲情", "修行", "战斗"],
    description: "全网 IP 候选：亲情驱动、呼吸法修行和鬼杀队群像鲜明，适合守护、成长和高情绪战斗二创归属。",
    personas: [
      { id: "demon_slayer_tanjiro", name: "灶门炭治郎", avatar: "🌊", tagline: "温柔坚定的剑士，适合守护、修行和线索追踪。" },
      { id: "demon_slayer_nezuko", name: "灶门祢豆子", avatar: "🎋", tagline: "被守护也在守护的妹妹角色，适合亲情和克制主题。" },
      { id: "demon_slayer_zenitsu", name: "我妻善逸", avatar: "⚡", tagline: "胆怯但爆发力强的剑士，适合喜剧反差和瞬间高光。" },
      { id: "demon_slayer_inosuke", name: "嘴平伊之助", avatar: "🐗", tagline: "野性直接的战斗角色，适合冲突、竞争和成长桥段。" },
      { id: "demon_slayer_giyu", name: "富冈义勇", avatar: "🌊", tagline: "水柱角色，适合沉默守护、规则判断和关键援手。" },
      { id: "demon_slayer_shinobu", name: "胡蝶忍", avatar: "🦋", tagline: "虫柱角色，适合药理、微笑压迫感和复仇暗线。" },
    ],
  },
  {
    sourceId: "anime:frieren",
    id: "mainstream_frieren",
    name: "Frieren: Beyond Journey's End / 葬送的芙莉莲",
    aliases: ["葬送的芙莉莲", "芙莉莲", "Frieren"],
    defaultZoneId: "healing",
    heatScore: 9900,
    tags: ["奇幻", "治愈", "冒险"],
    description: "主流外部 IP：长寿魔法师、旅途回忆和温柔冒险主题，适合情绪陪伴与轻冒险二创归属。",
    personas: [
      {
        id: "frieren_frieren",
        name: "芙莉莲",
        avatar: "🪄",
        tagline: "长寿魔法师角色，适合安静、回忆和旅途选择。",
      },
      {
        id: "frieren_fern",
        name: "费伦",
        avatar: "📘",
        tagline: "稳重的年轻魔法师，适合陪伴、吐槽和成长桥段。",
      },
      {
        id: "frieren_stark",
        name: "修塔尔克",
        avatar: "🪓",
        tagline: "胆怯但可靠的战士，适合守护、冒险和轻喜剧反差。",
      },
      {
        id: "frieren_himmel",
        name: "辛美尔",
        avatar: "🗡️",
        tagline: "勇者记忆核心，适合回忆、约定和温柔影响。",
      },
    ],
  },
  {
    sourceId: "anime:spy_family",
    id: "mainstream_spy_family",
    name: "Spy x Family / 间谍过家家",
    aliases: ["间谍过家家", "间谍家家酒", "Spy Family", "Spy x Family"],
    defaultZoneId: "duo",
    heatScore: 9700,
    tags: ["家庭", "日常", "喜剧"],
    description: "主流外部 IP：伪装家庭、任务日常和轻喜剧反差主题，适合同频搭子和日常互动二创归属。",
    personas: [
      {
        id: "spy_family_anya",
        name: "阿尼亚",
        avatar: "🥜",
        tagline: "读心小学生角色，适合可爱误会、任务和表情包式互动。",
      },
      {
        id: "spy_family_loid",
        name: "劳埃德",
        avatar: "🕵️",
        tagline: "冷静的间谍父亲，适合计划、保护和反差日常。",
      },
      {
        id: "spy_family_yor",
        name: "约尔",
        avatar: "🌹",
        tagline: "温柔又危险的母亲角色，适合守护和动作桥段。",
      },
      {
        id: "spy_family_bond",
        name: "邦德",
        avatar: "🐶",
        tagline: "预知能力宠物伙伴，适合危机预警、家庭陪伴和轻喜剧。",
      },
    ],
  },
  {
    sourceId: "anime:chainsaw_man",
    id: "mainstream_chainsaw_man",
    name: "Chainsaw Man / 电锯人",
    aliases: ["电锯人", "Chainsaw Man", "链锯人"],
    defaultZoneId: "adventure",
    heatScore: 9500,
    tags: ["热血", "黑色幽默", "战斗"],
    description: "主流外部 IP：恶魔、契约和高能战斗主题，适合强节奏冒险和反差互动二创归属。",
    personas: [
      {
        id: "chainsaw_denji",
        name: "电次",
        avatar: "⛓️",
        tagline: "冲动直接的少年角色，适合高能选择和荒诞日常。",
      },
      {
        id: "chainsaw_power",
        name: "帕瓦",
        avatar: "🩸",
        tagline: "张扬的血之魔人，适合夸张反应和轻喜剧冲突。",
      },
      {
        id: "chainsaw_aki",
        name: "早川秋",
        avatar: "🗡️",
        tagline: "冷静的公安猎魔人，适合任务、牺牲和队伍照料。",
      },
      {
        id: "chainsaw_makima",
        name: "玛奇玛",
        avatar: "👁️",
        tagline: "压迫感强的支配型角色，适合悬疑、操控和权力暗线。",
      },
    ],
  },
  {
    sourceId: "anime:haikyu",
    id: "mainstream_haikyu",
    name: "Haikyu!! / 排球少年",
    aliases: ["排球少年", "Haikyu", "Haikyu!!"],
    defaultZoneId: "duo",
    heatScore: 9300,
    tags: ["运动", "团队", "青春"],
    description: "主流外部 IP：社团竞技、团队成长和青春热血主题，适合同频搭子和挑战互动二创归属。",
    personas: [
      {
        id: "haikyu_hinata",
        name: "日向翔阳",
        avatar: "🏐",
        tagline: "小个子攻手，适合训练、突破和伙伴鼓励。",
      },
      {
        id: "haikyu_kageyama",
        name: "影山飞雄",
        avatar: "👑",
        tagline: "天才二传手，适合配合、竞争和高光瞬间。",
      },
      {
        id: "haikyu_tsukishima",
        name: "月岛萤",
        avatar: "🧱",
        tagline: "冷静的拦网手，适合吐槽、策略和关键防守。",
      },
      {
        id: "haikyu_nishinoya",
        name: "西谷夕",
        avatar: "🛡️",
        tagline: "自由人守护核心，适合救球、鼓舞和燃点瞬间。",
      },
      {
        id: "haikyu_daichi",
        name: "泽村大地",
        avatar: "🧱",
        tagline: "队长角色，适合稳定军心、守备和团队责任。",
      },
      {
        id: "haikyu_sugawara",
        name: "菅原孝支",
        avatar: "🕊️",
        tagline: "温和前辈与二传手，适合鼓励、换人策略和情绪托底。",
      },
    ],
  },
  {
    sourceId: "anime:conan",
    id: "mainstream_detective_conan",
    name: "Detective Conan / 名侦探柯南",
    aliases: ["名侦探柯南", "柯南", "Detective Conan", "Case Closed"],
    defaultZoneId: "adventure",
    heatScore: 9600,
    tags: ["推理", "悬疑", "日常案件"],
    description: "主流外部 IP：推理、案件和身份隐藏主题，适合谜题分支与轻冒险二创归属。",
    personas: [
      {
        id: "conan_edogawa",
        name: "江户川柯南",
        avatar: "🔍",
        tagline: "少年侦探角色，适合线索选择和推理互动。",
      },
      {
        id: "conan_ai_haibara",
        name: "灰原哀",
        avatar: "🧪",
        tagline: "冷静敏锐的研究者，适合暗线、提示和守护桥段。",
      },
      {
        id: "conan_ran_mouri",
        name: "毛利兰",
        avatar: "🥋",
        tagline: "温柔又有行动力的角色，适合守护、等待和情感线。",
      },
      {
        id: "conan_kaito_kid",
        name: "怪盗基德",
        avatar: "🃏",
        tagline: "华丽的怪盗角色，适合谜题、反转和舞台感互动。",
      },
      {
        id: "conan_shinichi",
        name: "工藤新一",
        avatar: "🧩",
        tagline: "高中生侦探身份，适合真相揭示、推理和身份切换。",
      },
      {
        id: "conan_heiji",
        name: "服部平次",
        avatar: "🧢",
        tagline: "关西侦探角色，适合双侦探推理、竞争和轻松互动。",
      },
    ],
  },
  {
    sourceId: "web:ip:jujutsu_kaisen",
    id: "mainstream_jujutsu_kaisen",
    name: "Jujutsu Kaisen / 咒术回战",
    aliases: ["咒术回战", "咒术", "Jujutsu Kaisen", "虎杖", "五条悟"],
    defaultZoneId: "adventure",
    heatScore: 9500,
    tags: ["咒术", "校园", "战斗", "群像"],
    description: "全网 IP 候选：现代咒术、校园战斗和高话题度角色群像，适合战斗选择、师生关系和诅咒事件二创归属。",
    personas: [
      { id: "jujutsu_yuji", name: "虎杖悠仁", avatar: "👊", tagline: "咒术高专学生，适合热血、责任和战斗选择。" },
      { id: "jujutsu_gojo", name: "五条悟", avatar: "🕶️", tagline: "人气咒术师角色，适合强者登场和轻松反差。" },
      { id: "jujutsu_megumi", name: "伏黑惠", avatar: "🐺", tagline: "影法术使用者，适合冷静判断、召唤和保护主题。" },
      { id: "jujutsu_nobara", name: "钉崎野蔷薇", avatar: "🔨", tagline: "果断自信的咒术师，适合战斗、吐槽和自我表达。" },
      { id: "jujutsu_sukuna", name: "两面宿傩", avatar: "👹", tagline: "危险的诅咒之王，适合压迫感、契约和高风险分支。" },
    ],
  },
  {
    sourceId: "web:ip:attack_on_titan",
    id: "mainstream_attack_on_titan",
    name: "Attack on Titan / 进击的巨人",
    aliases: ["进击的巨人", "巨人", "Attack on Titan", "艾伦", "三笠"],
    defaultZoneId: "adventure",
    heatScore: 9200,
    tags: ["末世", "自由", "墙内外", "群像"],
    description: "全网 IP 候选：墙内外冲突、自由抉择和群像命运主题突出，适合沉重选择、调查行动和身份反转二创归属。",
    personas: [
      { id: "attack_titan_eren", name: "艾伦·耶格尔", avatar: "🗝️", tagline: "追寻自由的核心角色，适合抉择、冲突和真相推进。" },
      { id: "attack_titan_mikasa", name: "三笠·阿克曼", avatar: "🧣", tagline: "强大战士角色，适合守护、行动和沉默情感线。" },
      { id: "attack_titan_armin", name: "阿尔敏·阿诺德", avatar: "📖", tagline: "战略与理想担当，适合推演、谈判和希望主题。" },
      { id: "attack_titan_levi", name: "利威尔", avatar: "⚔️", tagline: "调查兵团强者，适合冷静作战、清理危机和高压判断。" },
      { id: "attack_titan_hange", name: "韩吉", avatar: "🔬", tagline: "研究型指挥角色，适合实验、情报和危险好奇心。" },
    ],
  },
  {
    sourceId: "web:ip:dragon_ball",
    id: "mainstream_dragon_ball",
    name: "Dragon Ball / 龙珠",
    aliases: ["龙珠", "七龙珠", "Dragon Ball", "孙悟空", "贝吉塔"],
    defaultZoneId: "adventure",
    heatScore: 9700,
    tags: ["战斗", "修炼", "升级", "经典"],
    description: "全网 IP 候选：经典热血战斗、修炼升级和跨世代角色认知，适合训练、对战和力量突破二创归属。",
    personas: [
      { id: "dragon_ball_goku", name: "孙悟空", avatar: "🐉", tagline: "经典热血战斗角色，适合训练、突破和友情对战。" },
      { id: "dragon_ball_vegeta", name: "贝吉塔", avatar: "🔥", tagline: "骄傲的战士角色，适合竞争、修炼和反差日常。" },
      { id: "dragon_ball_gohan", name: "孙悟饭", avatar: "📚", tagline: "兼具学者与战士身份，适合成长、责任和潜力爆发。" },
      { id: "dragon_ball_piccolo", name: "比克", avatar: "🟢", tagline: "严厉导师和守护者，适合训练、牺牲和冷静判断。" },
      { id: "dragon_ball_bulma", name: "布尔玛", avatar: "🛠️", tagline: "科技与冒险发起者，适合发明、资源和路线规划。" },
    ],
  },
  {
    sourceId: "web:ip:my_hero_academia",
    id: "mainstream_my_hero_academia",
    name: "My Hero Academia / 我的英雄学院",
    aliases: ["我的英雄学院", "英雄学院", "My Hero Academia", "MHA", "绿谷", "爆豪"],
    defaultZoneId: "duo",
    heatScore: 9000,
    tags: ["英雄", "校园", "能力", "训练"],
    description: "全网 IP 候选：英雄学校、个性能力、训练和救援主题，适合成长任务、队友配合和救援分支二创归属。",
    personas: [
      { id: "mha_deku", name: "绿谷出久", avatar: "🟢", tagline: "努力型英雄学生，适合成长、救援和策略记录。" },
      { id: "mha_bakugo", name: "爆豪胜己", avatar: "💥", tagline: "强势竞争者，适合对抗、训练和不服输主题。" },
      { id: "mha_uraraka", name: "丽日御茶子", avatar: "🪐", tagline: "重力能力者，适合救援、伙伴鼓励和轻喜剧。" },
      { id: "mha_todoroki", name: "轰焦冻", avatar: "❄️", tagline: "冰火能力角色，适合家庭冲突、成长和控制力训练。" },
      { id: "mha_all_might", name: "欧尔麦特", avatar: "🏅", tagline: "象征型英雄导师，适合鼓舞、传承和关键救援。" },
    ],
  },
  {
    sourceId: "anime:sakura",
    id: "mainstream_cardcaptor_sakura",
    name: "Cardcaptor Sakura / 魔卡少女樱",
    aliases: ["魔卡少女樱", "百变小樱", "Cardcaptor Sakura"],
    defaultZoneId: "healing",
    heatScore: 9200,
    tags: ["魔法", "校园", "治愈"],
    description: "主流外部 IP：魔法卡牌、校园日常和温柔成长主题，适合治愈陪伴二创归属。",
    personas: [
      {
        id: "sakura_kinomoto",
        name: "木之本樱",
        avatar: "🌸",
        tagline: "元气魔法少女，适合收集、鼓励和暖心冒险。",
      },
      {
        id: "sakura_syaoran",
        name: "李小狼",
        avatar: "🧭",
        tagline: "认真可靠的伙伴角色，适合竞争、守护和成长线。",
      },
      {
        id: "sakura_tomoyo",
        name: "大道寺知世",
        avatar: "🎥",
        tagline: "温柔的记录者和支持者，适合服装、拍摄和友情陪伴。",
      },
      {
        id: "sakura_kero",
        name: "可鲁贝洛斯",
        avatar: "🪽",
        tagline: "守护兽伙伴，适合任务说明、吐槽和魔法规则提示。",
      },
    ],
  },
  {
    sourceId: "anime:bocchi",
    id: "mainstream_bocchi_the_rock",
    name: "Bocchi the Rock! / 孤独摇滚",
    aliases: ["孤独摇滚", "Bocchi the Rock", "波奇酱"],
    defaultZoneId: "duo",
    heatScore: 9100,
    tags: ["乐队", "社恐", "青春日常"],
    description: "主流外部 IP：乐队、社恐成长和青春日常主题，适合同频搭子和低压陪伴二创归属。",
    personas: [
      {
        id: "bocchi_hitori",
        name: "后藤一里",
        avatar: "🎸",
        tagline: "怕生但会发光的吉他手，适合鼓励、舞台和内心戏互动。",
      },
      {
        id: "bocchi_kita",
        name: "喜多郁代",
        avatar: "🎤",
        tagline: "开朗的主唱角色，适合社交、舞台和元气日常。",
      },
      {
        id: "bocchi_nijika",
        name: "伊地知虹夏",
        avatar: "🥁",
        tagline: "乐队组织者和鼓手，适合排练安排、鼓励和团队黏合。",
      },
      {
        id: "bocchi_ryo",
        name: "山田凉",
        avatar: "🎸",
        tagline: "冷淡贝斯手，适合毒舌、音乐偏执和反差喜剧。",
      },
    ],
  },
  {
    sourceId: "anime:oshi_no_ko",
    id: "mainstream_oshi_no_ko",
    name: "Oshi no Ko / 我推的孩子",
    aliases: ["我推的孩子", "星野爱", "Oshi no Ko"],
    defaultZoneId: "duo",
    heatScore: 9400,
    tags: ["偶像", "演艺圈", "悬疑"],
    description: "主流外部 IP：偶像舞台、演艺圈和多线人物关系主题，适合舞台互动与剧情分支二创归属。",
    personas: [
      {
        id: "oshi_ai",
        name: "星野爱",
        avatar: "💎",
        tagline: "舞台中心的偶像角色，适合表演、应援和情绪反转。",
      },
      {
        id: "oshi_ruby",
        name: "星野露比",
        avatar: "✨",
        tagline: "追逐舞台梦想的少女，适合成长、应援和伙伴互动。",
      },
      {
        id: "oshi_aqua",
        name: "星野阿库亚",
        avatar: "🌑",
        tagline: "冷静追查真相的角色，适合悬疑、演技和复仇暗线。",
      },
      {
        id: "oshi_kana",
        name: "有马加奈",
        avatar: "🎭",
        tagline: "童星出身的演员，适合舞台压力、成长和情绪拉扯。",
      },
    ],
  },
  ...createExpandedWebwideIpSeeds(),
  ...createOneClickIpIntakeSeeds(),
];

function persona(id, name, avatar, tagline) {
  return { id, name, avatar, tagline };
}

function createOneClickIpIntakeSeeds() {
  return ONE_CLICK_IP_INTAKE_CATALOG.map((entry) => ({
    sourceId: `oneclick:ip:${entry.id}`,
    id: entry.id,
    name: entry.name,
    aliases: entry.aliases || [],
    defaultZoneId: entry.defaultZoneId || "adventure",
    heatScore: entry.heatScore || 7000,
    tags: entry.tags || ["一键IP入池"],
    description: entry.description,
    personas: [],
  }));
}

function createPokemonDexPersonas() {
  return POKEMON_DEX_NAMES.map((name, index) => {
    const dexNo = String(index + 1).padStart(4, "0");
    return persona(
      `pokemon_dex_${dexNo}`,
      name,
      "📘",
      `全国图鉴 No.${dexNo} 宝可梦，适合图鉴收集、伙伴分支和冒险事件补全。`,
    );
  });
}

export const ANIME_IP_DEEP_CHARACTER_SEEDS = {
  mainstream_pokemon: [
    persona("pokemon_lucario", "路卡利欧", "🔷", "波导感知型伙伴，适合守护、修行和强信念战斗。"),
    persona("pokemon_gengar", "耿鬼", "👻", "幽灵系高人气角色，适合恶作剧、潜入和夜间事件。"),
    persona("pokemon_snorlax", "卡比兽", "💤", "温和巨大的伙伴，适合阻路、守护和轻喜剧桥段。"),
    persona("pokemon_jigglypuff", "胖丁", "🎤", "唱歌型角色，适合舞台、催眠和可爱失控。"),
    persona("pokemon_psyduck", "可达鸭", "💫", "头痛反差角色，适合喜剧、意外爆发和解谜误会。"),
    persona("pokemon_gardevoir", "沙奈朵", "🛡️", "守护感强的超能力伙伴，适合保护、预知和情绪共鸣。"),
    persona("pokemon_greninja", "甲贺忍蛙", "🥷", "敏捷忍者型伙伴，适合潜行、速度战和默契配合。"),
    persona("pokemon_jigglypuff_wigglytuff", "胖可丁", "🎀", "柔软治愈型角色，适合照料、团队恢复和轻松互动。"),
    persona("pokemon_mew", "梦幻", "✨", "神秘幻之角色，适合传说线索、奇遇和温柔悬念。"),
    persona("pokemon_rayquaza", "烈空坐", "🌌", "天空传说角色，适合灾变调停、飞行和高规格危机。"),
    persona("pokemon_groudon", "固拉多", "🌋", "大地传说角色，适合地形危机、远古苏醒和力量失控。"),
    persona("pokemon_kyogre", "盖欧卡", "🌊", "海洋传说角色，适合风暴、深海事件和环境危机。"),
    persona("pokemon_arceus", "阿尔宙斯", "⛩️", "创世传说角色，适合神话任务、规则裁定和终局选择。"),
    persona("pokemon_giratina", "骑拉帝纳", "🕳️", "反转世界角色，适合异界探索、阴影规则和空间谜题。"),
    persona("pokemon_dialga", "帝牙卢卡", "⏳", "时间传说角色，适合时间循环、倒计时和历史修正。"),
    persona("pokemon_palkia", "帕路奇亚", "🧿", "空间传说角色，适合传送、迷宫和世界边界事件。"),
    persona("pokemon_infernape", "烈焰猴", "🔥", "高爆发格斗伙伴，适合逆转、修行和热血对战。"),
    persona("pokemon_togepi", "波克比", "🥚", "幼小幸运角色，适合照护、队伍羁绊和意外触发。"),
    persona("pokemon_togekiss", "波克基斯", "🕊️", "带来祝福的飞行伙伴，适合和平、护送和好运事件。"),
    persona("pokemon_vulpix", "六尾", "🦊", "优雅火系伙伴，适合森林奇遇、陪伴和成长选择。"),
    persona("pokemon_ninetales", "九尾", "🪄", "传说感狐狸角色，适合古老约定、幻术和守护结界。"),
    persona("pokemon_dragonite", "快龙", "🐉", "可靠飞行伙伴，适合送信、救援和温柔力量。"),
    persona("pokemon_lapras", "拉普拉斯", "🚢", "渡海伙伴，适合航行、护送和水面冒险。"),
    persona("pokemon_slowpoke", "呆呆兽", "🫧", "慢节奏治愈角色，适合冷幽默、等待和意外发现。"),
    persona("pokemon_piplup", "波加曼", "🐧", "自尊心强的水系伙伴，适合伙伴磨合和轻喜剧。"),
    persona("pokemon_rowlet", "木木枭", "🦉", "圆滚飞行伙伴，适合侦察、卖萌和夜间行动。"),
    persona("pokemon_litten", "火斑喵", "🐾", "别扭火系伙伴，适合信任建立、独行和温柔反差。"),
    persona("pokemon_popplio", "球球海狮", "🫧", "表演型水系伙伴，适合舞台、泡泡机关和鼓励。"),
    persona("pokemon_serena", "莎莉娜", "🎀", "旅行伙伴和表演者，适合梦想、舞台和同行成长。"),
    persona("pokemon_may", "小遥", "🌺", "协调训练家，适合华丽大赛、旅行和自我发现。"),
    persona("pokemon_dawn", "小光", "💎", "协调训练家，适合舞台挑战、伙伴配合和自信成长。"),
    persona("pokemon_cynthia", "竹兰", "🏆", "冠军训练家，适合导师、遗迹线索和高水平对战。"),
    ...createPokemonDexPersonas(),
  ],
  mainstream_demon_slayer: [
    persona("demon_slayer_rengoku", "炼狱杏寿郎", "🔥", "炎柱角色，适合信念、守护和高情绪燃点。"),
    persona("demon_slayer_tengen", "宇髄天元", "💎", "音柱角色，适合潜入、华丽行动和团队作战。"),
    persona("demon_slayer_mitsuri", "甘露寺蜜璃", "💗", "恋柱角色，适合温柔力量、保护和情绪鼓励。"),
    persona("demon_slayer_muichiro", "时透无一郎", "🌫️", "霞柱角色，适合记忆、天才感和安静高光。"),
    persona("demon_slayer_obanai", "伊黑小芭内", "🐍", "蛇柱角色，适合严厉判断、守护和复杂情感线。"),
    persona("demon_slayer_sanemi", "不死川实弥", "🍃", "风柱角色，适合冲突、兄弟线和强硬守护。"),
    persona("demon_slayer_gyomei", "悲鸣屿行冥", "📿", "岩柱角色，适合沉稳压场、祈愿和终局战斗。"),
    persona("demon_slayer_kanao", "栗花落香奈乎", "🪙", "沉静剑士角色，适合自我选择、训练和温柔成长。"),
    persona("demon_slayer_genya", "不死川玄弥", "🔫", "特殊战斗方式的队员，适合兄弟关系、执念和逆境成长。"),
    persona("demon_slayer_tamayo", "珠世", "🧪", "医者型角色，适合药理、情报和与鬼相关的复杂立场。"),
    persona("demon_slayer_yushiro", "愈史郎", "👁️", "辅助与视觉能力角色，适合侦察、吐槽和守护。"),
    persona("demon_slayer_muzan", "鬼舞辻无惨", "🩸", "核心反派角色，适合压迫感、追踪和终局风险。"),
    persona("demon_slayer_akaza", "猗窝座", "🥊", "上弦之鬼角色，适合强者对决、执念和战斗哲学。"),
    persona("demon_slayer_doma", "童磨", "❄️", "上弦之鬼角色，适合危险微笑、教团暗线和心理压迫。"),
    persona("demon_slayer_kokushibo", "黑死牟", "🌙", "上弦之鬼角色，适合宿命、剑术压迫和终局对决。"),
    persona("demon_slayer_rui", "累", "🕸️", "下弦之鬼角色，适合家庭执念、蛛丝战斗和早期高压事件。"),
  ],
};

function createExpandedWebwideIpSeeds() {
  return [
    {
      sourceId: "web:ip:sailor_moon",
      id: "mainstream_sailor_moon",
      name: "Sailor Moon / 美少女战士",
      aliases: ["美少女战士", "水冰月", "Sailor Moon", "月野兔"],
      defaultZoneId: "healing",
      heatScore: 9100,
      tags: ["魔法少女", "守护", "友情", "经典"],
      description: "全网 IP 候选：魔法少女、守护星球和团队友情主题，适合治愈陪伴、成长和战斗分支二创归属。",
      personas: [
        persona("sailor_moon_usagi", "月野兔", "🌙", "月亮战士，适合成长、守护和温柔鼓励。"),
        persona("sailor_moon_ami", "水野亚美", "💧", "冷静聪明的水星战士，适合分析、学习和支援。"),
        persona("sailor_moon_rei", "火野丽", "🔥", "火星战士，适合直觉、净化和强势吐槽。"),
        persona("sailor_moon_mamoru", "地场卫", "🌹", "神秘守护者，适合浪漫、支援和关键登场。"),
      ],
    },
    {
      sourceId: "web:ip:evangelion",
      id: "mainstream_evangelion",
      name: "Neon Genesis Evangelion / 新世纪福音战士",
      aliases: ["EVA", "新世纪福音战士", "Evangelion", "碇真嗣", "绫波丽"],
      defaultZoneId: "adventure",
      heatScore: 9400,
      tags: ["机甲", "心理", "末世", "经典"],
      description: "全网 IP 候选：机甲战斗、心理独白和末世隐喻突出，适合高压选择、角色内心和危机行动二创归属。",
      personas: [
        persona("eva_shinji", "碇真嗣", "🎧", "敏感的驾驶员，适合内心选择、逃避与承担主题。"),
        persona("eva_rei", "绫波丽", "🩵", "安静神秘的驾驶员，适合身份追问和疏离陪伴。"),
        persona("eva_asuka", "明日香", "🔴", "高自尊驾驶员，适合竞争、爆发和脆弱反差。"),
        persona("eva_misato", "葛城美里", "🧥", "作战指挥者，适合任务说明、照料和战术决策。"),
      ],
    },
    {
      sourceId: "web:ip:gundam",
      id: "mainstream_gundam",
      name: "Gundam / 机动战士高达",
      aliases: ["高达", "Gundam", "机动战士高达", "阿姆罗", "夏亚"],
      defaultZoneId: "adventure",
      heatScore: 9300,
      tags: ["机甲", "战争", "科幻", "宿敌"],
      description: "全网 IP 候选：机甲战争、阵营冲突和驾驶员成长主题，适合战术、宿敌和科幻军事二创归属。",
      personas: [
        persona("gundam_amuro", "阿姆罗·雷", "🤖", "高达驾驶员，适合成长、战场压力和技术突破。"),
        persona("gundam_char", "夏亚·阿兹纳布尔", "🟥", "宿敌型角色，适合谋略、伪装和高压对决。"),
        persona("gundam_lalah", "拉拉ァ·辛", "✨", "感应能力角色，适合理解、悲剧和连接主题。"),
        persona("gundam_bright", "布莱特·诺亚", "🧭", "舰长角色，适合指挥、责任和队伍约束。"),
      ],
    },
    {
      sourceId: "web:ip:doraemon",
      id: "mainstream_doraemon",
      name: "Doraemon / 哆啦A梦",
      aliases: ["哆啦A梦", "机器猫", "Doraemon", "大雄"],
      defaultZoneId: "healing",
      heatScore: 9800,
      tags: ["日常", "童年", "道具", "友情"],
      description: "全网 IP 候选：未来道具、童年日常和友情成长主题，适合轻喜剧、陪伴和奇思妙想二创归属。",
      personas: [
        persona("doraemon_doraemon", "哆啦A梦", "🔵", "未来猫型机器人，适合道具支援、陪伴和轻喜剧。"),
        persona("doraemon_nobita", "野比大雄", "👓", "普通但善良的孩子，适合成长、求助和反转勇气。"),
        persona("doraemon_shizuka", "源静香", "🎻", "温柔同伴，适合日常、鼓励和团队平衡。"),
        persona("doraemon_gian", "胖虎", "🎤", "强势但讲义气的同伴，适合冲突、演唱和友情反差。"),
      ],
    },
    {
      sourceId: "web:ip:totoro",
      id: "mainstream_totoro",
      name: "My Neighbor Totoro / 龙猫",
      aliases: ["龙猫", "Totoro", "邻家的龙猫", "草壁五月"],
      defaultZoneId: "healing",
      heatScore: 9000,
      tags: ["治愈", "自然", "童年", "奇幻"],
      description: "全网 IP 候选：乡间童年、自然精灵和家庭陪伴主题，适合安静治愈和探索二创归属。",
      personas: [
        persona("totoro_totoro", "龙猫", "🌳", "森林精灵，适合陪伴、守护和奇幻发现。"),
        persona("totoro_satsuki", "草壁五月", "🎒", "可靠姐姐，适合照顾、寻找和家庭责任。"),
        persona("totoro_mei", "草壁梅", "🌱", "好奇妹妹，适合探索、迷路和纯真互动。"),
        persona("totoro_catbus", "猫巴士", "🚌", "奇幻交通伙伴，适合快速转场和温暖救援。"),
      ],
    },
    {
      sourceId: "web:ip:spirited_away",
      id: "mainstream_spirited_away",
      name: "Spirited Away / 千与千寻",
      aliases: ["千与千寻", "Spirited Away", "千寻", "无脸男"],
      defaultZoneId: "healing",
      heatScore: 9600,
      tags: ["奇幻", "成长", "汤屋", "治愈"],
      description: "全网 IP 候选：异世界汤屋、身份找回和成长冒险主题，适合探索、选择和情绪陪伴二创归属。",
      personas: [
        persona("spirited_chihiro", "荻野千寻", "🌉", "勇敢成长的少女，适合寻找、坚持和身份主题。"),
        persona("spirited_haku", "白龙", "🐉", "神秘守护者，适合引路、记忆和契约主题。"),
        persona("spirited_noface", "无脸男", "⚫", "孤独投射型角色，适合欲望、陪伴和边界选择。"),
        persona("spirited_yubaba", "汤婆婆", "🧙", "汤屋掌权者，适合规则、交易和压迫感场景。"),
      ],
    },
    {
      sourceId: "web:ip:slam_dunk",
      id: "mainstream_slam_dunk",
      name: "Slam Dunk / 灌篮高手",
      aliases: ["灌篮高手", "Slam Dunk", "樱木花道", "流川枫"],
      defaultZoneId: "duo",
      heatScore: 9500,
      tags: ["篮球", "青春", "团队", "竞技"],
      description: "全网 IP 候选：篮球社团、青春竞技和团队磨合主题，适合训练、比赛和伙伴成长二创归属。",
      personas: [
        persona("slam_sakuragi", "樱木花道", "🏀", "热血新手，适合成长、搞笑和关键篮板。"),
        persona("slam_rukawa", "流川枫", "🦊", "天才球员，适合竞争、突破和冷淡反差。"),
        persona("slam_akagi", "赤木刚宪", "🦍", "队长中锋，适合纪律、目标和团队稳定。"),
        persona("slam_mitsui", "三井寿", "🔥", "回归射手，适合遗憾、坚持和三分高光。"),
      ],
    },
    {
      sourceId: "web:ip:blue_lock",
      id: "mainstream_blue_lock",
      name: "Blue Lock / 蓝色监狱",
      aliases: ["蓝色监狱", "Blue Lock", "洁世一", "凪诚士郎"],
      defaultZoneId: "duo",
      heatScore: 9000,
      tags: ["足球", "竞技", "自我", "训练"],
      description: "全网 IP 候选：足球竞赛、自我觉醒和高压淘汰机制，适合策略、对抗和成长二创归属。",
      personas: [
        persona("blue_lock_isagi", "洁世一", "⚽", "观察型前锋，适合空间分析、自我觉醒和逆转。"),
        persona("blue_lock_bachira", "蜂乐回", "🐝", "自由盘带角色，适合直觉、怪物感和轻快互动。"),
        persona("blue_lock_nagi", "凪诚士郎", "🎮", "天才型球员，适合懒散反差和瞬间高光。"),
        persona("blue_lock_rin", "糸师凛", "🎯", "冷酷竞争者，适合目标压迫和高强度对决。"),
      ],
    },
    {
      sourceId: "web:ip:fullmetal_alchemist",
      id: "mainstream_fullmetal_alchemist",
      name: "Fullmetal Alchemist / 钢之炼金术师",
      aliases: ["钢之炼金术师", "钢炼", "Fullmetal Alchemist", "爱德华"],
      defaultZoneId: "adventure",
      heatScore: 9300,
      tags: ["炼金术", "兄弟", "冒险", "真理"],
      description: "全网 IP 候选：炼金术规则、兄弟羁绊和等价交换主题，适合冒险、调查和高情绪选择二创归属。",
      personas: [
        persona("fma_edward", "爱德华·艾尔利克", "🦾", "钢之炼金术师，适合调查、吐槽和责任主题。"),
        persona("fma_alphonse", "阿尔冯斯·艾尔利克", "🛡️", "温柔的铠甲灵魂，适合守护、陪伴和身份追问。"),
        persona("fma_mustang", "罗伊·马斯坦", "🔥", "焰之炼金术师，适合指挥、谋略和关键爆发。"),
        persona("fma_winry", "温莉·洛克贝尔", "🔧", "机械铠技师，适合修理、照顾和现实牵挂。"),
      ],
    },
    {
      sourceId: "web:ip:bleach",
      id: "mainstream_bleach",
      name: "Bleach / 死神",
      aliases: ["死神", "Bleach", "黑崎一护", "朽木露琪亚"],
      defaultZoneId: "adventure",
      heatScore: 9200,
      tags: ["死神", "斩魄刀", "战斗", "守护"],
      description: "全网 IP 候选：死神代理、斩魄刀和守护战斗主题，适合能力觉醒、队长群像和高燃对决二创归属。",
      personas: [
        persona("bleach_ichigo", "黑崎一护", "🗡️", "死神代理，适合守护、觉醒和强敌对决。"),
        persona("bleach_rukia", "朽木露琪亚", "❄️", "死神引路人，适合规则说明、冷静支援和羁绊。"),
        persona("bleach_orihime", "井上织姬", "🌼", "治疗与守护角色，适合温柔、支援和内心强大。"),
        persona("bleach_byakuya", "朽木白哉", "🌸", "贵族队长，适合秩序、压迫感和华丽战斗。"),
      ],
    },
    {
      sourceId: "web:ip:gintama",
      id: "mainstream_gintama",
      name: "Gintama / 银魂",
      aliases: ["银魂", "Gintama", "坂田银时", "神乐"],
      defaultZoneId: "duo",
      heatScore: 9100,
      tags: ["喜剧", "武士", "日常", "热血"],
      description: "全网 IP 候选：无厘头日常、武士精神和突发热血主题，适合吐槽、轻喜剧和情绪反转二创归属。",
      personas: [
        persona("gintama_gintoki", "坂田银时", "🍡", "懒散但可靠的万事屋，适合吐槽、守护和反差热血。"),
        persona("gintama_kagura", "神乐", "☂️", "战斗力强的少女，适合吃货日常、暴走和伙伴互动。"),
        persona("gintama_shinpachi", "志村新八", "👓", "吐槽担当，适合秩序感、日常收束和观众视角。"),
        persona("gintama_hijikata", "土方十四郎", "🚬", "真选组副长，适合纪律、对抗和冷面喜剧。"),
      ],
    },
    {
      sourceId: "web:ip:sword_art_online",
      id: "mainstream_sword_art_online",
      name: "Sword Art Online / 刀剑神域",
      aliases: ["刀剑神域", "SAO", "Sword Art Online", "桐人", "亚丝娜"],
      defaultZoneId: "adventure",
      heatScore: 9100,
      tags: ["VR", "游戏", "冒险", "搭档"],
      description: "全网 IP 候选：VR 游戏世界、生存冒险和搭档关系主题，适合副本、装备和双人互动二创归属。",
      personas: [
        persona("sao_kirito", "桐人", "⚔️", "黑衣剑士，适合副本攻略、保护和独行反差。"),
        persona("sao_asuna", "亚丝娜", "🪽", "高速剑士，适合搭档、领导和温柔行动力。"),
        persona("sao_yui", "结衣", "💠", "AI 家人角色，适合陪伴、提示和情感连接。"),
        persona("sao_sinon", "诗乃", "🎯", "冷静狙击手，适合远程支援、心理成长和任务。"),
      ],
    },
    {
      sourceId: "web:ip:fate",
      id: "mainstream_fate",
      name: "Fate series / Fate系列",
      aliases: ["Fate", "圣杯战争", "阿尔托莉雅", "远坂凛"],
      defaultZoneId: "adventure",
      heatScore: 9400,
      tags: ["英灵", "魔术", "圣杯", "群像"],
      description: "全网 IP 候选：英灵召唤、圣杯战争和主从契约主题，适合阵营、策略和历史角色二创归属。",
      personas: [
        persona("fate_saber", "阿尔托莉雅", "🗡️", "骑士王英灵，适合荣誉、守护和王道选择。"),
        persona("fate_rin", "远坂凛", "💎", "魔术师角色，适合策略、吐槽和资源管理。"),
        persona("fate_archer", "Archer", "🏹", "讽刺型英灵，适合远程支援、反转和宿命主题。"),
        persona("fate_shirou", "卫宫士郎", "🛠️", "理想主义少年，适合投影、拯救和自我追问。"),
      ],
    },
    {
      sourceId: "web:ip:rezero",
      id: "mainstream_rezero",
      name: "Re:Zero / Re:从零开始的异世界生活",
      aliases: ["Re:Zero", "从零开始的异世界生活", "菜月昴", "雷姆", "艾米莉娅"],
      defaultZoneId: "adventure",
      heatScore: 9200,
      tags: ["异世界", "轮回", "心理", "陪伴"],
      description: "全网 IP 候选：异世界轮回、心理压力和关系修复主题，适合选择重来、情绪陪伴和危机推演二创归属。",
      personas: [
        persona("rezero_subaru", "菜月昴", "⏳", "不断重来的主角，适合选择、崩溃和重新站起。"),
        persona("rezero_emilia", "艾米莉娅", "❄️", "温柔的银发少女，适合信任、保护和成长线。"),
        persona("rezero_rem", "雷姆", "💙", "忠诚女仆角色，适合守护、鼓励和高情绪陪伴。"),
        persona("rezero_ram", "拉姆", "🌸", "毒舌女仆角色，适合吐槽、协助和反差日常。"),
      ],
    },
    {
      sourceId: "web:ip:konosuba",
      id: "mainstream_konosuba",
      name: "KonoSuba / 为美好的世界献上祝福",
      aliases: ["为美好的世界献上祝福", "素晴", "KonoSuba", "惠惠", "阿库娅"],
      defaultZoneId: "duo",
      heatScore: 8900,
      tags: ["异世界", "喜剧", "冒险", "队伍"],
      description: "全网 IP 候选：异世界冒险和废柴队伍喜剧主题，适合任务失败、吐槽和轻松互动二创归属。",
      personas: [
        persona("konosuba_kazuma", "佐藤和真", "🪙", "现实吐槽型冒险者，适合选择、算盘和队伍收拾。"),
        persona("konosuba_aqua", "阿库娅", "💧", "女神但常出状况，适合喜剧、净化和麻烦制造。"),
        persona("konosuba_megumin", "惠惠", "💥", "爆裂魔法师，适合蓄力、仪式感和一击高光。"),
        persona("konosuba_darkness", "达克妮斯", "🛡️", "防御骑士，适合承担伤害和夸张反差。"),
      ],
    },
    {
      sourceId: "web:ip:madoka_magica",
      id: "mainstream_madoka_magica",
      name: "Puella Magi Madoka Magica / 魔法少女小圆",
      aliases: ["魔法少女小圆", "小圆", "Madoka Magica", "鹿目圆", "晓美焰"],
      defaultZoneId: "healing",
      heatScore: 9000,
      tags: ["魔法少女", "命运", "轮回", "黑暗童话"],
      description: "全网 IP 候选：魔法少女契约、命运轮回和代价主题，适合高情绪抉择、守护和反转二创归属。",
      personas: [
        persona("madoka_kaname", "鹿目圆", "🎀", "温柔的核心角色，适合愿望、守护和命运选择。"),
        persona("madoka_homura", "晓美焰", "⏱️", "时间轮回者，适合执念、计划和孤独守护。"),
        persona("madoka_mami", "巴麻美", "☕", "前辈魔法少女，适合优雅战斗和引导。"),
        persona("madoka_kyubey", "丘比", "◻️", "契约引导者，适合规则、代价和冷静压迫。"),
      ],
    },
    {
      sourceId: "web:ip:vocaloid",
      id: "mainstream_vocaloid",
      name: "Vocaloid / 初音未来",
      aliases: ["初音未来", "Vocaloid", "Miku", "镜音铃", "镜音连"],
      defaultZoneId: "duo",
      heatScore: 9700,
      tags: ["虚拟歌手", "音乐", "同人", "舞台"],
      description: "全网 IP 候选：虚拟歌手、音乐创作和同人舞台生态，适合演出、应援和创作搭档二创归属。",
      personas: [
        persona("vocaloid_miku", "初音未来", "🎤", "虚拟歌手代表，适合演唱、应援和创作陪伴。"),
        persona("vocaloid_rin", "镜音铃", "🍊", "活泼歌手角色，适合元气舞台和双人互动。"),
        persona("vocaloid_len", "镜音连", "🎧", "少年歌手角色，适合合唱、舞台和轻快剧情。"),
        persona("vocaloid_luka", "巡音流歌", "🎶", "成熟歌手角色，适合抒情、舞台和温柔支援。"),
      ],
    },
    {
      sourceId: "web:ip:zelda",
      id: "mainstream_zelda",
      name: "The Legend of Zelda / 塞尔达传说",
      aliases: ["塞尔达传说", "Zelda", "林克", "塞尔达"],
      defaultZoneId: "adventure",
      heatScore: 9600,
      tags: ["游戏", "冒险", "解谜", "奇幻"],
      description: "全网 IP 候选：开放冒险、神庙解谜和勇者传说主题，适合探索、装备和谜题分支二创归属。",
      personas: [
        persona("zelda_link", "林克", "🗡️", "沉默勇者，适合探索、解谜和守护任务。"),
        persona("zelda_princess", "塞尔达", "👑", "智慧公主，适合研究、封印和命运选择。"),
        persona("zelda_ganon", "盖侬", "🐗", "强大反派，适合灾厄压迫和最终对决。"),
        persona("zelda_mipha", "米法", "💧", "温柔英杰，适合治疗、回忆和守护。"),
      ],
    },
    {
      sourceId: "web:ip:mario",
      id: "mainstream_mario",
      name: "Super Mario / 超级马力欧",
      aliases: ["马力欧", "超级马力欧", "Super Mario", "Mario", "路易吉"],
      defaultZoneId: "adventure",
      heatScore: 9900,
      tags: ["游戏", "平台跳跃", "家庭", "经典"],
      description: "全网 IP 候选：平台跳跃、家庭娱乐和长期角色生态，适合关卡、道具和轻松冒险二创归属。",
      personas: [
        persona("mario_mario", "马力欧", "🍄", "经典冒险角色，适合闯关、救援和活力互动。"),
        persona("mario_luigi", "路易吉", "🟢", "略胆小的兄弟，适合协作、紧张和喜剧反差。"),
        persona("mario_peach", "碧姬公主", "👑", "蘑菇王国公主，适合守护、派对和领导场景。"),
        persona("mario_bowser", "酷霸王", "🐢", "经典反派，适合闯关阻碍、对抗和喜剧压迫。"),
      ],
    },
    {
      sourceId: "web:ip:animal_crossing",
      id: "mainstream_animal_crossing",
      name: "Animal Crossing / 动物森友会",
      aliases: ["动物森友会", "动森", "Animal Crossing", "西施惠"],
      defaultZoneId: "healing",
      heatScore: 9200,
      tags: ["生活", "岛屿", "治愈", "收集"],
      description: "全网 IP 候选：岛屿生活、收集装饰和低压社交主题，适合治愈陪伴、经营和日常二创归属。",
      personas: [
        persona("animal_crossing_isabelle", "西施惠", "📋", "温柔的事务助手，适合日程、提醒和照顾。"),
        persona("animal_crossing_tom_nook", "狸克", "🏝️", "岛屿经营者，适合规划、任务和资源管理。"),
        persona("animal_crossing_k_k", "K.K.", "🎸", "流浪音乐家，适合演出、放松和夜晚陪伴。"),
        persona("animal_crossing_raymond", "杰克", "👔", "高人气居民，适合邻里互动和轻松日常。"),
      ],
    },
    {
      sourceId: "web:ip:sonic",
      id: "mainstream_sonic",
      name: "Sonic the Hedgehog / 索尼克",
      aliases: ["索尼克", "Sonic", "Sonic the Hedgehog", "塔尔斯"],
      defaultZoneId: "adventure",
      heatScore: 9000,
      tags: ["速度", "游戏", "冒险", "伙伴"],
      description: "全网 IP 候选：高速冒险、伙伴团队和反派对抗主题，适合追逐、关卡和轻快动作二创归属。",
      personas: [
        persona("sonic_sonic", "索尼克", "💨", "高速英雄，适合追逐、自由和轻快行动。"),
        persona("sonic_tails", "塔尔斯", "🛩️", "发明家伙伴，适合飞行、维修和技术支援。"),
        persona("sonic_knuckles", "纳克鲁斯", "✊", "力量型守护者，适合守护、误会和硬派行动。"),
        persona("sonic_eggman", "蛋头博士", "🥚", "发明反派，适合机关、计划和喜剧对抗。"),
      ],
    },
    {
      sourceId: "web:ip:final_fantasy_vii",
      id: "mainstream_final_fantasy_vii",
      name: "Final Fantasy VII / 最终幻想VII",
      aliases: ["最终幻想7", "最终幻想VII", "FF7", "Cloud", "克劳德"],
      defaultZoneId: "adventure",
      heatScore: 9300,
      tags: ["RPG", "科幻", "命运", "战斗"],
      description: "全网 IP 候选：RPG 冒险、身份记忆和反抗巨型企业主题，适合队伍、战斗和剧情分支二创归属。",
      personas: [
        persona("ff7_cloud", "克劳德", "🗡️", "大剑佣兵，适合身份追问、战斗和冷淡反差。"),
        persona("ff7_tifa", "蒂法", "🥊", "近战伙伴，适合照顾、行动和情感牵引。"),
        persona("ff7_aerith", "爱丽丝", "🌸", "花语与治愈角色，适合希望、引导和命运主题。"),
        persona("ff7_sephiroth", "萨菲罗斯", "🌑", "强大反派，适合压迫感、宿命和最终对决。"),
      ],
    },
    {
      sourceId: "web:ip:kingdom_hearts",
      id: "mainstream_kingdom_hearts",
      name: "Kingdom Hearts / 王国之心",
      aliases: ["王国之心", "Kingdom Hearts", "索拉", "利库"],
      defaultZoneId: "adventure",
      heatScore: 8900,
      tags: ["游戏", "心", "友情", "奇幻"],
      description: "全网 IP 候选：心之力量、世界旅行和友情羁绊主题，适合钥刃战斗、伙伴与光暗选择二创归属。",
      personas: [
        persona("kh_sora", "索拉", "🗝️", "钥刃少年，适合友情、冒险和光明选择。"),
        persona("kh_riku", "利库", "🌘", "光暗摇摆的伙伴，适合诱惑、救赎和对照成长。"),
        persona("kh_kairi", "凯莉", "🌺", "重要牵挂角色，适合守护、记忆和归途主题。"),
        persona("kh_roxas", "罗克萨斯", "🌆", "身份追问角色，适合夏日、记忆和自我确认。"),
      ],
    },
    {
      sourceId: "web:ip:minecraft",
      id: "mainstream_minecraft",
      name: "Minecraft / 我的世界",
      aliases: ["我的世界", "Minecraft", "MC", "史蒂夫", "苦力怕"],
      defaultZoneId: "adventure",
      heatScore: 9900,
      tags: ["沙盒", "建造", "生存", "创造"],
      description: "全网 IP 候选：沙盒建造、生存探索和创作生态庞大，适合建筑、冒险和资源管理二创归属。",
      personas: [
        persona("minecraft_steve", "史蒂夫", "⛏️", "默认冒险者，适合采集、建造和生存选择。"),
        persona("minecraft_alex", "艾利克斯", "🪓", "冒险伙伴，适合探索、协作和资源规划。"),
        persona("minecraft_creeper", "苦力怕", "💣", "标志性怪物，适合危机、惊吓和防御设计。"),
        persona("minecraft_ender_dragon", "末影龙", "🐉", "终末 Boss，适合目标推进和大型挑战。"),
      ],
    },
    {
      sourceId: "web:ip:harry_potter",
      id: "mainstream_harry_potter",
      name: "Harry Potter / 哈利·波特",
      aliases: ["哈利波特", "哈利·波特", "Harry Potter", "赫敏", "霍格沃茨"],
      defaultZoneId: "adventure",
      heatScore: 9800,
      tags: ["魔法", "学院", "冒险", "成长"],
      description: "全网 IP 候选：魔法学院、伙伴冒险和成长对抗主题，适合课程、谜题和阵营选择二创归属。",
      personas: [
        persona("hp_harry", "哈利·波特", "⚡", "被选中的少年，适合冒险、勇气和身世谜题。"),
        persona("hp_hermione", "赫敏·格兰杰", "📚", "聪明的魔法学生，适合解谜、学习和可靠支援。"),
        persona("hp_ron", "罗恩·韦斯莱", "🧣", "忠诚伙伴，适合友情、吐槽和家庭温度。"),
        persona("hp_snape", "西弗勒斯·斯内普", "🖤", "复杂教授角色，适合误解、暗线和严厉指导。"),
      ],
    },
    {
      sourceId: "web:ip:marvel_avengers",
      id: "mainstream_marvel_avengers",
      name: "Marvel Avengers / 漫威复仇者联盟",
      aliases: ["漫威", "复仇者联盟", "Avengers", "钢铁侠", "美国队长"],
      defaultZoneId: "adventure",
      heatScore: 9900,
      tags: ["超级英雄", "团队", "科幻", "战斗"],
      description: "全网 IP 候选：超级英雄团队、城市危机和跨媒介角色生态，适合任务、协作和危机处理二创归属。",
      personas: [
        persona("marvel_iron_man", "钢铁侠", "🦾", "科技型英雄，适合装备、嘴炮和高风险决策。"),
        persona("marvel_captain_america", "美国队长", "🛡️", "信念型领袖，适合指挥、守护和价值选择。"),
        persona("marvel_spider_man", "蜘蛛侠", "🕸️", "邻家英雄，适合责任、城市行动和青春困扰。"),
        persona("marvel_black_widow", "黑寡妇", "🕷️", "特工角色，适合潜入、情报和冷静执行。"),
      ],
    },
    {
      sourceId: "web:ip:dc_batman",
      id: "mainstream_dc_batman",
      name: "DC Batman / 蝙蝠侠",
      aliases: ["蝙蝠侠", "Batman", "DC", "小丑", "哥谭"],
      defaultZoneId: "adventure",
      heatScore: 9700,
      tags: ["超级英雄", "侦探", "哥谭", "黑暗"],
      description: "全网 IP 候选：黑暗城市、侦探调查和超级英雄对抗主题，适合案件、心理博弈和夜间行动二创归属。",
      personas: [
        persona("dc_batman", "蝙蝠侠", "🦇", "黑暗骑士，适合侦探、潜入和原则选择。"),
        persona("dc_joker", "小丑", "🃏", "混乱型反派，适合心理博弈和高风险事件。"),
        persona("dc_catwoman", "猫女", "🐈", "暧昧盟友，适合潜入、盗取和立场摇摆。"),
        persona("dc_robin", "罗宾", "🟡", "年轻搭档，适合协作、成长和轻快行动。"),
      ],
    },
    {
      sourceId: "web:ip:star_wars",
      id: "mainstream_star_wars",
      name: "Star Wars / 星球大战",
      aliases: ["星球大战", "Star Wars", "卢克", "达斯维达", "原力"],
      defaultZoneId: "adventure",
      heatScore: 9900,
      tags: ["太空", "原力", "史诗", "科幻"],
      description: "全网 IP 候选：太空史诗、原力修行和家族命运主题，适合冒险、阵营和光暗选择二创归属。",
      personas: [
        persona("star_wars_luke", "卢克·天行者", "🌌", "原力修行者，适合成长、选择和英雄旅程。"),
        persona("star_wars_leia", "莱娅公主", "👑", "反抗军领袖，适合指挥、外交和坚定行动。"),
        persona("star_wars_vader", "达斯·维达", "⚫", "压迫感强的角色，适合光暗冲突和宿命对决。"),
        persona("star_wars_yoda", "尤达", "🟢", "导师型大师，适合训练、谜语和心性引导。"),
      ],
    },
    {
      sourceId: "web:ip:lord_of_the_rings",
      id: "mainstream_lord_of_the_rings",
      name: "The Lord of the Rings / 指环王",
      aliases: ["指环王", "魔戒", "Lord of the Rings", "佛罗多", "甘道夫"],
      defaultZoneId: "adventure",
      heatScore: 9700,
      tags: ["奇幻", "远征", "戒指", "史诗"],
      description: "全网 IP 候选：史诗奇幻、远征队和诱惑考验主题，适合旅程、阵营和艰难选择二创归属。",
      personas: [
        persona("lotr_frodo", "佛罗多", "💍", "戒指持有者，适合负担、诱惑和坚持前行。"),
        persona("lotr_gandalf", "甘道夫", "🧙", "巫师导师，适合指引、牺牲和关键归来。"),
        persona("lotr_aragorn", "阿拉贡", "⚔️", "流亡王者，适合领导、责任和身份回归。"),
        persona("lotr_legolas", "莱戈拉斯", "🏹", "精灵弓手，适合侦察、优雅战斗和队伍协作。"),
      ],
    },
    {
      sourceId: "web:ip:transformers",
      id: "mainstream_transformers",
      name: "Transformers / 变形金刚",
      aliases: ["变形金刚", "Transformers", "擎天柱", "威震天"],
      defaultZoneId: "adventure",
      heatScore: 9600,
      tags: ["机器人", "科幻", "阵营", "载具"],
      description: "全网 IP 候选：机器人阵营战争、载具变形和领袖对抗主题，适合战斗、变形和联盟选择二创归属。",
      personas: [
        persona("transformers_optimus", "擎天柱", "🚛", "汽车人领袖，适合守护、演讲和正面决策。"),
        persona("transformers_bumblebee", "大黄蜂", "🚕", "亲近人类的伙伴，适合陪伴、侦察和轻快行动。"),
        persona("transformers_megatron", "威震天", "🔫", "霸天虎领袖，适合压迫、野心和阵营冲突。"),
        persona("transformers_starscream", "红蜘蛛", "✈️", "野心副手，适合背刺、喜剧冲突和空战。"),
      ],
    },
    {
      sourceId: "web:ip:ultraman",
      id: "mainstream_ultraman",
      name: "Ultraman / 奥特曼",
      aliases: ["奥特曼", "Ultraman", "迪迦", "赛罗"],
      defaultZoneId: "adventure",
      heatScore: 9800,
      tags: ["特摄", "英雄", "怪兽", "守护"],
      description: "全网 IP 候选：巨大英雄、怪兽事件和守护地球主题，适合危机响应、变身和英雄救援二创归属。",
      personas: [
        persona("ultraman_original", "初代奥特曼", "🔴", "经典光之英雄，适合守护、怪兽对战和正义选择。"),
        persona("ultraman_tiga", "迪迦奥特曼", "✨", "光的战士，适合希望、复苏和多形态战斗。"),
        persona("ultraman_zero", "赛罗奥特曼", "🌀", "年轻强者，适合训练、突破和帅气登场。"),
        persona("ultraman_belial", "贝利亚", "⚫", "黑暗反派，适合压迫、堕落和高燃对决。"),
      ],
    },
    {
      sourceId: "web:ip:kamen_rider",
      id: "mainstream_kamen_rider",
      name: "Kamen Rider / 假面骑士",
      aliases: ["假面骑士", "Kamen Rider", "空我", "电王", "零一"],
      defaultZoneId: "adventure",
      heatScore: 9500,
      tags: ["特摄", "变身", "英雄", "都市"],
      description: "全网 IP 候选：变身英雄、都市事件和个人信念主题，适合调查、变身和单元剧战斗二创归属。",
      personas: [
        persona("kamen_rider_ichigo", "假面骑士1号", "🏍️", "经典改造英雄，适合正义、骑行和战斗开场。"),
        persona("kamen_rider_kuuga", "空我", "🔴", "守护笑容的英雄，适合温柔信念和多形态行动。"),
        persona("kamen_rider_den_o", "电王", "🚆", "时间列车骑士，适合人格切换、喜剧和穿越事件。"),
        persona("kamen_rider_zero_one", "零一", "🤖", "AI 时代骑士，适合创业、机器人和信任主题。"),
      ],
    },
  ];
}

function normalizeText(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[：:'’"“”!！?？,，.。/／\\\-_\s·・]+/g, "");
}

function searchTextForSeed(seed) {
  return [
    seed.name,
    seed.description,
    ...(seed.aliases || []),
    ...(seed.tags || []),
    ...(seed.personas || []).flatMap((persona) => [persona.name, persona.tagline]),
  ].join(" ");
}

function matchSeed(seed, query) {
  const compactQuery = normalizeText(query);
  if (!compactQuery) return { matched: true, matchedBy: "热度推荐" };

  const alias = [seed.name, ...(seed.aliases || [])].find((item) => normalizeText(item).includes(compactQuery));
  if (alias) return { matched: true, matchedBy: `IP：${alias}` };

  const persona = (seed.personas || []).find((item) => (
    normalizeText(item.name).includes(compactQuery) ||
    normalizeText(item.tagline).includes(compactQuery)
  ));
  if (persona) return { matched: true, matchedBy: `角色：${persona.name}` };

  const text = normalizeText(searchTextForSeed(seed));
  return { matched: text.includes(compactQuery), matchedBy: "题材匹配" };
}

function sameName(left = "", right = "") {
  return normalizeText(left) === normalizeText(right);
}

function findDuplicateIp(seed, existingIpPool) {
  return Object.values(existingIpPool || {}).find((entry) => (
    entry.id === seed.id ||
    sameName(entry.name, seed.name) ||
    (seed.aliases || []).some((alias) => sameName(entry.name, alias))
  )) || null;
}

function findSeedByIp(ipIdOrName, existingIpPool = {}) {
  const compactValue = normalizeText(ipIdOrName);
  if (!compactValue) return null;

  return ANIME_IP_COLLECTION_SEEDS.find((seed) => (
    seed.id === ipIdOrName ||
    normalizeText(seed.name) === compactValue ||
    (seed.aliases || []).some((alias) => normalizeText(alias) === compactValue)
  )) || Object.values(existingIpPool || {}).find((entry) => (
    entry.id === ipIdOrName ||
    normalizeText(entry.name) === compactValue ||
    (entry.aliases || []).some((alias) => normalizeText(alias) === compactValue)
  )) || null;
}

function seedFromExistingIp(entry, existingPersonas = {}) {
  const personaIds = entry?.personaIds || [];
  return {
    sourceId: entry?.collectedFrom || `existing:ip:${entry?.id || "unknown"}`,
    id: entry?.id || "unknown_ip",
    name: entry?.name || "未命名 IP",
    aliases: entry?.aliases || [],
    defaultZoneId: entry?.defaultZoneId || "adventure",
    heatScore: entry?.communityStats?.heatScore || 0,
    tags: entry?.tags || [],
    description: entry?.description || "已有 IP 池条目，等待角色深挖补全。",
    personas: personaIds
      .map((personaId) => existingPersonas[personaId])
      .filter(Boolean)
      .map((item) => ({
        id: item.id,
        name: item.name,
        avatar: item.avatar || "✨",
        tagline: item.tagline || "已有角色分身，等待运营补充简介。",
      })),
  };
}

function uniquePersonas(personas = []) {
  const seen = new Set();
  return personas.filter((item) => {
    const nameKey = item?.name ? `name:${item.name}` : "";
    if (!item?.id || seen.has(item.id) || (nameKey && seen.has(nameKey))) return false;
    seen.add(item.id);
    if (nameKey) seen.add(nameKey);
    return true;
  });
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
    collectedFrom: ANIME_IP_COLLECTION_SOURCE.id,
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
    personaIds: (seed.personas || []).map((persona) => persona.id),
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
    rightsNotice: ANIME_IP_COLLECTION_SOURCE.rightsNotice,
    collectedFrom: ANIME_IP_COLLECTION_SOURCE.id,
    collectedAt: now,
  };
}

function buildCandidate(seed, options = {}) {
  const {
    matchedBy = "热度推荐",
    existingIpPool = GUGU_IP_POOL,
    existingPersonas = ROLE_PERSONAS,
    now = Date.now(),
  } = options;
  const duplicate = findDuplicateIp(seed, existingIpPool);
  const personas = (seed.personas || []).map((persona) => buildPersona(seed, persona));
  const missingPersonas = personas.filter((persona) => !existingPersonas?.[persona.id]);
  const duplicatePersonaIds = new Set(duplicate?.personaIds || []);
  const missingFromDuplicate = duplicate
    ? personas.filter((persona) => !duplicatePersonaIds.has(persona.id))
    : missingPersonas;

  return {
    id: `candidate_${seed.id}`,
    sourceId: seed.sourceId,
    sourceName: ANIME_IP_COLLECTION_SOURCE.name,
    ipId: seed.id,
    name: seed.name,
    aliases: seed.aliases || [],
    tags: seed.tags || [],
    score: seed.heatScore || 0,
    matchedBy,
    alreadyInPool: Boolean(duplicate),
    duplicateIpId: duplicate?.id || null,
    duplicateReason: duplicate ? `已存在：${duplicate.name}` : null,
    importable: !duplicate,
    supplementable: Boolean(duplicate && missingFromDuplicate.length),
    actionLabel: duplicate
      ? (missingFromDuplicate.length ? "补全角色" : "已完整")
      : "收集入池",
    ipEntry: buildIpEntry(seed, now),
    personas,
    characters: personas.map((persona) => ({
      id: persona.id,
      name: persona.name,
      avatar: persona.avatar,
      tagline: persona.tagline,
    })),
    missingPersonaCount: missingPersonas.length,
    missingPoolPersonaCount: missingFromDuplicate.length,
    rightsNotice: ANIME_IP_COLLECTION_SOURCE.rightsNotice,
  };
}

export function collectAnimeIpCandidates(options = {}) {
  const {
    query = "",
    limit = 6,
    sweepAll = false,
    includeExisting = false,
    existingIpPool = GUGU_IP_POOL,
    existingPersonas = ROLE_PERSONAS,
    now = Date.now(),
  } = options;
  const shouldReturnAll = sweepAll || limit === "all" || limit === "ALL" || limit === Infinity;
  const safeLimit = shouldReturnAll
    ? ANIME_IP_COLLECTION_SEEDS.length
    : Math.max(1, Math.min(Number(limit) || 6, ANIME_IP_COLLECTION_SEEDS.length));
  const matches = ANIME_IP_COLLECTION_SEEDS
    .map((seed) => {
      const match = matchSeed(seed, query);
      if (!match.matched) return null;
      return buildCandidate(seed, {
        matchedBy: match.matchedBy,
        existingIpPool,
        existingPersonas,
        now,
      });
    })
    .filter(Boolean)
    .filter((candidate) => includeExisting || candidate.importable)
    .sort((a, b) => {
      if (a.importable !== b.importable) return a.importable ? -1 : 1;
      return b.score - a.score;
    });

  return matches.slice(0, safeLimit);
}

export function collectAnimeIpCharacterCandidates(ipIdOrName, options = {}) {
  const {
    existingIpPool = GUGU_IP_POOL,
    existingPersonas = ROLE_PERSONAS,
    limit = "all",
    now = Date.now(),
  } = options;
  const match = findSeedByIp(ipIdOrName, existingIpPool);
  if (!match) return null;

  const seed = match.personas ? match : seedFromExistingIp(match, existingPersonas);
  const deepPersonas = ANIME_IP_DEEP_CHARACTER_SEEDS[seed.id] || [];
  const shouldReturnAll = limit === "all" || limit === "ALL" || limit === Infinity;
  const safeLimit = shouldReturnAll ? Number.POSITIVE_INFINITY : Math.max(1, Number(limit) || 24);
  const personas = uniquePersonas([...(seed.personas || []), ...deepPersonas]).slice(0, safeLimit);

  return buildCandidate({
    ...seed,
    personas,
  }, {
    matchedBy: "二级角色深挖",
    existingIpPool,
    existingPersonas,
    now,
  });
}

export function importAnimeIpCandidates(candidates, options = {}) {
  const {
    targetIpPool = GUGU_IP_POOL,
    targetPersonas = ROLE_PERSONAS,
    now = Date.now(),
    ipOnly = false,
  } = options;
  const importedIpIds = [];
  const importedPersonaIds = [];
  const supplementedIpIds = [];
  const skipped = [];

  for (const candidate of candidates || []) {
    const entry = candidate?.ipEntry;
    if (!entry?.id) continue;
    const duplicate = findDuplicateIp(entry, targetIpPool);
    const personas = ipOnly ? [] : (candidate.personas || []);
    const entryPersonaIds = ipOnly ? [] : (entry.personaIds || []);
    if (duplicate) {
      if (ipOnly) {
        skipped.push({ ipId: entry.id, reason: `已存在：${duplicate.name}` });
        continue;
      }
      const beforePersonaIds = new Set(duplicate.personaIds || []);
      const nextPersonaIds = [...beforePersonaIds];
      for (const persona of personas) {
        if (!targetPersonas[persona.id]) {
          targetPersonas[persona.id] = {
            ...persona,
            ipId: duplicate.id,
            status: "active",
            collectedAt: now,
          };
          importedPersonaIds.push(persona.id);
        }
        if (!beforePersonaIds.has(persona.id)) {
          nextPersonaIds.push(persona.id);
          beforePersonaIds.add(persona.id);
        }
      }
      const changed = nextPersonaIds.length !== (duplicate.personaIds || []).length;
      duplicate.personaIds = nextPersonaIds.filter((personaId) => targetPersonas[personaId]);
      duplicate.aliases = Array.from(new Set([...(duplicate.aliases || []), ...(entry.aliases || [])]));
      duplicate.tags = Array.from(new Set([...(duplicate.tags || []), ...(entry.tags || [])]));
      duplicate.rightsNotice = duplicate.rightsNotice || entry.rightsNotice;
      duplicate.collectedFrom = duplicate.collectedFrom || entry.collectedFrom;
      duplicate.updatedAt = now;
      if (changed) supplementedIpIds.push(duplicate.id);
      else skipped.push({ ipId: entry.id, reason: `已存在且角色完整：${duplicate.name}` });
      continue;
    }

    for (const persona of personas) {
      if (!targetPersonas[persona.id]) {
        targetPersonas[persona.id] = {
          ...persona,
          ipId: entry.id,
          status: "active",
          collectedAt: now,
        };
        importedPersonaIds.push(persona.id);
      }
    }

    targetIpPool[entry.id] = {
      ...entry,
      personaIds: entryPersonaIds.filter((personaId) => targetPersonas[personaId]),
      collectedFrom: candidate.sourceId || entry.collectedFrom || ANIME_IP_COLLECTION_SOURCE.id,
      collectedAt: now,
    };
    importedIpIds.push(entry.id);
  }

  return {
    importedIpIds,
    importedPersonaIds,
    supplementedIpIds,
    skipped,
    addedIpCount: importedIpIds.length,
    addedPersonaCount: importedPersonaIds.length,
    supplementedIpCount: supplementedIpIds.length,
  };
}
