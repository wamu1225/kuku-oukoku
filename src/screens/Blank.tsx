import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine } from '../utils/LearningEngine';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
const STAGES = [
  { id: '3', name: 'しんキロウの森', max: 3, unlockRank: 3 },
  { id: '6', name: 'そらの雲海', max: 6, unlockRank: 6 },
  { id: '9', name: 'かみなりの山', max: 9, unlockRank: 9 },
];
const BADGE_LABEL: Record<string, string> = { gold: '金', silver: '銀', bronze: '銅', clear: 'クリア' };
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
  const [phase, setPhase] = useState<'select' | 'countdown' | 'playing' | 'done'>('select');
  const [stage, setStage] = useState<(typeof STAGES)[number] | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [problems, setProblems] = useState<BlankProblem[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const [result, setResult] = useState<{ timeMs: number; medal: string } | null>(null);

  const current = problems[index];

  const start = (s: (typeof STAGES)[number]) => {
    setStage(s);
    setProblems(generate(s.max));
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
  const advanceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current); };
  }, []);

  const handleKey = (key: string) => {
    if (phase !== 'playing' || !current || flashCorrect) return;
    if (key === 'C') return setInput('');
    if (key === '⌫') return setInput(input.slice(0, -1));
    const next = input + key;
    const maxLen = current.answer.toString().length;
    if (next.length > maxLen) return;
    if (parseInt(next) === current.answer) {
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
    } else {
      setInput(next);
    }
  };

  const finish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    const final = Date.now() - (startRef.current || Date.now());
    const after = LearningEngine.saveBlankResult(stage!.id, final);
    const medal = after.blankMedalsPerDiff?.[stage!.id] ?? 'clear';
    setResult({ timeMs: final, medal: BADGE_LABEL[medal] || 'クリア' });
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
          {STAGES.map((s) => {
            const unlocked = danRank >= s.unlockRank;
            const best = state.challengeBestTimes?.[s.id];
            const medal = state.blankMedalsPerDiff?.[s.id];
            return (
              <button
                key={s.id}
                className={`battle-stage ${unlocked ? '' : 'locked'}`}
                style={{ '--stage-color': '#8b5cf6' } as React.CSSProperties}
                disabled={!unlocked}
                onClick={() => start(s)}
              >
                <span className="stage-name">{s.name}</span>
                <span className="stage-meta">1〜{s.max}の段</span>
                {unlocked ? (
                  <span className="stage-best">
                    {best ? `自己ベスト: ${(best / 1000).toFixed(2)}秒` : '未挑戦'}
                    {medal && ` (${BADGE_LABEL[medal]})`}
                  </span>
                ) : <span className="stage-locked">🔒 段位試験を進めて解禁</span>}
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
        <h1 className="result-title">クリア！🎉</h1>
        <div className="result-stats">
          <div><span className="result-label">タイム</span><span className="result-value">{(result.timeMs / 1000).toFixed(2)}秒</span></div>
          <div><span className="result-label">メダル</span><span className="result-value">{result.medal}</span></div>
          <div><span className="result-label">報酬</span><span className="result-value">+500 KP</span></div>
        </div>
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
      <div className="quiz-header">
        <span className="quiz-counter">⏱ {(elapsed / 1000).toFixed(2)}秒</span>
        <span className="quiz-counter">{index + 1} / {problems.length}</span>
      </div>
      <p className="blank-instruction">↓ <strong>あなあき（黄色のマス）</strong> に入る数をキーパッドで入力</p>
      <div className={`quiz-problem ${flashCorrect ? 'flash-correct' : ''}`}>
        {current.hole === 'a' ? (
          <span className="quiz-equation">
            <span className={`quiz-blank ${input ? 'filled' : ''} ${flashCorrect ? 'success' : ''}`}>
              {flashCorrect ? '✓' : (input || '?')}
            </span> × {current.b} = {current.c}
          </span>
        ) : (
          <span className="quiz-equation">
            {current.a} × <span className={`quiz-blank ${input ? 'filled' : ''} ${flashCorrect ? 'success' : ''}`}>
              {flashCorrect ? '✓' : (input || '?')}
            </span> = {current.c}
          </span>
        )}
      </div>
      <div className="keypad">
        {KEYS.map((key) => (
          <button key={key} className="keypad-btn" onClick={() => handleKey(key)}>{key}</button>
        ))}
      </div>
    </div>
  );
}
