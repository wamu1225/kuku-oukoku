import type { KukuState } from '../types';
import { DateUtils } from './DateUtils';
import { IdleManager, MAX_KP } from './IdleManager';
import { getDanRankName, DAN_LEVELS } from '../data/danLevels';
import { getTowerMedal } from '../data/towerStages';
import { KUKU_READINGS } from '../data/kukuReadings';

const STORAGE_KEY = 'kuku-oukoku:state';

const getInitialState = (): KukuState => ({
  results: {},
  tableBests: {},
  totalStamps: 0,
  rank: 'みならい',
  kp: 0,
  companions: {},
  prestigeCount: 0,
  lastSeenDate: new Date().toISOString(),
  mastery: {},
  festivalUntil: {},
  activeQuests: [],
  unlockedTitles: ['九九のみならい'],
  currentTitle: '九九のみならい',
  unlockedModes: ['learn'],
  unlockedLevels: [1],
  settings: { showAnswerHint: false, bgColor: '#ffffff', hapticsEnabled: true },
  danRank: 0,
  wisdomSeals: [],
  royalTreasures: [],
  dailyStreak: { lastDate: DateUtils.getLocalDateString(), count: 0 },
  stats: {
    totalLearnPlays: 0,
    totalAttackPlays: 0,
    totalAttackCorrect: 0,
    totalDanSolved: 0,
    maxCombo: 0,
  },
  danMedals: {},
  studyHistory: [],
});

// dan rank → 段番号 の対応を返す（mixed-segment ranks は null）
function danRankToSegmentLevel(rank: number): number | null {
  if (rank >= 1 && rank <= 9) return rank;       // 10級〜2級 → 1〜9の段
  if (rank >= 11 && rank <= 21) return rank - 1; // 初段〜皆伝 → 10〜20の段
  // rank 10 (1級: 1-9 mixed), 22 (名人), 23 (伝説) は対応 seal なし
  return null;
}

const sanitize = (raw: unknown): KukuState => {
  const init = getInitialState();
  if (!raw || typeof raw !== 'object') return init;
  const p = raw as Partial<KukuState>;
  const merged: KukuState = { ...init, ...p };

  // Migration (2026-05-27): completeDanTest が誤って rank ベースで seal を付与していたバグの掃除
  // 各 seal_X は「X の段の印」を意味するので、tableBests[X].isCompleted か
  // 対応する dan medal がない場合は誤付与とみなして除去する。
  if (merged.wisdomSeals && merged.wisdomSeals.length > 0) {
    merged.wisdomSeals = merged.wisdomSeals.filter((sealId) => {
      const m = /^seal_(\d+)$/.exec(sealId);
      if (!m) return true;
      const segLv = parseInt(m[1]);
      if (segLv < 1 || segLv > 20) return false; // seal_21+ は存在しないので除去
      // 正当な根拠：(a) tableBests[segLv].isCompleted (b) 対応する dan rank の medal がある
      const learnLegit = (merged.tableBests?.[segLv]?.isCompleted) === true;
      const danRankForSeg = segLv <= 9 ? segLv : segLv + 1; // 1〜9段→rank=同, 10〜20段→rank=段+1
      const danLegit = merged.danMedals && merged.danMedals[danRankForSeg] != null;
      return learnLegit || !!danLegit;
    });
  }
  if (!merged.results) merged.results = {};
  if (!merged.tableBests) merged.tableBests = {};
  if (typeof merged.kp !== 'number' || isNaN(merged.kp)) merged.kp = 0;
  else if (merged.kp > MAX_KP) merged.kp = MAX_KP;
  if (typeof merged.totalStamps !== 'number') merged.totalStamps = 0;
  if (!merged.rank) merged.rank = 'みならい';
  if (!merged.companions) merged.companions = {};
  Object.keys(merged.companions).forEach((k) => {
    const v = (merged.companions as Record<string, number>)[k];
    if (typeof v !== 'number' || isNaN(v)) (merged.companions as Record<string, number>)[k] = 0;
  });
  if (!merged.mastery) merged.mastery = {};
  Object.keys(merged.mastery).forEach((k) => {
    const v = (merged.mastery as Record<string, number>)[k];
    if (typeof v !== 'number' || isNaN(v)) (merged.mastery as Record<string, number>)[k] = 0;
  });
  if (!merged.festivalUntil) merged.festivalUntil = {};
  if (!merged.unlockedModes) merged.unlockedModes = ['learn'];
  if (!merged.unlockedLevels) merged.unlockedLevels = [1];
  if (!merged.settings) merged.settings = { showAnswerHint: false, bgColor: '#ffffff', hapticsEnabled: true };
  if (!merged.stats) merged.stats = {};
  if (!merged.wisdomSeals) merged.wisdomSeals = [];
  if (!merged.royalTreasures) merged.royalTreasures = [];
  if (!merged.studyHistory) merged.studyHistory = [];
  if (!merged.danMedals) merged.danMedals = {};
  if (!merged.danBestTimes) merged.danBestTimes = {};
  if (typeof merged.danRank !== 'number') merged.danRank = 0;
  if (!merged.dailyStreak) merged.dailyStreak = { lastDate: DateUtils.getLocalDateString(), count: 0 };
  return merged;
};

