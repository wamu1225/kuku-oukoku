import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../App';
import { LearningEngine } from '../utils/LearningEngine';
import { vibrate } from '../utils/haptics';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
const BADGE_LABEL: Record<string, string> = { gold: '金', silver: '銀', bronze: '銅', clear: 'クリア' };

// Fisher-Yates shuffle (unbiased)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TimeAttack({ level, onComplete }: { level: number; onComplete: () => void }) {
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{ timeMs: number; badge: string; isNewBest: boolean } | null>(null);

  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // CRITICAL: problems must be stable for the duration of the attack. Generate once based on level.
  const problems = useMemo(
    () => shuffle(Array.from({ length: 9 }, (_, i) => ({ a: level, b: i + 1 }))),
    [level]
  );
  const current = problems[index];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [started, finished]);

  useEffect(() => {
    if (countdown > 0) {
      const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => window.clearTimeout(t);
    }
    if (!started) {
      setStarted(true);
      startRef.current = Date.now();
    }
  }, [countdown, started]);

  useEffect(() => {
    if (started && !finished) {
      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - (startRef.current || 0));
      }, 100);
      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
      };
    }
  }, [started, finished]);

  const handleKey = (key: string) => {
    if (finished || !started) return;
    if (key === 'C') return setInput('');
    if (key === '⌫') return setInput((p) => p.slice(0, -1));
    setInput((prev) => {
      const next = prev + key;
      const answer = current.a * current.b;
      const maxLen = answer.toString().length;
      if (next.length > maxLen) return prev;
      if (parseInt(next) === answer) {
        vibrate(15);
        if (index >= problems.length - 1) {
          finishChallenge();
        } else {
          setIndex((i) => i + 1);
        }
        return '';
      }
      return next;
    });
  };

  const finishChallenge = () => {
    setFinished(true);
    if (timerRef.current) window.clearInterval(timerRef.current);
    const final = Date.now() - (startRef.current || Date.now());
    setElapsed(final);
    const { state, isNewBest } = LearningEngine.saveTimeAttackResult(level, final);
    const badge = state.tableBests[level]?.badge ?? 'clear';
    setResult({ timeMs: final, badge: BADGE_LABEL[badge] || 'クリア', isNewBest });
    onComplete();
  };

  if (countdown > 0) {
    return (
      <div className="screen countdown-screen">
        <p className="countdown-ready">Ready...</p>
        <p className="countdown-number">{countdown}</p>
      </div>
    );
  }

  if (finished && result) {
    return (
      <div className="screen result-screen">
        <h1 className="result-title">{result.isNewBest ? '✨ 自己ベスト更新！ ✨' : 'クリア！🎉'}</h1>
        <div className="result-stats">
          <div><span className="result-label">タイム</span><span className="result-value">{(result.timeMs / 1000).toFixed(2)}秒</span></div>
          <div><span className="result-label">メダル</span><span className="result-value">{result.badge}</span></div>
          <div><span className="result-label">報酬</span><span className="result-value">+100 KP</span></div>
        </div>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => navigate('/attack/')}>つぎにちょうせん</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <span className="quiz-counter">⏱ {(elapsed / 1000).toFixed(2)}秒</span>
        <span className="quiz-counter">のこり {problems.length - index}</span>
      </div>
      <div className="quiz-problem attack-problem">
        <span className="quiz-equation">{current.a} × {current.b} =</span>
        <span className="quiz-input attack-input">{input || '?'}</span>
      </div>
      <div className="keypad">
        {KEYS.map((key) => (
          <button key={key} className="keypad-btn" onClick={() => handleKey(key)} aria-label={key}>
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
