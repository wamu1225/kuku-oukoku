import type { KukuState } from '../types';
import { getDanRankName } from '../data/danLevels';

export const MAX_KP = 1e36;

// 最後のなかま（段21相当）。生産はせず、招待は一度きり。一秭(1e24) KP の最終目標
export const FINAL_COMPANION_LEVEL = 21;
export const FINAL_COMPANION_COST = 1e24;

// 王国レベルの上限。プレステージ回数の最大（レベル = 回数 + 1 なので Lv.30 が上限）
export const MAX_PRESTIGE_COUNT = 29;

export const IdleManager = {
  getIndividualProduction(state: KukuState, level: number): number {
    // 最後のなかま（段21〜）は生産しない（クリアの証）
    if (level >= FINAL_COMPANION_LEVEL) return 0;
    const count = state.companions[level] || 0;
    if (count === 0) return 0;

    const baseProd = Math.pow(4, level - 1);

    const festivalMultiplier = this.getFestivalMultiplier(state, level);

    const masteryInfo = this.getMasteryInfo(state, level);
    const masteryBadgeMultiplier = 1 + masteryInfo.bonus;

    // danMedals は「段位ランク」キー。段Lは 1〜9→同rank、10〜20→rank=L+1（初段=rank11=10の段…）
    const danRankForLevel = level <= 9 ? level : level + 1;
    let danMultiplier = 1;
    if (state.danMedals?.[danRankForLevel]) {
      danMultiplier = 2.0;
    }

    return baseProd * count * festivalMultiplier * masteryBadgeMultiplier * danMultiplier;
  },

  // 祝祭が発動中ならその段の倍率（金×5 / 銀×3 / 銅・なし×1.5）、未発動なら1を返す
  getFestivalMultiplier(state: KukuState, level: number): number {
    const festivalUntil = state.festivalUntil?.[level] || 0;
    if (festivalUntil <= Date.now()) return 1;
    const badge = state.tableBests?.[level]?.badge;
    if (badge === 'diamond') return 5.0;
    if (badge === 'gold') return 5.0;
    if (badge === 'silver') return 3.0;
    return 1.5;
  },

  getPrestigeBonus(prestigeCount: number | undefined): number {
    return Math.pow(2, prestigeCount || 0);
  },

  calculateKPS(state: KukuState): number {
    if (!state || !state.companions) return 0;
    let totalKPS = 0;
    for (let level = 1; level <= 20; level++) {
      totalKPS += this.getIndividualProduction(state, level);
    }
    const prestigeBonus = this.getPrestigeBonus(state.prestigeCount);
    return Math.floor(totalKPS * prestigeBonus);
  },

  getMasteryInfo(
    state: KukuState,
    level: number
  ): {
    badge: 'none' | 'bronze' | 'silver' | 'gold';
    bonus: number;
    multiplier: number;
    threshold: number;
    nextThreshold: number | null;
  } {
    const count = state.mastery?.[level] || 0;
    const calcMultiplier = 1 + Math.floor(count / 20) * 0.1;
    const cappedMultiplier = Math.min(2.5, parseFloat(calcMultiplier.toFixed(1)));
    const currentBonus = cappedMultiplier - 1;

    let badge: 'none' | 'bronze' | 'silver' | 'gold' = 'none';
    if (count >= 300) badge = 'gold';
    else if (count >= 100) badge = 'silver';
    else if (count >= 20) badge = 'bronze';

    let nextThreshold: number | null = 20;
    if (count >= 300) nextThreshold = null;
    else if (count >= 100) nextThreshold = 300;
    else if (count >= 20) nextThreshold = 100;

    return {
      badge,
      bonus: currentBonus,
      multiplier: cappedMultiplier,
      threshold: badge === 'gold' ? 300 : badge === 'silver' ? 100 : badge === 'bronze' ? 20 : 0,
      nextThreshold,
    };
  },

  calculateOfflineEarnings(
    state: KukuState,
    minSecondsForNotify: number = 600
  ): { kp: number; seconds: number; shouldNotify: boolean } {
    if (!state.lastSeenDate) return { kp: 0, seconds: 0, shouldNotify: false };
    const lastSeen = new Date(state.lastSeenDate);
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - lastSeen.getTime()) / 1000);
    if (elapsedSeconds <= 0) return { kp: 0, seconds: 0, shouldNotify: false };
    const diffSeconds = Math.max(0, (now.getTime() - lastSeen.getTime()) / 1000);
    const kps = this.calculateKPS(state);
    const cappedSeconds = Math.min(diffSeconds, 12 * 3600);
    const kp = Math.floor(kps * cappedSeconds);
    return {
      kp,
      seconds: elapsedSeconds,
      shouldNotify: elapsedSeconds >= minSecondsForNotify && kp > 0,
    };
  },

  getPrestigeCost(prestigeCount: number | undefined): number {
    return 5000000 * Math.pow(10, prestigeCount || 0);
  },

  getEmpireLevelName(prestigeCount: number): string {
    return `Lv.${(prestigeCount || 0) + 1}`;
  },

  getPrestigeRankName(prestigeCount: number): string {
    const ranks = [
      'はじまりの村',
      'かけだしの村',
      'にぎわう町',
      'さかえる都市',
      'かがやく王都',
      '叡智の王国',
      '平和の聖域',
      '九九の帝国',
      '伝説の帝国',
    ];
    if (prestigeCount < 0) return ranks[0];
    if (prestigeCount >= ranks.length) return ranks[ranks.length - 1];
    return ranks[prestigeCount];
  },

  getUpgradeCost(level: number, currentCount: number): number {
    const basePriceForLevel = Math.pow(10, level - 1) * 100;
    return Math.floor(basePriceForLevel * Math.pow(1.15, currentCount));
  },

  calculateMaxBuy(
    level: number,
    currentCount: number,
    currentKP: number
  ): { count: number; totalCost: number } {
    const basePriceForLevel = Math.pow(10, level - 1) * 100;
    const r = 1.15;
    let buyCount = 0;
    let totalCost = 0;
    while (true) {
      const nextCost = Math.floor(basePriceForLevel * Math.pow(r, currentCount + buyCount));
      if (currentKP >= totalCost + nextCost) {
        totalCost += nextCost;
        buyCount++;
      } else break;
      if (buyCount >= 100) break;
    }
    return { count: buyCount, totalCost };
  },

  formatBigNumber(num: number): string {
    if (isNaN(num) || !isFinite(num)) return '0';
    if (num < 100000000) return Math.floor(num).toLocaleString();
    const units = ['億', '兆', '京', '垓', '秭', '穣', '溝', '澗'];
    const log10 = Math.log10(num);
    let unitIndex = Math.floor((log10 + 1e-10) / 4) - 2;
    if (unitIndex >= units.length) unitIndex = units.length - 1;
    if (unitIndex < 0) return Math.floor(num).toLocaleString();
    let unit = units[unitIndex];
    let divisor = Math.pow(10, (unitIndex + 2) * 4);
    let scaled = num / divisor;
    let decimals = 2;
    if (scaled >= 1000) decimals = 0;
    else if (scaled >= 100) decimals = 1;
    if (parseFloat(scaled.toFixed(decimals)) >= 10000 && unitIndex < units.length - 1) {
      unitIndex++;
      unit = units[unitIndex];
      divisor = Math.pow(10, (unitIndex + 2) * 4);
      scaled = num / divisor;
      if (scaled >= 1000) decimals = 0;
      else if (scaled >= 100) decimals = 1;
      else decimals = 2;
    }
    const fixed = scaled.toFixed(decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = parts.join('.');
    return formatted.replace(/\.0+$/, '').replace(/(\.[1-9])0$/, '$1') + unit;
  },

  getDanRankName,
};
