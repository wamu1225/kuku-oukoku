import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../App';
import { LearningEngine } from '../utils/LearningEngine';
import { vibrate } from '../utils/haptics';
import { CountUp } from '../components/CountUp';
import { Confetti } from '../components/Confetti';

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

  const endedRef = useRef(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [flashWrong, setFlashWrong] = useState(false);
  const advanceTimerRef = useRef<number | null>(null);
  const wrongTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
    };
  }, []);

  const handleKey = (key: string) => {
    if (finished || !started || flashCorrect || flashWrong) return;
    if (key === 'C') return setInput('');
    if (key === '⌫') return setInput(input.slice(0, -1));
    const next = input + key;
    const answer = current.a * current.b;
    const maxLen = answer.toString().length;
    if (next.length > maxLen) return;
    if (parseInt(next) === answer) {
      vibrate(15);
      setInput(next);
      setFlashCorrect(true);
      advanceTimerRef.current = window.setTimeout(() => {
        setFlashCorrect(false);
        setInput('');
        if (index >= problems.length - 1) {
          finishChallenge();
        } else {
          setIndex(index + 1);
        }
      }, 250);
    } else if (next.length === maxLen) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch { /* ignore */ }
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

  const finishChallenge = () => {
    if (endedRef.current) return;
    endedRef.current = true;
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
        <p key={countdown} className="countdown-number pop">{countdown}</p>
      </div>
    );
  }

  if (finished && result) {
    const secs = result.timeMs / 1000;
    let next: { medal: string; gap: number } | null = null;
    if (secs >= 15 && secs < 25) next = { medal: '🥇 金', gap: secs - 15 };
    else if (secs >= 25 && secs < 40) next = { medal: '🥈 銀', gap: secs - 25 };
    else if (secs >= 40) next = { medal: '🥉 銅', gap: secs - 40 };
    const showConfetti = result.isNewBest || result.badge === '金';
    return (
      <div className="screen result-screen">
        {showConfetti && <Confetti count={45} />}
        <div className="result-symbol" aria-hidden="true">{result.badge === '金' ? '🥇' : result.badge === '銀' ? '🥈' : result.badge === '銅' ? '🥉' : '✨'}</div>
        <h1 className="result-title">{result.isNewBest ? '自己ベスト更新！' : 'クリア！'}</h1>
        <div className="result-stats">
          <div><span className="result-label">タイム</span><span className="result-value">{secs.toFixed(2)}秒</span></div>
          <div><span className="result-label">メダル</span><span className="result-value">{result.badge}</span></div>
          <div><span className="result-label">報酬</span><span className="result-value">+<CountUp to={100} duration={900} format="plain" /> KP</span></div>
        </div>
        {next ? (
          <p className="result-hint">あと <strong>{next.gap.toFixed(2)}秒</strong> で {next.medal} メダル！</p>
        ) : (
          <p className="result-hint">🥇 金メダル獲得！最速ペース達成！</p>
        )}
        <p className="festival-notice">🎉 おうこくで「{level}の段の祝祭」が <strong>30 分間</strong> 発動！生産が大幅アップ</p>
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
      <div className={`quiz-problem attack-problem ${flashCorrect ? 'flash-correct' : ''} ${flashWrong ? 'flash-wrong' : ''}`}>
        <span className="quiz-equation">{current.a} × {current.b} =</span>
        <span className={`quiz-input attack-input ${flashCorrect ? 'success' : ''} ${flashWrong ? 'wrong' : ''}`}>
          {flashCorrect ? '✓' : flashWrong ? '✗' : (input || '?')}
        </span>
      </div>
      <div className="keypad">
        {KEYS.map((key) => (
          <button key={key} className="keypad-btn" onClick={() => handleKey(key)} aria-label={key}>
            {key}
          </button>
        ))}
      </div>
      <button className="btn-secondary quit-btn" onClick={() => { if (confirm('やめてホームに戻りますか？（タイムは記録されません）')) navigate('/'); }}>
        やめる
      </button>
    </div>
  );
}
