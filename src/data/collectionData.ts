export interface CollectionItem {
  id: string;
  name: string;
  desc: string;
  category: 'seal' | 'treasure' | 'medal' | 'relic';
  emoji: string;
  color: string;
  /** true なら未獲得時に獲得条件を隠す（ラスボス系のお楽しみ用） */
  hidden?: boolean;
}

export const COLLECTION_ITEMS: CollectionItem[] = [
  { id: 'seal_1', name: '1の段の印', desc: '1のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_2', name: '2の段の印', desc: '2のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_3', name: '3の段の印', desc: '3のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_4', name: '4の段の印', desc: '4のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_5', name: '5の段の印', desc: '5のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_6', name: '6の段の印', desc: '6のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_7', name: '7の段の印', desc: '7のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_8', name: '8の段の印', desc: '8のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_9', name: '9の段の印', desc: '9のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#60a5fa' },
  { id: 'seal_10', name: '10の段の印', desc: '10のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#a78bfa', hidden: true },
  { id: 'seal_11', name: '11の段の印', desc: '11のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#a78bfa', hidden: true },
  { id: 'seal_12', name: '12の段の印', desc: '12のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#a78bfa', hidden: true },
  { id: 'seal_13', name: '13の段の印', desc: '13のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#a78bfa', hidden: true },
  { id: 'seal_14', name: '14の段の印', desc: '14のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#a78bfa', hidden: true },
  { id: 'seal_15', name: '15の段の印', desc: '15のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#a78bfa', hidden: true },
  { id: 'seal_16', name: '16の段の印', desc: '16のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#a78bfa', hidden: true },
  { id: 'seal_17', name: '17の段の印', desc: '17のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#a78bfa', hidden: true },
  { id: 'seal_18', name: '18の段の印', desc: '18のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#a78bfa', hidden: true },
  { id: 'seal_19', name: '19の段の印', desc: '19のだんを マスターした あかし', category: 'seal', emoji: '📜', color: '#a78bfa', hidden: true },
  { id: 'seal_20', name: '20の段の印', desc: 'くくの さいごまで たどりついた あかし', category: 'seal', emoji: '👑', color: '#fbbf24', hidden: true },

  { id: 'treasure_1', name: '友情のブレスレット', desc: 'なかまを 10人 よんだ きねん', category: 'treasure', emoji: '💖', color: '#ef4444' },
  { id: 'treasure_2', name: '黄金のコイン', desc: '10,000 ポイント あつめた あかし', category: 'treasure', emoji: '🪙', color: '#facc15' },
  { id: 'treasure_3', name: '約束の指輪', desc: 'なかまを 50人 よんだ きねん', category: 'treasure', emoji: '💍', color: '#fb7185' },
  { id: 'treasure_4', name: 'きらめく首飾り', desc: '1,000,000 ポイント あつめた あかし', category: 'treasure', emoji: '✨', color: '#22d3ee' },
  { id: 'treasure_5', name: '王国の鍵', desc: 'なかまを 100人 よんだ きねん', category: 'treasure', emoji: '🗝️', color: '#fcd34d' },
  { id: 'treasure_6', name: 'ダイヤモンド', desc: '1おく ポイント あつめた あかし', category: 'treasure', emoji: '💎', color: '#7dd3fc' },
  { id: 'treasure_7', name: '勇者のマント', desc: 'でんせつの なかまを よんだ あかし', category: 'treasure', emoji: '🧣', color: '#a78bfa' },
  { id: 'treasure_8', name: '世界樹の枝', desc: 'おうこくを レベル3まで そだてた', category: 'treasure', emoji: '🌳', color: '#22c55e' },
  { id: 'treasure_9', name: '虹色の杯', desc: '1ちょう ポイント あつめた あかし', category: 'treasure', emoji: '🏆', color: '#fb923c', hidden: true },
  { id: 'treasure_10', name: '究極の玉座', desc: 'おうこくの すべてを てにいれた あかし', category: 'treasure', emoji: '👑', color: '#64748b', hidden: true },
  { id: 'treasure_11', name: '創世の冠', desc: 'さいごの なかま「九九の神さま」を よんだ あかし', category: 'treasure', emoji: '🌟', color: '#fbbf24', hidden: true },

  { id: 'medal_1', name: 'かけだしのバッジ', desc: 'はなまるスタンプを 10個 あつめた', category: 'medal', emoji: '🎯', color: '#67e8f9' },
  { id: 'medal_2', name: '勇気の大剣', desc: 'バトルで あわせて20たい たおした', category: 'medal', emoji: '⚔️', color: '#22c55e' },
  { id: 'medal_3', name: 'スピードスター', desc: 'アタックを 15びょうより はやく クリア', category: 'medal', emoji: '⚡', color: '#fde047' },
  { id: 'medal_4', name: '鉄人のバッジ', desc: 'はなまるスタンプを 100個 あつめた', category: 'medal', emoji: '🛡️', color: '#fda4af' },
  { id: 'medal_5', name: 'コンボマスター', desc: 'バトルで 5コンボ いじょう つなげた', category: 'medal', emoji: '🔥', color: '#f97316' },
  { id: 'wisdom_gem', name: '知恵の原石', desc: 'タワーで 300m まで のぼった', category: 'medal', emoji: '💠', color: '#64748b' },
  { id: 'medal_7', name: '暗黒の盾', desc: 'くらやみの しれんを のりこえた ゆうしゃの あかし', category: 'medal', emoji: '🛡', color: '#1f2937' },
  { id: 'medal_8', name: '光の剣', desc: 'タワーで 1000m まで のぼった', category: 'medal', emoji: '⚔', color: '#fde047' },
  { id: 'medal_9', name: '月の雫', desc: 'はなまるスタンプを 500個 あつめた', category: 'medal', emoji: '🌙', color: '#a78bfa' },
  { id: 'medal_10', name: '伝説の王者', desc: 'バトルで あわせて100たい たおした', category: 'medal', emoji: '👑', color: '#facc15' },

  { id: 'relic_1', name: '古びた教科書', desc: 'あわせて 15問 といた', category: 'relic', emoji: '📖', color: '#67e8f9' },
  { id: 'relic_2', name: '知恵のルーペ', desc: 'まなぶモードを 10回 プレイした', category: 'relic', emoji: '🔍', color: '#22c55e' },
  { id: 'relic_3', name: 'インクの小瓶', desc: 'あわせて 100問 といた', category: 'relic', emoji: '🖋️', color: '#3b82f6' },
  { id: 'relic_4', name: '魔法の筆', desc: 'くもくも「しんキロウの森」で金メダル', category: 'relic', emoji: '🖌', color: '#a78bfa' },
  { id: 'relic_5', name: '真実の鏡', desc: 'くもくも「そらの雲海」で金メダル', category: 'relic', emoji: '🪞', color: '#22d3ee' },
  { id: 'relic_6', name: '時空の時計', desc: '3日 つづけて あそんだ', category: 'relic', emoji: '⏰', color: '#fb923c' },
  { id: 'relic_7', name: '知の羅針盤', desc: 'くもくも「かみなりの山」で金メダル', category: 'relic', emoji: '🧭', color: '#06b6d4' },
  { id: 'relic_8', name: '光り輝く地図', desc: 'あわせて 500問 といた', category: 'relic', emoji: '🗺️', color: '#fcd34d' },
  { id: 'relic_9', name: '導きの杖', desc: 'あわせて 5000問 といた', category: 'relic', emoji: '🪄', color: '#a78bfa', hidden: true },
  { id: 'relic_10', name: '賢者の石', desc: 'だんいにんてい 1級を 金メダルで クリアした あかし', category: 'relic', emoji: '💎', color: '#fb7185' },
];
