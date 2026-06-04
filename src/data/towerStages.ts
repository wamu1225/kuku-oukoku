// タワーの各ステージ定義とメダル基準スコアの唯一の正（SSOT）。
// 画面（Tower.tsx）とエンジン（LearningEngine.saveTowerResult）が共通でここを参照する。
export interface TowerStage {
  id: string;
  name: string;
  max: number;
  diamond: number; // 隠し（金より上）
  gold: number;
  silver: number;
  bronze: number;
  unlockRank?: number;
  requiresTrial?: boolean;
  requiresStage4Gold?: boolean;
}

export const TOWER_STAGES: TowerStage[] = [
  { id: '3', name: 'そよ風の塔', max: 3, unlockRank: 2, diamond: 350, gold: 230, silver: 150, bronze: 80 },
  { id: '6', name: '雲海の見張り塔', max: 6, unlockRank: 5, diamond: 700, gold: 460, silver: 300, bronze: 160 },
  { id: '9', name: '迅雷の尖塔', max: 9, unlockRank: 8, diamond: 950, gold: 630, silver: 410, bronze: 220 },
  { id: '15', name: '月光の天楼', max: 15, diamond: 1200, gold: 800, silver: 520, bronze: 280, requiresTrial: true },
  { id: '20', name: '星天の頂', max: 20, diamond: 1500, gold: 1000, silver: 650, bronze: 350, requiresTrial: true, requiresStage4Gold: true },
];

export type TowerMedal = 'diamond' | 'gold' | 'silver' | 'bronze' | 'clear';

// 到達スコアからメダルを判定（ダイヤは隠しの最上位）
export function getTowerMedal(diffId: string, score: number): TowerMedal {
  const s = TOWER_STAGES.find((x) => x.id === diffId) ?? TOWER_STAGES.find((x) => x.id === '9')!;
  if (score >= s.diamond) return 'diamond';
  if (score >= s.gold) return 'gold';
  if (score >= s.silver) return 'silver';
  if (score >= s.bronze) return 'bronze';
  return 'clear';
}
