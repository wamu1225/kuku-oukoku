import { useState } from 'react';
import type { KukuState } from '../types';
import { navigate } from '../App';
import { LearningEngine } from '../utils/LearningEngine';
import { refreshHapticsSetting } from '../utils/haptics';

export function Settings({ state, onUpdate }: { state: KukuState; onUpdate: () => void }) {
  const [showHint, setShowHint] = useState(state.settings?.showAnswerHint ?? false);
  const [haptics, setHaptics] = useState(state.settings?.hapticsEnabled !== false);
  const [confirmReset, setConfirmReset] = useState(false);

  const toggle = (key: 'showAnswerHint' | 'hapticsEnabled', value: boolean) => {
    if (key === 'showAnswerHint') setShowHint(value);
    if (key === 'hapticsEnabled') { setHaptics(value); refreshHapticsSetting(); }
    LearningEngine.updateSettings({ ...state.settings, [key]: value });
    onUpdate();
  };

  const doReset = () => {
    LearningEngine.resetAllData();
    setConfirmReset(false);
    onUpdate();
    navigate('/');
  };

  return (
    <div className="screen">
      <h1 className="screen-title">⚙️ せってい</h1>

      <section className="settings-section">
        <h2 className="section-h">学習設定</h2>
        <label className="settings-row">
          <span>まなぶモードで答えのヒントを薄く表示する</span>
          <input
            type="checkbox"
            checked={showHint}
            onChange={(e) => toggle('showAnswerHint', e.target.checked)}
          />
        </label>
        <label className="settings-row">
          <span>正解時にバイブで知らせる（スマホ・タブレットのみ）</span>
          <input
            type="checkbox"
            checked={haptics}
            onChange={(e) => toggle('hapticsEnabled', e.target.checked)}
          />
        </label>
      </section>

      <section className="settings-section">
        <h2 className="section-h">称号 (タイトル)</h2>
        <p className="screen-desc" style={{ marginTop: 0 }}>
          九九を解いた合計数に応じて称号が解放されます。今の称号：<strong>{state.currentTitle ?? '九九のみならい'}</strong>
        </p>
        <div className="title-list">
          {(state.unlockedTitles ?? ['九九のみならい']).map((title) => (
            <button
              key={title}
              className={`title-pill ${(state.currentTitle ?? '九九のみならい') === title ? 'active' : ''}`}
              onClick={() => { LearningEngine.setCurrentTitle(title); onUpdate(); }}
            >
              {title}
            </button>
          ))}
        </div>
        {(state.unlockedTitles ?? []).length < 5 && (
          <p className="title-hint">
            次の称号は…<br/>
            ・九九の騎士（合計 100 問）<br/>
            ・おうこくの勇者（合計 500 問）<br/>
            ・九九マスター（合計 1000 問）<br/>
            ・伝説の賢者（合計 5000 問）
          </p>
        )}
      </section>

      <section className="settings-section">
        <h2 className="section-h">統計</h2>
        <dl className="stats-list">
          <div><dt>総スタンプ</dt><dd>{state.totalStamps} 個</dd></div>
          <div><dt>まなぶ プレイ回数</dt><dd>{state.stats?.totalLearnPlays ?? 0} 回</dd></div>
          <div><dt>アタック プレイ回数</dt><dd>{state.stats?.totalAttackPlays ?? 0} 回</dd></div>
          <div><dt>段位試験 累計</dt><dd>{state.stats?.totalDanSolved ?? 0} 問</dd></div>
          <div><dt>連続学習日数</dt><dd>{state.dailyStreak?.count ?? 0} 日</dd></div>
        </dl>
      </section>

      <section className="settings-section">
        <h2 className="section-h">データの削除</h2>
        <p className="settings-warn">
          すべての記録・進捗をリセットします。元に戻せません。
        </p>
        {!confirmReset ? (
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>
            データをリセットする
          </button>
        ) : (
          <div className="confirm-row">
            <p>本当にリセットしますか？</p>
            <button className="btn-danger" onClick={doReset}>はい、リセット</button>
            <button className="btn-secondary" onClick={() => setConfirmReset(false)}>キャンセル</button>
          </div>
        )}
      </section>

      <button className="back-link" onClick={() => navigate('/')}>← ホームへ</button>
    </div>
  );
}
