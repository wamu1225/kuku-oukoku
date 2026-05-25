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
  const current = problems[index];

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
  };

  const fail = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    LearningEngine.completeTrial(false);
    setPhase('failed');
    onComplete();
  };

  const succeed = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    LearningEngine.completeTrial(true);
    setPhase('success');
    onComplete();
  };

  const handleKey = (key: string) => {
    if (phase !== 'playing') return;
    if (key === 'C') return setInput('');
    if (key === '⌫') return setInput((p) => p.slice(0, -1));
    setInput((prev) => {
      const next = prev + key;
      const ans = current.a * current.b;
      if (next.length > ans.toString().length) return prev;
      if (parseInt(next) === ans) {
        if (index >= problems.length - 1) {
          succeed();
        } else {
          setIndex((i) => i + 1);
        }
        return '';
      }
      return next;
    });
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
            {trialCleared ? '再挑戦する' : '門を叩く'}
          </button>
          <button className="btn-secondary" onClick={() => navigate('/empire/')}>おうこくへ戻る</button>
        </div>
      </div>
    );
  }

  if (phase === 'countdown') {
    return <div className="screen countdown-screen"><p className="countdown-ready">心を整えて…</p><p className="countdown-number">{countdown}</p></div>;
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
        <p>九九の力をもっと磨いて、再挑戦しよう。</p>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => { setPhase('intro'); }}>再挑戦</button>
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
      <div className="quiz-problem attack-problem">
        <span className="quiz-equation">{current.a} × {current.b} =</span>
        <span className="quiz-input attack-input">{input || '?'}</span>
      </div>
      <div className="keypad">
        {KEYS.map((key) => (
          <button key={key} className="keypad-btn" onClick={() => handleKey(key)}>{key}</button>
        ))}
      </div>
    </div>
  );
}
