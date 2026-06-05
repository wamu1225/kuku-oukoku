export interface CompanionMeta {
  level: number;
  name: string;
  emoji: string;
  color: string;
  type: 'fairy' | 'bird' | 'spirit' | 'star' | 'animal' | 'guardian' | 'legend' | 'god' | 'final';
}

export const COMPANIONS: CompanionMeta[] = [
  { level: 1, name: 'ちょうちょの妖精', emoji: '🦋', color: '#60a5fa', type: 'fairy' },
  { level: 2, name: 'はばたく小鳥', emoji: '🐦', color: '#34d399', type: 'bird' },
  { level: 3, name: '木の葉の精', emoji: '🍃', color: '#84cc16', type: 'spirit' },
  { level: 4, name: 'お花の精', emoji: '🌸', color: '#ec4899', type: 'fairy' },
  { level: 5, name: 'きらきら星', emoji: '⭐', color: '#facc15', type: 'star' },
  { level: 6, name: 'みかづきうさぎ', emoji: '🐰', color: '#a78bfa', type: 'animal' },
  { level: 7, name: 'お日さま騎士', emoji: '☀️', color: '#fb923c', type: 'guardian' },
  { level: 8, name: '鉄壁のゴーレム', emoji: '🪨', color: '#78716c', type: 'guardian' },
  { level: 9, name: 'おうこくの守護兵', emoji: '🛡️', color: '#475569', type: 'guardian' },
  { level: 10, name: 'でんせつの白龍', emoji: '🐉', color: '#06b6d4', type: 'legend' },
  { level: 11, name: '知識の守護者', emoji: '📚', color: '#8b5cf6', type: 'legend' },
  { level: 12, name: '真理の探求者', emoji: '🔮', color: '#c084fc', type: 'legend' },
  { level: 13, name: '時をかける猫', emoji: '🐈', color: '#f472b6', type: 'legend' },
  { level: 14, name: '夢幻の蝶', emoji: '🦋', color: '#e879f9', type: 'legend' },
  { level: 15, name: '雷光の虎', emoji: '🐅', color: '#eab308', type: 'legend' },
  { level: 16, name: '氷雪の狼', emoji: '🐺', color: '#7dd3fc', type: 'legend' },
  { level: 17, name: '焔の鳳凰', emoji: '🔥', color: '#ef4444', type: 'legend' },
  { level: 18, name: '天界の麒麟', emoji: '🦄', color: '#fcd34d', type: 'legend' },
  { level: 19, name: '次元の旅人', emoji: '🌌', color: '#6366f1', type: 'legend' },
  { level: 20, name: '九九の大賢者', emoji: '🧙', color: '#7c3aed', type: 'god' },
  // 最後のなかま（段21相当）。生産はせず、クリアの証となる特別な存在
  { level: 21, name: '九九の神さま', emoji: '👑', color: '#fbbf24', type: 'final' },
];

export const getCompanion = (level: number): CompanionMeta => {
  return COMPANIONS.find((c) => c.level === level) || COMPANIONS[0];
};
