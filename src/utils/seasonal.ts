export interface SeasonalTheme {
  name: string;
  emoji: string;
  bg: string;
  accent: string;
}

const THEMES: SeasonalTheme[] = [
  { name: '雪のおうこく', emoji: '❄️', bg: 'linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)', accent: '#0284c7' }, // 1月
  { name: '梅と春のはじまり', emoji: '🌸', bg: 'linear-gradient(180deg, #fdf2f8 0%, #fff1f2 100%)', accent: '#db2777' }, // 2月
  { name: 'はるのおうこく', emoji: '🌷', bg: 'linear-gradient(180deg, #fce7f3 0%, #fdf4ff 100%)', accent: '#c026d3' }, // 3月
  { name: '桜の王都', emoji: '🌸', bg: 'linear-gradient(180deg, #fff1f2 0%, #fef3c7 100%)', accent: '#f43f5e' }, // 4月
  { name: 'みどりのおうこく', emoji: '🌿', bg: 'linear-gradient(180deg, #ecfdf5 0%, #f0fdf4 100%)', accent: '#16a34a' }, // 5月
  { name: 'あめのおうこく', emoji: '☔', bg: 'linear-gradient(180deg, #e0e7ff 0%, #ddd6fe 100%)', accent: '#6366f1' }, // 6月
  { name: 'なつのおうこく', emoji: '🌻', bg: 'linear-gradient(180deg, #fef9c3 0%, #fde68a 100%)', accent: '#eab308' }, // 7月
  { name: 'ひまわりの王都', emoji: '🌞', bg: 'linear-gradient(180deg, #fef3c7 0%, #fed7aa 100%)', accent: '#f97316' }, // 8月
  { name: 'みのりのおうこく', emoji: '🍁', bg: 'linear-gradient(180deg, #fed7aa 0%, #fecaca 100%)', accent: '#ea580c' }, // 9月
  { name: 'こうようの王都', emoji: '🍂', bg: 'linear-gradient(180deg, #fee2e2 0%, #fef3c7 100%)', accent: '#dc2626' }, // 10月
  { name: 'おちばのおうこく', emoji: '🍁', bg: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)', accent: '#b45309' }, // 11月
  { name: 'せいなるおうこく', emoji: '🎄', bg: 'linear-gradient(180deg, #d1fae5 0%, #fee2e2 100%)', accent: '#16a34a' }, // 12月
];

export function getCurrentSeasonal(date: Date = new Date()): SeasonalTheme {
  const month = date.getMonth(); // 0-11
  return THEMES[month] ?? THEMES[0];
}
