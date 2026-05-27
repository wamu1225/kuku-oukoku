import { useState } from 'react';
import type { KukuState } from '../types';
import { navigate } from '../App';
import { LearningEngine } from '../utils/LearningEngine';

const ALL_TITLES = [
  { name: '九九のみならい', target: 0 },
  { name: '九九の騎士', target: 100 },
  { name: 'おうこくの勇者', target: 500 },
  { name: '九九マスター', target: 1000 },
  { name: '伝説の賢者', target: 5000 },
];

export function Settings({ state, onUpdate }: { state: KukuState; onUpdate: () => void }) {
  const [showHint, setShowHint] = useState(state.settings?.showAnswerHint ?? false);
  const [confirmReset, setConfirmReset] = useState(false);

  const toggle = (key: 'showAnswerHint', value: boolean) => {
    if (key === 'showAnswerHint') setShowHint(value);
    LearningEngine.updateSettings({ ...state.settings, [key]: value });
    onUpdate();
  };

  const doReset = () => {
    LearningEngine.resetAllData();
    setConfirmReset(false);
    onUpdate();
    navigate('/');
  };

  const unlocked = new Set(state.unlockedTitles ?? ['九九のみならい']);
  const upcomingTitles = ALL_TITLES.filter((t) => !unlocked.has(t.name));

  const totalMastery = Object.values(state.mastery || {}).reduce((a, b) => a + (b as number), 0);

  // リセットで失われる主要項目
  const masteredDan = Object.keys(state.danMedals || {}).length;
  const totalCompanions = Object.values(state.companions || {}).reduce((a, b) => a + b, 0);
  const collectionCount = (state.wisdomSeals?.length || 0) + (state.royalTreasures?.length || 0);

  return (
    <div className="screen">
      <h1 className="screen-title">⚙️ せってい</h1>

      <section className="settings-section">
        <h2 className="section-h">学習設定</h2>
        <label className="settings-row">
          <span>
            <strong>答えのヒント</strong>
            <small className="settings-row-hint">まなぶで こたえを うすく ヒント表示</small>
          </span>
          <input
            type="checkbox"
            checked={showHint}
            onChange={(e) => toggle('showAnswerHint', e.target.checked)}
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
        {upcomingTitles.length > 0 && (
          <div className="title-hint-box">
            <div className="title-hint-h">次の称号は…</div>
            <ul className="title-hint-list">
              {upcomingTitles.map((t) => {
                const remaining = Math.max(0, t.target - totalMastery);
                return (
                  <li key={t.name}>
                    <strong>{t.name}</strong>
                    <span className="title-hint-meta">
                      合計 {t.target} 問
                      {remaining > 0 && <> （あと {remaining} 問）</>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2 className="section-h">統計</h2>
        <div className="settings-stats-grid">
          <div className="settings-stat-card">
            <span className="settings-stat-label">総スタンプ</span>
            <span className="settings-stat-value">{state.totalStamps} 個</span>
          </div>
          <div className="settings-stat-card">
            <span className="settings-stat-label">まなぶ</span>
            <span className="settings-stat-value">{state.stats?.totalLearnPlays ?? 0} 回</span>
          </div>
          <div className="settings-stat-card">
            <span className="settings-stat-label">アタック</span>
            <span className="settings-stat-value">{state.stats?.totalAttackPlays ?? 0} 回</span>
          </div>
          <div className="settings-stat-card">
            <span className="settings-stat-label">段位試験 累計</span>
            <span className="settings-stat-value">{state.stats?.totalDanSolved ?? 0} 問</span>
          </div>
          <div className="settings-stat-card">
            <span className="settings-stat-label">連続学習</span>
            <span className="settings-stat-value">{state.dailyStreak?.count ?? 0} 日</span>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="section-h">データのリセット</h2>
        <p className="settings-warn">
          下のボタンを押すと、<strong>あなたの記録すべて</strong> が消えます。元には戻せません。
        </p>
        {!confirmReset ? (
          <button className="btn-danger" onClick={() => setConfirmReset(true)}>
            データをリセットする
          </button>
        ) : (
          <div className="reset-confirm-box">
            <p className="reset-confirm-title">⚠️ 本当にリセットしますか？</p>
            <p className="reset-confirm-msg">つぎの記録が <strong>すべて消えます</strong>：</p>
            <ul className="reset-confirm-list">
              <li>マスタした段：<strong>{masteredDan}</strong> 個の段位メダル</li>
              <li>キングダムパワー：<strong>{(state.kp || 0).toLocaleString()}</strong> KP</li>
              <li>おうこくの仲間：<strong>{totalCompanions}</strong> 人</li>
              <li>ずかんの収集：<strong>{collectionCount}</strong> 個</li>
              <li>連続学習：<strong>{state.dailyStreak?.count ?? 0}</strong> 日</li>
              <li>称号、設定、すべての履歴</li>
            </ul>
            <div className="reset-confirm-actions">
              <button className="btn-danger" onClick={doReset}>はい、すべて消す</button>
              <button className="btn-secondary" onClick={() => setConfirmReset(false)}>キャンセル</button>
            </div>
          </div>
        )}
      </section>

      <button className="btn-secondary" onClick={() => navigate('/')}>← ホームへ</button>
    </div>
  );
}
