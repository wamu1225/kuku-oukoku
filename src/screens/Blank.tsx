import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine, isGoldOrBetter } from '../utils/LearningEngine';
import { IdleManager } from '../utils/IdleManager';
import { Confetti } from '../components/Confetti';
import { vibrateCorrect, vibrateWrong } from '../utils/haptics';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

type Stage = {
  id: string;
  name: string;
  max: number;
  unlockRank?: number;
  requiresTrial?: boolean;
  requiresStage4Gold?: boolean;
};

const STAGES: Stage[] = [
  { id: '3', name: 'しんキロウの森', max: 3, unlockRank: 3 },
  { id: '6', name: 'そらの雲海', max: 6, unlockRank: 6 },
  { id: '9', name: 'かみなりの山', max: 9, unlockRank: 9 },
  { id: '15', name: '月見の雲海', max: 15, requiresTrial: true },
  { id: '20', name: '流星の彼方', max: 20, requiresTrial: true, requiresStage4Gold: true },
];

const UNLOCK_RANK_NAMES: Record<number, string> = { 3: '8級', 6: '5級', 9: '2級' };

// 金/銀メダルしきい値 (10 問の合計タイム)
const GOLD_MS = 10 * 1500;  // 15 秒
const SILVER_MS = 10 * 2500; // 25 秒
const BADGE_LABEL: Record<string, string> = { diamond: 'ダイヤ', gold: '金', silver: '銀', bronze: '銅', clear: 'クリア' };
const QUESTION_COUNT = 10;

interface BlankProblem {
  a: number;
  b: number;
  c: number;
  hole: 'a' | 'b';
  answer: number;
}

function generate(max: number): BlankProblem[] {
  const out: BlankProblem[] = [];
  let prev = '';
  for (let i = 0; i < QUESTION_COUNT; i++) {
    let a = 0, b = 0, key = '';
    let tries = 0;
    do {
      a = Math.floor(Math.random() * max) + 1;
      b = Math.floor(Math.random() * 9) + 1;
      key = `${a}x${b}`;
      tries++;
    } while (key === prev && tries < 5);
    prev = key;
    const hole: 'a' | 'b' = Math.random() < 0.5 ? 'a' : 'b';
    out.push({ a, b, c: a * b, hole, answer: hole === 'a' ? a : b });
  }
  return out;
}

