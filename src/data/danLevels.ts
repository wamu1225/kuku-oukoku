export interface DanLevel {
  rank: number;
  name: string;
  source: number[];
  count: number;
  goldTimeMs: number;
  silverTimeMs: number;
  limitMs: number;
}

// 1問あたりの基準ペース。問題数(15/50/100)を掛けても秒数が整数になる値にする。
// limit(=銅クリア) も問題数に連動させ、銀タイムが制限時間を超えない（到達不能にならない）ようにする。
const GOLD_PACE = 1600;
const SILVER_PACE = 2400;
const BRONZE_PACE = 6000;

const makeLevel = (rank: number, name: string, source: number[], count: number): DanLevel => ({
  rank, name, source, count,
  goldTimeMs: count * GOLD_PACE,
  silverTimeMs: count * SILVER_PACE,
  limitMs: count * BRONZE_PACE,
});

const standardLevel = (rank: number, name: string, level: number): DanLevel =>
  makeLevel(rank, name, [level], 15);

export const DAN_LEVELS: DanLevel[] = [
  standardLevel(1, '10級', 1),
  standardLevel(2, '9級', 2),
  standardLevel(3, '8級', 3),
  standardLevel(4, '7級', 4),
  standardLevel(5, '6級', 5),
  standardLevel(6, '5級', 6),
  standardLevel(7, '4級', 7),
  standardLevel(8, '3級', 8),
  standardLevel(9, '2級', 9),
  makeLevel(10, '1級', [1, 2, 3, 4, 5, 6, 7, 8, 9], 15),
  standardLevel(11, '初段', 10),
  standardLevel(12, '二段', 11),
  standardLevel(13, '三段', 12),
  standardLevel(14, '四段', 13),
  standardLevel(15, '五段', 14),
  standardLevel(16, '六段', 15),
  standardLevel(17, '七段', 16),
  standardLevel(18, '八段', 17),
  standardLevel(19, '九段', 18),
  standardLevel(20, '十段', 19),
  standardLevel(21, '皆伝', 20),
  makeLevel(22, '名人', Array.from({ length: 20 }, (_, i) => i + 1), 50),
  makeLevel(23, '伝説', Array.from({ length: 20 }, (_, i) => i + 1), 100),
];

export const getDanRankName = (rank: number): string => {
  const lv = DAN_LEVELS.find((d) => d.rank === rank);
  if (lv) return lv.name;
  return rank <= 0 ? 'みならい' : '伝説';
};

export const getNextDan = (currentRank: number): DanLevel | null => {
  return DAN_LEVELS.find((d) => d.rank === currentRank + 1) ?? null;
};
