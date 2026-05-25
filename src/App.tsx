import { useEffect, useState, useCallback } from 'react';
import './App.css';
import { LearningEngine } from './utils/LearningEngine';
import { IdleManager } from './utils/IdleManager';
import type { KukuState } from './types';
import { Menu } from './screens/Menu';
import { LevelSelect } from './screens/LevelSelect';
import { Learning } from './screens/Learning';
import { TimeAttack } from './screens/TimeAttack';
import { DanChallenge } from './screens/DanChallenge';
import { Empire } from './screens/Empire';
import { Collection } from './screens/Collection';
import { Calendar } from './screens/Calendar';
import { Settings } from './screens/Settings';
import { Guide } from './pages/Guide';
import { About } from './pages/About';
import { Privacy } from './pages/Privacy';

const BASE = '/kuku-oukoku';

function parseRoute(pathname: string) {
  let rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  if (rel === '' || rel === '/') return { name: 'menu' } as const;
  rel = rel.replace(/^\//, '').replace(/\/$/, '');
  const parts = rel.split('/');
  switch (parts[0]) {
    case 'learn':
      if (parts[1]) return { name: 'learning', level: parseInt(parts[1]) } as const;
      return { name: 'levelSelect', mode: 'learn' } as const;
    case 'attack':
      if (parts[1]) return { name: 'timeAttack', level: parseInt(parts[1]) } as const;
      return { name: 'levelSelect', mode: 'attack' } as const;
    case 'dan': return { name: 'dan' } as const;
    case 'empire': return { name: 'empire' } as const;
    case 'collection': return { name: 'collection' } as const;
    case 'calendar': return { name: 'calendar' } as const;
    case 'settings': return { name: 'settings' } as const;
    case 'guide': return { name: 'guide' } as const;
    case 'about': return { name: 'about' } as const;
    case 'privacy': return { name: 'privacy' } as const;
    default: return { name: 'menu' } as const;
  }
}

export function navigate(path: string) {
  const target = BASE + (path.startsWith('/') ? path : '/' + path);
  if (window.location.pathname === target) return;
  window.history.pushState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function App() {
  const [pathname, setPathname] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [state, setState] = useState<KukuState>(() => LearningEngine.loadState());
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setState(LearningEngine.loadState());
  }, []);

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const { state: s, offlineKp, shouldNotify } = LearningEngine.applyOfflineEarnings();
    setState(s);
    if (shouldNotify && offlineKp > 0) {
      setOfflineNotice(`おかえり！るすばん中に ${IdleManager.formatBigNumber(offlineKp)} KP ためたよ`);
      window.setTimeout(() => setOfflineNotice(null), 5000);
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const r = LearningEngine.applyOfflineEarnings();
        setState(r.state);
      } else {
        LearningEngine.updateLastSeen();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const route = parseRoute(pathname);

  return (
    <>
      <a href={`${BASE}/`} className="skip-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
        メインコンテンツへスキップ
      </a>
      {offlineNotice && (
        <div className="offline-toast" role="status">{offlineNotice}</div>
      )}
      <Header state={state} pathname={pathname} />
      <main id="main">
        {route.name === 'menu' && <Menu state={state} />}
        {route.name === 'levelSelect' && <LevelSelect mode={route.mode} state={state} />}
        {route.name === 'learning' && <Learning level={route.level} onComplete={refresh} />}
        {route.name === 'timeAttack' && <TimeAttack level={route.level} onComplete={refresh} />}
        {route.name === 'dan' && <DanChallenge state={state} onComplete={refresh} />}
        {route.name === 'empire' && <Empire state={state} onUpdate={refresh} />}
        {route.name === 'collection' && <Collection state={state} />}
        {route.name === 'calendar' && <Calendar state={state} />}
        {route.name === 'settings' && <Settings state={state} onUpdate={refresh} />}
        {route.name === 'guide' && <Guide />}
        {route.name === 'about' && <About />}
        {route.name === 'privacy' && <Privacy />}
      </main>
      <Footer />
    </>
  );
}

function Header({ state, pathname }: { state: KukuState; pathname: string }) {
  const isMenu = pathname === BASE || pathname === BASE + '/';
  return (
    <header className="site-header" role="banner">
      <div className="site-header-inner">
        <a href={`${BASE}/`} className="site-title" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <span className="site-title-emoji" aria-hidden="true">👑</span>
          九九おうこく
        </a>
        {!isMenu && (
          <button className="back-btn" onClick={() => window.history.length > 1 ? window.history.back() : navigate('/')}>
            ← もどる
          </button>
        )}
        <div className="header-stats">
          <span className="stat-badge stat-rank" title="段位">
            <span aria-hidden="true">🛡️</span> {state.rank}
          </span>
          <span className="stat-badge stat-kp" title="知識ポイント">
            <span aria-hidden="true">✨</span> {IdleManager.formatBigNumber(state.kp)} KP
          </span>
          <span className="stat-badge stat-stamp" title="はなまるスタンプ">
            <span aria-hidden="true">🌼</span> {state.totalStamps}
          </span>
        </div>
      </div>
      <nav className="site-nav" aria-label="主要ナビゲーション">
        <a href={`${BASE}/`} onClick={(e) => { e.preventDefault(); navigate('/'); }}>ホーム</a>
        <a href={`${BASE}/guide/`} onClick={(e) => { e.preventDefault(); navigate('/guide/'); }}>あそびかた</a>
        <a href={`${BASE}/collection/`} onClick={(e) => { e.preventDefault(); navigate('/collection/'); }}>ずかん</a>
        <a href={`${BASE}/calendar/`} onClick={(e) => { e.preventDefault(); navigate('/calendar/'); }}>カレンダー</a>
        <a href={`${BASE}/settings/`} onClick={(e) => { e.preventDefault(); navigate('/settings/'); }}>せってい</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">
        <nav aria-label="フッターナビゲーション">
          <a href={`${BASE}/guide/`} onClick={(e) => { e.preventDefault(); navigate('/guide/'); }}>あそびかた</a>
          <a href={`${BASE}/about/`} onClick={(e) => { e.preventDefault(); navigate('/about/'); }}>このサイトについて</a>
          <a href={`${BASE}/privacy/`} onClick={(e) => { e.preventDefault(); navigate('/privacy/'); }}>プライバシーポリシー</a>
          <a href="https://study-apps.com/">study-apps.com</a>
        </nav>
        <p className="copyright">© 九九おうこく — 小学2年生向けの算数学習ゲーム</p>
      </div>
    </footer>
  );
}

export default App;
