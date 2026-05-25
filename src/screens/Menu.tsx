import { useState } from 'react';
import type { KukuState } from '../types';
import { navigate } from '../App';
import { IdleManager } from '../utils/IdleManager';

interface Tile {
  id: string;
  label: string;
  emoji: string;
  color: string;
  path: string;
  desc: string;
  danReq?: number;
}

const GROUPS: { title: string; tiles: Tile[] }[] = [
  {
    title: '📚 まなぶ・きそ',
    tiles: [
      { id: 'learn', label: 'まなぶ', emoji: '📖', color: '#3498db', path: '/learn/', desc: '九九を1の段から練習' },
      { id: 'map', label: '九九の地図', emoji: '🗺️', color: '#0ea5e9', path: '/map/', desc: '九九の全体表' },
    ],
  },
  {
    title: '⚡ ちょうせん',
    tiles: [
      { id: 'attack', label: 'アタック', emoji: '⚡', color: '#e67e22', path: '/attack/', desc: '9問のタイム勝負' },
      { id: 'dan', label: 'だんいにんてい', emoji: '🛡️', color: '#6c5ce7', path: '/dan/', desc: '15問で段位を上げる' },
      { id: 'battle', label: 'バトル', emoji: '⚔️', color: '#d63031', path: '/battle/', desc: '2枚カードで敵を撃破', danReq: 1 },
      { id: 'tower', label: 'タワー', emoji: '🗼', color: '#f1c40f', path: '/tower/', desc: '30秒でどこまで高く', danReq: 2 },
      { id: 'blank', label: 'くもくも', emoji: '🌫', color: '#fd79a8', path: '/blank/', desc: '？×4=12 のあなあき', danReq: 3 },
    ],
  },
  {
    title: '🏰 おうこく',
    tiles: [
      { id: 'empire', label: 'おうこく', emoji: '🏰', color: '#00b894', path: '/empire/', desc: 'なかまを呼んで育てる' },
    ],
  },
  {
    title: '📊 きろく',
    tiles: [
      { id: 'collection', label: 'ずかん', emoji: '📚', color: '#2ecc71', path: '/collection/', desc: '集めたメダル' },
      { id: 'calendar', label: 'カレンダー', emoji: '📅', color: '#14b8a6', path: '/calendar/', desc: '学習の記録' },
    ],
  },
];

export function Menu({ state }: { state: KukuState }) {
  const [lockMsg, setLockMsg] = useState<string | null>(null);
  const isUnlocked = (tile: Tile) => {
    if (['learn', 'collection', 'calendar', 'map'].includes(tile.id)) return true;
    if (tile.danReq !== undefined) return (state.danRank || 0) >= tile.danReq;
    return state.unlockedModes?.includes(tile.id as never) ?? false;
  };

  const lockMessage = (tile: Tile): string => {
    if (tile.id === 'attack') return '1の段の「まなぶ」をクリアするとあそべるよ';
    if (tile.id === 'dan' || tile.id === 'empire') return '1の段の「アタック」をクリアするとあそべるよ';
    if (tile.danReq) {
      const danLabel: Record<number, string> = { 1: '10級', 2: '9級', 3: '8級' };
      return `だんいにんていで ${danLabel[tile.danReq] || tile.danReq + '級'} に合格するとあそべるよ`;
    }
    return 'まだ あそべないよ';
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

      {lockMsg && (
        <div className="lock-toast" role="alert" onClick={() => setLockMsg(null)}>
          🔒 {lockMsg}
        </div>
      )}

      {GROUPS.map((g) => (
        <section key={g.title} className="menu-group">
          <h2 className="menu-group-title">{g.title}</h2>
          <div className="menu-grid">
            {g.tiles.map((t) => {
              const unlocked = isUnlocked(t);
              return (
                <button
                  key={t.id}
                  className={`menu-tile ${unlocked ? '' : 'locked'}`}
                  style={{ '--tile-color': unlocked ? t.color : '#94a3b8' } as React.CSSProperties}
                  onClick={() => {
                    if (!unlocked) {
                      setLockMsg(lockMessage(t));
                      window.setTimeout(() => setLockMsg(null), 4000);
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
        </section>
      ))}

      <section className="menu-intro" aria-labelledby="menu-intro-h">
        <h2 id="menu-intro-h">はじめての人へ</h2>
        <p>
          九九おうこくは、小学2年生から楽しめる<strong>九九の学習ゲーム</strong>です。
          「まなぶ」で1の段から練習を始めると、しだいに新しいモードが開放されていきます。
        </p>
        <p>
          解いた問題はすべて<strong>知識ポイント(KP)</strong>になり、KPで「なかま」を招待すると、
          そのなかまが自動的にもっとKPを集めてくれます。無料・登録不要で、お子さんが安心して遊べる作りです。
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