export function Blank({ state, onComplete }: { state: KukuState; onComplete: () => void }) {
  const danRank = state.danRank || 0;
  const trialCleared = (state.stats?.totalTrialsCleared || 0) > 0;
  const [phase, setPhase] = useState<'select' | 'countdown' | 'playing' | 'done'>('select');
  const [stage, setStage] = useState<Stage | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [problems, setProblems] = useState<BlankProblem[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  // 解いた段ごとの問題数（熟練度加算用）
  const solvedRef = useRef<Record<number, number>>({});
  const [result, setResult] = useState<{ timeMs: number; medal: string; kpGained: number; festivalLevel: number } | null>(null);

  const current = problems[index];

  const start = (s: Stage) => {
    setStage(s);
    setProblems(generate(s.max));
    solvedRef.current = {};
    setIndex(0);
    setInput('');
    setPhase('countdown');
    setCountdown(3);
    endedRef.current = false;
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
      setElapsed(Date.now() - (startRef.current || 0));
    }, 100);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [phase]);

  const endedRef = useRef(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [flashWrong, setFlashWrong] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const advanceTimerRef = useRef<number | null>(null);
  const wrongTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
    };
  }, []);

  const handleKey = (key: string) => {
    if (phase !== 'playing' || !current || flashCorrect || flashWrong) return;
    if (key === 'C') return setInput('');
    if (key === '⌫') return setInput(input.slice(0, -1));
    const next = input + key;
    const maxLen = current.answer.toString().length;
    if (next.length > maxLen) return;
    if (parseInt(next) === current.answer) {
      vibrateCorrect();
      solvedRef.current[current.a] = (solvedRef.current[current.a] || 0) + 1;
      setInput(next);
      setFlashCorrect(true);
      advanceTimerRef.current = window.setTimeout(() => {
        setFlashCorrect(false);
        setInput('');
        if (index >= problems.length - 1) {
          finish();
        } else {
          setIndex(index + 1);
        }
      }, 250);
    } else if (next.length === maxLen) {
      vibrateWrong();
      setInput(next);
      setFlashWrong(true);
      wrongTimerRef.current = window.setTimeout(() => {
        setFlashWrong(false);
        setInput('');
      }, 500);
    } else {
      setInput(next);
    }
  };

  const finish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    const final = Date.now() - (startRef.current || Date.now());
    const { state: after, kpGained, festivalLevel } = LearningEngine.saveBlankResult(stage!.id, final, solvedRef.current);
    const medal = after.blankMedalsPerDiff?.[stage!.id] ?? 'clear';
    setResult({ timeMs: final, medal: BADGE_LABEL[medal] || 'クリア', kpGained, festivalLevel });
    setPhase('done');
    onComplete();
  };

  if (phase === 'select') {
    return (
      <div className="screen">
        <h1 className="screen-title">🌫 くもくも（あなあき九九）</h1>
        <p className="screen-desc">
          式の中に <strong>あなあき（？）</strong> がある九九問題に答えるモード。
          <br />
          例：<span className="blank-example">？ × 4 = 12</span> →「？」に入る数（この場合 <strong>3</strong>）をキーパッドで入力。
          <br />
          10 問の合計タイムで金/銀/銅メダル。
        </p>

        <div className="battle-stages">
          {STAGES.filter((s) => !s.requiresTrial || trialCleared).map((s) => {
            const stage4Medal = state.blankMedalsPerDiff?.['15'];
            const stage4Gold = isGoldOrBetter(stage4Medal);
            let unlocked = true;
            let lockMsg = '';
            if (s.requiresStage4Gold && !stage4Gold) {
              unlocked = false;
              lockMsg = '🔒 月見の雲海で 🥇 金メダルを取ると解禁';
            } else if (s.unlockRank != null && danRank < s.unlockRank) {
              unlocked = false;
              lockMsg = `🔒 だんいにんてい ${UNLOCK_RANK_NAMES[s.unlockRank]}合格で解禁`;
            }
            const best = state.challengeBestTimes?.[s.id];
            const medal = state.blankMedalsPerDiff?.[s.id];
            return (
              <button
                key={s.id}
                className={`battle-stage ${unlocked ? '' : 'locked'} ${s.requiresTrial ? 'stage-legend' : ''}`}
                style={{ '--stage-color': s.requiresTrial ? '#a78bfa' : '#8b5cf6' } as React.CSSProperties}
                disabled={!unlocked}
                onClick={() => start(s)}
              >
                <span className="stage-name">{s.name}</span>
                <span className="stage-meta">1〜{s.max}の段</span>
                {unlocked ? (
                  <>
                    <span className="stage-best">
                      {best ? `自己ベスト: ${(best / 1000).toFixed(2)}秒` : '未挑戦'}
                      {medal && ` (${BADGE_LABEL[medal]})`}
                    </span>
                    <span className="stage-targets">
                      🥇 {(GOLD_MS / 1000).toFixed(1)}秒 / 🥈 {(SILVER_MS / 1000).toFixed(1)}秒 / 🥉 クリア
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
    return <div className="screen countdown-screen"><p className="countdown-ready">よーい…</p><p key={countdown} className="countdown-number pop">{countdown}</p></div>;
  }

  if (phase === 'done' && result) {
    const showConfetti = result.medal === 'ダイヤ' || result.medal === '金' || result.medal === '銀';
    const ms = result.timeMs;
    let goalHint = '';
    if (result.medal === 'ダイヤ') goalHint = '💎 ダイヤモンド達成！神速！';
    else if (ms <= GOLD_MS) goalHint = '🥇 金級！自己ベスト更新を狙おう';
    else if (ms <= SILVER_MS) goalHint = `🥈 銀級。あと ${((ms - GOLD_MS) / 1000).toFixed(2)}秒 縮めれば 🥇 金へ`;
    else goalHint = `🥉 銅級。あと ${((ms - SILVER_MS) / 1000).toFixed(2)}秒 縮めれば 🥈 銀へ`;
    const symbol = result.medal === 'ダイヤ' ? '💎' : result.medal === '金' ? '🥇' : result.medal === '銀' ? '🥈' : result.medal === '銅' ? '🥉' : '🌫';
    return (
      <div className="screen result-screen">
        {showConfetti && <Confetti count={result.medal === 'ダイヤ' ? 70 : result.medal === '金' ? 50 : 30} />}
        <div className="result-symbol" aria-hidden="true">{symbol}</div>
        <h1 className="result-title">クリア！</h1>
        <div className="result-stats">
          <div><span className="result-label">タイム</span><span className="result-value">{(result.timeMs / 1000).toFixed(2)}秒</span></div>
          <div><span className="result-label">メダル</span><span className="result-value">{result.medal}</span></div>
          <div><span className="result-label">報酬</span><span className="result-value">+{IdleManager.formatBigNumber(result.kpGained)} KP</span></div>
        </div>
        <p className="result-hint">{goalHint}</p>
        <p className="festival-notice">🎉 {result.festivalLevel}の段の祝祭が 30分 発動！その段のなかまの生産アップ</p>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => setPhase('select')}>もう一度</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="screen quiz-screen">
      {showQuitConfirm && (
        <div className="quit-confirm-overlay" role="alertdialog" aria-label="やめる確認">
          <div className="quit-confirm-card">
            <p className="quit-confirm-msg">やめてホームに戻りますか？<br/>タイムは記録されません。</p>
            <div className="quit-confirm-actions">
              <button className="btn-danger" onClick={() => navigate('/')}>やめる</button>
              <button className="btn-secondary" onClick={() => setShowQuitConfirm(false)}>つづける</button>
            </div>
          </div>
        </div>
      )}
      <div className="quiz-header">
        <span className="quiz-counter">⏱ {(elapsed / 1000).toFixed(2)}秒</span>
        <span className="quiz-counter">📝 {index + 1} / {problems.length}</span>
      </div>
      <div className={`quiz-problem ${flashCorrect ? 'flash-correct' : ''} ${flashWrong ? 'flash-wrong' : ''}`}>
        {current.hole === 'a' ? (
          <span className="quiz-equation">
            <span className={`quiz-blank ${input ? 'filled' : ''} ${flashCorrect ? 'success' : ''} ${flashWrong ? 'wrong' : ''}`}>
              {flashCorrect ? '✓' : flashWrong ? '✗' : (input ? input : <span className="placeholder-q">?</span>)}
            </span> × {current.b} = {current.c}
          </span>
        ) : (
          <span className="quiz-equation">
            {current.a} × <span className={`quiz-blank ${input ? 'filled' : ''} ${flashCorrect ? 'success' : ''} ${flashWrong ? 'wrong' : ''}`}>
              {flashCorrect ? '✓' : flashWrong ? '✗' : (input ? input : <span className="placeholder-q">?</span>)}
            </span> = {current.c}
          </span>
        )}
      </div>
      <div className="keypad">
        {KEYS.map((key) => (
          <button key={key} className="keypad-btn" onClick={() => handleKey(key)}>{key}</button>
        ))}
      </div>
      <button className="btn-link quit-btn" onClick={() => setShowQuitConfirm(true)}>
        やめる
      </button>
    </div>
  );
}
