import { useState } from 'react';
import { navigate } from '../App';
import type { KukuState } from '../types';
import { KUKU_READINGS } from '../data/kukuReadings';

export function Map({ state }: { state: KukuState }) {
  const trialCleared = (state.stats?.totalTrialsCleared || 0) > 0;
  const [mode, setMode] = useState<'9' | '20'>('9');
  const [selected, setSelected] = useState<{ a: number; b: number } | null>(null);
  const size = mode === '20' ? 20 : 9;

  const closeReading = () => setSelected(null);
  const selectedReading = selected
    ? KUKU_READINGS[`${selected.a}x${selected.b}`] || null
    : null;
  const selectedAnswer = selected ? selected.a * selected.b : null;

  return (
    <div className="screen">
      <h1 className="screen-title">🗺️ 九九の地図</h1>
      <p className="screen-desc">
        九九ぜんぶの ちず。ますを タップすると よみかたが でるよ。
      </p>

      {trialCleared && (
        <div className="map-mode-toggle">
          <button
            className={mode === '9' ? 'active' : ''}
            onClick={() => { setMode('9'); setSelected(null); }}
          >9×9 の地図</button>
          <button
            className={mode === '20' ? 'active' : ''}
            onClick={() => { setMode('20'); setSelected(null); }}
          >でんせつの 20×20 の地図 <span className="map-unlock-badge">✨</span></button>
        </div>
      )}

      <div className="map-legend" aria-hidden="true">
        <span className="map-legend-item map-region-basic">1〜3 はじまりの里</span>
        <span className="map-legend-item map-region-mid">4〜6 みどりの森</span>
        <span className="map-legend-item map-region-adv">7〜9 雷の山</span>
        {size === 20 && <span className="map-legend-item map-region-legend">10〜20 でんせつの地</span>}
      </div>

      <div className={`kuku-map kuku-map-${size}`}>
        <div className="kuku-map-row kuku-map-header">
          <div className="kuku-map-cell kuku-map-corner">×</div>
          {Array.from({ length: size }, (_, i) => {
            const col = i + 1;
            return (
              <div key={col} className="kuku-map-cell kuku-map-head">
                {col}
              </div>
            );
          })}
        </div>
        {Array.from({ length: size }, (_, a) => {
          const row = a + 1;
          const region = row <= 3 ? 'basic' : row <= 6 ? 'mid' : row <= 9 ? 'adv' : 'legend';
          return (
            <div key={row} className={`kuku-map-row map-row-${region}`}>
              <div className="kuku-map-cell kuku-map-head">
                {row}
              </div>
              {Array.from({ length: size }, (_, b) => {
                const col = b + 1;
                const isSelected = selected?.a === row && selected?.b === col;
                return (
                  <button
                    key={col}
                    type="button"
                    className={`kuku-map-cell kuku-map-cell-btn ${isSelected ? 'cell-selected' : ''}`}
                    onClick={() => setSelected({ a: row, b: col })}
                    aria-label={`${row} かける ${col} は ${row * col}`}
                  >
                    {row * col}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="map-reading-popup" role="dialog" aria-label="九九の よみかた">
          <button className="map-reading-close" onClick={closeReading} aria-label="閉じる">✕</button>
          <div className="map-reading-eq">
            {selected.a} × {selected.b} = <strong>{selectedAnswer}</strong>
          </div>
          {selectedReading ? (
            <div className="map-reading-yomi">「{selectedReading}」</div>
          ) : (
            <div className="map-reading-yomi map-reading-yomi-extra">
              （でんせつの だん：声に出して「{selected.a} かける {selected.b} は {selectedAnswer}」）
            </div>
          )}
        </div>
      )}

      <button className="btn-secondary" onClick={() => navigate('/')}>← ホームへ</button>
    </div>
  );
}
