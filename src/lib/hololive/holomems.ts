export type HolomemGenerationId =
  | "jp-gen-0"
  | "jp-gen-1"
  | "jp-gen-2"
  | "jp-gamers"
  | "jp-gen-3"
  | "jp-gen-4"
  | "jp-gen-5"
  | "jp-promise"
  | "jp-regloss"
  | "jp-flow-glow"
  | "en-myth"
  | "en-hope"
  | "en-council"
  | "en-advent"
  | "en-justice"
  | "id-gen-1"
  | "id-gen-2"
  | "id-gen-3";

export type Holomem = {
  id: string;
  name: string;
  nameJa?: string;
  generationId: HolomemGenerationId;
  /** Signature oshi / theme color (hex). */
  color: string;
};

export type HolomemGeneration = {
  id: HolomemGenerationId;
  label: string;
  members: Holomem[];
};

const MEMBERS: Holomem[] = [
  // JP Gen 0
  { id: "tokino-sora", name: "Tokino Sora", nameJa: "ときのそら", generationId: "jp-gen-0", color: "#FF7F97" },
  { id: "roboco", name: "Roboco", nameJa: "ロボ子さん", generationId: "jp-gen-0", color: "#A6A6A6" },
  { id: "sakura-miko", name: "Sakura Miko", nameJa: "さくらみこ", generationId: "jp-gen-0", color: "#FF65B2" },
  { id: "hoshimachi-suisei", name: "Hoshimachi Suisei", nameJa: "星街すいせい", generationId: "jp-gen-0", color: "#2DCADF" },
  { id: "azki", name: "AZKi", generationId: "jp-gen-0", color: "#D21F55" },
  // JP Gen 1
  { id: "aki-rosenthal", name: "Aki Rosenthal", nameJa: "アキ・ローゼンタール", generationId: "jp-gen-1", color: "#F3D058" },
  { id: "akai-haato", name: "Akai Haato", nameJa: "赤井はあと", generationId: "jp-gen-1", color: "#E50012" },
  { id: "natsuiro-matsuri", name: "Natsuiro Matsuri", nameJa: "夏色まつり", generationId: "jp-gen-1", color: "#FF9801" },
  // JP Gen 2
  { id: "minato-aqua", name: "Minato Aqua", nameJa: "湊あくあ", generationId: "jp-gen-2", color: "#EB6EA5" },
  { id: "murasaki-shion", name: "Murasaki Shion", nameJa: "紫咲シオン", generationId: "jp-gen-2", color: "#856AAD" },
  { id: "nakiri-ayame", name: "Nakiri Ayame", nameJa: "百鬼あやめ", generationId: "jp-gen-2", color: "#C72645" },
  { id: "yuzuki-choco", name: "Yuzuki Choco", nameJa: "癒月ちょこ", generationId: "jp-gen-2", color: "#FE65B4" },
  { id: "oozora-subaru", name: "Oozora Subaru", nameJa: "大空スバル", generationId: "jp-gen-2", color: "#E5ED70" },
  // Gamers
  { id: "ookami-mio", name: "Ookami Mio", nameJa: "大神ミオ", generationId: "jp-gamers", color: "#C7233A" },
  { id: "nekomata-okayu", name: "Nekomata Okayu", nameJa: "猫又おかゆ", generationId: "jp-gamers", color: "#B27ACB" },
  { id: "inugami-korone", name: "Inugami Korone", nameJa: "戌神ころね", generationId: "jp-gamers", color: "#DC941D" },
  // JP Gen 3
  { id: "usada-pekora", name: "Usada Pekora", nameJa: "兎田ぺこら", generationId: "jp-gen-3", color: "#45D0EE" },
  { id: "shiranui-flare", name: "Shiranui Flare", nameJa: "不知火フレア", generationId: "jp-gen-3", color: "#FF5722" },
  { id: "shirogane-noel", name: "Shirogane Noel", nameJa: "白銀ノエル", generationId: "jp-gen-3", color: "#8C929C" },
  { id: "houshou-marine", name: "Houshou Marine", nameJa: "宝鐘マリン", generationId: "jp-gen-3", color: "#AE2740" },
  // JP Gen 4
  { id: "tsunomaki-watame", name: "Tsunomaki Watame", nameJa: "角巻わため", generationId: "jp-gen-4", color: "#F2EBB3" },
  { id: "tokoyami-towa", name: "Tokoyami Towa", nameJa: "常闇トワ", generationId: "jp-gen-4", color: "#7A6CFF" },
  { id: "amane-kanata", name: "Amane Kanata", nameJa: "天音かなた", generationId: "jp-gen-4", color: "#7AC0E0" },
  { id: "himemori-luna", name: "Himemori Luna", nameJa: "姫森ルーナ", generationId: "jp-gen-4", color: "#DDA0DD" },
  // JP Gen 5
  { id: "yukihana-lamy", name: "Yukihana Lamy", nameJa: "雪花ラミィ", generationId: "jp-gen-5", color: "#91C1ED" },
  { id: "momosuzu-nene", name: "Momosuzu Nene", nameJa: "桃鈴ねね", generationId: "jp-gen-5", color: "#FFAC93" },
  { id: "shishiro-botan", name: "Shishiro Botan", nameJa: "獅白ぼたん", generationId: "jp-gen-5", color: "#F2EFEA" },
  { id: "omaru-polka", name: "Omaru Polka", nameJa: "尾丸ポルカ", generationId: "jp-gen-5", color: "#FF6A6A" },
  // Promise (Gen 6)
  { id: "laplus-darknesss", name: "La+ Darknesss", nameJa: "ラプラス・ダークネス", generationId: "jp-promise", color: "#9B84EE" },
  { id: "takane-lui", name: "Takane Lui", nameJa: "鷹嶺ルイ", generationId: "jp-promise", color: "#F17E7E" },
  { id: "hakui-koyori", name: "Hakui Koyori", nameJa: "博衣こより", generationId: "jp-promise", color: "#FF6CAA" },
  { id: "sakamata-chloe", name: "Sakamata Chloe", nameJa: "沙花叉クロヱ", generationId: "jp-promise", color: "#8C5C4A" },
  { id: "kazama-iroha", name: "Kazama Iroha", nameJa: "風真いろは", generationId: "jp-promise", color: "#3FDEBA" },
  // ReGLOSS
  { id: "hiodoshi-ao", name: "Hiodoshi Ao", nameJa: "火威青", generationId: "jp-regloss", color: "#1E90FF" },
  { id: "otonose-kanade", name: "Otonose Kanade", nameJa: "音乃瀬奏", generationId: "jp-regloss", color: "#F5C518" },
  { id: "ichijou-ririka", name: "Ichijou Ririka", nameJa: "一条莉々華", generationId: "jp-regloss", color: "#E85D75" },
  { id: "juufuutei-raden", name: "Juufuutei Raden", nameJa: "儒烏風亭らでん", generationId: "jp-regloss", color: "#2E8B57" },
  { id: "todoroki-hajime", name: "Todoroki Hajime", nameJa: "轟はじめ", generationId: "jp-regloss", color: "#FF7A45" },
  // FLOW GLOW
  { id: "isaki-riona", name: "Isaki Riona", nameJa: "響咲リオナ", generationId: "jp-flow-glow", color: "#FF4D8D" },
  { id: "koganei-niko", name: "Koganei Niko", nameJa: "虎金妃笑虎", generationId: "jp-flow-glow", color: "#FFB020" },
  { id: "mizumiya-su", name: "Mizumiya Su", nameJa: "水宮枢", generationId: "jp-flow-glow", color: "#5B8CFF" },
  { id: "rindo-chihaya", name: "Rindo Chihaya", nameJa: "輪堂千速", generationId: "jp-flow-glow", color: "#7C5CFF" },
  { id: "kikirara-vivi", name: "Kikirara Vivi", nameJa: "綺々羅々ヴィヴィ", generationId: "jp-flow-glow", color: "#FF6EC7" },
  // EN Myth
  { id: "mori-calliope", name: "Mori Calliope", generationId: "en-myth", color: "#FF2456" },
  { id: "takanashi-kiara", name: "Takanashi Kiara", generationId: "en-myth", color: "#FF511C" },
  { id: "ninomae-inanis", name: "Ninomae Ina'nis", generationId: "en-myth", color: "#3B3E8C" },
  { id: "gawr-gura", name: "Gawr Gura", generationId: "en-myth", color: "#5B9BD5" },
  { id: "watson-amelia", name: "Watson Amelia", generationId: "en-myth", color: "#F8D66D" },
  // EN Hope
  { id: "irys", name: "IRyS", generationId: "en-hope", color: "#E5408E" },
  // EN Council
  { id: "ceres-fauna", name: "Ceres Fauna", generationId: "en-council", color: "#A6D388" },
  { id: "ouro-kronii", name: "Ouro Kronii", generationId: "en-council", color: "#1C5BA8" },
  { id: "nanashi-mumei", name: "Nanashi Mumei", generationId: "en-council", color: "#C2A47B" },
  { id: "hakos-baelz", name: "Hakos Baelz", generationId: "en-council", color: "#FF6262" },
  // EN Advent
  { id: "shiori-novella", name: "Shiori Novella", generationId: "en-advent", color: "#2B2B2B" },
  { id: "koseki-bijou", name: "Koseki Bijou", generationId: "en-advent", color: "#6EC8FF" },
  { id: "nerissa-ravencroft", name: "Nerissa Ravencroft", generationId: "en-advent", color: "#1E3A8A" },
  { id: "fuwawa-abyssgard", name: "Fuwawa Abyssgard", generationId: "en-advent", color: "#8BB8FF" },
  { id: "mococo-abyssgard", name: "Mococo Abyssgard", generationId: "en-advent", color: "#FF9BB8" },
  // EN Justice
  { id: "elizabeth-rose-bloodflame", name: "Elizabeth Rose Bloodflame", generationId: "en-justice", color: "#C41E3A" },
  { id: "gigi-murin", name: "Gigi Murin", generationId: "en-justice", color: "#FF8A3D" },
  { id: "cecilia-immergreen", name: "Cecilia Immergreen", generationId: "en-justice", color: "#3D9E6F" },
  { id: "raora-panthera", name: "Raora Panthera", generationId: "en-justice", color: "#F4A6C8" },
  // ID Gen 1
  { id: "airani-iofifteen", name: "Airani Iofifteen", generationId: "id-gen-1", color: "#8CD600" },
  { id: "moona-hoshinova", name: "Moona Hoshinova", generationId: "id-gen-1", color: "#6B4FA0" },
  { id: "ayunda-risu", name: "Ayunda Risu", generationId: "id-gen-1", color: "#F7A8B8" },
  // ID Gen 2
  { id: "kureiji-ollie", name: "Kureiji Ollie", generationId: "id-gen-2", color: "#B71C1C" },
  { id: "anya-melfissa", name: "Anya Melfissa", generationId: "id-gen-2", color: "#D4A017" },
  { id: "pavolia-reine", name: "Pavolia Reine", generationId: "id-gen-2", color: "#2B6CB0" },
  // ID Gen 3
  { id: "vestia-zeta", name: "Vestia Zeta", generationId: "id-gen-3", color: "#92A8D1" },
  { id: "kaela-kovalskia", name: "Kaela Kovalskia", generationId: "id-gen-3", color: "#E25822" },
  { id: "kobo-kanaeru", name: "Kobo Kanaeru", generationId: "id-gen-3", color: "#3DB7E4" },
];

