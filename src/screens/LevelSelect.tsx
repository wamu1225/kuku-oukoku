import type { KukuState } from '../types';
import { navigate } from '../App';

const BADGE_LABEL: Record<string, string> = {
  gold: '金',
  silver: '銀',
  bronze: '銅',
  clear: 'クリア',
};

const BADGE_EMOJI: Record<string, string> = {
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
  clear: '✅',
};

export function LevelSelect({ mode, state }: { mode: 'learn' | 'attack'; state: KukuState }) {
  const isLearn = mode === 'learn';
  const title = isLearn ? 'まなぶ' : 'タイムアタック';
  const description = isLearn
    ? '段を選んで、ゆっくり九九を確認してから問題にちょうせんしよう'
    : 'タイムを競って、金メダルをめざそう';

  const unlocked = state.unlockedLevels ?? [1];
  const allLevels = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <div className="screen">
      <h1 className="screen-title">{title}</h1>
      <p className="screen-desc">{description}</p>

      <div className="level-grid">
        {allLevels.map((level) => {
          const isUnlocked = unlocked.includes(level);
          const best = state.tableBests[level];
          const showLearnCompleted = isLearn && best?.isCompleted;
          const showAttackBadge = !isLearn && best?.badge;

          return (
            <button
              key={level}
              className={`level-card ${isUnlocked ? '' : 'locked'}`}
              disabled={!isUnlocked}
              onClick={() => navigate(`/${mode}/${level}/`)}
              aria-label={`${level}の段${isUnlocked ? '' : '（ロック中）'}`}
            >
              <span className="level-number">{level}の段</span>
              {showLearnCompleted && (
                <span className="level-status" title="クリア済み">💮</span>
              )}
              {showAttackBadge && best.badge && (
                <span className="level-status">
                  {BADGE_EMOJI[best.badge]} {BADGE_LABEL[best.badge]}
                </span>
              )}
              {best?.bestTimeMs && !isLearn ? (
                <span className="level-time">{(best.bestTimeMs / 1000).toFixed(2)}秒</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <button className="back-link" onClick={() => navigate('/')}>← ホームへ</button>
    </div>
  );
}
