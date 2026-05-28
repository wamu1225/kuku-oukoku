import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine } from '../utils/LearningEngine';
import { IdleManager } from '../utils/IdleManager';
import { Confetti } from '../components/Confetti';
import { vibrateCorrect, vibrateWrong } from '../utils/haptics';

type Stage = {
  id: string;
  name: string;
  max: number;
  color: string;
  enemyEmoji: string;
  goldCount: number;
  cards: number;
  unlockRank?: number;
  requiresTrial?: boolean;
  requiresStage4Gold?: boolean;
};

const STAGES: Stage[] = [
  { id: '3', name: 'はじまりの草原', max: 3, unlockRank: 1, color: '#22c55e', enemyEmoji: '🐛', goldCount: 10, cards: 5 },
  { id: '6', name: 'しずかな森', max: 6, unlockRank: 4, color: '#16a34a', enemyEmoji: '🦊', goldCount: 13, cards: 5 },
  { id: '9', name: 'ゴツゴツ洞窟', max: 9, unlockRank: 7, color: '#a16207', enemyEmoji: '👹', goldCount: 15, cards: 5 },
  { id: '15', name: '月夜の古城', max: 15, color: '#7c3aed', enemyEmoji: '🐉', goldCount: 12, cards: 7, requiresTrial: true },
  { id: '20', name: '星天の決戦場', max: 20, color: '#fbbf24', enemyEmoji: '👑', goldCount: 10, cards: 7, requiresTrial: true, requiresStage4Gold: true },
];

const STAGE4_GOLD_COUNT = 12;

const UNLOCK_RANK_NAMES: Record<number, string> = { 1: '10級', 4: '7級', 7: '4級' };

function generateHP(maxTable: number): number {
  // a×b: a in [1..maxTable], b in [1..9]。少なくとも片方が maxTable 内にある
  const a = Math.floor(Math.random() * maxTable) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return a * b;
}

function generateCards(hp: number, maxTable: number, count: number): number[] {
  const cardMax = Math.max(9, maxTable);
  const cards: number[] = [];
  // a×b === hp なる(a,b)を探す。a,b ∈ [1..cardMax]、少なくとも一方が maxTable 以内
  for (let a = 1; a <= cardMax; a++) {
    if (hp % a !== 0) continue;
    const b = hp / a;
    if (b < 1 || b > cardMax) continue;
    if (a > maxTable && b > maxTable) continue;
    cards.push(a, b);
    break;
  }
  while (cards.length < count) {
    cards.push(Math.floor(Math.random() * cardMax) + 1);
  }
  return cards.sort(() => Math.random() - 0.5);
}

