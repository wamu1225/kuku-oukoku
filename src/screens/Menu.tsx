import type { KukuState } from '../types';
import { navigate } from '../App';
import { IdleManager } from '../utils/IdleManager';

const TILES = [
  { id: 'learn', label: 'まなぶ', emoji: '📖', color: '#3498db', path: '/learn/', desc: '九九を1の段から練習' },
  { id: 'attack', label: 'アタック', emoji: '⚡', color: '#e67e22', path: '/attack/', desc: '時間との勝負' },
  { id: 'dan', label: 'だんいにんてい', emoji: '🛡️', color: '#6c5ce7', path: '/dan/', desc: '段位認定試験' },
  { id: 'empire', label: 'おうこく', emoji: '🏰', color: '#00b894', path: '/empire/', desc: 'なかまを呼んで王国を育てよう' },
  { id: 'collection', label: 'ずかん', emoji: '📚', color: '#2ecc71', path: '/collection/', desc: '集めた印・宝物・メダル' },
  { id: 'calendar', label: 'カレンダー', emoji: '📅', color: '#2d3436', path: '/calendar/', desc: '学習の記録' },
];

export function Menu({ state }: { state: KukuState }) {
  const isUnlocked = (id: string) => {
    if (id === 'learn' || id === 'collection' || id === 'calendar') return true;
    return state.unlockedModes?.includes(id as never) ?? false;
  };

  const kps = IdleManager.calculateKPS(state);

  return (
    <div className="menu-screen">
      <div className="menu-hero">
        <h1 className="menu-title">九九おうこく</h1>
        <p className="menu-subtitle">九九を解くと、王国が広がる ✨</p>
      </div>

      {kps > 0 && (
        <div className="kps-banner" role="status">
          <span aria-hidden="true">🌱</span> いま 1秒に {IdleManager.formatBigNumber(kps)} KP ふえてるよ
        </div>
      )}

      <div className="menu-grid">
        {TILES.map((t) => {
          const unlocked = isUnlocked(t.id);
          return (
            <button
              key={t.id}
              className={`menu-tile ${unlocked ? '' : 'locked'}`}
              style={{ '--tile-color': unlocked ? t.color : '#94a3b8' } as React.CSSProperties}
              onClick={() => {
                if (!unlocked) {
                  if (t.id === 'attack') {
                    alert('1の段の「まなぶ」をクリアするとあそべるよ');
                  } else if (t.id === 'dan' || t.id === 'empire') {
                    alert('1の段の「アタック」をクリアするとあそべるよ');
                  }
                  return;
                }
                navigate(t.path);
              }}
              aria-label={`${t.label}${unlocked ? '' : '（ロック中）'}`}
            >
              <span className="menu-tile-emoji" aria-hidden="true">{unlocked ? t.emoji : '🔒'}</span>
              <span className="menu-tile-label">{t.label}</span>
              <span className="menu-tile-desc">{t.desc}</span>
            </button>
          );
        })}
      </div>

      <section className="menu-intro" aria-labelledby="menu-intro-h">
        <h2 id="menu-intro-h">はじめての人へ</h2>
        <p>
          九九おうこくは、小学2年生から楽しめる<strong>九九の学習ゲーム</strong>です。
          「まなぶ」で1の段から練習を始めると、しだいに新しいモードが開放されていきます。
        </p>
        <p>
          解いた問題はすべて<strong>知識ポイント(KP)</strong>になり、KPで「なかま」を招待すると、
          そのなかまが自動的にもっとKPを集めてくれます。広告も追加課金もない、安心して遊べる作りです。
        </p>
        <p>
          <a href="/kuku-oukoku/guide/" onClick={(e) => { e.preventDefault(); navigate('/guide/'); }}>
            ▶︎ あそびかたを詳しく見る
          </a>
        </p>
      </section>
    </div>
  );
}