function _syncUnlockedLevels(state: KukuState) {
  const danRank = state.danRank || 0;
  const trialCleared = (state.stats?.totalTrialsCleared || 0) > 0;
  const newUnlockedLevels = new Set<number>([1, 2, 3]);
  if (danRank >= 3) [4, 5, 6].forEach((l) => newUnlockedLevels.add(l));
  if (danRank >= 6) [7, 8, 9].forEach((l) => newUnlockedLevels.add(l));
  if (trialCleared) newUnlockedLevels.add(10);
  if (danRank >= 11) [11, 12, 13].forEach((l) => newUnlockedLevels.add(l));
  if (danRank >= 14) [14, 15, 16].forEach((l) => newUnlockedLevels.add(l));
  if (danRank >= 17) [17, 18, 19].forEach((l) => newUnlockedLevels.add(l));
  if (danRank >= 20) newUnlockedLevels.add(20);
  Object.keys(state.companions).forEach((levelStr) => {
    const lvl = parseInt(levelStr);
    if ((state.companions[lvl] || 0) > 0) newUnlockedLevels.add(lvl);
  });
  state.unlockedLevels = Array.from(newUnlockedLevels).sort((a, b) => a - b);
}

function _checkAchievements(state: KukuState) {
  if (!state.wisdomSeals) state.wisdomSeals = [];
  if (!state.royalTreasures) state.royalTreasures = [];
  if (!state.stats) state.stats = {};

  const hasAny = (id: string) => state.wisdomSeals!.includes(id) || state.royalTreasures!.includes(id);
  const add = (id: string) => {
    if (id.startsWith('seal_')) {
      if (!state.wisdomSeals!.includes(id)) state.wisdomSeals!.push(id);
    } else {
      if (!state.royalTreasures!.includes(id)) state.royalTreasures!.push(id);
    }
  };

  for (let l = 1; l <= 20; l++) {
    const id = `seal_${l}`;
    if (!hasAny(id) && state.tableBests?.[l]?.isCompleted) add(id);
  }
  // dan medals からも seal を付与（段番号ベース）
  Object.keys(state.danMedals || {}).forEach((rankStr) => {
    const rank = parseInt(rankStr);
    const segLv = danRankToSegmentLevel(rank);
    if (segLv !== null) {
      const id = `seal_${segLv}`;
      if (!hasAny(id)) add(id);
    }
  });

  const totalCompanions = Object.values(state.companions || {}).reduce((a, b) => a + b, 0);
  if (!hasAny('treasure_1') && totalCompanions >= 10) add('treasure_1');
  if (!hasAny('treasure_2') && state.kp >= 10000) add('treasure_2');
  if (!hasAny('treasure_3') && totalCompanions >= 50) add('treasure_3');
  if (!hasAny('treasure_4') && state.kp >= 1000000) add('treasure_4');
  if (!hasAny('treasure_5') && totalCompanions >= 100) add('treasure_5');
  if (!hasAny('treasure_6') && state.kp >= 1e8) add('treasure_6');
  const hasLegendary = Object.keys(state.companions || {}).some(
    (k) => parseInt(k) >= 10 && (state.companions[parseInt(k)] || 0) > 0
  );
  if (!hasAny('treasure_7') && hasLegendary) add('treasure_7');
  if (!hasAny('treasure_8') && (state.prestigeCount || 0) >= 2) add('treasure_8');
  if (!hasAny('treasure_9') && state.kp >= 1e12) add('treasure_9');
  if (!hasAny('treasure_10') && state.kp >= 1e15) add('treasure_10');
  // 最後のなかま（段21）を迎えたら「創世の冠」
  if (!hasAny('treasure_11') && (state.companions?.[21] || 0) > 0) add('treasure_11');

  const totalMastery = Object.values(state.mastery || {}).reduce((a, b) => a + (b as number), 0);
  if (!hasAny('medal_1') && state.totalStamps >= 10) add('medal_1');
  if (!hasAny('medal_4') && state.totalStamps >= 100) add('medal_4');
  if (!hasAny('medal_9') && state.totalStamps >= 500) add('medal_9');

  const fastAttack = Object.values(state.tableBests || {}).some(
    (b) => b.bestTimeMs > 0 && b.bestTimeMs <= 15000
  );
  if (!hasAny('medal_3') && fastAttack) add('medal_3');

  if (!hasAny('medal_2') && (state.stats?.battleTotalDefeated || 0) >= 20) add('medal_2');
  if (!hasAny('medal_5') && (state.stats?.maxCombo || 0) >= 5) add('medal_5');
  const towerBest300 = Object.values(state.stats?.towerBestHeightsPerDiff || {}).some((v) => v >= 300);
  if (!hasAny('wisdom_gem') && towerBest300) add('wisdom_gem');
  const towerBest1000 = Object.values(state.stats?.towerBestHeightsPerDiff || {}).some((v) => v >= 1000);
  if (!hasAny('medal_8') && towerBest1000) add('medal_8');
  if (!hasAny('medal_10') && (state.stats?.battleTotalDefeated || 0) >= 100) add('medal_10');
  if (!hasAny('relic_4') && isGoldOrBetter(state.blankMedalsPerDiff?.['3'])) add('relic_4');
  if (!hasAny('relic_5') && isGoldOrBetter(state.blankMedalsPerDiff?.['6'])) add('relic_5');
  if (!hasAny('relic_7') && isGoldOrBetter(state.blankMedalsPerDiff?.['9'])) add('relic_7');
  if (!hasAny('medal_7') && (state.stats?.totalTrialsCleared || 0) > 0) add('medal_7');

  // Title auto-award based on totalMastery
  if (!state.unlockedTitles) state.unlockedTitles = ['九九のみならい'];
  const titleThresholds = [
    { name: '九九の騎士', target: 100 },
    { name: 'おうこくの勇者', target: 500 },
    { name: '九九マスター', target: 1000 },
    { name: '伝説の賢者', target: 5000 },
  ];
  for (const t of titleThresholds) {
    if (totalMastery >= t.target && !state.unlockedTitles.includes(t.name)) {
      state.unlockedTitles.push(t.name);
    }
  }

  if (!hasAny('relic_1') && totalMastery >= 15) add('relic_1');
  if (!hasAny('relic_2') && (state.stats?.totalLearnPlays || 0) >= 10) add('relic_2');
  if (!hasAny('relic_3') && totalMastery >= 100) add('relic_3');
  if (!hasAny('relic_6') && (state.dailyStreak?.count || 0) >= 3) add('relic_6');
  if (!hasAny('relic_8') && totalMastery >= 500) add('relic_8');
  if (!hasAny('relic_9') && totalMastery >= 5000) add('relic_9');
  // 1級 (rank 10) を金メダル取得 = 1〜9 段ランダム 15 問を金タイム以内（danLevels.ts 基準）
  if (!hasAny('relic_10') && isGoldOrBetter(state.danMedals?.[10])) add('relic_10');
}

