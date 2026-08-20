import { useEffect, useRef, useState } from 'react';
import { navigate } from '../App';
import { LearningEngine } from '../utils/LearningEngine';
import { IdleManager } from '../utils/IdleManager';
import { DAN_LEVELS, getNextDan } from '../data/danLevels';
import { Confetti } from '../components/Confetti';
import { vibrateCorrect, vibrateWrong } from '../utils/haptics';

// 段位ランク到達で新たに解禁されるコンテンツ
function unlocksOnRank(rank: number): string[] {
  const u: string[] = [];
  if (rank === 1) u.push('⚔️ 九九バトル（はじまりの草原）');
  if (rank === 2) u.push('🗼 九九のタワー（そよ風の塔）');
  if (rank === 3) { u.push('🌫 くもくも（しんキロウの森）'); u.push('📖 まなぶ・アタック：4〜6 のだん'); }
  if (rank === 4) u.push('⚔️ 九九バトル（しずかな森）');
  if (rank === 5) u.push('🗼 九九のタワー（雲海の見張り塔）');
  if (rank === 6) { u.push('🌫 くもくも（そらの雲海）'); u.push('📖 まなぶ・アタック：7〜9 のだん'); }
  if (rank === 7) u.push('⚔️ 九九バトル（ゴツゴツ洞窟）');
  if (rank === 8) u.push('🗼 九九のタワー（迅雷の尖塔）');
  if (rank === 9) u.push('🌫 くもくも（かみなりの山）');
  return u;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
const BADGE_LABEL: Record<string, string> = { diamond: 'ダイヤ', gold: '金', silver: '銀', bronze: '銅' };

function pickProblems(source: number[], count: number) {
  const out: { a: number; b: number }[] = [];
  // 単一段の段位（a固定）は、まず九九を順に覚えてもらうため 1〜9問目を b=1→9 の順で出す
  const singleSegment = source.length === 1;
  let prev = '';
  for (let i = 0; i < count; i++) {
    let a = 0, b = 0, key = '';
    if (singleSegment && i < 9) {
      // 1〜9問目：a固定・b を 1,2,…,9 の順番
      a = source[0];
      b = i + 1;
    } else {
      // 範囲段位、または単一段の10問目以降：ランダム。直前と同じ問題は避ける
      let tries = 0;
      do {
        a = source[Math.floor(Math.random() * source.length)];
        b = Math.floor(Math.random() * 9) + 1;
        key = `${a}x${b}`;
        tries++;
      } while (key === prev && tries < 5);
    }
    prev = `${a}x${b}`;
    out.push({ a, b });
  }
  return out;
}

export function DanChallenge({ state, onComplete }: { state: any; onComplete: () => void }) {
  const currentRank = state.danRank || 0;
  const trialCleared = (state.stats?.totalTrialsCleared || 0) > 0;
  const nextDanRaw = getNextDan(currentRank);
  // 1級 (rank 10) 取得後、初段 (rank 11) を受けるには暗黒の試練クリアが必要
  const trialGateActive = currentRank === 10 && !trialCleared;
  const nextDan = trialGateActive ? null : nextDanRaw;

  // 次の段位が「まなぶ未解禁の段」かどうかチェック（事前学習推奨ヒント）
  const unmasteredHint = (() => {
    if (!nextDan) return null;
    if (nextDan.source.length !== 1) return null; // 単段試験のみ
    const segLv = nextDan.source[0];
    if (segLv <= 9) return null; // 1-9 段は初期解禁なので OK
    const isCompletedLearn = state.tableBests?.[segLv]?.isCompleted === true;
    if (isCompletedLearn) return null;
    return segLv;
  })();
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<'select' | 'countdown' | 'playing' | 'done' | 'failed'>('select');
  const [countdown, setCountdown] = useState(3);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [problems, setProblems] = useState<{ a: number; b: number }[]>([]);
  const [result, setResult] = useState<{ timeMs: number; medal: string; newDan: boolean; kpGained: number; festivalLevel: number } | null>(null);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [flashWrong, setFlashWrong] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const advanceTimerRef = useRef<number | null>(null);
  const wrongTimerRef = useRef<number | null>(null);
  // 解いた段ごとの問題数（熟練度加算用）
  const solvedRef = useRef<Record<number, number>>({});
  const current = problems[index];
  // 挑戦中の段位の制限時間（問題数に連動。15問=90秒 / 名人50問=300秒 / 伝説100問=600秒）
  const activeDan = DAN_LEVELS.find((d) => d.rank === selected) ?? null;
  const limitMs = activeDan?.limitMs ?? 90000;

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      if (wrongTimerRef.current) window.clearTimeout(wrongTimerRef.current);
    };
  }, []);

  const start = (rank: number) => {
    const d = DAN_LEVELS.find((x) => x.rank === rank);
    if (!d) return;
    setProblems(pickProblems(d.source, d.count));
    setSelected(rank);
    setPhase('countdown');
    setCountdown(3);
    setIndex(0);
    setInput('');
    solvedRef.current = {};
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
        if (e >= limitMs) {
          fail();
        }
      }, 100);
      return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    }
  }, [phase, limitMs]);

  const fail = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    setPhase('failed');
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
      solvedRef.current[current.a] = (solvedRef.current[current.a] || 0) + 1;
      setInput(next);
      setFlashCorrect(true);
      advanceTimerRef.current = window.setTimeout(() => {
        setFlashCorrect(false);
        setInput('');
        if (index >= problems.length - 1) {
          finishOk();
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

  const finishOk = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    const final = Date.now() - (startRef.current || Date.now());
    setElapsed(final);
    const rank = selected!;
    const before = state.danRank || 0;
    const { state: after, kpGained, festivalLevel, runMedal } = LearningEngine.completeDanTest(rank, final, solvedRef.current);
    setResult({
      timeMs: final,
      medal: BADGE_LABEL[runMedal] || 'クリア',
      newDan: (after.danRank || 0) > before,
      kpGained,
      festivalLevel,
    });
    setPhase('done');
    onComplete();
  };

  if (phase === 'select') {
    return (
      <div className="screen">
        <h1 className="screen-title">だんいにんてい</h1>
        <div className="dan-rank-card">
          <div className="dan-rank-now">今の くらい</div>
          <div className="dan-rank-value">{state.rank}</div>
          {nextDan && (
            <div className="dan-rank-next">
              次は <strong>{nextDan.name}</strong> ／ {nextDan.count}問を {nextDan.limitMs / 1000}びょうより はやく ぜんぶ せいかいで クリア
            </div>
          )}
          {trialGateActive && (
            <div className="dan-rank-next">
              次は <strong>初段</strong>。ちょうせんする前に <strong>くらやみの しれん</strong> をクリアしてください
            </div>
          )}
        </div>

        {trialGateActive ? (
          <div className="dan-card dan-card-locked">
            <h2>🌑 初段への道</h2>
            <p>
              初段は <strong>10のだん</strong> の テストです。ちょうせんする前に「<strong>くらやみの しれん</strong>」をクリアして、10 のだんを あそべるようにしましょう。
            </p>
            <p className="dan-trial-hint">
              💡 くらやみの しれんは <a href="/kuku-oukoku/empire/" onClick={(e) => { e.preventDefault(); navigate('/empire/'); }}>おうこく</a> で 9 のだんの なかまを よぶと ちょうせんできるように なります。
            </p>
            <div className="cta-row">
              <button className="btn-primary big" onClick={() => navigate('/trial/')}>⚔️ しれんの もんへ</button>
              <button className="btn-secondary" onClick={() => navigate('/empire/')}>おうこくへ</button>
            </div>
          </div>
        ) : nextDan ? (
          <div className="dan-card">
            <h2>{nextDan.name} に ちょうせん</h2>
            <p>もんだいの はんい：{nextDan.source.length === 1 ? `${nextDan.source[0]}のだん` : `${Math.min(...nextDan.source)}〜${Math.max(...nextDan.source)}のだんランダム`}</p>
            <p>問題数：{nextDan.count}問　／　じかん：{nextDan.limitMs / 1000}びょう</p>
            <div className="dan-medal-targets">
              <span className="dan-medal-target dan-medal-gold">🥇 金：{nextDan.goldTimeMs / 1000}びょうより はやく</span>
              <span className="dan-medal-target dan-medal-silver">🥈 銀：{nextDan.silverTimeMs / 1000}びょうより はやく</span>
              <span className="dan-medal-target dan-medal-bronze">🥉 銅：{nextDan.limitMs / 1000}びょうより はやく クリア</span>
            </div>
            {unmasteredHint !== null && (
              <p className="dan-prep-hint">
                💡 <strong>{unmasteredHint}のだん</strong> が まだの ばあいは、先に
                <a href={`/kuku-oukoku/learn/${unmasteredHint}/`} onClick={(e) => { e.preventDefault(); navigate(`/learn/${unmasteredHint}/`); }}>まなぶ</a>
                で おぼえてから ちょうせんすると ゆうり！
              </p>
            )}
            <button className="btn-primary big" onClick={() => start(nextDan.rank)}>ちょうせんする</button>
          </div>
        ) : (
          <p>ぜんぶの くらいを とりました。おめでとう！</p>
        )}

        {currentRank > 0 ? (
          <>
            <h2 className="section-h">📜 くらいの きろく（タップで もう一度）</h2>
            <p className="dan-retry-hint">💡 もっと よい メダルを めざして もう一度 ちょうせんできます。きろくは あたらしく なります。</p>
            <div className="dan-passport">
              {DAN_LEVELS.filter((d) => d.rank <= currentRank).map((d) => {
                const medal = state.danMedals?.[d.rank];
                const medalIcon = medal === 'diamond' ? '💎' : medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : medal === 'bronze' ? '🥉' : '📜';
                return (
                  <button
                    key={d.rank}
                    className={`dan-stamp dan-stamp-${medal || 'none'}`}
                    onClick={() => start(d.rank)}
                    aria-label={`${d.name} に もう一度 ちょうせん（今の メダル: ${medal ? BADGE_LABEL[medal] : 'クリア'}）`}
                  >
                    <span className="dan-stamp-medal" aria-hidden="true">{medalIcon}</span>
                    <span className="dan-stamp-name">{d.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <p className="dan-empty">まだ くらいが ありません。はじめての ちょうせんで 10級を めざそう！</p>
        )}

        <button className="back-link" onClick={() => navigate('/')}>← ホームへ</button>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <div className="screen countdown-screen">
        <p className="countdown-ready">よーい…</p>
        <p key={countdown} className="countdown-number pop">{countdown}</p>
      </div>
    );
  }

  if (phase === 'done' && result) {
    const newUnlocks = result.newDan && selected ? unlocksOnRank(selected) : [];
    const prevRankName = result.newDan && selected ? (DAN_LEVELS.find((d) => d.rank === selected - 1)?.name ?? 'みならい') : null;
    const newRankName = result.newDan && selected ? DAN_LEVELS.find((d) => d.rank === selected)?.name : null;
    return (
      <div className="screen result-screen">
        {(result.newDan || result.medal === 'ダイヤ') && <Confetti count={result.medal === 'ダイヤ' ? 70 : 50} />}
        <div className="result-symbol" aria-hidden="true">{result.newDan ? '🛡' : result.medal === 'ダイヤ' ? '💎' : result.medal === '金' ? '🥇' : result.medal === '銀' ? '🥈' : '🥉'}</div>
        <h1 className={`result-title ${result.newDan || result.medal === 'ダイヤ' ? 'celebrate' : ''}`}>
          {result.newDan ? '🎉 くらいアップ おめでとう！' : 'クリア！'}
        </h1>
        {result.newDan && prevRankName && newRankName && (
          <p className="dan-promotion">
            <span className="dan-promotion-from">{prevRankName}</span>
            <span className="dan-promotion-arrow">→</span>
            <span className="dan-promotion-to">{newRankName}</span>
          </p>
        )}
        <div className="result-stats">
          <div><span className="result-label">タイム</span><span className="result-value">{(result.timeMs / 1000).toFixed(2)}秒</span></div>
          <div><span className="result-label">メダル</span><span className="result-value">{result.medal}</span></div>
          <div><span className="result-label">もらった ポイント</span><span className="result-value">+{IdleManager.formatBigNumber(result.kpGained)}</span></div>
        </div>
        <p className="festival-notice">🎉 {result.festivalLevel}のだんの おまつりが 30ぷん はじまった！そのだんの なかまが たくさん つくってくれるよ</p>
        {newUnlocks.length > 0 && (
          <div className="result-unlock">
            <h3>🔓 あそべるように なったよ！</h3>
            <ul>{newUnlocks.map((u) => <li key={u}>{u}</li>)}</ul>
          </div>
        )}
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
        <h1 className="result-title">じかんぎれ！</h1>
        <p>あと {Math.max(0, (failedDan?.count ?? 15) - index)} 問のところで じかんぎれ。</p>
        <p>にがてな だんを <strong>まなぶ</strong> で もう一度 見なおしてから ちょうせんすると ぐっと らくに なるよ。</p>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => { setPhase('select'); }}>もう一度</button>
          {reviewLevel && reviewLevel <= 9 && (
            <button className="btn-secondary" onClick={() => navigate(`/learn/${reviewLevel}/`)}>
              {reviewLevel}のだんを もう一度 見なおす
            </button>
          )}
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  const remainingSecs = Math.max(0, (limitMs - elapsed) / 1000);
  return (
    <div className="screen quiz-screen">
      {showQuitConfirm && (
        <div className="quit-confirm-overlay" role="alertdialog" aria-label="やめる確認">
          <div className="quit-confirm-card">
            <p className="quit-confirm-msg">やめてホームに戻りますか？<br/>進捗は記録されません。</p>
            <div className="quit-confirm-actions">
              <button className="btn-danger" onClick={() => navigate('/')}>やめる</button>
              <button className="btn-secondary" onClick={() => setShowQuitConfirm(false)}>つづける</button>
            </div>
          </div>
        </div>
      )}
      <div className="quiz-header">
        <span className={`quiz-counter ${remainingSecs < 10 ? 'time-urgent' : ''}`}>
          ⏱ のこり {remainingSecs.toFixed(1)}秒
        </span>
        <span className="quiz-counter">📝 {index + 1} / {problems.length}</span>
      </div>
      <div className={`quiz-problem ${flashCorrect ? 'flash-correct' : ''} ${flashWrong ? 'flash-wrong' : ''}`}>
        <span className="quiz-equation">{current.a} × {current.b} =</span>
        <span className={`quiz-input ${flashCorrect ? 'success' : ''} ${flashWrong ? 'wrong' : ''}`}>
          {flashCorrect ? '✓' : flashWrong ? '✗' : (input || <span className="placeholder-q">?</span>)}
        </span>
      </div>
      <div className="keypad">
        {KEYS.map((key) => (
          <button key={key} className="keypad-btn" onClick={() => handleKey(key)}>
            {key}
          </button>
        ))}
      </div>
      <button className="btn-link quit-btn" onClick={() => setShowQuitConfirm(true)}>
        やめる
      </button>
    </div>
  );
}
