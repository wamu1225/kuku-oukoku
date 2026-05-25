export interface CollectionItem {
  id: string;
  name: string;
  desc: string;
  category: 'seal' | 'treasure' | 'medal' | 'relic';
  emoji: string;
  color: string;
}

export const COLLECTION_ITEMS: CollectionItem[] = [
  { id: 'seal_1', name: '1の段の印', desc: '1の段をマスターした証', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_2', name: '2の段の印', desc: '2の段をマスターした証', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_3', name: '3の段の印', desc: '3の段をマスターした証', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_4', name: '4の段の印', desc: '4の段をマスターした証', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_5', name: '5の段の印', desc: '5の段をマスターした証', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_6', name: '6の段の印', desc: '6の段をマスターした証', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_7', name: '7の段の印', desc: '7の段をマスターした証', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_8', name: '8の段の印', desc: '8の段をマスターした証', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_9', name: '9の段の印', desc: '9の段をマスターした証', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_10', name: '10の段の印', desc: '10の段をマスターした証', category: 'seal', emoji: '📜', color: '#a78bfa' },
  { id: 'seal_11', name: '11の段の印', desc: '11の段をマスターした証', category: 'seal', emoji: '📜', color: '#a78bfa' },
  { id: 'seal_12', name: '12の段の印', desc: '12の段をマスターした証', category: 'seal', emoji: '📜', color: '#a78bfa' },
  { id: 'seal_13', name: '13の段の印', desc: '13の段をマスターした証', category: 'seal', emoji: '📜', color: '#a78bfa' },
  { id: 'seal_14', name: '14の段の印', desc: '14の段をマスターした証', category: 'seal', emoji: '📜', color: '#a78bfa' },
  { id: 'seal_15', name: '15の段の印', desc: '15の段をマスターした証', category: 'seal', emoji: '📜', color: '#a78bfa' },
  { id: 'seal_16', name: '16の段の印', desc: '16の段をマスターした証', category: 'seal', emoji: '📜', color: '#a78bfa' },
  { id: 'seal_17', name: '17の段の印', desc: '17の段をマスターした証', category: 'seal', emoji: '📜', color: '#a78bfa' },
  { id: 'seal_18', name: '18の段の印', desc: '18の段をマスターした証', category: 'seal', emoji: '📜', color: '#a78bfa' },
  { id: 'seal_19', name: '19の段の印', desc: '19の段をマスターした証', category: 'seal', emoji: '📜', color: '#a78bfa' },
  { id: 'seal_20', name: '20の段の印', desc: '九九の神域に達した証', category: 'seal', emoji: '👑', color: '#fbbf24' },

  { id: 'treasure_1', name: '友情のブレスレット', desc: 'なかまを 10人 呼んだ記念', category: 'treasure', emoji: '💖', color: '#ef4444' },
  { id: 'treasure_2', name: '黄金のコイン', desc: '10,000 KP 集めた証', category: 'treasure', emoji: '🪙', color: '#facc15' },
  { id: 'treasure_3', name: '約束の指輪', desc: 'なかまを 50人 呼んだ記念', category: 'treasure', emoji: '💍', color: '#fb7185' },
  { id: 'treasure_4', name: 'きらめく首飾り', desc: '1,000,000 KP 集めた証', category: 'treasure', emoji: '✨', color: '#22d3ee' },
  { id: 'treasure_5', name: '王国の鍵', desc: 'なかまを 100人 呼んだ記念', category: 'treasure', emoji: '🗝️', color: '#fcd34d' },
  { id: 'treasure_6', name: 'ダイヤモンド', desc: '1億 KP 集めた証', category: 'treasure', emoji: '💎', color: '#7dd3fc' },
  { id: 'treasure_7', name: '勇者のマント', desc: '伝説のなかまを招待した証', category: 'treasure', emoji: '🧣', color: '#a78bfa' },
  { id: 'treasure_8', name: '世界樹の枝', desc: 'おうこくレベル Lv.3 に到達', category: 'treasure', emoji: '🌳', color: '#22c55e' },
  { id: 'treasure_9', name: '虹色の杯', desc: '1兆 KP 集めた証', category: 'treasure', emoji: '🏆', color: '#fb923c' },
  { id: 'treasure_10', name: '究極の玉座', desc: '王国の全てを手に入れた証', category: 'treasure', emoji: '👑', color: '#64748b' },

  { id: 'medal_1', name: 'かけだしのバッジ', desc: 'はなまるスタンプを 10個 集めた', category: 'medal', emoji: '🎯', color: '#67e8f9' },
  { id: 'medal_3', name: 'スピードスター', desc: 'アタックを 15秒以内 でクリア', category: 'medal', emoji: '⚡', color: '#fde047' },
  { id: 'medal_4', name: '鉄人のバッジ', desc: 'はなまるスタンプを 100個 集めた', category: 'medal', emoji: '🛡️', color: '#fda4af' },
  { id: 'medal_9', name: '月の雫', desc: 'はなまるスタンプを 500個 集めた', category: 'medal', emoji: '🌙', color: '#a78bfa' },

  { id: 'relic_1', name: '古びた教科書', desc: '合計で 15問 とき終えた', category: 'relic', emoji: '📖', color: '#67e8f9' },
  { id: 'relic_2', name: '知恵のルーペ', desc: 'まなぶモードを 10回 プレイした', category: 'relic', emoji: '🔍', color: '#22c55e' },
  { id: 'relic_3', name: 'インクの小瓶', desc: '合計で 100問 とき終えた', category: 'relic', emoji: '🖋️', color: '#3b82f6' },
  { id: 'relic_6', name: '時空の時計', desc: '毎日学習を 3日 続けた', category: 'relic', emoji: '⏰', color: '#fb923c' },
  { id: 'relic_8', name: '光り輝く地図', desc: '合計で 500問 とき終えた', category: 'relic', emoji: '🗺️', color: '#fcd34d' },
  { id: 'relic_9', name: '導きの杖', desc: '合計で 5000問 とき終えた', category: 'relic', emoji: '🪄', color: '#a78bfa' },
];
