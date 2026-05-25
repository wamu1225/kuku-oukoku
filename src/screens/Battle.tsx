import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine } from '../utils/LearningEngine';

const STAGES = [
  { id: '3', name: 'はじまりの草原', max: 3, unlockRank: 1, color: '#22c55e' },
  { id: '6', name: 'しずかな森', max: 6, unlockRank: 4, color: '#16a34a' },
  { id: '9', name: 'ゴツゴツ洞窟', max: 9, unlockRank: 7, color: '#a16207' },
];

function generateHP(maxTable: number): number {
  // Choose a*b where a,b in [1..9] but at least one in [1..maxTable]
  const a = Math.floor(Math.random() * maxTable) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return a * b;
}

function generateCards(hp: number, maxTable: number, count: number): number[] {
  // Ensure at least one valid pair (a,b) where a*b === hp and a or b ≤ maxTable
  const cards: number[] = [];
  // Find divisor pair
  for (let a = 1; a <= 9; a++) {
    if (hp % a === 0) {
      const b = hp / a;
      if (b >= 1 && b <= 9 && (a <= maxTable || b <= maxTable)) {
        cards.push(a, b);
        break;
      }
    }
  }
  while (cards.length < count) {
    const c = Math.floor(Math.random() * 9) + 1;
    cards.push(c);
  }
  return cards.sort(() => Math.random() - 0.5);
}

export function Battle({ state, onComplete }: { state: KukuState; onComplete: () => void }) {
  const danRank = state.danRank || 0;
  const [phase, setPhase] = useState<'select' | 'countdown' | 'playing' | 'done'>('select');
  const [stage, setStage] = useState<(typeof STAGES)[number] | null>(null);
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
  const [result, setResult] = useState<{ count: number; combo: number; kpGain: number } | null>(null);

  const start = (s: (typeof STAGES)[number]) => {
    setStage(s);
    setPhase('countdown');
    setCountdown(3);
    setDefeated(0);
    setCombo(0);
    setMaxCombo(0);
    setSelected([]);
    const newHp = generateHP(s.max);
    setHp(newHp);
    setCards(generateCards(newHp, s.max, 5));
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
    if (timerRef.current) window.clearInterval(timerRef.current);
    const m = Math.max(maxCombo, combo);
    LearningEngine.saveBattleResult(stage!.id, defeated, m);
    setResult({ count: defeated, combo: m, kpGain: defeated * 50 + (Math.floor(defeated / 10) * 10000) });
    setPhase('done');
    onComplete();
  };

  const pickCard = (idx: number) => {
    if (phase !== 'playing') return;
    if (selected.includes(idx)) {
      setSelected((s) => s.filter((i) => i !== idx));
      return;
    }
    const next = [...selected, idx];
    if (next.length === 2) {
      const product = cards[next[0]] * cards[next[1]];
      if (product === hp) {
        setDefeated((d) => d + 1);
        setCombo((c) => {
          const nc = c + 1;
          setMaxCombo((m) => Math.max(m, nc));
          return nc;
        });
        setFeedback('correct');
        window.setTimeout(() => {
          setFeedback(null);
          setSelected([]);
          const newHp = generateHP(stage!.max);
          setHp(newHp);
          setCards(generateCards(newHp, stage!.max, 5));
        }, 350);
      } else {
        setFeedback('wrong');
        setCombo(0);
        window.setTimeout(() => {
          setFeedback(null);
          setSelected([]);
        }, 500);
      }
    } else {
      setSelected(next);
    }
  };

  if (phase === 'select') {
    return (
      <div className="screen">
        <h1 className="screen-title">⚔️ 九九バトル</h1>
        <p className="screen-desc">
          30 秒のあいだ、敵の HP に合うように 2 枚のカードを選んで撃破しよう。
          連続撃破でコンボがつながると、ますます熱くなる！
        </p>

        <div className="battle-stages">
          {STAGES.map((s) => {
            const unlocked = danRank >= s.unlockRank;
            const best = state.stats?.battleMaxDefeatedPerDiff?.[s.id] || 0;
            return (
              <button
                key={s.id}
                className={`battle-stage ${unlocked ? '' : 'locked'}`}
                style={{ '--stage-color': s.color } as React.CSSProperties}
                disabled={!unlocked}
                onClick={() => start(s)}
              >
                <span className="stage-name">{s.name}</span>
                <span className="stage-meta">1〜{s.max}の段</span>
                {unlocked ? (
                  <span className="stage-best">自己ベスト: {best}体</span>
                ) : (
                  <span className="stage-locked">🔒 段位試験を進めて解禁</span>
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
    return <div className="screen countdown-screen"><p className="countdown-ready">Ready...</p><p className="countdown-number">{countdown}</p></div>;
  }

  if (phase === 'done' && result) {
    return (
      <div className="screen result-screen">
        <h1 className="result-title">{stage!.name} 終了！</h1>
        <div className="result-stats">
          <div><span className="result-label">撃破数</span><span className="result-value">{result.count}体</span></div>
          <div><span className="result-label">最大コンボ</span><span className="result-value">{result.combo}</span></div>
          <div><span className="result-label">獲得 KP</span><span className="result-value">+{result.kpGain}</span></div>
        </div>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => { setPhase('select'); setResult(null); }}>もう一度</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen battle-screen">
      <div className="quiz-header">
        <span className="quiz-counter">⏱ {((30000 - elapsed) / 1000).toFixed(1)}秒</span>
        <span className="quiz-counter">⚔️ {defeated}体撃破</span>
        <span className="quiz-counter">🔥 {combo}コンボ</span>
      </div>

      <div className={`battle-enemy ${feedback === 'correct' ? 'hit' : feedback === 'wrong' ? 'shake' : ''}`}>
        <div className="enemy-emoji" aria-hidden="true">👾</div>
        <div className="enemy-hp">HP: {hp}</div>
      </div>

      <div className="battle-formula">
        {selected.length > 0 && (
          <span>
            {cards[selected[0]]}
            {selected.length === 2 && <> × {cards[selected[1]]} = {cards[selected[0]] * cards[selected[1]]}</>}
          </span>
        )}
      </div>

      <div className="battle-cards">
        {cards.map((c, i) => (
          <button
            key={i}
            className={`battle-card ${selected.includes(i) ? 'selected' : ''}`}
            onClick={() => pickCard(i)}
            disabled={feedback !== null}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
