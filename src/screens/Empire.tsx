import { useEffect, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine } from '../utils/LearningEngine';
import { IdleManager } from '../utils/IdleManager';
import { COMPANIONS } from '../data/companions';
import { getCurrentSeasonal } from '../utils/seasonal';

function PrestigeBanner({ state, onPrestige }: { state: KukuState; onPrestige: () => void }) {
  const currentRank = IdleManager.getPrestigeRankName(state.prestigeCount || 0);
  const nextRank = IdleManager.getPrestigeRankName((state.prestigeCount || 0) + 1);
  const nextMultiplier = Math.pow(2, (state.prestigeCount || 0) + 1);
  return (
    <div className="prestige-banner">
      <div className="prestige-emoji" aria-hidden="true">👑</div>
      <div>
        <h2>おうこくランクアップ可能！</h2>
        <p>
          現在：{currentRank}（×{Math.pow(2, state.prestigeCount || 0)}）<br />
          次：{nextRank}（×{nextMultiplier}）
        </p>
        <p className="prestige-warn">※ KP は 0 にリセットされますが、なかまは維持されます</p>
        <button className="btn-primary" onClick={onPrestige}>王国をランクアップする</button>
      </div>
    </div>
  );
}

export function Empire({ state: initialState, onUpdate }: { state: KukuState; onUpdate: () => void }) {
  const [state, setState] = useState(initialState);
  const [now, setNow] = useState(Date.now());

  useEffect(() => setState(initialState), [initialState]);

  // Empire mount 時に offline KP を credit（タブ内ナビゲーションでも反映）
  useEffect(() => {
    const r = LearningEngine.applyOfflineEarnings();
    setState(r.state);
  }, []);

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

  const trialCleared = (state.stats?.totalTrialsCleared || 0) > 0;
  const visibleLevels = COMPANIONS.filter((c) => {
    if (c.level === 1) return true;
    const prevOwned = (state.companions[c.level - 1] || 0) > 0;
    if (c.level <= 9) return prevOwned;
    // Legendary companions (10+) require Trial cleared AND previous owned
    if (c.level === 10) return trialCleared;
    return trialCleared && prevOwned;
  });
  const showTrialGate =
    (state.companions[9] || 0) > 0 && !trialCleared;

  const season = getCurrentSeasonal();

  return (
    <div className="screen empire-screen" style={{ background: season.bg, padding: '16px', borderRadius: 'var(--radius-lg)' }}>
      <h1 className="screen-title">🏰 おうこく</h1>
      <p className="season-banner" style={{ borderLeftColor: season.accent }}>
        <span aria-hidden="true">{season.emoji}</span> 今月のおうこく：<strong>{season.name}</strong>
      </p>

      <div className="empire-stats-v2">
        <div className="empire-stat-primary">
          <span className="empire-stat-primary-label">所持 KP</span>
          <span className="empire-stat-primary-value">{IdleManager.formatBigNumber(state.kp)}</span>
          <span className="empire-stat-primary-sub">+ {IdleManager.formatBigNumber(kps)} / 秒</span>
        </div>
        <div className="empire-stat-secondary">
          <div className="empire-stat empire-stat-rank">
            <span className="empire-stat-label">{empireName}</span>
            <span className="empire-stat-value">{empireLevel}</span>
          </div>
          <div className="empire-stat empire-stat-comp">
            <span className="empire-stat-label">なかま合計</span>
            <span className="empire-stat-value">{totalCompanions}人</span>
          </div>
        </div>
      </div>

      <details className="empire-help">
        <summary>📖 おうこくのしくみ（タップで開く）</summary>
        <ul>
          <li><strong>招待 X KP</strong>：そのなかまを 1 人呼ぶ。コストは段ごと・所持数で増加</li>
          <li><strong>まとめて招待</strong>：今の KP で買えるだけまとめて呼ぶ（最大 100 まで）</li>
          <li><strong>熟練度バッジ</strong>：その段の九九を解いた数で銅→銀→金。生産力に倍率（最大 ×2.5）</li>
          <li><strong>🎉 祝祭</strong>：アタックをクリアするとその段の生産が <strong>30 分間 1.5〜5×</strong>（メダル色で倍率変化）</li>
          <li><strong>段位ボーナス</strong>：だんいにんていに合格した段は ×2 ボーナス</li>
          <li>オフライン中も最大 <strong>12 時間</strong> KP がたまる</li>
        </ul>
      </details>

      {(state.activeQuests?.length ?? 0) > 0 && (
        <section className="quests-section">
          <h2 className="section-h">📜 きょうの任務</h2>
          <ul className="quests-list">
            {state.activeQuests?.map((q) => {
              const ratio = Math.min(q.progress / q.target, 1);
              return (
                <li key={q.id} className={`quest-card ${q.isCompleted ? 'completed' : ''}`}>
                  <div className="quest-head">
                    <span className="quest-title">{q.title}</span>
                    <span className="quest-reward">
                      {q.reward.type === 'kp' ? '+' + IdleManager.formatBigNumber(q.reward.amount) + ' KP' : '+' + q.reward.amount + ' スタンプ'}
                    </span>
                  </div>
                  <p className="quest-desc">{q.description}</p>
                  <div className="quest-progress">
                    <div className="quest-progress-bar" style={{ width: `${ratio * 100}%` }} />
                  </div>
                  <div className="quest-foot">
                    <span>{q.progress} / {q.target}</span>
                    {q.isCompleted && (
                      <button
                        className="btn-primary quest-claim"
                        onClick={() => {
                          const updated = LearningEngine.claimQuest(q.id);
                          setState(updated);
                          onUpdate();
                        }}
                      >もらう</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {showTrialGate && (
        <div className="trial-gate">
          <div className="trial-gate-emoji" aria-hidden="true">🌑</div>
          <div className="trial-gate-body">
            <h2>暗黒の試練の門</h2>
            <p>9 の段のなかまの加護を得たあなたに、新たな扉が現れた。挑むと 10 の段とその先への道が開く。</p>
            <button className="btn-primary" onClick={() => navigate('/trial/')}>門に挑む</button>
          </div>
        </div>
      )}

      {state.kp >= IdleManager.getPrestigeCost(state.prestigeCount || 0) && (
        <PrestigeBanner state={state} onPrestige={() => {
          const cost = IdleManager.getPrestigeCost(state.prestigeCount || 0);
          if (!confirm(`王国をランクアップしますか？\n\n・現在 KP (${IdleManager.formatBigNumber(state.kp)}) がすべてリセットされます\n・必要 KP：${IdleManager.formatBigNumber(cost)}\n・なかまは維持されます\n・全体の生産力が永続的に ×2 されます`)) return;
          const after = LearningEngine.prestige();
          setState(after);
          onUpdate();
          alert('🎉 王国がランクアップした！全体の生産力が永続的にアップしたよ。');
        }} />
      )}

      <div className="companion-list">
        {visibleLevels.map((comp) => {
          const owned = state.companions[comp.level] || 0;
          const cost = IdleManager.getUpgradeCost(comp.level, owned);
          const canBuy = state.kp >= cost;
          const production = IdleManager.getIndividualProduction(state, comp.level);
          const masteryInfo = IdleManager.getMasteryInfo(state, comp.level);
          const festivalUntil = state.festivalUntil?.[comp.level] || 0;
          const festivalActive = festivalUntil > now;
          const festivalSecsLeft = festivalActive ? Math.ceil((festivalUntil - now) / 1000) : 0;
          const festivalMM = Math.floor(festivalSecsLeft / 60);
          const festivalSS = festivalSecsLeft % 60;

          return (
            <div key={comp.level} className={`companion-card ${festivalActive ? 'festival-active' : ''}`} style={{ borderColor: festivalActive ? '#ec4899' : comp.color }}>
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
                  {festivalActive && (
                    <span className="festival-badge">🎉 祝祭中 残 {String(festivalMM).padStart(2, '0')}:{String(festivalSS).padStart(2, '0')}</span>
                  )}
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
