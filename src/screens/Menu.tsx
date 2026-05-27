import { useState, useMemo } from 'react';
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
      { id: 'learn', label: 'まなぶ', emoji: '📖', color: '#3498db', path: '/learn/', desc: '1のだんから れんしゅう' },
      { id: 'map', label: '九九の地図', emoji: '🗺️', color: '#0ea5e9', path: '/map/', desc: 'ぜんぶの九九を ちずで見る' },
    ],
  },
  {
    title: '⚡ ちょうせん',
    tiles: [
      { id: 'attack', label: 'アタック', emoji: '⚡', color: '#e67e22', path: '/attack/', desc: '9もんの タイムしょうぶ' },
      { id: 'dan', label: 'だんいにんてい', emoji: '🛡️', color: '#6c5ce7', path: '/dan/', desc: '15もんで くらいアップ' },
      { id: 'battle', label: 'バトル', emoji: '⚔️', color: '#d63031', path: '/battle/', desc: 'カード2まいで てきを たおす', danReq: 1 },
      { id: 'tower', label: 'タワー', emoji: '🗼', color: '#f1c40f', path: '/tower/', desc: '30びょうで どこまで のぼれる？', danReq: 2 },
      { id: 'blank', label: 'くもくも', emoji: '🌫', color: '#fd79a8', path: '/blank/', desc: 'あなあき九九（？×4=12）', danReq: 3 },
    ],
  },
  {
    title: '🏰 おうこく',
    tiles: [
      { id: 'empire', label: 'おうこく', emoji: '🏰', color: '#00b894', path: '/empire/', desc: 'なかまを よんで そだてる' },
    ],
  },
  {
    title: '📊 きろく',
    tiles: [
      { id: 'collection', label: 'ずかん', emoji: '📚', color: '#2ecc71', path: '/collection/', desc: '集めた 印・秘宝・メダル' },
      { id: 'calendar', label: 'カレンダー', emoji: '📅', color: '#14b8a6', path: '/calendar/', desc: 'がくしゅうの きろく' },
    ],
  },
];

const INTRO_HIDDEN_KEY = 'kuku-oukoku:menu-intro-hidden';

export function Menu({ state }: { state: KukuState }) {
  const [lockMsg, setLockMsg] = useState<string | null>(null);
  const [introHidden, setIntroHidden] = useState(() => {
    try { return localStorage.getItem(INTRO_HIDDEN_KEY) === '1'; } catch { return false; }
  });
  const isBeginner = (state.totalStamps || 0) < 10 && (state.stats?.totalLearnPlays || 0) < 3;
  const introOpenDefault = isBeginner && !introHidden;
  const [introOpen, setIntroOpen] = useState(introOpenDefault);

  const toggleIntro = () => {
    const next = !introOpen;
    setIntroOpen(next);
    if (!next) {
      try { localStorage.setItem(INTRO_HIDDEN_KEY, '1'); } catch { /* ignore */ }
      setIntroHidden(true);
    }
  };

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

  // 次の目標を 1 つ算出
  const nextGoal = useMemo(() => {
    const danRank = state.danRank || 0;
    // 1. アタック未解禁
    if (!state.unlockedModes?.includes('attack' as never)) {
      return { icon: '⚡', text: '1の段の「まなぶ」を全問正解で「アタック」解禁！', path: '/learn/' };
    }
    // 2. だんいにんてい未解禁
    if (!state.unlockedModes?.includes('dan' as never)) {
      return { icon: '🛡️', text: '「アタック」を1回クリアで「だんいにんてい」解禁！', path: '/attack/' };
    }
    // 3. danReq タイルで未解禁あり
    const lockedChallenge = GROUPS.flatMap((g) => g.tiles).find((t) => t.danReq && danRank < t.danReq);
    if (lockedChallenge) {
      const danLabel: Record<number, string> = { 1: '10級', 2: '9級', 3: '8級' };
      return {
        icon: lockedChallenge.emoji,
        text: `だんいにんていで ${danLabel[lockedChallenge.danReq!]} 合格で「${lockedChallenge.label}」解禁！`,
        path: '/dan/',
      };
    }
    // 4. すべて解禁済 → 次の段位
    if (danRank < 10) {
      return { icon: '🛡️', text: 'だんいにんていで次の段位を目指そう！', path: '/dan/' };
    }
    if (danRank === 10 && (state.stats?.totalTrialsCleared || 0) === 0) {
      return { icon: '🌑', text: '暗黒の試練を突破して、伝説の段へ！', path: '/empire/' };
    }
    if (danRank > 10 && danRank < 21) {
      return { icon: '🌟', text: '伝説の段を進めて皆伝（21段）を目指そう！', path: '/dan/' };
    }
    return null;
  }, [state]);

  return (
    <div className="menu-screen">
      <div className="menu-hero">
        <h1 className="menu-title">九九おうこく</h1>
        <p className="menu-subtitle">九九を とけば、おうこくが ひろがるよ ✨</p>
      </div>

      {kps > 0 && (
        <div className="kps-banner" role="status">
          <span aria-hidden="true">🌱</span> いま 1秒に {IdleManager.formatBigNumber(kps)} KP ふえてるよ
        </div>
      )}

      {nextGoal && (
        <button
          className="menu-next-goal"
          onClick={() => navigate(nextGoal.path)}
          aria-label={`次の目標：${nextGoal.text}`}
        >
          <span className="menu-next-goal-icon" aria-hidden="true">{nextGoal.icon}</span>
          <span className="menu-next-goal-body">
            <span className="menu-next-goal-label">次の もくひょう</span>
            <span className="menu-next-goal-text">{nextGoal.text}</span>
          </span>
          <span className="menu-next-goal-arrow" aria-hidden="true">→</span>
        </button>
      )}

      {lockMsg && (
        <div className="lock-toast lock-toast-sticky" role="alert" onClick={() => setLockMsg(null)}>
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
        <button
          className="menu-intro-toggle"
          onClick={toggleIntro}
          aria-expanded={introOpen}
          aria-controls="menu-intro-body"
        >
          <span id="menu-intro-h">📘 はじめての人へ</span>
          <span className="menu-intro-chevron" aria-hidden="true">{introOpen ? '▲' : '▼'}</span>
        </button>
        {introOpen && (
          <div id="menu-intro-body" className="menu-intro-body">
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
          </div>
        )}
      </section>
    </div>
  );
}
