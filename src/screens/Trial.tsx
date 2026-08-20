import { useEffect, useRef, useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { LearningEngine } from '../utils/LearningEngine';
import { IdleManager } from '../utils/IdleManager';
import { Confetti } from '../components/Confetti';
import { vibrateCorrect, vibrateWrong } from '../utils/haptics';

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
  const [rewardKp, setRewardKp] = useState(5000);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [flashWrong, setFlashWrong] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
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
    const { kpGained } = LearningEngine.completeTrial(true);
    setRewardKp(kpGained);
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
      vibrateCorrect();
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

  if (phase === 'intro') {
    if (!hasNineCompanion) {
      return (
        <div className="screen trial-intro">
          <h1 className="screen-title">🌑 くらやみの しれん</h1>
          <p className="screen-desc">
            おうこくの おくに ひっそりと たつ、ふるい もん。九九の ちからが ためされる、とくべつな ばしょです。
          </p>
          <div className="trial-locked">
            🔒 まずは おうこくで なかまを じっくり あつめましょう。じゅんびが できたときに、みちが ひらきます。
          </div>
          <div className="cta-row">
            <button className="btn-secondary" onClick={() => navigate('/empire/')}>← おうこくへ</button>
          </div>
        </div>
      );
    }
    return (
      <div className="screen trial-intro">
        <h1 className="screen-title">🌑 くらやみの しれん</h1>
        <p className="screen-desc">
          おうこくの おくに ひっそりと たつ、ふるい もん。九九の ちからが ためされる、とても むずかしい ちょうせんです。
        </p>

        <div className="trial-rules">
          <h2 className="section-h">ルール</h2>
          <ul>
            <li>1×1〜9×9 から <strong>20 問</strong> が ランダムに でる</li>
            <li><strong>30 びょうより はやく</strong> ぜんぶ せいかいすると かち</li>
            <li>1 問でも じかんぎれに なると その ちょうせんは しっぱい</li>
          </ul>

          <h2 className="section-h">もらえるもの</h2>
          <ul>
            <li>クリアで <strong>5,000 KP</strong></li>
            <li>あたらしい だんが いくつも あそべるようになり、おうこくが 大きく広がる</li>
            <li>「暗黒の盾」の メダルが もらえる</li>
          </ul>
        </div>

        <div className="cta-row">
          <button className="btn-primary big" onClick={start}>
            {trialCleared ? '⚔️ もう一度 ちょうせん' : '⚔️ ちょうせんする'}
          </button>
          <button className="btn-secondary" onClick={() => navigate('/empire/')}>← おうこくへ</button>
        </div>
      </div>
    );
  }

  if (phase === 'countdown') {
    return <div className="screen countdown-screen"><p className="countdown-ready">心を整えて…</p><p key={countdown} className="countdown-number pop">{countdown}</p></div>;
  }

  if (phase === 'success') {
    // 初回クリア vs 再挑戦で表示を分ける
    // trialCleared は phase=success 突入時点の前提値（completeTrial で +1 されている）
    const isFirstClear = (state.stats?.totalTrialsCleared || 0) === 1;
    return (
      <div className="screen result-screen">
        <Confetti count={isFirstClear ? 60 : 30} />
        <div className="result-symbol" aria-hidden="true">🌟</div>
        <h1 className={`result-title ${isFirstClear ? 'celebrate' : ''}`}>
          {isFirstClear ? '🌟 しれんの もんが ひらいた！' : '🌟 しれん クリア！'}
        </h1>
        {isFirstClear ? (
          <p>あたらしい みちが 見えた。<strong>10 の段</strong> が あそべるようになったよ。</p>
        ) : (
          <p>もう一度 しれんを クリアした。ポイントを もらったよ！</p>
        )}
        <div className="result-stats">
          <div><span className="result-label">もらった ポイント</span><span className="result-value">+{IdleManager.formatBigNumber(rewardKp)} KP</span></div>
          {isFirstClear && (
            <div><span className="result-label">あそべるように なった</span><span className="result-value">10 の段</span></div>
          )}
        </div>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => navigate('/empire/')}>おうこくへ</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  if (phase === 'failed') {
    const remaining = Math.max(0, PROBLEMS_COUNT - index);
    return (
      <div className="screen result-screen">
        <h1 className="result-title">🌑 じかんぎれ</h1>
        <p className="trial-fail-stats">
          すすみぐあい：<strong>{index} / {PROBLEMS_COUNT} 問</strong>
          {remaining <= 3 && <span className="trial-fail-close"> — もう少しだった！</span>}
        </p>
        <p><strong>アタック</strong> や <strong>だんいにんてい</strong> で はやく とけるように れんしゅうしてから もう一度 ちょうせんするのが おすすめ。</p>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => { setPhase('intro'); }}>もう一度</button>
          <button className="btn-secondary" onClick={() => navigate('/attack/')}>アタックで れんしゅう</button>
          <button className="btn-secondary" onClick={() => navigate('/empire/')}>おうこくへ</button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="screen quiz-screen trial-screen">
      {showQuitConfirm && (
        <div className="quit-confirm-overlay" role="alertdialog" aria-label="やめる確認">
          <div className="quit-confirm-card">
            <p className="quit-confirm-msg">やめてホームに戻りますか？<br/>記録されません。</p>
            <div className="quit-confirm-actions">
              <button className="btn-danger" onClick={() => navigate('/')}>やめる</button>
              <button className="btn-secondary" onClick={() => setShowQuitConfirm(false)}>つづける</button>
            </div>
          </div>
        </div>
      )}
      <div className="quiz-header">
        <span className="quiz-counter trial-timer">⏱ {((TIME_LIMIT_MS - elapsed) / 1000).toFixed(1)}秒</span>
        <span className="quiz-counter">📝 {index + 1} / {problems.length}</span>
      </div>
      <div className={`quiz-problem attack-problem ${flashCorrect ? 'flash-correct' : ''} ${flashWrong ? 'flash-wrong' : ''}`}>
        <span className="quiz-equation">{current.a} × {current.b} =</span>
        <span className={`quiz-input attack-input ${flashCorrect ? 'success' : ''} ${flashWrong ? 'wrong' : ''}`}>
          {flashCorrect ? '✓' : flashWrong ? '✗' : (input || <span className="placeholder-q">?</span>)}
        </span>
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
