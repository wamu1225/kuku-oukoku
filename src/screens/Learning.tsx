import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '../App';
import { LearningEngine } from '../utils/LearningEngine';
import { KUKU_READINGS } from '../data/kukuReadings';
import { DotGrid } from '../components/DotGrid';
import { vibrate } from '../utils/haptics';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

export function Learning({ level, onComplete }: { level: number; onComplete: () => void }) {
  // 設定は mount 時に 1 度だけ読む（render 毎の localStorage アクセス防止）
  const showHint = useMemo(() => LearningEngine.loadState().settings?.showAnswerHint === true, []);
  const [phase, setPhase] = useState<'list' | 'quiz' | 'done'>('list');
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const successTimerRef = useRef<number | null>(null);
  const wrongTimerRef = useRef<number | null>(null);
  const endedRef = useRef(false);
  const [flashWrong, setFlashWrong] = useState(false);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const problems = Array.from({ length: 9 }, (_, i) => ({ a: level, b: i + 1 }));
  const current = problems[index];

  useEffect(() => {
    setIndex(0);
    setInput('');
    setPhase('list');
    endedRef.current = false;
  }, [level]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    // phase が quiz → list/done に変わったら、保留中の success timeout をキャンセル
    if (phase !== 'quiz' && successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, [phase]);

  const startQuiz = () => {
    setIndex(0);
    setInput('');
    setShowSuccess(false);
    setPhase('quiz');
    endedRef.current = false;
  };

  const handleKey = (key: string) => {
    if (phase !== 'quiz' || showSuccess || flashWrong) return;
    if (key === 'C') return setInput('');
    if (key === '⌫') return setInput(input.slice(0, -1));
    const next = input + key;
    const answer = current.a * current.b;
    const maxLen = answer.toString().length;
    if (next.length > maxLen) return;
    if (parseInt(next) === answer) {
      vibrate(20);
      setShowSuccess(true);
      setInput(next);
      successTimerRef.current = window.setTimeout(() => {
        successTimerRef.current = null;
        if (phaseRef.current !== 'quiz' || endedRef.current) return;
        setShowSuccess(false);
        setInput('');
        if (index >= problems.length - 1) {
          finish();
        } else {
          setIndex(index + 1);
        }
      }, 400);
    } else if (next.length === maxLen) {
      // 桁数に達したのに正解と一致しない → 不正解
      if (typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch { /* ignore */ }
      setInput(next);
      setFlashWrong(true);
      wrongTimerRef.current = window.setTimeout(() => {
        wrongTimerRef.current = null;
        if (phaseRef.current !== 'quiz') return;
        setFlashWrong(false);
        setInput('');
      }, 600);
    } else {
      setInput(next);
    }
  };

  const finish = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    LearningEngine.setLearningCompleted(level);
    setPhase('done');
    setResultMsg(`よくがんばったね！\n100 KP ＆ はなまるスタンプ +1 ゲット！`);
    onComplete();
  };

  if (phase === 'done') {
    return (
      <div className="screen result-screen">
        <h1 className="result-title">クリア！🎉</h1>
        <pre className="result-msg">{resultMsg}</pre>
        <div className="result-actions">
          <button className="btn-primary" onClick={() => navigate('/learn/')}>つぎの段にちょうせん</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>ホームへ</button>
        </div>
      </div>
    );
  }

  if (phase === 'list') {
    return (
      <div className="screen">
        <h1 className="screen-title">{level}の段を まなぼう！</h1>
        <p className="screen-desc">
          まずは九九を <strong>声に出して</strong> 読んで覚えよう。答えは青く書いてあるよ。
          おぼえたら下のボタンで <strong>クイズ</strong>（数字を入力するもんだい）に進もう。
        </p>
        <div className="kuku-list">
          {problems.map((p) => (
            <div key={p.b} className="kuku-card">
              <div className="kuku-formula-block">
                <div className="kuku-formula">
                  {p.a} × {p.b} = <span className="kuku-answer">{p.a * p.b}</span>
                </div>
                {level < 10 && (
                  <div className="kuku-reading">{KUKU_READINGS[`${p.a}x${p.b}`] || ''}</div>
                )}
              </div>
              {level < 10 && (
                <div className="kuku-dotgrid">
                  <DotGrid a={p.a} b={p.b} size={10} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="action-row">
          <button className="btn-primary big" onClick={startQuiz}>もんだいをといてみる →</button>
          <button className="btn-secondary" onClick={() => navigate('/learn/')}>もどる</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen quiz-screen">
      <div className="quiz-header">
        <span className="quiz-counter">{index + 1} / {problems.length}</span>
        {level < 10 && <span className="quiz-reading">{KUKU_READINGS[`${current.a}x${current.b}`] || ''}</span>}
      </div>
      <div className={`quiz-problem ${flashWrong ? 'flash-wrong' : ''}`}>
        <span className="quiz-equation">{current.a} × {current.b} =</span>
        <span className={`quiz-input ${showSuccess ? 'success' : ''} ${flashWrong ? 'wrong' : ''}`}>
          {showSuccess ? '✓' : input || (showHint ? <span className="answer-hint">{current.a * current.b}</span> : '?')}
        </span>
      </div>
      <div className="keypad">
        {KEYS.map((key) => (
          <button key={key} className="keypad-btn" onClick={() => handleKey(key)} aria-label={key}>
            {key}
          </button>
        ))}
      </div>
      <button className="btn-secondary back-link" onClick={() => setPhase('list')}>← かくにんに戻る</button>
    </div>
  );
}
