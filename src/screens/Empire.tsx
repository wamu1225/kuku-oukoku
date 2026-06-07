import { useEffect, useRef, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine, QUEST_KP_SECONDS, silverCompletion } from '../utils/LearningEngine';
import { IdleManager, FINAL_COMPANION_COST, MAX_PRESTIGE_COUNT } from '../utils/IdleManager';
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

const HELP_DISMISSED_KEY = 'kuku-oukoku:empire-help-dismissed';

export function Empire({ state: initialState, onUpdate }: { state: KukuState; onUpdate: () => void }) {
  const [state, setState] = useState(initialState);
  const [now, setNow] = useState(Date.now());
  const [popLevel, setPopLevel] = useState<number | null>(null);
  const popTimerRef = useRef<number | null>(null);
  const [helpOpen, setHelpOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(HELP_DISMISSED_KEY) !== '1'; } catch { return true; }
  });
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
  const [prestigeNotice, setPrestigeNotice] = useState<string | null>(null);

  const triggerPop = (level: number) => {
    setPopLevel(level);
    if (popTimerRef.current) window.clearTimeout(popTimerRef.current);
    popTimerRef.current = window.setTimeout(() => setPopLevel((p) => (p === level ? null : p)), 700);
  };

  useEffect(() => {
    return () => { if (popTimerRef.current) window.clearTimeout(popTimerRef.current); };
  }, []);

  useEffect(() => setState(initialState), [initialState]);

  // 1 秒ごとの KP 加算は App.tsx の global ticker で実行され、initialState 経由で同期される。
  // ここでは祝祭タイマー表示用に setNow のみ更新する。
  useEffect(() => {
    const interval = window.setInterval(() => {
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
    triggerPop(level);
    onUpdate();
  };

  const inviteFinal = () => {
    if ((state.companions[21] || 0) > 0) return;
    if (silverCompletion(state).missing > 0) return;
    if (state.kp < FINAL_COMPANION_COST) return;
    const updated = LearningEngine.inviteCompanion(21, FINAL_COMPANION_COST);
    setState(updated);
    triggerPop(21);
    onUpdate();
  };

  const inviteMax = (level: number) => {
    const owned = state.companions[level] || 0;
    const { count, totalCost } = IdleManager.calculateMaxBuy(level, owned, state.kp);
    if (count === 0) return;
    const updated = LearningEngine.inviteCompanionsBulk({ [level]: owned + count }, totalCost);
    setState(updated);
    triggerPop(level);
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

  // 王国イラスト要素：城のサイズ・なかまアバター
  const castleSize = (state.prestigeCount || 0) >= 5 ? '🏯' : (state.prestigeCount || 0) >= 2 ? '🏰' : '🏘️';
  const ownedCompanions = COMPANIONS.filter((c) => (state.companions[c.level] || 0) > 0);

  return (
    <div className="screen empire-screen" style={{ background: season.bg, padding: '16px', borderRadius: 'var(--radius-lg)' }}>
      <h1 className="screen-title">🏰 おうこく</h1>

      <div className="kingdom-banner kingdom-banner-v2">
        <div className="kingdom-sky" aria-hidden="true" />
        <div className="kingdom-ground">
          <div className="kingdom-castle" aria-hidden="true">{castleSize}</div>
          <div className="kingdom-info">
            <div className="kingdom-info-rank">
              <strong>{empireName}</strong> <span className="kingdom-banner-level">{empireLevel}</span>
            </div>
            <div className="kingdom-info-season" style={{ color: season.accent }}>
              <span aria-hidden="true">{season.emoji}</span> {season.name}
            </div>
          </div>
        </div>
        <div className="kingdom-companions" aria-hidden="true">
          {ownedCompanions.map((c) => (
            <span key={c.level} className="kingdom-mate" title={c.name}>{c.emoji}</span>
          ))}
          {ownedCompanions.length === 0 && (
            <span className="kingdom-empty-hint">なかまを呼んでにぎわせよう</span>
          )}
        </div>
      </div>

      <div className="empire-stats-v3">
        <div className="empire-stat-primary">
          <span className="empire-stat-primary-label">所持 KP</span>
          <span className="empire-stat-primary-value">{IdleManager.formatBigNumber(state.kp)}</span>
          <span className="empire-stat-primary-sub">+ {IdleManager.formatBigNumber(kps)} / 秒　・　なかま {totalCompanions}人</span>
        </div>
      </div>

      <div className={`empire-help ${helpOpen ? 'open' : ''}`}>
        <button
          className="empire-help-toggle"
          onClick={() => {
            const next = !helpOpen;
            setHelpOpen(next);
            try { localStorage.setItem(HELP_DISMISSED_KEY, next ? '0' : '1'); } catch { /* ignore */ }
          }}
          aria-expanded={helpOpen}
        >
          <span>📖 おうこくのしくみ</span>
          <span className="empire-help-toggle-arrow">{helpOpen ? '▲' : '▼'}</span>
        </button>
        {helpOpen && (
          <ul>
            <li><strong>招待 X KP</strong>：そのなかまを 1 人呼ぶ。コストは段ごと・所持数で増加</li>
            <li><strong>まとめて招待</strong>：今の KP で買えるだけまとめて呼ぶ（最大 100 まで）</li>
            <li><strong>熟練度バッジ</strong>：その段の九九を解いた数で銅→銀→金。生産力に倍率（最大 ×2.5）</li>
            <li><strong>🎉 祝祭</strong>：いろいろなモードのクリアで、ある段の生産が <strong>30 分間</strong> アップ</li>
            <li><strong>段位ボーナス</strong>：だんいにんていに合格した段は ×2 ボーナス</li>
            <li>オフライン中も最大 <strong>12 時間</strong> KP がたまる</li>
          </ul>
        )}
      </div>

      {(state.activeQuests?.length ?? 0) > 0 && (
        <section className="quests-section">
          <h2 className="section-h">📜 任務</h2>
          <ul className="quests-list">
            {state.activeQuests?.map((q) => {
              const ratio = Math.min(q.progress / q.target, 1);
              return (
                <li key={q.id} className={`quest-card ${q.isCompleted ? 'completed' : ''}`}>
                  <div className="quest-head">
                    <span className="quest-title">{q.title}</span>
                    <span className="quest-reward">
                      {q.reward.type === 'kp' ? '+' + IdleManager.formatBigNumber(Math.floor(kps * QUEST_KP_SECONDS)) + ' KP' : '+' + q.reward.amount + ' スタンプ'}
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
                        className="btn-primary quest-claim-big"
                        onClick={() => {
                          const updated = LearningEngine.claimQuest(q.id);
                          setState(updated);
                          onUpdate();
                        }}
                      >🎁 もらう</button>
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
            <p>9 の段のなかまを得たあなたを認める、特別な門が王国に現れました。挑んで何が起きるか確かめよう！</p>
            <button className="btn-primary" onClick={() => navigate('/trial/')}>門に挑む</button>
          </div>
        </div>
      )}

      {(state.prestigeCount || 0) >= MAX_PRESTIGE_COUNT ? (
        <div className="prestige-banner prestige-max">
          <div className="prestige-emoji" aria-hidden="true">👑</div>
          <div>
            <h2>👑 最高ランク到達！</h2>
            <p>伝説の帝国 Lv.{MAX_PRESTIGE_COUNT + 1}（×{IdleManager.formatBigNumber(Math.pow(2, MAX_PRESTIGE_COUNT))}）<br />九九おうこくの頂点を極めた！</p>
          </div>
        </div>
      ) : state.kp >= IdleManager.getPrestigeCost(state.prestigeCount || 0) ? (
        <PrestigeBanner state={state} onPrestige={() => setShowPrestigeConfirm(true)} />
      ) : null}

      {showPrestigeConfirm && (
        <div className="quit-confirm-overlay" role="alertdialog" aria-label="ランクアップ確認">
          <div className="quit-confirm-card">
            <h2 className="prestige-confirm-title">👑 王国をランクアップしますか？</h2>
            <ul className="prestige-confirm-list">
              <li>現在の KP <strong>{IdleManager.formatBigNumber(state.kp)}</strong> がリセット</li>
              <li>必要 KP：<strong>{IdleManager.formatBigNumber(IdleManager.getPrestigeCost(state.prestigeCount || 0))}</strong></li>
              <li>なかまは <strong>維持</strong> されます</li>
              <li>生産力が <strong>永続的に ×2</strong></li>
            </ul>
            <div className="quit-confirm-actions">
              <button className="btn-primary" onClick={() => {
                const after = LearningEngine.prestige();
                setState(after);
                onUpdate();
                setShowPrestigeConfirm(false);
                setPrestigeNotice('🎉 王国がランクアップした！生産力が永続的にアップ');
                window.setTimeout(() => setPrestigeNotice(null), 4500);
              }}>ランクアップ</button>
              <button className="btn-secondary" onClick={() => setShowPrestigeConfirm(false)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
      {prestigeNotice && (
        <div className="offline-toast" role="status">{prestigeNotice}</div>
      )}

      <div className="companion-list">
        {visibleLevels.map((comp) => {
          // 最後のなかま（段21・生産なし・1回だけ・全モード銀以上が条件）
          if (comp.type === 'final') {
            const owned21 = state.companions[comp.level] || 0;
            const prog = silverCompletion(state);
            const canInvite = owned21 === 0 && prog.missing === 0 && state.kp >= FINAL_COMPANION_COST;
            return (
              <div key={comp.level} className={`companion-card companion-card-final ${owned21 > 0 ? 'final-done' : ''}`} style={{ borderColor: comp.color }}>
                <div className="companion-icon" aria-hidden="true" style={{ background: comp.color }}>{comp.emoji}</div>
                <div className="companion-info">
                  <div className="companion-name">✨ 最後のなかま：{comp.name}</div>
                  <div className="companion-stats">
                    {owned21 > 0
                      ? <span className="final-achieved-note">👑 即位ずみ！九九おうこくを極めた証</span>
                      : <span>クリアの証（生産はしない）</span>}
                  </div>
                </div>
                <div className="companion-actions">
                  {owned21 > 0 ? (
                    <span className="final-achieved">✨ 達成</span>
                  ) : prog.missing > 0 ? (
                    <span className="stage-locked">🔒 全モード・全ステージで銀メダル以上（あと {prog.missing} 個）</span>
                  ) : (
                    <button
                      className={`btn-invite ${state.kp >= FINAL_COMPANION_COST ? '' : 'disabled'}`}
                      disabled={!canInvite}
                      onClick={inviteFinal}
                    >
                      即位 {IdleManager.formatBigNumber(FINAL_COMPANION_COST)} KP
                    </button>
                  )}
                </div>
              </div>
            );
          }
          const owned = state.companions[comp.level] || 0;
          const cost = IdleManager.getUpgradeCost(comp.level, owned);
          const canBuy = state.kp >= cost;
          // 表示はおうこくレベル（昇段ボーナス）反映後の値にする（合計KPSと整合させるため）
          const production = IdleManager.getIndividualProduction(state, comp.level) * IdleManager.getPrestigeBonus(state.prestigeCount);
          const masteryInfo = IdleManager.getMasteryInfo(state, comp.level);
          const festivalUntil = state.festivalUntil?.[comp.level] || 0;
          const festivalActive = festivalUntil > now;
          const festivalSecsLeft = festivalActive ? Math.ceil((festivalUntil - now) / 1000) : 0;
          const festivalMM = Math.floor(festivalSecsLeft / 60);
          const festivalSS = festivalSecsLeft % 60;
          // まとめて招待で何人買えるか事前計算
          const maxBuyInfo = owned > 0 ? IdleManager.calculateMaxBuy(comp.level, owned, state.kp) : { count: 0, totalCost: 0 };

          return (
            <div key={comp.level} className={`companion-card ${festivalActive ? 'festival-active' : ''} ${popLevel === comp.level ? 'pop-in' : ''}`} style={{ borderColor: festivalActive ? '#ec4899' : comp.color }}>
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
                    <span className="festival-badge">🎉 祝祭中 ×{IdleManager.getFestivalMultiplier(state, comp.level).toFixed(1)}（残り {String(festivalMM).padStart(2, '0')}:{String(festivalSS).padStart(2, '0')}）</span>
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
                {owned > 0 && maxBuyInfo.count > 1 && (
                  <button className="btn-invite-max" onClick={() => inviteMax(comp.level)} disabled={!canBuy}>
                    まとめて招待 ({maxBuyInfo.count}人)
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