function _updateHabit(state: KukuState, isActivity: boolean) {
  const today = DateUtils.getLocalDateString();
  if (!state.studyHistory) state.studyHistory = [];
  if (isActivity && !state.studyHistory.includes(today)) {
    state.studyHistory.push(today);
  }
  const history = [...new Set(state.studyHistory)].sort().reverse();
  if (history.length === 0) {
    state.dailyStreak = { lastDate: today, count: 0 };
    return;
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = DateUtils.getLocalDateString(yesterday);
  const lastHistoryDay = history[0];
  const isContinuous = lastHistoryDay === today || lastHistoryDay === yesterdayStr;
  if (!isContinuous) {
    state.dailyStreak = { lastDate: today, count: 1 };
  } else {
    let count = 0;
    const checkDate = new Date(lastHistoryDay);
    for (const dateStr of history) {
      if (dateStr === DateUtils.getLocalDateString(checkDate)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    state.dailyStreak = { lastDate: lastHistoryDay, count };
  }
}

function _updateRank(state: KukuState) {
  state.rank = getDanRankName(state.danRank || 0);
}

// アクティブプレイ報酬：現在の生産(KPS)×秒数を「前借り」として付与し、付与額を返す。
// 放置収入が指数的に伸びても各モードの報酬が相対的に無意味化しないようにする。
function _grantTimeBonus(state: KukuState, seconds: number): number {
  const kps = IdleManager.calculateKPS(state);
  const bonus = Math.floor(kps * seconds);
  if (bonus > 0) state.kp = Math.min(MAX_KP, state.kp + bonus);
  return bonus;
}

// 指定段リストから1段をランダムに選び、その段の祝祭(30分)を発動。選んだ段を返す。
// ※KPS 計算より後に呼ぶこと（祝祭で自分のボーナスを水増ししないため）
function _triggerFestivalRandom(state: KukuState, levels: number[]): number {
  if (!state.festivalUntil) state.festivalUntil = {};
  const level = levels[Math.floor(Math.random() * levels.length)];
  state.festivalUntil[level] = Date.now() + 30 * 60 * 1000;
  return level;
}

const rangeLevels = (max: number): number[] =>
  Array.from({ length: max }, (_, i) => i + 1);

// ステージ難易度倍率（段の上限で決定）
function _stageDifficultyMult(topLevel: number): number {
  if (topLevel <= 3) return 1.0;
  if (topLevel <= 6) return 1.3;
  if (topLevel <= 9) return 1.6;
  if (topLevel <= 15) return 2.0;
  return 2.5;
}

// メダル倍率（実績）。ダイヤは隠しの上位だが倍率は金と同等
function _medalMult(medal: string | null | undefined): number {
  if (medal === 'diamond') return 2.0;
  if (medal === 'gold') return 2.0;
  if (medal === 'silver') return 1.5;
  if (medal === 'bronze') return 1.2;
  return 1.0;
}

// アタック/くもくも/タワー/バトル共通：60秒 × 難易度 × メダル の時間ボーナスを付与
function _grantScaledBonus(state: KukuState, topLevel: number, medal: string | null | undefined): number {
  const seconds = 60 * _stageDifficultyMult(topLevel) * _medalMult(medal);
  return _grantTimeBonus(state, seconds);
}

// クエスト(KP型)の報酬秒数。KPS連動にして放置収入に埋もれないようにする
export const QUEST_KP_SECONDS = 180;

// ダイヤは金より上位なので「金以上」判定に含める（解禁・実績の取りこぼし防止）
export const isGoldOrBetter = (m: string | null | undefined): boolean => m === 'gold' || m === 'diamond';

// 銀以上（銀・金・ダイヤ）
const isSilverOrBetter = (m: string | null | undefined): boolean => m === 'silver' || m === 'gold' || m === 'diamond';
const STAGE_IDS = ['3', '6', '9', '15', '20'];
const BATTLE_SILVER_COUNT = 7; // バトルの銀相当（撃破数）

// 「最後のなかま」招待条件：全モード・全段/全ステージで銀以上のコンプリート進捗
export function silverCompletion(state: KukuState): { done: number; total: number; missing: number } {
  let total = 0;
  let done = 0;
  const check = (ok: boolean) => { total++; if (ok) done++; };
  // アタック：段1〜20
  for (let l = 1; l <= 20; l++) check(isSilverOrBetter(state.tableBests?.[l]?.badge));
  // だん：rank1〜23（10級〜伝説）
  for (let r = 1; r <= 23; r++) check(isSilverOrBetter(state.danMedals?.[r]));
  // タワー・くもくも・バトル：各5ステージ
  for (const id of STAGE_IDS) {
    check(isSilverOrBetter(state.stats?.towerMedalsPerDiff?.[id]));
    check(isSilverOrBetter(state.blankMedalsPerDiff?.[id]));
    check((state.stats?.battleMaxDefeatedPerDiff?.[id] || 0) >= BATTLE_SILVER_COUNT);
  }
  return { done, total, missing: total - done };
}
export const hasAllSilver = (state: KukuState): boolean => silverCompletion(state).missing === 0;

export type Medal = 'diamond' | 'gold' | 'silver' | 'bronze' | 'clear';
// アタックのタイム→バッジ（💎13/金15/銀25/銅40秒）。ダイヤは隠し
const _attackBadge = (ms: number): Medal =>
  ms <= 13000 ? 'diamond' : ms <= 15000 ? 'gold' : ms <= 25000 ? 'silver' : ms <= 40000 ? 'bronze' : 'clear';
// くもくものタイム→メダル（💎13/金15/銀25秒、クリアは銅）
const _blankBadge = (ms: number): Medal =>
  ms <= 13000 ? 'diamond' : ms <= 15000 ? 'gold' : ms <= 25000 ? 'silver' : 'bronze';

function _replenishQuests(state: KukuState) {
  if (!state.activeQuests) state.activeQuests = [];
  // Cleanup duplicates
  const seen = new Set<string>();
  state.activeQuests = state.activeQuests.filter((q) => {
    if (seen.has(q.title)) return false;
    seen.add(q.title);
    return true;
  });

  let attempts = 0;
  while (state.activeQuests.length < 3 && attempts < 30) {
    attempts++;
    const useMastery = Math.random() < 0.66; // bias toward mastery quests
    if (useMastery) {
      const available = (state.unlockedLevels ?? [1]).filter((l) => l <= 9);
      const level = available[Math.floor(Math.random() * available.length)];
      const title = `${level}の段 特訓！`;
      if (state.activeQuests.some((q) => q.title === title)) continue;
      const current = state.mastery?.[level] || 0;
      let target = 50;
      if (current < 5) target = 5;
      else if (current < 15) target = 15;
      else if (current < 30) target = 30;
      else target = (Math.floor(current / 50) + 1) * 50;
      state.activeQuests.push({
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title,
        description: `${level}の段を 合計${target}回 とこう！`,
        type: 'mastery_count',
        target,
        level,
        progress: current,
        reward: { type: 'kp', amount: target * 50 },
        isCompleted: current >= target,
        isClaimed: false,
      });
    } else {
      const title = 'おうこくの広がり';
      if (state.activeQuests.some((q) => q.title === title)) continue;
      const total = Object.values(state.mastery || {}).reduce<number>((a, b) => a + (b as number), 0);
      let target = 100;
      if (total < 20) target = 20;
      else if (total < 50) target = 50;
      else target = (Math.floor(total / 100) + 1) * 100;
      state.activeQuests.push({
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title,
        description: `九九を 合計で ${target}回 とこう！\n（どのモードでも OK）`,
        type: 'total_correct',
        target,
        progress: total,
        reward: { type: 'stamps', amount: 5 },
        isCompleted: total >= target,
        isClaimed: false,
      });
    }
  }
}

function _updateQuestProgress(state: KukuState) {
  if (!state.activeQuests) return;
  const total = Object.values(state.mastery || {}).reduce<number>((a, b) => a + (b as number), 0);
  state.activeQuests.forEach((q) => {
    if (q.isClaimed) return;
    if (q.type === 'mastery_count' && q.level != null) {
      q.progress = state.mastery?.[q.level] || 0;
    } else if (q.type === 'total_correct') {
      q.progress = total;
    }
    if (q.progress >= q.target) q.isCompleted = true;
  });
}

export const LearningEngine = {
  loadState(): KukuState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const state = sanitize(parsed);
      _syncUnlockedLevels(state);
      _replenishQuests(state);
      _updateQuestProgress(state);
      return state;
    } catch (e) {
      console.error('LearningEngine.loadState failed', e);
      return getInitialState();
    }
  },

  claimQuest(questId: string): KukuState {
    const state = this.loadState();
    const q = state.activeQuests?.find((x) => x.id === questId);
    if (!q || !q.isCompleted || q.isClaimed) return state;
    // KP 報酬は KPS 連動（固定額だと放置収入に埋もれるため）
    if (q.reward.type === 'kp') _grantTimeBonus(state, QUEST_KP_SECONDS);
    else if (q.reward.type === 'stamps') state.totalStamps += q.reward.amount;
    state.activeQuests = state.activeQuests?.filter((x) => x.id !== questId);
    _replenishQuests(state);
    _checkAchievements(state);
    this.saveState(state);
    return state;
  },

  saveState(state: KukuState): void {
    try {
      if (typeof state.kp === 'number' && state.kp > MAX_KP) state.kp = MAX_KP;
      state.lastSeenDate = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('LearningEngine.saveState failed', e);
    }
  },

  addKP(amount: number): KukuState {
    const state = this.loadState();
    state.kp += Math.floor(amount);
    _checkAchievements(state);
    this.saveState(state);
    return state;
  },

  inviteCompanion(level: number, cost: number): KukuState {
    const state = this.loadState();
    if (state.kp < cost) return state;
    state.kp -= cost;
    state.companions[level] = (state.companions[level] || 0) + 1;
    _syncUnlockedLevels(state);
    _checkAchievements(state);
    this.saveState(state);
    return state;
  },

  inviteCompanionsBulk(updates: Record<number, number>, totalCost: number): KukuState {
    const state = this.loadState();
    if (state.kp < totalCost) return state;
    state.kp -= totalCost;
    state.companions = { ...state.companions, ...updates };
    _syncUnlockedLevels(state);
    _checkAchievements(state);
    this.saveState(state);
    return state;
  },

  triggerFestival(level: number): KukuState {
    const state = this.loadState();
    state.festivalUntil[level] = Date.now() + 30 * 60 * 1000;
    this.saveState(state);
    return state;
  },

  setLearningCompleted(level: number): { state: KukuState; kpGained: number } {
    const state = this.loadState();
    if (!state.stats) state.stats = {};
    state.stats.totalLearnPlays = (state.stats.totalLearnPlays || 0) + 1;

    const current = state.tableBests[level] || { level, bestTimeMs: 0, badge: null, isCompleted: false };
    current.isCompleted = true;
    state.tableBests[level] = current;

    state.mastery[level] = (state.mastery[level] || 0) + 9;
    state.kp += 100;
    const bonus = _grantTimeBonus(state, 30);
    state.totalStamps += 1;

    if (level === 1) {
      if (!state.unlockedModes) state.unlockedModes = ['learn'];
      if (!state.unlockedModes.includes('attack')) state.unlockedModes.push('attack');
    }

    _updateHabit(state, true);
    _checkAchievements(state);
    this.saveState(state);
    return { state, kpGained: 100 + bonus };
  },

  saveTimeAttackResult(level: number, timeMs: number): { state: KukuState; isNewBest: boolean; kpGained: number; festivalLevel: number; runBadge: Medal } {
    const state = this.loadState();
    if (!state.stats) state.stats = {};
    state.stats.totalAttackPlays = (state.stats.totalAttackPlays || 0) + 1;
    state.stats.totalAttackCorrect = (state.stats.totalAttackCorrect || 0) + 9;

    if (timeMs < 1000) return { state, isNewBest: false, kpGained: 0, festivalLevel: level, runBadge: 'clear' };

    const currentBest = state.tableBests[level] || {
      level, bestTimeMs: 0, badge: null, isCompleted: false,
    };
    const runBadge = _attackBadge(timeMs); // この回の成績（時間ボーナス用）

    let isNewBest = false;
    if (currentBest.bestTimeMs === 0 || timeMs < currentBest.bestTimeMs) {
      currentBest.bestTimeMs = timeMs;
      isNewBest = true;
    }
    // バッジは常にベストタイムから現行基準で再評価（ベスト未更新でもダイヤ昇格を反映）
    currentBest.badge = _attackBadge(currentBest.bestTimeMs);
    currentBest.isCompleted = true;
    state.tableBests[level] = currentBest;
    state.totalStamps += 5;

    state.mastery[level] = (state.mastery[level] || 0) + 9;
    for (let i = 1; i <= 9; i++) {
      const key = `${level}x${i}`;
      if (!state.results[key]) {
        state.results[key] = {
          a: level, b: i, correctCount: 0, lastCorrectDate: null, nextReviewDate: null, averageTimeMs: 0,
        };
      }
      state.results[key].correctCount += 1;
      state.results[key].lastCorrectDate = new Date().toISOString();
    }

    state.kp += 100;
    const bonus = _grantScaledBonus(state, level, runBadge);
    state.festivalUntil[level] = Date.now() + 30 * 60 * 1000;

    if (level === 1) {
      if (!state.unlockedModes) state.unlockedModes = ['learn'];
      if (!state.unlockedModes.includes('empire')) state.unlockedModes.push('empire');
      if (!state.unlockedModes.includes('dan')) state.unlockedModes.push('dan');
    }

    _updateHabit(state, true);
    _checkAchievements(state);
    _updateRank(state);
    this.saveState(state);
    return { state, isNewBest, kpGained: 100 + bonus, festivalLevel: level, runBadge };
  },

  // 各モードで「実際に解いた段」を熟練度に加算する（まなぶ/アタックと同じ 1問1カウント）
  _applySolvedMastery(state: KukuState, solvedByLevel?: Record<number, number>): void {
    if (!solvedByLevel) return;
    if (!state.mastery) state.mastery = {};
    for (const key in solvedByLevel) {
      const level = parseInt(key);
      const n = solvedByLevel[key];
      if (level >= 1 && n > 0) state.mastery[level] = (state.mastery[level] || 0) + n;
    }
  },

  completeDanTest(rank: number, timeTakenMs: number, solvedByLevel?: Record<number, number>): { state: KukuState; kpGained: number; festivalLevel: number; runMedal: Medal } {
    const state = this.loadState();
    if (!state.danBestTimes) state.danBestTimes = {};
    const currentBest = state.danBestTimes[rank] || Infinity;
    if (timeTakenMs < currentBest) {
      state.danBestTimes[rank] = timeTakenMs;
    }

    if (!state.danMedals) state.danMedals = {};
    // 基準タイム・問題数は danLevels.ts を唯一の正とする（表示と判定のズレを防ぐ）
    const dan = DAN_LEVELS.find((d) => d.rank === rank);
    const problems = dan?.count ?? 15;
    const danMedalFor = (ms: number): Medal =>
      dan && ms <= dan.diamondTimeMs ? 'diamond'
      : dan && ms <= dan.goldTimeMs ? 'gold'
      : dan && ms <= dan.silverTimeMs ? 'silver'
      : 'bronze';
    const runMedal = danMedalFor(timeTakenMs); // この回の成績（結果画面用）
    // 保存メダルは常にベストタイムから現行基準で再評価（ベスト未更新でもダイヤ昇格を反映）
    state.danMedals[rank] = danMedalFor(state.danBestTimes[rank] ?? timeTakenMs);

    const isPromotion = (state.danRank || 0) < rank;
    if (isPromotion) {
      state.danRank = rank;
      // seal 付与は _checkAchievements 内で dan medal ベースに段番号→seal_X として行う
      if (!state.wisdomSeals) state.wisdomSeals = [];
    }

    // 時間ボーナス：一律60秒。初昇段時は節目として rank×30秒 を追加（KPS連動でスケール）
    const baseBonus = _grantTimeBonus(state, 60);
    const promoBonus = isPromotion ? _grantTimeBonus(state, rank * 30) : 0;
    // 祝祭：出題範囲の段から1段ランダムに発動
    const festivalLevel = _triggerFestivalRandom(state, dan ? dan.source : [rank]);

    if (!state.stats) state.stats = {};
    state.stats.totalDanSolved = (state.stats.totalDanSolved || 0) + problems;

    this._applySolvedMastery(state, solvedByLevel);

    _updateHabit(state, true);
    _checkAchievements(state);
    _updateRank(state);
    _syncUnlockedLevels(state);
    this.saveState(state);
    return { state, kpGained: baseBonus + promoBonus, festivalLevel, runMedal };
  },

  saveBattleResult(diffId: string, count: number, combo: number, solvedByLevel?: Record<number, number>): { state: KukuState; kpGained: number; festivalLevel: number } {
    const state = this.loadState();
    if (!state.stats) state.stats = {};
    this._applySolvedMastery(state, solvedByLevel);
    state.stats.battleTotalDefeated = (state.stats.battleTotalDefeated || 0) + count;
    if (combo > (state.stats.maxCombo || 0)) state.stats.maxCombo = combo;
    if (!state.stats.battleMaxDefeatedPerDiff) state.stats.battleMaxDefeatedPerDiff = {};
    if (count > (state.stats.battleMaxDefeatedPerDiff[diffId] || 0)) {
      state.stats.battleMaxDefeatedPerDiff[diffId] = count;
    }
    state.kp += count * 50;
    // 10体ごとのゴールデンエネミー累積ボーナス
    const goldenEnemies = Math.floor(count / 10);
    state.kp += goldenEnemies * 10000;
    // 1体も倒していなければ時間ボーナス・祝祭は無し（無操作放置の抜け道を防ぐ）
    const max = parseInt(diffId);
    let bonus = 0;
    let festivalLevel = 0;
    if (count > 0) {
      // 撃破数からメダル相当を判定（💎14体/金12体/銀7体/銅1体）
      const battleMedal = count >= 14 ? 'diamond' : count >= 12 ? 'gold' : count >= 7 ? 'silver' : 'bronze';
      bonus = _grantScaledBonus(state, max, battleMedal);
      festivalLevel = _triggerFestivalRandom(state, rangeLevels(max));
    }
    _updateHabit(state, true);
    _checkAchievements(state);
    this.saveState(state);
    return { state, kpGained: count * 50 + goldenEnemies * 10000 + bonus, festivalLevel };
  },

  saveTowerResult(diffId: string, score: number, solvedByLevel?: Record<number, number>): { state: KukuState; kpGained: number; festivalLevel: number } {
    const state = this.loadState();
    if (!state.stats) state.stats = {};
    this._applySolvedMastery(state, solvedByLevel);
    if (!state.stats.towerBestHeightsPerDiff) state.stats.towerBestHeightsPerDiff = {};
    if (score > (state.stats.towerBestHeightsPerDiff[diffId] || 0)) {
      state.stats.towerBestHeightsPerDiff[diffId] = score;
    }
    if (!state.stats.towerMedalsPerDiff) state.stats.towerMedalsPerDiff = {};
    // メダルは常にベスト高度から現行基準（towerStages の SSOT）で再評価
    const runMedal = getTowerMedal(diffId, score); // この回の成績（時間ボーナス用）
    state.stats.towerMedalsPerDiff[diffId] = getTowerMedal(diffId, state.stats.towerBestHeightsPerDiff[diffId] || 0);
    state.kp += Math.floor(score / 10);
    // 1問も解いていなければ時間ボーナス・祝祭は無し（無操作放置の抜け道を防ぐ）
    const max = parseInt(diffId);
    let bonus = 0;
    let festivalLevel = 0;
    if (score > 0) {
      bonus = _grantScaledBonus(state, max, runMedal);
      festivalLevel = _triggerFestivalRandom(state, rangeLevels(max));
    }
    _updateHabit(state, true);
    _checkAchievements(state);
    this.saveState(state);
    return { state, kpGained: Math.floor(score / 10) + bonus, festivalLevel };
  },

  completeTrial(success: boolean): { state: KukuState; kpGained: number } {
    const state = this.loadState();
    if (!state.stats) state.stats = {};
    let kpGained = 0;
    if (success) {
      state.stats.totalTrialsCleared = (state.stats.totalTrialsCleared || 0) + 1;
      state.kp += 5000;
      kpGained = 5000 + _grantTimeBonus(state, 600);
      if (!state.royalTreasures) state.royalTreasures = [];
      if (!state.wisdomSeals) state.wisdomSeals = [];
    } else {
      state.stats.totalTrialsFailed = (state.stats.totalTrialsFailed || 0) + 1;
    }
    _syncUnlockedLevels(state);
    _updateHabit(state, true);
    _checkAchievements(state);
    this.saveState(state);
    return { state, kpGained };
  },

  saveBlankResult(diffId: string, timeMs: number, solvedByLevel?: Record<number, number>): { state: KukuState; kpGained: number; festivalLevel: number; runMedal: Medal } {
    const state = this.loadState();
    this._applySolvedMastery(state, solvedByLevel);
    if (!state.challengeBestTimes) state.challengeBestTimes = {};
    const currentBest = state.challengeBestTimes[diffId] || Infinity;
    if (timeMs < currentBest) state.challengeBestTimes[diffId] = timeMs;

    if (!state.blankMedalsPerDiff) state.blankMedalsPerDiff = {};
    // メダルは常にベストタイムから現行基準で再評価（ベスト未更新でもダイヤ昇格を反映）
    const runMedal = _blankBadge(timeMs); // この回の成績（時間ボーナス用）
    state.blankMedalsPerDiff[diffId] = _blankBadge(state.challengeBestTimes[diffId] ?? timeMs);
    state.kp += 500;
    const max = parseInt(diffId);
    const bonus = _grantScaledBonus(state, max, runMedal);
    const festivalLevel = _triggerFestivalRandom(state, rangeLevels(max));
    _updateHabit(state, true);
    _checkAchievements(state);
    this.saveState(state);
    return { state, kpGained: 500 + bonus, festivalLevel, runMedal };
  },

  prestige(): KukuState {
    const state = this.loadState();
    state.prestigeCount = (state.prestigeCount || 0) + 1;
    state.kp = 0;
    _checkAchievements(state);
    this.saveState(state);
    return state;
  },

  setCurrentTitle(title: string): KukuState {
    const state = this.loadState();
    if (state.unlockedTitles?.includes(title)) {
      state.currentTitle = title;
      this.saveState(state);
    }
    return state;
  },

  updateSettings(settings: KukuState['settings']): KukuState {
    const state = this.loadState();
    state.settings = { ...state.settings, ...settings };
    this.saveState(state);
    return state;
  },

  resetAllData(): KukuState {
    const init = getInitialState();
    this.saveState(init);
    return init;
  },

  updateLastSeen(): void {
    const state = this.loadState();
    this.saveState(state);
  },

  applyOfflineEarnings(): { state: KukuState; offlineKp: number; shouldNotify: boolean } {
    const state = this.loadState();
    const offline = IdleManager.calculateOfflineEarnings(state, 600);
    let appliedKp = 0;
    if (offline.kp > 0) {
      const before = state.kp;
      state.kp = Math.min(state.kp + offline.kp, MAX_KP);
      appliedKp = state.kp - before;
      if (appliedKp > 0) this.saveState(state);
    }
    return { state, offlineKp: appliedKp, shouldNotify: offline.shouldNotify && appliedKp > 0 };
  },

  getReading(level: number, b: number): string {
    return KUKU_READINGS[`${level}x${b}`] || '';
  },
};

export { getInitialState };