const GENERATION_LABELS: Record<HolomemGenerationId, string> = {
  "jp-gen-0": "hololive JP · Gen 0",
  "jp-gen-1": "hololive JP · 1st Gen",
  "jp-gen-2": "hololive JP · 2nd Gen",
  "jp-gamers": "hololive JP · Gamers",
  "jp-gen-3": "hololive JP · 3rd Gen",
  "jp-gen-4": "hololive JP · 4th Gen",
  "jp-gen-5": "hololive JP · 5th Gen",
  "jp-promise": "hololive JP · HoloX",
  "jp-regloss": "hololive JP · ReGLOSS",
  "jp-flow-glow": "hololive JP · FLOW GLOW",
  "en-myth": "hololive EN · Myth",
  "en-hope": "hololive EN · Promise (Hope)",
  "en-council": "hololive EN · Council",
  "en-advent": "hololive EN · Advent",
  "en-justice": "hololive EN · Justice",
  "id-gen-1": "hololive ID · 1st Gen",
  "id-gen-2": "hololive ID · 2nd Gen",
  "id-gen-3": "hololive ID · 3rd Gen",
};

const GENERATION_ORDER: HolomemGenerationId[] = [
  "jp-gen-0",
  "jp-gen-1",
  "jp-gen-2",
  "jp-gamers",
  "jp-gen-3",
  "jp-gen-4",
  "jp-gen-5",
  "jp-promise",
  "jp-regloss",
  "jp-flow-glow",
  "en-myth",
  "en-hope",
  "en-council",
  "en-advent",
  "en-justice",
  "id-gen-1",
  "id-gen-2",
  "id-gen-3",
];

export const HOLOMEM_BY_ID: Record<string, Holomem> = Object.fromEntries(
  MEMBERS.map((member) => [member.id, member]),
);

export const HOLOMEM_IDS = new Set(MEMBERS.map((member) => member.id));

export function getHolomemGenerations(): HolomemGeneration[] {
  return GENERATION_ORDER.map((id) => ({
    id,
    label: GENERATION_LABELS[id],
    members: MEMBERS.filter((member) => member.generationId === id),
  }));
}

export function filterValidOshiIds(ids: string[]): string[] {
  const unique = new Set<string>();
  for (const id of ids) {
    if (HOLOMEM_IDS.has(id)) unique.add(id);
  }
  return [...unique];
}
