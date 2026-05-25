import { useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';

export function Map({ state }: { state: KukuState }) {
  const trialCleared = (state.stats?.totalTrialsCleared || 0) > 0;
  const [mode, setMode] = useState<'9' | '20'>('9');
  const size = mode === '20' ? 20 : 9;

  const masteredRows = new Set<number>();
  Object.entries(state.tableBests).forEach(([k, v]) => {
    if (v?.isCompleted) masteredRows.add(parseInt(k));
  });
  Object.entries(state.danMedals || {}).forEach(([rank, medal]) => {
    if (medal) {
      const r = parseInt(rank);
      // map dan rank to row (e.g. 10級=rank1 → row1, 初段=rank11 → row10)
      if (r >= 1 && r <= 9) masteredRows.add(r); // 10〜2級
      else if (r >= 11 && r <= 21) masteredRows.add(r - 1); // 初段(11)→10, 二段(12)→11 ... 皆伝(21)→20
    }
  });

  return (
    <div className="screen">
      <h1 className="screen-title">🗺️ 九九の地図</h1>
      <p className="screen-desc">
        九九を一覧できる全体表。マスターした段（まなぶで全問正解、または段位合格）はハイライト表示されます。
      </p>

      {trialCleared && (
        <div className="map-mode-toggle">
          <button
            className={mode === '9' ? 'active' : ''}
            onClick={() => setMode('9')}
          >9×9 の地図</button>
          <button
            className={mode === '20' ? 'active' : ''}
            onClick={() => setMode('20')}
          >でんせつの 20×20 の地図</button>
        </div>
      )}

      <div className={`kuku-map kuku-map-${size}`}>
        <div className="kuku-map-row kuku-map-header">
          <div className="kuku-map-cell kuku-map-corner">×</div>
          {Array.from({ length: size }, (_, i) => (
            <div key={i} className="kuku-map-cell kuku-map-head">{i + 1}</div>
          ))}
        </div>
        {Array.from({ length: size }, (_, a) => {
          const row = a + 1;
          const isMastered = masteredRows.has(row);
          return (
            <div key={row} className={`kuku-map-row ${isMastered ? 'mastered' : ''}`}>
              <div className="kuku-map-cell kuku-map-head">{row}</div>
              {Array.from({ length: size }, (_, b) => (
                <div key={b} className="kuku-map-cell" title={`${row} × ${b + 1} = ${row * (b + 1)}`}>
                  {row * (b + 1)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <button className="back-link" onClick={() => navigate('/')}>← ホームへ</button>
    </div>
  );
}
