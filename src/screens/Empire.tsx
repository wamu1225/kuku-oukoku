import { useEffect, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine } from '../utils/LearningEngine';
import { IdleManager } from '../utils/IdleManager';
import { COMPANIONS } from '../data/companions';

export function Empire({ state: initialState, onUpdate }: { state: KukuState; onUpdate: () => void }) {
  const [state, setState] = useState(initialState);
  const [now, setNow] = useState(Date.now());

  useEffect(() => setState(initialState), [initialState]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const fresh = LearningEngine.loadState();
      const kps = IdleManager.calculateKPS(fresh);
      if (kps > 0) {
        fresh.kp = Math.min(fresh.kp + kps, 1e36);
        LearningEngine.saveState(fresh);
      }
      setState(fresh);
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const kps = IdleManager.calculateKPS(state);
  const empireName = IdleManager.getPrestigeRankName(state.prestigeCount || 0);
  const empireLevel = IdleManager.getEmpireLevelName(state.prestigeCount || 0);
  const totalCompanions = Object.values(state.companions || {}).reduce((a, b) => a + b, 0);

  const invite = (level: number) => {
    const owned = state.companions[level] || 0;
    const cost = IdleManager.getUpgradeCost(level, owned);
    if (state.kp < cost) return;
    const updated = LearningEngine.inviteCompanion(level, cost);
    setState(updated);
    onUpdate();
  };

  const inviteMax = (level: number) => {
    const owned = state.companions[level] || 0;
    const { count, totalCost } = IdleManager.calculateMaxBuy(level, owned, state.kp);
    if (count === 0) return;
    const updated = LearningEngine.inviteCompanionsBulk({ [level]: owned + count }, totalCost);
    setState(updated);
    onUpdate();
  };

  const visibleLevels = COMPANIONS.filter((c) => {
    if (c.level === 1) return true;
    const prevOwned = (state.companions[c.level - 1] || 0) > 0;
    return prevOwned;
  }).filter((c) => c.level <= 9);

  return (
    <div className="screen empire-screen">
      <h1 className="screen-title">🏰 おうこく</h1>

      <div className="empire-stats">
        <div className="empire-stat">
          <span className="empire-stat-label">{empireName}</span>
          <span className="empire-stat-value">{empireLevel}</span>
        </div>
        <div className="empire-stat">
          <span className="empire-stat-label">KP</span>
          <span className="empire-stat-value">{IdleManager.formatBigNumber(state.kp)}</span>
        </div>
        <div className="empire-stat">
          <span className="empire-stat-label">1秒に</span>
          <span className="empire-stat-value">+{IdleManager.formatBigNumber(kps)}</span>
        </div>
        <div className="empire-stat">
          <span className="empire-stat-label">なかま合計</span>
          <span className="empire-stat-value">{totalCompanions}人</span>
        </div>
      </div>

      <p className="screen-desc">
        なかまを招待しよう。なかまは1秒ごとに自動で KP を集めてくれるよ。
        さらに、その段の九九を「まなぶ」「アタック」で何度も解くと、なかまが進化して生産力がアップ！
      </p>

      <div className="companion-list">
        {visibleLevels.map((comp) => {
          const owned = state.companions[comp.level] || 0;
          const cost = IdleManager.getUpgradeCost(comp.level, owned);
          const canBuy = state.kp >= cost;
          const production = IdleManager.getIndividualProduction(state, comp.level);
          const masteryInfo = IdleManager.getMasteryInfo(state, comp.level);
          const festivalActive = (state.festivalUntil?.[comp.level] || 0) > now;

          return (
            <div key={comp.level} className="companion-card" style={{ borderColor: comp.color }}>
              <div className="companion-icon" aria-hidden="true" style={{ background: comp.color }}>
                {comp.emoji}
              </div>
              <div className="companion-info">
                <div className="companion-name">{comp.level}の段：{comp.name}</div>
                <div className="companion-stats">
                  <span>所持：{owned}人</span>
                  <span>生産：+{IdleManager.formatBigNumber(production)}/秒</span>
                  {masteryInfo.badge !== 'none' && (
                    <span className={`mastery-badge mastery-${masteryInfo.badge}`}>
                      熟練度 {masteryInfo.badge === 'gold' ? '金' : masteryInfo.badge === 'silver' ? '銀' : '銅'}（×{masteryInfo.multiplier.toFixed(1)}）
                    </span>
                  )}
                  {festivalActive && <span className="festival-badge">🎉 祝祭中</span>}
                </div>
              </div>
              <div className="companion-actions">
                <button
                  className={`btn-invite ${canBuy ? '' : 'disabled'}`}
                  disabled={!canBuy}
                  onClick={() => invite(comp.level)}
                >
                  招待 {IdleManager.formatBigNumber(cost)} KP
                </button>
                {owned > 0 && (
                  <button className="btn-invite-max" onClick={() => inviteMax(comp.level)} disabled={!canBuy}>
                    まとめて招待
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visibleLevels.length < 9 && (
        <p className="empire-hint">
          ※ 1つ前の段のなかまを呼ぶと、次の段のなかまが現れるよ
        </p>
      )}

      <button className="back-link" onClick={() => navigate('/')}>← ホームへ</button>
    </div>
  );
}
