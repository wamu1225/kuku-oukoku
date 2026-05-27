import { useState } from 'react';
import type { KukuState } from '../types';
import { navigate } from '../App';
import { COLLECTION_ITEMS, type CollectionItem } from '../data/collectionData';

const CATEGORY_LABEL: Record<string, string> = {
  seal: '賢者の印（段位）',
  treasure: '王国の秘宝',
  medal: '挑戦の記録',
  relic: '探索の証明',
};

export function Collection({ state }: { state: KukuState }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const owned = new Set([
    ...(state.wisdomSeals || []),
    ...(state.royalTreasures || []),
  ]);

  const grouped = COLLECTION_ITEMS.reduce<Record<string, CollectionItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const ownedCount = COLLECTION_ITEMS.filter((i) => owned.has(i.id)).length;
  const selected = selectedId ? COLLECTION_ITEMS.find((i) => i.id === selectedId) : null;
  const selectedOwned = selected ? owned.has(selected.id) : false;

  return (
    <div className="screen">
      <h1 className="screen-title">📚 ずかん</h1>
      <p className="screen-desc">
        集めた印・秘宝・記録・遺物：<strong>{ownedCount} / {COLLECTION_ITEMS.length}</strong>
      </p>

      {Object.entries(grouped).map(([cat, items]) => {
        const catOwned = items.filter((i) => owned.has(i.id)).length;
        const ratio = catOwned / items.length;
        const isComplete = catOwned === items.length;
        const remaining = items.length - catOwned;
        return (
          <section key={cat} className="collection-section">
            <h2 className="section-h collection-section-h">
              <span>{CATEGORY_LABEL[cat] ?? cat}</span>
              <span className="collection-section-count">
                {catOwned} / {items.length}
                {isComplete && <span className="collection-complete-badge">✨ 完全制覇</span>}
              </span>
            </h2>
            <div className="collection-section-progress" aria-hidden="true">
              <div
                className={`collection-section-progress-bar ${isComplete ? 'complete' : ''}`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
            {!isComplete && remaining > 0 && (
              <p className="collection-remaining">あと <strong>{remaining}</strong> 個！</p>
            )}
            <div className="collection-grid">
              {items.map((item) => {
                const has = owned.has(item.id);
                const isSelected = selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`collection-item ${has ? 'owned' : 'locked'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                    style={has ? { borderColor: item.color } : { borderColor: item.color + '33' }}
                    aria-label={has ? `${item.name}：${item.desc}` : `未獲得：${item.hidden ? '？？？' : item.desc}`}
                  >
                    {has && <span className="collection-shine" aria-hidden="true" />}
                    <span className="collection-emoji" aria-hidden="true">{has ? item.emoji : '🔒'}</span>
                    <span className="collection-name">{has ? item.name : '？？？'}</span>
                    <span className="collection-desc">
                      {has ? item.desc : (item.hidden ? '？？？（高難度）' : `条件：${item.desc}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {selected && (
        <div className="collection-detail-popup" role="dialog" aria-label="アイテム詳細">
          <button className="collection-detail-close" onClick={() => setSelectedId(null)} aria-label="閉じる">✕</button>
          <div className="collection-detail-row">
            <span className="collection-detail-emoji" aria-hidden="true">
              {selectedOwned ? selected.emoji : '🔒'}
            </span>
            <div className="collection-detail-body">
              <div className="collection-detail-name">
                {selectedOwned ? selected.name : '？？？'}
              </div>
              <div className="collection-detail-cat">{CATEGORY_LABEL[selected.category]}</div>
              <div className="collection-detail-desc">
                {selectedOwned
                  ? <>✅ {selected.desc}</>
                  : (selected.hidden
                      ? '👀 獲得条件は秘密。極めた者にだけ分かる…'
                      : <>💡 条件：{selected.desc}</>
                    )}
              </div>
            </div>
          </div>
        </div>
      )}

      <button className="btn-secondary" onClick={() => navigate('/')}>← ホームへ</button>
    </div>
  );
}
