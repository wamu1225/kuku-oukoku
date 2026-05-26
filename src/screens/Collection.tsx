import type { KukuState } from '../types';
import { navigate } from '../App';
import { COLLECTION_ITEMS } from '../data/collectionData';

const CATEGORY_LABEL: Record<string, string> = {
  seal: '賢者の印（段位）',
  treasure: '王国の秘宝',
  medal: '挑戦の記録',
  relic: '探索の証明',
};

export function Collection({ state }: { state: KukuState }) {
  const owned = new Set([
    ...(state.wisdomSeals || []),
    ...(state.royalTreasures || []),
  ]);

  const grouped = COLLECTION_ITEMS.reduce<Record<string, typeof COLLECTION_ITEMS>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const ownedCount = COLLECTION_ITEMS.filter((i) => owned.has(i.id)).length;

  return (
    <div className="screen">
      <h1 className="screen-title">📚 ずかん</h1>
      <p className="screen-desc">
        集めた印・宝物・メダル：<strong>{ownedCount} / {COLLECTION_ITEMS.length}</strong>
      </p>

      {Object.entries(grouped).map(([cat, items]) => {
        const catOwned = items.filter((i) => owned.has(i.id)).length;
        const ratio = catOwned / items.length;
        return (
          <section key={cat} className="collection-section">
            <h2 className="section-h collection-section-h">
              <span>{CATEGORY_LABEL[cat] ?? cat}</span>
              <span className="collection-section-count">{catOwned} / {items.length}</span>
            </h2>
            <div className="collection-section-progress" aria-hidden="true">
              <div className="collection-section-progress-bar" style={{ width: `${ratio * 100}%` }} />
            </div>
            <div className="collection-grid">
              {items.map((item) => {
                const has = owned.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`collection-item ${has ? 'owned' : 'locked'}`}
                    title={has ? item.desc : `${CATEGORY_LABEL[cat]}（未獲得）`}
                    style={has ? { borderColor: item.color } : { borderColor: item.color + '33' }}
                  >
                    {has && <span className="collection-shine" aria-hidden="true" />}
                    <span className="collection-emoji" aria-hidden="true">{has ? item.emoji : '🔒'}</span>
                    <span className="collection-name">{has ? item.name : '？？？'}</span>
                    <span className="collection-desc">{has ? item.desc : 'まだ未獲得'}</span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <button className="back-link" onClick={() => navigate('/')}>← ホームへ</button>
    </div>
  );
}
