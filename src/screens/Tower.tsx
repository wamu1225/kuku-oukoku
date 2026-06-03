import { useEffect, useRef, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine } from '../utils/LearningEngine';
import { IdleManager } from '../utils/IdleManager';
import { Confetti } from '../components/Confetti';
import { vibrateCorrect, vibrateWrong } from '../utils/haptics';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

type Stage = {
  id: string;
  name: string;
  max: number;
  gold: number;
  silver: number;
  bronze: number;
  unlockRank?: number;
  requiresTrial?: boolean;
  requiresStage4Gold?: boolean;
};

const STAGES: Stage[] = [
  { id: '3', name: 'そよ風の塔', max: 3, unlockRank: 2, gold: 230, silver: 150, bronze: 80 },
  { id: '6', name: '雲海の見張り塔', max: 6, unlockRank: 5, gold: 460, silver: 300, bronze: 160 },
  { id: '9', name: '迅雷の尖塔', max: 9, unlockRank: 8, gold: 630, silver: 410, bronze: 220 },
  { id: '15', name: '月光の天楼', max: 15, gold: 800, silver: 520, bronze: 280, requiresTrial: true },
  { id: '20', name: '星天の頂', max: 20, gold: 1000, silver: 650, bronze: 350, requiresTrial: true, requiresStage4Gold: true },
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
  const trialCleared = (state.stats?.totalTrialsCleared || 0) > 0;
  const [phase, setPhase] = useState<'select' | 'countdown' | 'playing' | 'done'>('select');
  const [stage, setStage] = useState<Stage | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [problemCount, setProblemCount] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  // setInterval 内 finish() の stale closure 対策
  const scoreRef = useRef(0);
  const stageRef = useRef<Stage | null>(null);
  const endedRef = useRef(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [flashWrong, setFlashWrong] = useState(false);
  const [floatingGain, setFloatingGain] = useState<{ value: number; key: number } | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const advanceTimerRef = useRef<number | null>(null);
  const wrongTimerRef = useRef<number | null>(null);
  const floatTimerRef = useRef<number | null>(null);
  // 解いた段ごとの問題数（熟練度加算用）
  const solvedRef = useRef<Record<number, number>>({});
  const [reward, setReward] = useState<{ kp: number; festivalLevel: number } | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
      if (floatTimerRef.current) window.clearTimeout(floatTimerRef.current);
    };
  }, []);

  const nextProblem = (max: number) => {
    setA(Math.floor(Math.random() * max) + 1);
    setB(Math.floor(Math.random() * 9) + 1);
    setInput('');
  };

  const start = (s: Stage) => {
    setStage(s);
    stageRef.current = s;
    setPhase('countdown');
    setCountdown(3);
    setScore(0); scoreRef.current = 0;
    setProblemCount(0);
    solvedRef.current = {};
    endedRef.current = false;
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
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    const stg = stageRef.current;
    const s = scoreRef.current;
    if (stg) {
      const r = LearningEngine.saveTowerResult(stg.id, s, solvedRef.current);
      setReward({ kp: r.kpGained, festivalLevel: r.festivalLevel });
    }
    setPhase('done');
    onComplete();
  };

  const handleKey = (key: string) => {
    if (phase !== 'playing' || flashCorrect || flashWrong) return;
    if (key === 'C') return setInput('');
    if (key === '⌫') return setInput(input.slice(0, -1));
    const next = input + key;
    const ansLocal = a * b;
    const maxLen = ansLocal.toString().length;
    if (next.length > maxLen) return;
    if (parseInt(next) === ansLocal) {
      vibrateCorrect();
      const newScore = score + ansLocal;
      scoreRef.current = newScore;
      setScore(newScore);
      setProblemCount(problemCount + 1);
      solvedRef.current[a] = (solvedRef.current[a] || 0) + 1;
      setInput(next);
      setFlashCorrect(true);
      // 浮遊「+ans」アニメ
      setFloatingGain({ value: ansLocal, key: Date.now() });
      if (floatTimerRef.current) window.clearTimeout(floatTimerRef.current);
      floatTimerRef.current = window.setTimeout(() => setFloatingGain(null), 900);
      advanceTimerRef.current = window.setTimeout(() => {
        setFlashCorrect(false);
        nextProblem(stage!.max);
      }, 150);
    } else if (next.length === maxLen) {
      vibrateWrong();
      setInput(next);
      setFlashWrong(true);
      wrongTimerRef.current = window.setTimeout(() => {
        setFlashWrong(false);
        setInput('');
      }, 350);
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
          {STAGES.filter((s) => !s.requiresTrial || trialCleared).map((s) => {
            const stage4Medal = state.stats?.towerMedalsPerDiff?.['15'];
            const stage4Gold = stage4Medal === 'gold';
            let unlocked = true;
            let lockMsg = '';
            if (s.requiresStage4Gold && !stage4Gold) {
              unlocked = false;
              lockMsg = '🔒 月光の天楼で 🥇 金メダルを取ると解禁';
            } else if (s.unlockRank != null && danRank < s.unlockRank) {
              unlocked = false;
              const rankLabel = s.unlockRank === 2 ? '9級' : s.unlockRank === 5 ? '6級' : '3級';
              lockMsg = `🔒 だんいにんてい ${rankLabel}合格で解禁`;
            }
            const best = state.stats?.towerBestHeightsPerDiff?.[s.id] || 0;
            const medal = state.stats?.towerMedalsPerDiff?.[s.id];
            return (
              <button
                key={s.id}
                className={`battle-stage ${unlocked ? '' : 'locked'} ${s.requiresTrial ? 'stage-legend' : ''}`}
                style={{ '--stage-color': s.requiresTrial ? '#a78bfa' : '#6366f1' } as React.CSSProperties}
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
                ) : <span className="stage-locked">{lockMsg}</span>}
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
      <div className="screen tower-screen tower-countdown-screen" style={{ background: BG_TIERS[BG_TIERS.length - 1].bg }}>
        <p className="countdown-ready" style={{ color: '#fff' }}>よーい…</p>
        <p key={countdown} className="countdown-number pop" style={{ color: '#fff' }}>{countdown}</p>
      </div>
    );
  }

  if (phase === 'done') {
    const tier = getTier(score);
    const showConfetti = score >= 300;
    // tier 別シンボル
    const tierSymbol = tier.name === '深宇宙' ? '🌌' : tier.name === '宇宙' ? '🚀' : tier.name === '成層圏' ? '🛰' : tier.name === '雲の上' ? '☁️' : '🌱';
    // メダル目標との比較
    const stg = stage;
    let goalHint = '';
    if (stg) {
      if (score >= stg.gold) goalHint = `🥇 金級到達！自己ベスト更新を狙おう`;
      else if (score >= stg.silver) goalHint = `🥈 銀級。あと ${stg.gold - score}m で 🥇 金へ`;
      else if (score >= stg.bronze) goalHint = `🥉 銅級。あと ${stg.silver - score}m で 🥈 銀へ`;
      else goalHint = `あと ${stg.bronze - score}m で 🥉 銅級！`;
    }
    return (
      <div className="screen result-screen">
        {showConfetti && <Confetti count={45} />}
        <div className="result-symbol" aria-hidden="true">{tierSymbol}</div>
        <h1 className="result-title">🗼 {tier.name}に到達！</h1>
        <div className="result-stats">
          <div><span className="result-label">到達高度</span><span className="result-value">{score}m</span></div>
          <div><span className="result-label">エリア</span><span className="result-value">{tier.name}</span></div>
          <div><span className="result-label">問題数</span><span className="result-value">{problemCount}問</span></div>
          <div><span className="result-label">獲得 KP</span><span className="result-value">+{IdleManager.formatBigNumber(reward?.kp ?? Math.floor(score / 10))}</span></div>
        </div>
        {goalHint && <p className="result-hint">{goalHint}</p>}
        {reward && <p className="festival-notice">🎉 {reward.festivalLevel}の段の祝祭が 30分 発動！その段のなかまの生産アップ</p>}
        <div className="result-actions">
          <button className="btn-primary" onClick={() => { setPhase('select'); }}>もう一度</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  const tier = getTier(score);
  const ans = a * b;
  // 次ティアまでの距離
  const tierIdx = BG_TIERS.findIndex((t) => t.from === tier.from);
  const nextTier = tierIdx > 0 ? BG_TIERS[tierIdx - 1] : null;
  const toNext = nextTier ? nextTier.from - score : 0;

  // タワー可視化用 - 各 tier の位置を 0-100% で固定配置（地上=0%、深宇宙=100%）
  // log スケールで対数的な階層表現にする (1m=0, 100m=25, 300m=50, 1000m=75, 2000m=100)
  const positionForScore = (m: number) => {
    if (m <= 0) return 0;
    if (m <= 100) return (m / 100) * 25;
    if (m <= 300) return 25 + ((m - 100) / 200) * 25;
    if (m <= 1000) return 50 + ((m - 300) / 700) * 25;
    if (m <= 2000) return 75 + ((m - 1000) / 1000) * 25;
    return 100;
  };
  const playerPos = positionForScore(score);

  const remainingSecs = Math.max(0, (30000 - elapsed) / 1000);
  return (
    <div className="screen tower-screen" style={{ background: tier.bg }}>
      {showQuitConfirm && (
        <div className="quit-confirm-overlay" role="alertdialog" aria-label="やめる確認">
          <div className="quit-confirm-card">
            <p className="quit-confirm-msg">やめてホームに戻りますか？<br/>スコアは記録されません。</p>
            <div className="quit-confirm-actions">
              <button className="btn-danger" onClick={() => navigate('/')}>やめる</button>
              <button className="btn-secondary" onClick={() => setShowQuitConfirm(false)}>つづける</button>
            </div>
          </div>
        </div>
      )}
      <div className="tower-overlay tower-overlay-v2">
        <div className="quiz-header">
          <span className={`quiz-counter tower-time ${remainingSecs < 5 ? 'time-urgent' : ''}`}>⏱ {remainingSecs.toFixed(1)}秒</span>
          <span className="quiz-counter tower-tier-label">📍 今は『{tier.name}』</span>
        </div>

        <div className="tower-main">
          <div className="tower-bar-col" aria-hidden="true">
            <div className="tower-bar">
              {/* 階層マーカー */}
              {BG_TIERS.slice().reverse().map((t) => (
                <div key={t.name} className="tower-tier-mark" style={{ bottom: `${positionForScore(t.from)}%` }}>
                  <span className="tower-tier-mark-label">{t.from}m</span>
                  <span className="tower-tier-mark-line" />
                </div>
              ))}
              {/* プレイヤー位置（🚀 + 現在スコアを横に） */}
              <div className="tower-player" style={{ bottom: `${playerPos}%` }}>
                <span className="tower-player-rocket" aria-hidden="true">🚀</span>
                <span className="tower-player-score">{score}m</span>
              </div>
              {/* 浮遊「+ans」（プレイヤーの少し上から） */}
              {floatingGain && (
                <div
                  key={floatingGain.key}
                  className="tower-floating-gain"
                  style={{ bottom: `calc(${playerPos}% + 24px)` }}
                >
                  +{floatingGain.value}m
                </div>
              )}
            </div>
          </div>

          <div className="tower-game-col">
            {nextTier && (
              <p className="tower-next-tier-v2">
                あと <strong>{toNext}m</strong> で <strong>{nextTier.name}</strong> ！
              </p>
            )}

            <div className={`quiz-problem attack-problem ${flashCorrect ? 'flash-correct' : ''} ${flashWrong ? 'flash-wrong' : ''}`}>
              <span className="quiz-equation">{a} × {b} =</span>
              <span className={`quiz-input attack-input ${flashCorrect ? 'success' : ''} ${flashWrong ? 'wrong' : ''}`}>
                {flashCorrect ? `${ans} ✓` : flashWrong ? '✗' : (input || <span className="placeholder-q">?</span>)}
              </span>
            </div>

            <div className="keypad">
              {KEYS.map((key) => (
                <button key={key} className="keypad-btn" onClick={() => handleKey(key)}>{key}</button>
              ))}
            </div>
          </div>
        </div>

        <button className="btn-link quit-btn" onClick={() => setShowQuitConfirm(true)}>
          やめる
        </button>
      </div>
    </div>
  );
}
