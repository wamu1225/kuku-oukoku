import { useEffect, useRef, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine } from '../utils/LearningEngine';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
const STAGES = [
  { id: '3', name: 'そよ風の塔', max: 3, unlockRank: 2, gold: 230, silver: 150, bronze: 80 },
  { id: '6', name: '雲海の見張り塔', max: 6, unlockRank: 5, gold: 460, silver: 300, bronze: 160 },
  { id: '9', name: '迅雷の尖塔', max: 9, unlockRank: 8, gold: 630, silver: 410, bronze: 220 },
];
const BG_TIERS = [
  { from: 2000, name: '深宇宙', bg: 'linear-gradient(180deg, #020617 0%, #1e1b4b 100%)' },
  { from: 1000, name: '宇宙', bg: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' },
  { from: 300, name: '成層圏', bg: 'linear-gradient(180deg, #1e3a8a 0%, #6366f1 100%)' },
  { from: 100, name: '雲の上', bg: 'linear-gradient(180deg, #93c5fd 0%, #c7d2fe 100%)' },
  { from: 0, name: '地上', bg: 'linear-gradient(180deg, #bae6fd 0%, #fde68a 100%)' },
];

function getTier(score: number) {
  return BG_TIERS.find((t) => score >= t.from) ?? BG_TIERS[BG_TIERS.length - 1];
}

export function Tower({ state, onComplete }: { state: KukuState; onComplete: () => void }) {
  const danRank = state.danRank || 0;
  const [phase, setPhase] = useState<'select' | 'countdown' | 'playing' | 'done'>('select');
  const [stage, setStage] = useState<(typeof STAGES)[number] | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [problemCount, setProblemCount] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const nextProblem = (max: number) => {
    setA(Math.floor(Math.random() * max) + 1);
    setB(Math.floor(Math.random() * 9) + 1);
    setInput('');
  };

  const start = (s: (typeof STAGES)[number]) => {
    setStage(s);
    setPhase('countdown');
    setCountdown(3);
    setScore(0);
    setProblemCount(0);
    nextProblem(s.max);
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
    LearningEngine.saveTowerResult(stage!.id, score);
    setPhase('done');
    onComplete();
  };

  const handleKey = (key: string) => {
    if (phase !== 'playing') return;
    if (key === 'C') return setInput('');
    if (key === '⌫') return setInput(input.slice(0, -1));
    const next = input + key;
    const ans = a * b;
    const maxLen = ans.toString().length;
    if (next.length > maxLen) return;
    if (parseInt(next) === ans) {
      setScore(score + ans);
      setProblemCount(problemCount + 1);
      nextProblem(stage!.max);
    } else {
      setInput(next);
    }
  };

  if (phase === 'select') {
    return (
      <div className="screen">
        <h1 className="screen-title">🗼 九九のタワー</h1>
        <p className="screen-desc">
          30 秒で問題を解くたびに、答えの数だけタワーが伸びていくよ。
          100m で雲の上、300m で成層圏、1000m で宇宙に到達！
        </p>

        <div className="battle-stages">
          {STAGES.map((s) => {
            const unlocked = danRank >= s.unlockRank;
            const best = state.stats?.towerBestHeightsPerDiff?.[s.id] || 0;
            const medal = state.stats?.towerMedalsPerDiff?.[s.id];
            return (
              <button
                key={s.id}
                className={`battle-stage ${unlocked ? '' : 'locked'}`}
                style={{ '--stage-color': '#6366f1' } as React.CSSProperties}
                disabled={!unlocked}
                onClick={() => start(s)}
              >
                <span className="stage-name">{s.name}</span>
                <span className="stage-meta">1〜{s.max}の段</span>
                {unlocked ? (
                  <>
                    <span className="stage-best">
                      自己ベスト: {best}m {medal && `(${medal === 'gold' ? '🥇金' : medal === 'silver' ? '🥈銀' : '🥉銅'})`}
                    </span>
                    <span className="stage-targets">
                      🥇 {s.gold}m / 🥈 {s.silver}m / 🥉 {s.bronze}m
                    </span>
                  </>
                ) : <span className="stage-locked">🔒 だんいにんてい {s.unlockRank === 2 ? '9級' : s.unlockRank === 5 ? '6級' : '3級'}合格で解禁</span>}
              </button>
            );
          })}
        </div>

        <button className="back-link" onClick={() => navigate('/')}>← ホームへ</button>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <div className="screen tower-screen" style={{ background: BG_TIERS[BG_TIERS.length - 1].bg, minHeight: 300 }}>
        <div className="tower-overlay countdown-screen">
          <p className="countdown-ready">Ready...</p>
          <p className="countdown-number">{countdown}</p>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    const tier = getTier(score);
    return (
      <div className="screen result-screen">
        <h1 className="result-title">🗼 {tier.name}に到達！</h1>
        <div className="result-stats">
          <div><span className="result-label">到達高度</span><span className="result-value">{score}m</span></div>
          <div><span className="result-label">エリア</span><span className="result-value">{tier.name}</span></div>
          <div><span className="result-label">問題数</span><span className="result-value">{problemCount}問</span></div>
          <div><span className="result-label">獲得 KP</span><span className="result-value">+{Math.floor(score / 10)}</span></div>
        </div>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => { setPhase('select'); }}>もう一度</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  const tier = getTier(score);
  // 次ティアまでの距離
  const tierIdx = BG_TIERS.findIndex((t) => t.from === tier.from);
  const nextTier = tierIdx > 0 ? BG_TIERS[tierIdx - 1] : null;
  const toNext = nextTier ? nextTier.from - score : 0;

  return (
    <div className="screen tower-screen" style={{ background: tier.bg }}>
      <div className="tower-overlay">
        <div className="quiz-header">
          <span className="quiz-counter">⏱ {((30000 - elapsed) / 1000).toFixed(1)}秒</span>
          <span className="quiz-counter">🗼 {score}m</span>
          <span className="quiz-counter">📍 {tier.name}</span>
        </div>
        {nextTier && (
          <p className="tower-next-tier">
            あと <strong>{toNext}m</strong> で <strong>{nextTier.name}</strong> ！
          </p>
        )}

        <div className="quiz-problem attack-problem">
          <span className="quiz-equation">{a} × {b} =</span>
          <span className="quiz-input attack-input">{input || '?'}</span>
        </div>

        <div className="keypad">
          {KEYS.map((key) => (
            <button key={key} className="keypad-btn" onClick={() => handleKey(key)}>{key}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
