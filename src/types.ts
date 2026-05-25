export interface KukuResult {
  a: number;
  b: number;
  correctCount: number;
  lastCorrectDate: string | null;
  nextReviewDate: string | null;
  averageTimeMs: number;
}

export interface TableBest {
  level: number;
  bestTimeMs: number;
  badge: 'gold' | 'silver' | 'bronze' | 'clear' | null;
  isCompleted?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'mastery_count' | 'total_correct';
  target: number;
  level?: number;
  progress: number;
  reward: { type: 'kp' | 'stamps'; amount: number };
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface KukuState {
  results: Record<string, KukuResult>;
  tableBests: Record<number, TableBest>;
  totalStamps: number;
  rank: string;
  kp: number;
  companions: Record<number, number>;
  prestigeCount: number;
  lastSeenDate: string | null;
  mastery: Record<number, number>;
  festivalUntil: Record<number, number>;

  activeQuests?: Quest[];
  unlockedTitles?: string[];
  currentTitle?: string;

  danRank?: number;
  danBestTimes?: Record<number, number>;
  danMedals?: Record<number, 'gold' | 'silver' | 'bronze' | 'clear'>;

  wisdomSeals?: string[];
  royalTreasures?: string[];
  studyHistory?: string[];
  dailyStreak?: { lastDate: string; count: number };

  stats?: {
    totalLearnPlays?: number;
    totalAttackPlays?: number;
    totalAttackCorrect?: number;
    totalDanSolved?: number;
    totalTrialsCleared?: number;
    maxCombo?: number;
    battleTotalDefeated?: number;
    battleMaxDefeatedPerDiff?: Record<string, number>;
    battleWeeklyBestPerDiff?: Record<string, number>;
    towerBestHeightsPerDiff?: Record<string, number>;
    towerWeeklyBestHeightsPerDiff?: Record<string, number>;
    towerMedalsPerDiff?: Record<string, 'gold' | 'silver' | 'bronze' | 'clear'>;
  };

  challengeBestTimes?: Record<string, number>;
  blankMedalsPerDiff?: Record<string, 'gold' | 'silver' | 'bronze' | 'clear'>;

  unlockedModes?: ('learn' | 'attack' | 'empire' | 'dan')[];
  unlockedLevels?: number[];

  settings?: {
    showAnswerHint?: boolean;
    bgColor?: string;
    hapticsEnabled?: boolean;
  };
}
