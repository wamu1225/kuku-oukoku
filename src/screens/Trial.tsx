import { useEffect, useRef, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine } from '../utils/LearningEngine';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
const PROBLEMS_COUNT = 20;
const TIME_LIMIT_MS = 30000;

function generate(): { a: number; b: number }[] {
  const out: { a: number; b: number }[] = [];
  let prev = '';
  for (let i = 0; i < PROBLEMS_COUNT; i++) {
    let a = 0, b = 0, key = '';
    let tries = 0;
    do {
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
      key = `${a}x${b}`;
      tries++;
    } while (key === prev && tries < 5);
    prev = key;
    out.push({ a, b });
  }
  return out;
}

export function Trial({ state, onComplete }: { state: KukuState; onComplete: () => void }) {
  const hasNineCompanion = (state.companions[9] || 0) > 0;
  const trialCleared = (state.stats?.totalTrialsCleared || 0) > 0;

  const [phase, setPhase] = useState<'intro' | 'countdown' | 'playing' | 'success' | 'failed'>('intro');
  const [countdown, setCountdown] = useState(3);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [problems, setProblems] = useState<{ a: number; b: number }[]>([]);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [flashWrong, setFlashWrong] = useState(false);
  const advanceTimerRef = useRef<number | null>(null);
  const wrongTimerRef = useRef<number | null>(null);
  const current = problems[index];

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
    };
  }, []);

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
      if (e >= TIME_LIMIT_MS) fail();
    }, 100);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [phase]);

  const start = () => {
    setProblems(generate());
    setPhase('countdown');
    setCountdown(3);
    setIndex(0);
    setInput('');
    endedRef.current = false;
  };

  const fail = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    LearningEngine.completeTrial(false);
    setPhase('failed');
    onComplete();
  };

  const succeed = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    LearningEngine.completeTrial(true);
    setPhase('success');
    onComplete();
  };

  const handleKey = (key: string) => {
    if (phase !== 'playing' || !current || flashCorrect || flashWrong) return;
    if (key === 'C') return setInput('');
    if (key === '⌫') return setInput(input.slice(0, -1));
    const next = input + key;
    const ans = current.a * current.b;
    const maxLen = ans.toString().length;
    if (next.length > maxLen) return;
    if (parseInt(next) === ans) {
      setInput(next);
      setFlashCorrect(true);
      advanceTimerRef.current = window.setTimeout(() => {
        setFlashCorrect(false);
        setInput('');
        if (index >= problems.length - 1) {
          succeed();
        } else {
          setIndex(index + 1);
        }
      }, 150);
    } else if (next.length === maxLen) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch { /* ignore */ }
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

  if (phase === 'intro') {
    if (!hasNineCompanion) {
      return (
        <div className="screen trial-intro">
          <h1 className="screen-title">🌑 暗黒の試練</h1>
          <p className="screen-desc">
            おうこくの奥にひっそりと立つ、いにしえの門。九九の真の力が試される、特別な挑戦の場です。
          </p>
          <div className="trial-locked">
            🔒 まずはおうこくでなかまをじっくり集めましょう。条件が整ったときに、自然と道が開きます。
          </div>
          <div className="cta-row">
            <button className="btn-secondary" onClick={() => navigate('/empire/')}>おうこくへ戻る</button>
          </div>
        </div>
      );
    }
    return (
      <div className="screen trial-intro">
        <h1 className="screen-title">🌑 暗黒の試練</h1>
        <p className="screen-desc">
          おうこくの奥にひっそりと立つ、いにしえの門。九九の真の力を試される高難度チャレンジです。
        </p>

        <div className="trial-rules">
          <h2 className="section-h">ルール</h2>
          <ul>
            <li>1×1〜9×9 から <strong>20 問</strong> がランダムに出題</li>
            <li>制限時間 <strong>30 秒以内</strong> に全問正解で勝利</li>
            <li>1 問でも時間切れになるとその挑戦は失敗</li>
          </ul>

          <h2 className="section-h">報酬</h2>
          <ul>
            <li>クリアで <strong>5,000 KP</strong></li>
            <li>新たな段がいくつも解禁され、王国が大きく広がる</li>
            <li>「暗黒の盾」のメダル獲得</li>
          </ul>
        </div>

        <div className="cta-row">
          <button className="btn-primary big" onClick={start}>
            ⚔️ 挑戦する
          </button>
          <button className="btn-secondary" onClick={() => navigate('/empire/')}>おうこくへ戻る</button>
        </div>
      </div>
    );
  }

  if (phase === 'countdown') {
    return <div className="screen countdown-screen"><p className="countdown-ready">心を整えて…</p><p key={countdown} className="countdown-number pop">{countdown}</p></div>;
  }

  if (phase === 'success') {
    return (
      <div className="screen result-screen">
        <h1 className="result-title">🌟 試練の門が開いた！</h1>
        <p>新たな道が見えた。10 の段が解禁されたよ。</p>
        <div className="result-stats">
          <div><span className="result-label">報酬</span><span className="result-value">+5,000 KP</span></div>
          <div><span className="result-label">解禁</span><span className="result-value">10 の段</span></div>
        </div>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => navigate('/empire/')}>おうこくへ</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  if (phase === 'failed') {
    return (
      <div className="screen result-screen">
        <h1 className="result-title">🌑 時間切れ</h1>
        <p>あと {Math.max(0, PROBLEMS_COUNT - index)} 問のところで時間切れ。九九の瞬発力が試されるよ。</p>
        <p><strong>アタック</strong> や <strong>だんいにんてい</strong> で速度を磨いてから再挑戦するのがおすすめ。</p>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => { setPhase('intro'); }}>もう一度</button>
          <button className="btn-secondary" onClick={() => navigate('/attack/')}>アタックで練習</button>
          <button className="btn-secondary" onClick={() => navigate('/empire/')}>おうこくへ</button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="screen quiz-screen trial-screen">
      <div className="quiz-header">
        <span className="quiz-counter trial-timer">⏱ {((TIME_LIMIT_MS - elapsed) / 1000).toFixed(1)}秒</span>
        <span className="quiz-counter">{index + 1} / {problems.length}</span>
      </div>
      <div className={`quiz-problem attack-problem ${flashCorrect ? 'flash-correct' : ''} ${flashWrong ? 'flash-wrong' : ''}`}>
        <span className="quiz-equation">{current.a} × {current.b} =</span>
        <span className={`quiz-input attack-input ${flashCorrect ? 'success' : ''} ${flashWrong ? 'wrong' : ''}`}>
          {flashCorrect ? '✓' : flashWrong ? '✗' : (input || '?')}
        </span>
      </div>
      <div className="keypad">
        {KEYS.map((key) => (
          <button key={key} className="keypad-btn" onClick={() => handleKey(key)}>{key}</button>
        ))}
      </div>
    </div>
  );
}
