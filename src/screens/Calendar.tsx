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
  const totalStudyDays = studyHistory.size;
  const hasClockRelic = (state.royalTreasures || []).includes('relic_6');

  const cells: Array<{ day: number | null; date: string | null; studied: boolean; isToday: boolean; isFuture: boolean }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, date: null, studied: false, isToday: false, isFuture: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      day: d,
      date,
      studied: studyHistory.has(date),
      isToday: date === today,
      isFuture: date > today,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, date: null, studied: false, isToday: false, isFuture: false });

  const streak = state.dailyStreak?.count ?? 0;
  const studyDaysInMonth = cells.filter((c) => c.studied).length;
  const studiedToday = studyHistory.has(today);

  const flameTier = streak === 0 ? 0 : streak < 3 ? 1 : streak < 7 ? 2 : streak < 14 ? 3 : streak < 30 ? 4 : 5;
  const flameEmoji = streak === 0 ? '🕯️' : streak < 3 ? '🔥' : streak < 30 ? '🔥' : '🌟';
  const flameSize = [28, 36, 48, 60, 72, 88][flameTier];

  // streak hint：relic_6 既獲得時は時計の文言を出さない
  let streakHint: React.ReactNode;
  if (streak === 0) {
    streakHint = <>今日からスタート！🌱 まずは 1 日 やってみよう</>;
  } else if (!hasClockRelic && streak < 3) {
    streakHint = <>あと <strong>{3 - streak}日</strong> で「時空の時計」メダル！</>;
  } else if (streak < 7) {
    streakHint = <>あと <strong>{7 - streak}日</strong> で 1 週間達成！</>;
  } else if (streak < 14) {
    streakHint = <>あと <strong>{14 - streak}日</strong> で 2 週間達成！</>;
  } else if (streak < 30) {
    streakHint = <>あと <strong>{30 - streak}日</strong> で 1 ヶ月連続！</>;
  } else {
    streakHint = <>すごい！1 ヶ月以上の連続学習達成 🎉</>;
  }

  return (
    <div className="screen">
      <h1 className="screen-title">📅 がくしゅうカレンダー</h1>

      <div className="streak-hero">
        <div className={`streak-flame streak-flame-${flameTier}`} style={{ fontSize: flameSize }} aria-hidden="true">
          {flameEmoji}
        </div>
        <div className="streak-hero-text">
          <div className="streak-hero-count"><strong>{streak}</strong> 日 れんぞく</div>
          <div className="streak-hero-hint">{streakHint}</div>
        </div>
      </div>

      <p className="screen-desc">まいにち ちょっとずつ つづけるのが じょうたつの コツ。</p>

      {!studiedToday && (
        <div className="calendar-today-cta">
          <span className="calendar-today-cta-msg">📚 まだ きょうの がくしゅうが おわってないよ！</span>
          <button className="btn-primary calendar-today-cta-btn" onClick={() => navigate('/learning/')}>
            まなぶをはじめる
          </button>
        </div>
      )}

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
            className={`calendar-cell ${c.studied ? 'studied' : ''} ${c.isToday ? 'today' : ''} ${c.isFuture ? 'future' : ''} ${c.day == null ? 'empty' : ''}`}
            role="gridcell"
          >
            {c.day && <span className="calendar-day">{c.day}</span>}
            {c.studied && <span className="calendar-mark" aria-label="学習済み">🌼</span>}
          </div>
        ))}
      </div>

      <div className="calendar-stats">
        <div className="calendar-stats-row">
          <span className="calendar-stats-label">この月の学習日数</span>
          <span className="calendar-stats-value">{studyDaysInMonth} 日</span>
        </div>
        <div className="calendar-stats-row">
          <span className="calendar-stats-label">これまでの累計</span>
          <span className="calendar-stats-value">{totalStudyDays} 日</span>
        </div>
      </div>

      <button className="btn-secondary" onClick={() => navigate('/')}>← ホームへ</button>
    </div>
  );
}