export function Battle({ state, onComplete }: { state: KukuState; onComplete: () => void }) {
  const danRank = state.danRank || 0;
  const trialCleared = (state.stats?.totalTrialsCleared || 0) > 0;
  const [phase, setPhase] = useState<'select' | 'countdown' | 'playing' | 'done'>('select');
  const [stage, setStage] = useState<Stage | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [hp, setHp] = useState(0);
  const [cards, setCards] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [defeated, setDefeated] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  // setInterval 内 finish() の stale closure 対策：常に最新値を ref で保持
  const defeatedRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const stageRef = useRef<Stage | null>(null);
  const endedRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [comboFlash, setComboFlash] = useState(false);
  const comboFlashTimerRef = useRef<number | null>(null);
  const [result, setResult] = useState<{ count: number; combo: number; kpGain: number } | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
      if (comboFlashTimerRef.current) window.clearTimeout(comboFlashTimerRef.current);
    };
  }, []);

  const start = (s: Stage) => {
    setStage(s);
    stageRef.current = s;
    setPhase('countdown');
    setCountdown(3);
    setDefeated(0); defeatedRef.current = 0;
    setCombo(0); comboRef.current = 0;
    setMaxCombo(0); maxComboRef.current = 0;
    setSelected([]);
    endedRef.current = false;
    const newHp = generateHP(s.max);
    setHp(newHp);
    setCards(generateCards(newHp, s.max, s.cards));
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [phase]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown > 0) {
      const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => window.clearTimeout(t);
    }
    setPhase('playing');
    startRef.current = Date.now();
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = window.setInterval(() => {
      const e = Date.now() - (startRef.current || 0);
      setElapsed(e);
      if (e >= 30000) finish();
    }, 100);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [phase]);

  const finish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    // ref から最新値を読む（setInterval 内 closure の stale を回避）
    const d = defeatedRef.current;
    const m = Math.max(maxComboRef.current, comboRef.current);
    const stg = stageRef.current;
    if (stg) LearningEngine.saveBattleResult(stg.id, d, m);
    setResult({ count: d, combo: m, kpGain: d * 50 + Math.floor(d / 10) * 10000 });
    setPhase('done');
    onComplete();
  };

  const pickCard = (idx: number) => {
    if (phase !== 'playing' || feedback !== null) return;
    if (selected.includes(idx)) {
      setSelected((s) => s.filter((i) => i !== idx));
      return;
    }
    const next = [...selected, idx];
    // 2 枚目も即座に式に反映（演出中もスロットに残す）
    setSelected(next);
    if (next.length === 2) {
      const product = cards[next[0]] * cards[next[1]];
      if (product === hp) {
        vibrateCorrect();
        const newDefeated = defeated + 1;
        const newCombo = combo + 1;
        const newMaxCombo = Math.max(maxCombo, newCombo);
        defeatedRef.current = newDefeated;
        comboRef.current = newCombo;
        maxComboRef.current = newMaxCombo;
        setDefeated(newDefeated);
        setCombo(newCombo);
        setMaxCombo(newMaxCombo);
        setFeedback('correct');
        // コンボ更新時のフラッシュ演出（max 更新 or マイルストーン 3/5/10/20...）
        if (newCombo > maxCombo || newCombo === 3 || newCombo === 5 || newCombo === 10 || newCombo % 10 === 0) {
          setComboFlash(true);
          if (comboFlashTimerRef.current) window.clearTimeout(comboFlashTimerRef.current);
          comboFlashTimerRef.current = window.setTimeout(() => setComboFlash(false), 600);
        }
        // 正解は 700ms に延長：式 + ⚔️ 表示をプレイヤーが視認できる時間を確保
        if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = window.setTimeout(() => {
          feedbackTimerRef.current = null;
          setFeedback(null);
          setSelected([]);
          const newHp = generateHP(stage!.max);
          setHp(newHp);
          setCards(generateCards(newHp, stage!.max, stage!.cards));
        }, 700);
      } else {
        vibrateWrong();
        setFeedback('wrong');
        comboRef.current = 0;
        setCombo(0);
        if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = window.setTimeout(() => {
          feedbackTimerRef.current = null;
          setFeedback(null);
          setSelected([]);
        }, 700);
      }
    }
  };

  if (phase === 'select') {
    return (
      <div className="screen">
        <h1 className="screen-title">⚔️ 九九バトル</h1>
        <p className="screen-desc">
          敵が <strong>HP（つくる数）</strong> を持って現れます。
          5 枚のカードから <strong>2 まい</strong> を選び、その <strong>かけ算の答えが HP と同じ</strong> になったら撃破！
        </p>
        <div className="battle-howto">
          <div className="battle-howto-example">
            <span>例：HP <strong>24</strong> のとき</span>
            <span className="battle-howto-formula">
              <span className="battle-howto-card">3</span> × <span className="battle-howto-card">8</span> = 24 ⚔️
            </span>
            <span className="battle-howto-or">または</span>
            <span className="battle-howto-formula">
              <span className="battle-howto-card">4</span> × <span className="battle-howto-card">6</span> = 24 ⚔️
            </span>
          </div>
          <p className="battle-howto-tip">
            30 秒以内にできるだけ多く倒そう。連続撃破でコンボがつながると、ますます熱くなる！
          </p>
        </div>

        <div className="battle-stages">
          {STAGES.filter((s) => !s.requiresTrial || trialCleared).map((s) => {
            const stage4Best = state.stats?.battleMaxDefeatedPerDiff?.['15'] || 0;
            const stage4Gold = stage4Best >= STAGE4_GOLD_COUNT;
            let unlocked = true;
            let lockMsg = '';
            if (s.requiresStage4Gold && !stage4Gold) {
              unlocked = false;
              lockMsg = `🔒 月夜の古城で 🥇 金級（${STAGE4_GOLD_COUNT}体撃破）で解禁`;
            } else if (s.unlockRank != null && danRank < s.unlockRank) {
              unlocked = false;
              lockMsg = `🔒 だんいにんてい ${UNLOCK_RANK_NAMES[s.unlockRank]}合格で解禁`;
            }
            const best = state.stats?.battleMaxDefeatedPerDiff?.[s.id] || 0;
            return (
              <button
                key={s.id}
                className={`battle-stage ${unlocked ? '' : 'locked'} ${s.requiresTrial ? 'stage-legend' : ''}`}
                style={{ '--stage-color': s.color } as React.CSSProperties}
                disabled={!unlocked}
                onClick={() => start(s)}
              >
                <span className="stage-name">{s.name}</span>
                <span className="stage-meta">1〜{s.max}の段</span>
                {unlocked ? (
                  <span className="stage-best">自己ベスト: {best}体 / 🥇金 {s.goldCount}体</span>
                ) : (
                  <span className="stage-locked">{lockMsg}</span>
                )}
              </button>
            );
          })}
        </div>

        <button className="back-link" onClick={() => navigate('/')}>← ホームへ</button>
      </div>
    );
  }

  if (phase === 'countdown') {
    return <div className="screen countdown-screen"><p className="countdown-ready">よーい…</p><p key={countdown} className="countdown-number pop">{countdown}</p></div>;
  }

  if (phase === 'done' && result) {
    const showConfetti = result.count >= 10 || result.combo >= 5;
    const goldGoal = stage?.goldCount ?? 10;
    const evalText =
      result.count >= goldGoal
        ? `🥇 ${stage!.name} の金級達成！`
        : result.count >= Math.floor(goldGoal * 0.7)
        ? `あと ${goldGoal - result.count}体 で 🥇 金級！`
        : `次は ${goldGoal}体 撃破を狙おう（🥇 金級ライン）`;
    const comboNote = result.combo >= 5 ? `🔥 ${result.combo} 連続コンボ！` : null;
    return (
      <div className="screen result-screen">
        {showConfetti && <Confetti count={40} />}
        <div className="result-symbol" aria-hidden="true">⚔️</div>
        <h1 className="result-title">{stage!.name} 終了！</h1>
        <div className="result-stats">
          <div><span className="result-label">撃破数</span><span className="result-value">{result.count}体</span></div>
          <div><span className="result-label">最大コンボ</span><span className="result-value">{result.combo}</span></div>
          <div><span className="result-label">獲得 KP</span><span className="result-value">+{IdleManager.formatBigNumber(result.kpGain)}</span></div>
        </div>
        <p className="result-hint">{evalText}</p>
        {comboNote && <p className="result-hint result-hint-combo">{comboNote}</p>}
        <div className="result-actions">
          <button className="btn-primary" onClick={() => { setPhase('select'); setResult(null); }}>もう一度</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  const remainingSecs = Math.max(0, (30000 - elapsed) / 1000);
  return (
    <div className="screen battle-screen">
      {showQuitConfirm && (
        <div className="quit-confirm-overlay" role="alertdialog" aria-label="やめる確認">
          <div className="quit-confirm-card">
            <p className="quit-confirm-msg">やめてホームに戻りますか？<br/>進捗は記録されません。</p>
            <div className="quit-confirm-actions">
              <button className="btn-danger" onClick={() => navigate('/')}>やめる</button>
              <button className="btn-secondary" onClick={() => setShowQuitConfirm(false)}>つづける</button>
            </div>
          </div>
        </div>
      )}
      <div className="quiz-header">
        <span className={`quiz-counter ${remainingSecs < 5 ? 'time-urgent' : ''}`}>⏱ {remainingSecs.toFixed(1)}秒</span>
        <span className="quiz-counter">⚔️ {defeated}体</span>
        <span className={`quiz-counter combo-counter combo-${combo >= 5 ? 'hot' : combo >= 3 ? 'warm' : ''} ${comboFlash ? 'combo-flash' : ''}`}>
          🔥 {combo}コンボ
        </span>
      </div>

      <div className={`battle-enemy ${feedback === 'correct' ? 'hit' : feedback === 'wrong' ? 'shake' : ''}`}>
        <div className="enemy-emoji" aria-hidden="true">{stage?.enemyEmoji ?? '👾'}</div>
        <div className="enemy-hp">この数を作ろう：<strong>{hp}</strong></div>
      </div>

      <div className="battle-formula-line">
        <span className={`battle-slot ${selected[0] != null ? 'filled' : ''}`}>
          {selected[0] != null ? cards[selected[0]] : '?'}
        </span>
        <span className="battle-op">×</span>
        <span className={`battle-slot ${selected[1] != null ? 'filled' : ''}`}>
          {selected[1] != null ? cards[selected[1]] : '?'}
        </span>
        <span className="battle-op">=</span>
        <span className={`battle-slot battle-target ${
          selected.length === 2
            ? (cards[selected[0]] * cards[selected[1]] === hp ? 'ok' : 'ng')
            : ''
        }`}>
          {selected.length === 2 ? cards[selected[0]] * cards[selected[1]] : hp}
        </span>
        {selected.length === 2 && (
          <span className="battle-check">
            {cards[selected[0]] * cards[selected[1]] === hp ? '⚔️' : '✗'}
          </span>
        )}
      </div>
      <p className="battle-hint">
        {selected.length === 0 && '↓ カードを 2 まい選ぼう'}
        {selected.length === 1 && 'もう 1 まい選ぼう（× するとどうなる？）'}
        {selected.length === 2 && (
          cards[selected[0]] * cards[selected[1]] === hp
            ? '⚔️ 撃破！次の敵が来るよ'
            : 'HP と合わない… 1 まい選び直そう'
        )}
      </p>

      <div className={`battle-cards ${cards.length === 7 ? 'battle-cards-7' : ''}`}>
        {cards.map((c, i) => (
          <button
            key={i}
            className={`battle-card ${selected.includes(i) ? 'selected' : ''}`}
            onClick={() => pickCard(i)}
            disabled={feedback !== null}
            aria-pressed={selected.includes(i)}
            aria-label={`カード ${c}${selected.includes(i) ? '（選択中）' : ''}`}
          >
            {c}
          </button>
        ))}
      </div>

      <button className="btn-link quit-btn" onClick={() => setShowQuitConfirm(true)}>
        やめる
      </button>
    </div>
  );
}
