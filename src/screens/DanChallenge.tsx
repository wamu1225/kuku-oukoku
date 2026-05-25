import { useEffect, useRef, useState } from 'react';
import { navigate } from '../App';
import { LearningEngine } from '../utils/LearningEngine';
import { DAN_LEVELS, getNextDan } from '../data/danLevels';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
const BADGE_LABEL: Record<string, string> = { gold: '金', silver: '銀', bronze: '銅' };

function pickProblems(source: number[], count: number) {
  const out: { a: number; b: number }[] = [];
  let prev = '';
  for (let i = 0; i < count; i++) {
    let a = 0, b = 0, key = '';
    let tries = 0;
    do {
      a = source[Math.floor(Math.random() * source.length)];
      b = Math.floor(Math.random() * 9) + 1;
      key = `${a}x${b}`;
      tries++;
    } while (key === prev && tries < 5);
    prev = key;
    out.push({ a, b });
  }
  return out;
}

export function DanChallenge({ state, onComplete }: { state: any; onComplete: () => void }) {
  const currentRank = state.danRank || 0;
  const nextDan = getNextDan(currentRank);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<'select' | 'countdown' | 'playing' | 'done' | 'failed'>('select');
  const [countdown, setCountdown] = useState(3);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [problems, setProblems] = useState<{ a: number; b: number }[]>([]);
  const [result, setResult] = useState<{ timeMs: number; medal: string; newDan: boolean } | null>(null);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const current = problems[index];

  const start = (rank: number) => {
    const d = DAN_LEVELS.find((x) => x.rank === rank);
    if (!d) return;
    setProblems(pickProblems(d.source, d.count));
    setSelected(rank);
    setPhase('countdown');
    setCountdown(3);
    setIndex(0);
    setInput('');
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
    if (phase === 'playing') {
      timerRef.current = window.setInterval(() => {
        const e = Date.now() - (startRef.current || 0);
        setElapsed(e);
        if (e >= 90000) {
          fail();
        }
      }, 100);
      return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    }
  }, [phase]);

  const fail = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    setPhase('failed');
  };

  const handleKey = (key: string) => {
    if (phase !== 'playing' || !current) return;
    if (key === 'C') return setInput('');
    if (key === '⌫') return setInput(input.slice(0, -1));
    const next = input + key;
    const ans = current.a * current.b;
    const maxLen = ans.toString().length;
    if (next.length > maxLen) return;
    if (parseInt(next) === ans) {
      setInput('');
      if (index >= problems.length - 1) {
        finishOk();
      } else {
        setIndex(index + 1);
      }
    } else {
      setInput(next);
    }
  };

  const finishOk = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    const final = Date.now() - (startRef.current || Date.now());
    setElapsed(final);
    const rank = selected!;
    const before = state.danRank || 0;
    const after = LearningEngine.completeDanTest(rank, final);
    const medal = after.danMedals?.[rank] ?? 'clear';
    setResult({
      timeMs: final,
      medal: BADGE_LABEL[medal] || 'クリア',
      newDan: (after.danRank || 0) > before,
    });
    setPhase('done');
    onComplete();
  };

  if (phase === 'select') {
    return (
      <div className="screen">
        <h1 className="screen-title">だんいにんてい試験</h1>
        <p className="screen-desc">
          15問を制限時間 90秒以内に全問正解すると合格。次の段位は <strong>{nextDan?.name ?? '伝説 (最高位)'}</strong> です。
        </p>
        <p className="screen-desc">
          現在の段位：<strong>{state.rank}</strong>
        </p>

        {nextDan ? (
          <div className="dan-card">
            <h2>{nextDan.name} に挑戦</h2>
            <p>出題範囲：{nextDan.source.length === 1 ? `${nextDan.source[0]}の段` : `${Math.min(...nextDan.source)}〜${Math.max(...nextDan.source)}の段ランダム`}</p>
            <p>問題数：{nextDan.count}問　／　制限時間：90秒</p>
            <div className="dan-medal-targets">
              <span className="dan-medal-target dan-medal-gold">🥇 金：{(nextDan.goldTimeMs / 1000).toFixed(1)}秒以内</span>
              <span className="dan-medal-target dan-medal-silver">🥈 銀：{(nextDan.silverTimeMs / 1000).toFixed(1)}秒以内</span>
              <span className="dan-medal-target dan-medal-bronze">🥉 銅：90秒以内クリア</span>
            </div>
            <button className="btn-primary big" onClick={() => start(nextDan.rank)}>挑戦する</button>
          </div>
        ) : (
          <p>すべての段位を取得しています。おめでとう！</p>
        )}

        {currentRank > 0 ? (
          <>
            <h2 className="section-h">取得済みの段位（タップで再挑戦・メダル改善）</h2>
            <div className="dan-list">
              {DAN_LEVELS.filter((d) => d.rank <= currentRank).map((d) => {
                const medal = state.danMedals?.[d.rank];
                return (
                  <button
                    key={d.rank}
                    className={`dan-pill dan-pill-clickable medal-${medal || 'none'}`}
                    onClick={() => start(d.rank)}
                    aria-label={`${d.name} を再挑戦（現在のメダル: ${medal ? BADGE_LABEL[medal] : 'なし'}）`}
                  >
                    {d.name}
                    {medal && <span className="dan-medal"> {BADGE_LABEL[medal]}</span>}
                  </button>
                );
              })}
            </div>
            <p className="dan-retry-hint">
              💡 より良いメダル（金/銀）を狙って再挑戦できます。記録は上書きされます。
            </p>
          </>
        ) : (
          <p className="dan-empty">まだ段位を取得していません。初挑戦で 10級 を取得しよう！</p>
        )}

        <button className="back-link" onClick={() => navigate('/')}>← ホームへ</button>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <div className="screen countdown-screen">
        <p className="countdown-ready">Ready...</p>
        <p className="countdown-number">{countdown}</p>
      </div>
    );
  }

  if (phase === 'done' && result) {
    return (
      <div className="screen result-screen">
        <h1 className="result-title">{result.newDan ? '🎉 昇段おめでとう！' : 'クリア！'}</h1>
        <div className="result-stats">
          <div><span className="result-label">タイム</span><span className="result-value">{(result.timeMs / 1000).toFixed(2)}秒</span></div>
          <div><span className="result-label">メダル</span><span className="result-value">{result.medal}</span></div>
        </div>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => { setPhase('select'); setResult(null); }}>つづける</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  if (phase === 'failed') {
    const failedDan = DAN_LEVELS.find((d) => d.rank === selected);
    const reviewLevel = failedDan?.source[0];
    return (
      <div className="screen result-screen">
        <h1 className="result-title">時間切れ！</h1>
        <p>あと {Math.max(0, (failedDan?.count ?? 15) - index)} 問のところで時間切れ。</p>
        <p>苦手な段を <strong>まなぶ</strong> で復習してから挑戦すると一気に楽になるよ。</p>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => { setPhase('select'); }}>もう一度</button>
          {reviewLevel && reviewLevel <= 9 && (
            <button className="btn-secondary" onClick={() => navigate(`/learn/${reviewLevel}/`)}>
              {reviewLevel}の段を復習
            </button>
          )}
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <span className="quiz-counter">⏱ {(elapsed / 1000).toFixed(2)}秒 / 90秒</span>
        <span className="quiz-counter">{index + 1} / {problems.length}</span>
      </div>
      <div className="quiz-problem">
        <span className="quiz-equation">{current.a} × {current.b} =</span>
        <span className="quiz-input">{input || '?'}</span>
      </div>
      <div className="keypad">
        {KEYS.map((key) => (
          <button key={key} className="keypad-btn" onClick={() => handleKey(key)}>
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
