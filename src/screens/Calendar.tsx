import { useMemo, useState } from 'react';
import type { KukuState } from '../types';
import { navigate } from '../App';
import { DateUtils } from '../utils/DateUtils';

export function Calendar({ state }: { state: KukuState }) {
  const [offset, setOffset] = useState(0);
  const target = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    d.setDate(1);
    return d;
  }, [offset]);

  const year = target.getFullYear();
  const month = target.getMonth();
  const firstDay = target.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = DateUtils.getLocalDateString();
  const studyHistory = new Set(state.studyHistory || []);

  const cells: Array<{ day: number | null; date: string | null; studied: boolean; isToday: boolean }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, date: null, studied: false, isToday: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, date, studied: studyHistory.has(date), isToday: date === today });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, date: null, studied: false, isToday: false });

  const streak = state.dailyStreak?.count ?? 0;
  const studyDaysInMonth = cells.filter((c) => c.studied).length;

  return (
    <div className="screen">
      <h1 className="screen-title">📅 がくしゅうカレンダー</h1>
      <p className="screen-desc">
        まいにち少しずつでも続けるのが上達のコツ。今のれんぞく日数：<strong>{streak}日</strong>
      </p>

      <div className="calendar-controls">
        <button onClick={() => setOffset((o) => o - 1)} aria-label="前の月">← 前</button>
        <span className="calendar-month">{year}年 {month + 1}月</span>
        <button onClick={() => setOffset((o) => o + 1)} aria-label="次の月">次 →</button>
      </div>

      <div className="calendar-grid" role="grid">
        {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
          <div key={d} className="calendar-head" role="columnheader">{d}</div>
        ))}
        {cells.map((c, i) => (
          <div
            key={i}
            className={`calendar-cell ${c.studied ? 'studied' : ''} ${c.isToday ? 'today' : ''} ${c.day == null ? 'empty' : ''}`}
            role="gridcell"
          >
            {c.day && <span className="calendar-day">{c.day}</span>}
            {c.studied && <span className="calendar-mark" aria-label="学習済み">🌼</span>}
          </div>
        ))}
      </div>

      <p className="calendar-summary">この月の学習日数：{studyDaysInMonth}日</p>

      <button className="back-link" onClick={() => navigate('/')}>← ホームへ</button>
    </div>
  );
}
