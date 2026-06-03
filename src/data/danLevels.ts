export interface DanLevel {
  rank: number;
  name: string;
  source: number[];
  count: number;
  goldTimeMs: number;
  silverTimeMs: number;
}

// 1問あたりの基準ペース。問題数(15/50/100)を掛けても秒数が整数になる値にする
const GOLD_PACE = 1600;
const SILVER_PACE = 2400;

const standardLevel = (rank: number, name: string, level: number): DanLevel => ({
  rank, name, source: [level], count: 15,
  goldTimeMs: 15 * GOLD_PACE, silverTimeMs: 15 * SILVER_PACE,
});

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
  { rank: 10, name: '1級', source: [1, 2, 3, 4, 5, 6, 7, 8, 9], count: 15, goldTimeMs: 15 * GOLD_PACE, silverTimeMs: 15 * SILVER_PACE },
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
  { rank: 22, name: '名人', source: Array.from({ length: 20 }, (_, i) => i + 1), count: 50, goldTimeMs: 50 * GOLD_PACE, silverTimeMs: 50 * SILVER_PACE },
  { rank: 23, name: '伝説', source: Array.from({ length: 20 }, (_, i) => i + 1), count: 100, goldTimeMs: 100 * GOLD_PACE, silverTimeMs: 100 * SILVER_PACE },
];

export const getDanRankName = (rank: number): string => {
  const lv = DAN_LEVELS.find((d) => d.rank === rank);
  if (lv) return lv.name;
  return rank <= 0 ? 'みならい' : '伝説';
};

export const getNextDan = (currentRank: number): DanLevel | null => {
  return DAN_LEVELS.find((d) => d.rank === currentRank + 1) ?? null;
};
