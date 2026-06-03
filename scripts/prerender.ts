import * as fs from 'fs';
import * as path from 'path';

const DIST = path.resolve(process.cwd(), 'dist');
const BASE_URL = 'https://study-apps.com/kuku-oukoku';
const TODAY = new Date().toISOString().split('T')[0];
const SITE_NAME = '九九おうこく';
const PUBLISHER = { '@type': 'Organization', name: 'study-apps.com', url: 'https://study-apps.com/' };

if (!fs.existsSync(DIST)) {
  console.error('dist/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8');

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

interface Page {
  slug: string;
  title: string;
  description: string;
  ogType: 'website' | 'article';
  fallbackHtml: string;
  changefreq: string;
  priority: string;
  extraJsonLd?: object[];
  breadcrumbName?: string;
}

const HOME_FALLBACK = `
<h1>${SITE_NAME}</h1>
<p>九九おうこくは、小学2年生から楽しめる九九の学習ゲームです。「まなぶ」モードで1の段から練習を始めると、しだいに新しいモードが開放されていきます。解いた問題はすべて知識ポイント(KP)になり、KPで「なかま」を招待すると、そのなかまが自動的にもっとKPを集めてくれます。無料・登録不要で、お子さんが安心して遊べる作りです。</p>
<h2>主なモード</h2>
<ul>
  <li><a href="/kuku-oukoku/learn/">まなぶ</a>：九九を1の段から順に練習</li>
  <li><a href="/kuku-oukoku/attack/">アタック</a>：タイムを競って金メダルを目指す</li>
  <li><a href="/kuku-oukoku/dan/">だんいにんてい</a>：15問を90秒以内で解いて昇段</li>
  <li><a href="/kuku-oukoku/empire/">おうこく</a>：KPでなかまを招待して王国を発展させる放置要素</li>
  <li><a href="/kuku-oukoku/battle/">バトル</a>：2枚のカードで敵HPを撃破する30秒チャレンジ</li>
  <li><a href="/kuku-oukoku/tower/">タワー</a>：30秒で解いた答えの合計分だけタワーが高くなる</li>
  <li><a href="/kuku-oukoku/blank/">くもくも</a>：「？×4=12」のような穴あき九九を10問</li>
  <li><a href="/kuku-oukoku/map/">九九の地図</a>：1×1〜9×9の全体表</li>
  <li><a href="/kuku-oukoku/collection/">ずかん</a>：集めた印・宝物・メダル一覧</li>
  <li><a href="/kuku-oukoku/calendar/">カレンダー</a>：学習履歴とストリーク</li>
</ul>
<h2>このゲームのねらい（保護者の方へ）</h2>
<p>九九は「覚える」だけでなく「とっさに答えが出てくる」状態まで定着させることが大切です。とはいえ、単純な反復練習は飽きやすく、毎日続けるのは簡単ではありません。九九おうこくは、解いた問題を「知識ポイント」「なかま」「王国の発展」という目に見える成果に変えることで、少しずつでも続けたくなる動機づけを作ることを目指して設計しています。</p>
<p>おすすめの使い方は、1日5〜10分でも「まなぶ」で1つの段に取り組み、慣れてきたら「アタック」でスピードを確かめる流れです。最初は答えを見ながら声に出して読み、徐々に画面を隠して解けるようにしていくと、無理なく身についていきます。他の人と点数を競わせる作りにはしておらず、お子さん自身が昨日の記録を超えていくことを目標にできます。学習の記録はすべてお使いの端末内（ブラウザ）に保存され、登録や個人情報の入力は一切必要ありません。</p>
<p><a href="/kuku-oukoku/guide/">あそびかたを詳しく見る →</a></p>`;

const GUIDE_FALLBACK = `
<h1>あそびかた</h1>
<p>九九おうこくは、九九を解くたびに「知識ポイント (KP)」がたまり、なかまが集まり、王国が大きくなっていく小学生向けの学習ゲームです。ここでは初めて遊ぶ人向けに、ゲームの流れと各モードのコツを紹介します。</p>
<h2>1. まずは「まなぶ」から</h2>
<p>ホーム画面から「まなぶ」を選び、1の段から順番に練習しましょう。最初は答えが見える状態で九九を確認できます。「もんだいをといてみる」ボタンを押すと、実際に答えを入力するクイズが始まります。9問すべて正解すると、その段はクリア。100 KPとはなまるスタンプを1個ゲットできます。最初に1の段をクリアすると「アタック」モードが解放されます。</p>
<h2>2. 「アタック」でタイムにちょうせん</h2>
<p>9問をできるだけ速く解いてゴールタイムを縮めるモードです。3秒のカウントダウンの後、ランダムな順番で問題が出題されます。15秒以内で金メダル、25秒以内で銀メダル、40秒以内で銅メダル。1の段のアタックをクリアすると、「だんいにんてい」と「おうこく」が解放されます。</p>
<h2>3. 「だんいにんてい」で昇段</h2>
<p>段位認定試験は、15問を制限時間90秒以内に全問正解すると合格となるモードです。10級（1の段）から始まり、級が上がるごとに出題範囲が広がっていきます。合格すると、その段のメダルがずかんに記録され、なかまの生産力にもボーナスが付きます。</p>
<h2>4. 「おうこく」でなかまを集める</h2>
<p>おうこくは、KPをなかまの招待コストに使って、王国を育てていく放置ゲーム要素のあるモードです。招待したなかまは1秒ごとに自動でKPを集めてくれます。なかまの生産力は、九九を解いた回数（熟練度バッジ）や段位試験の合格、各モードのクリアで発動する「おうこくの祝祭」（ある段の生産が30分間 1.5〜5倍）で強化されます。オフラインの間も最大12時間までKPがたまり続けます。</p>
<h2>5. 「バトル」「タワー」「くもくも」</h2>
<p>段位試験に合格していくと、3種類の対戦・タイムアタック型モードがアンロックされます。バトルは30秒のあいだに敵HPに一致する2枚のカードを選んで撃破。タワーは30秒で解いた答えの合計だけ高さが伸びていきます（100mで雲の上、300mで成層圏、1000mで宇宙）。くもくもは「？×4=12」のような穴あき九九を10問解く逆引きクイズです。</p>
<h2>6. 「ずかん」で集めた証を確認</h2>
<p>段位の印・王国の秘宝・挑戦のメダル・探索の証など、さまざまな項目を集める要素があります。条件を達成すると自動的に獲得され、ずかんに記録されます。</p>
<h2>続けるコツ</h2>
<p>まいにち少しずつ続けるほど、なかまの熟練度バッジが上がり、王国の発展も加速していきます。カレンダー画面では学習した日が記録されるので、連続日数を伸ばしていきましょう。3日間続けると「時空の時計」のメダルもゲットできます。</p>
<h2>よくある質問 (FAQ)</h2>
<details><summary>料金はかかりますか？</summary><p>完全無料です。広告の表示はありますが、追加課金や登録は一切不要です。</p></details>
<details><summary>データはどこに保存されますか？</summary><p>すべてお使いのブラウザの localStorage に保存されます。サーバには送信されません。ブラウザのデータを削除すると進捗もリセットされる点にご注意ください。</p></details>
<details><summary>アプリのインストールは必要ですか？</summary><p>不要です。ブラウザでアクセスするだけで遊べます。Chrome / Safari / Edge / Firefox などのモダンブラウザで動作します。</p></details>
<details><summary>オフラインでも遊べますか？</summary><p>最初のロード後はオフラインでも一部のモードは遊べますが、完全なオフライン対応（PWA）にはまだ未対応です。</p></details>
<details><summary>小学2年生でも理解できますか？</summary><p>はい。文字はひらがな中心、操作はタップ・数字入力のみで、ふりがな付きの読みかたも表示されます。1の段から段階的に解放されるので、初学者でも迷わず進めます。</p></details>`;

const GUIDE_FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: '料金はかかりますか？', acceptedAnswer: { '@type': 'Answer', text: '完全無料です。広告の表示はありますが、追加課金や登録は一切不要です。' } },
    { '@type': 'Question', name: 'データはどこに保存されますか？', acceptedAnswer: { '@type': 'Answer', text: 'すべてお使いのブラウザの localStorage に保存されます。サーバには送信されません。' } },
    { '@type': 'Question', name: 'アプリのインストールは必要ですか？', acceptedAnswer: { '@type': 'Answer', text: '不要です。ブラウザでアクセスするだけで遊べます。' } },
    { '@type': 'Question', name: 'オフラインでも遊べますか？', acceptedAnswer: { '@type': 'Answer', text: '最初のロード後はオフラインでも一部のモードは遊べますが、完全なオフライン対応にはまだ未対応です。' } },
    { '@type': 'Question', name: '小学2年生でも理解できますか？', acceptedAnswer: { '@type': 'Answer', text: 'はい。文字はひらがな中心、操作はタップ・数字入力のみで、ふりがな付きの読みかたも表示されます。' } },
  ],
};

const GUIDE_HOWTO_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: '九九おうこくの遊び方',
  description: '九九おうこくをはじめて遊ぶ人のための7ステップガイド',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'まなぶで1の段から練習', text: '「まなぶ」を選び、1の段の九九を確認してから9問のクイズに挑戦します。' },
    { '@type': 'HowToStep', position: 2, name: 'アタックで時間を競う', text: '1の段をクリアしたら「アタック」が解放。15秒以内で金メダルを狙います。' },
    { '@type': 'HowToStep', position: 3, name: 'だんいにんていで昇段', text: '15問を90秒で全問正解。級ごとに段が上がりなかまの生産力にボーナス。' },
    { '@type': 'HowToStep', position: 4, name: 'おうこくでなかまを招待', text: 'KPでなかまを呼ぶと、1秒ごとに自動でKPを稼いでくれます。' },
    { '@type': 'HowToStep', position: 5, name: 'バトル・タワー・くもくも', text: '段位を上げると3種類の対戦型モードがアンロックされます。' },
    { '@type': 'HowToStep', position: 6, name: 'ずかん・カレンダーで成果確認', text: '集めたメダルや連続学習日数を確認してモチベを維持します。' },
  ],
};

const PAGES: Page[] = [
  {
    slug: '',
    title: '九九おうこく | 九九を解くと王国が広がる学習ゲーム',
    description:
      '小学2年生向けの九九学習ゲーム。問題を解くたびにKPがたまり、なかまが集まり、おうこくが大きくなる。無料・登録不要で安心して遊べる。',
    ogType: 'website',
    changefreq: 'weekly',
    priority: '1.0',
    fallbackHtml: HOME_FALLBACK,
    breadcrumbName: 'ホーム',
    extraJsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: SITE_NAME,
        url: `${BASE_URL}/`,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web Browser',
        inLanguage: 'ja',
        description: '九九を解くと王国が広がる、小学2年生向けの算数学習ゲーム。',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
        audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
        publisher: PUBLISHER,
      },
    ],
  },
  {
    slug: 'guide',
    title: 'あそびかた | 九九おうこく',
    description: '九九おうこくの遊び方ガイド。まなぶ・アタック・だんいにんてい・おうこく・バトル・タワーの使い方と上達のコツ、FAQ を網羅。',
    ogType: 'article',
    changefreq: 'monthly',
    priority: '0.9',
    fallbackHtml: GUIDE_FALLBACK,
    breadcrumbName: 'あそびかた',
    extraJsonLd: [GUIDE_HOWTO_JSONLD, GUIDE_FAQ_JSONLD],
  },
  {
    slug: 'about',
    title: 'このサイトについて | 九九おうこく',
    description: '九九おうこくのコンセプトと運営方針、動作環境、対象ユーザーについて。無料・登録不要・データはブラウザ内に保存。',
    ogType: 'article',
    changefreq: 'monthly',
    priority: '0.6',
    breadcrumbName: 'このサイトについて',
    fallbackHtml: `
<h1>このサイトについて</h1>
<p>「九九おうこく」は、小学2年生の九九学習を、楽しく続けられるようにデザインされた完全無料のブラウザ向け学習ゲームです。登録も不要で、お子さんが安心して遊べる環境を提供します。広告は Google AdSense のみ控えめに表示しています。</p>
<h2>コンセプト</h2>
<p>「九九を解くたびに、王国が広がる」がコアアイデアです。解いた問題はすべて知識ポイント (KP) に変わり、なかまを呼ぶことで、さらに自動でKPがたまる仕組みになっています。学習の成果が、ただの数字ではなく「自分の王国」として可視化されるので、モチベーションが続きやすい設計です。</p>
<h2>3つの方針</h2>
<ul>
<li><strong>学習を最優先</strong>：ゲーム要素はあくまで学習のモチベーションを上げるためのもの。</li>
<li><strong>安心・安全</strong>：個人情報を求める機能はありません。学習データはお使いの端末のブラウザ内に保存されます。広告は Google AdSense のみ控えめに表示。</li>
<li><strong>段階的な解放</strong>：学習の進捗に応じて新しいモードが現れます。</li>
</ul>
<h2>編集・制作方針</h2>
<p>本サイトの問題・解説・ゲーム内のテキストは、小学校で学ぶ九九の範囲をもとに、運営者がすべて独自に制作しています。他サイトの文章や素材をそのまま転載することはありません。九九の出題はプログラムで自動生成しており、答えはすべて検算済みです。誤りや改善のご要望に気づいた場合は、お問い合わせを受けて随時見直し・修正します。</p>
<h2>お問い合わせ</h2>
<p>ご質問・誤りのご指摘は<a href="https://forms.gle/ccMv7oKwz6ysDHBe6" target="_blank" rel="noopener noreferrer">こちらのGoogleフォーム</a>からお願いします。</p>
<h2>動作環境</h2>
<p>最新のChrome、Safari、Edge、Firefoxなどのモダンブラウザで動作します。スマートフォン・タブレット・PCのどれでも遊べます。インストールは不要で、ブラウザでアクセスするだけですぐに始められます。</p>`,
  },
  {
    slug: 'privacy',
    title: 'プライバシーポリシー | 九九おうこく',
    description: '九九おうこくの個人情報・利用情報の取り扱い方針。Google Analytics、AdSense、データ保存場所について。',
    ogType: 'article',
    changefreq: 'yearly',
    priority: '0.3',
    breadcrumbName: 'プライバシーポリシー',
    fallbackHtml: `
<h1>プライバシーポリシー</h1>
<p>本サイト「九九おうこく」（以下「当サイト」）における、ユーザーの個人情報・利用情報の取り扱い方針をここに定めます。</p>
<h2>1. 学習データの保存場所</h2>
<p>当サイトの学習進捗（解いた問題、KP、なかま、段位など）はすべて、お使いのブラウザのlocalStorageに保存されます。当サイト側のサーバには送信されず、外部に共有されることもありません。</p>
<h2>2. アクセス解析（Google Analytics）</h2>
<p>当サイトはGoogle Analytics 4を使用してアクセス状況を把握しています。Google Analyticsは個人を特定しない形でデータを収集します。</p>
<h2>3. 広告配信（Google AdSense）</h2>
<p>当サイトはGoogle AdSenseによる広告を配信する場合があります。Googleを含む第三者配信事業者は、Cookieを使用して過去のアクセス情報をもとに広告を配信します。</p>`,
  },

  // === Interactive routes (now also indexed with unique meta + content) ===
  {
    slug: 'learn',
    title: 'まなぶ | 九九おうこく',
    description: '1の段から9の段まで、九九を声に出して読みながら覚えるモード。読み仮名つきで初学者にも安心。',
    ogType: 'article', changefreq: 'monthly', priority: '0.7',
    breadcrumbName: 'まなぶ',
    fallbackHtml: `<h1>まなぶ</h1><p>段を選んで、九九の式と答え、読み仮名を一覧で確認するモードです。全部読んでから「もんだいをといてみる」ボタンを押すと、9問のクイズに挑戦できます。全問正解で100 KPとはなまるスタンプを1つ獲得。1の段をクリアすると「アタック」モードが解放されます。</p><p>初学者は1の段→2の段→5の段→10の段→3の段...の順がおすすめ。最初は答えが見える状態で読み上げて、リズムで覚えていきましょう。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
  {
    slug: 'attack',
    title: 'アタック | 九九おうこく',
    description: '9問の九九をできるだけ速く解くタイムアタックモード。15秒以内で金、25秒以内で銀、40秒以内で銅メダル。',
    ogType: 'article', changefreq: 'monthly', priority: '0.7',
    breadcrumbName: 'アタック',
    fallbackHtml: `<h1>アタック</h1><p>3秒のカウントダウンの後、9問の九九がランダムな順番で出題されます。できるだけ速く解いてゴールタイムを縮めましょう。15秒以内で金メダル、25秒以内で銀メダル、40秒以内で銅メダル。クリアで100 KP獲得。1の段のアタックをクリアすると「だんいにんてい」と「おうこく」が解放されます。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
  {
    slug: 'dan',
    title: 'だんいにんてい試験 | 九九おうこく',
    description: '15問を90秒以内に全問正解で合格する段位認定試験。10級から伝説まで23階級。合格でメダル取得＋なかまの生産力ボーナス。',
    ogType: 'article', changefreq: 'monthly', priority: '0.7',
    breadcrumbName: 'だんいにんてい',
    fallbackHtml: `<h1>だんいにんてい</h1><p>15問を制限時間90秒以内に全問正解すると合格となる段位認定モードです。10級（1の段）から始まり、級が上がるごとに範囲が広がります。1級は1〜9の段ランダム、その先には初段、二段、三段……と段位が用意されており、最上位は名人・伝説の称号が待っています。</p><p>合格するとずかんに「○の段の印」が記録され、おうこくのなかまの生産力が×2にアップします。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
  {
    slug: 'battle',
    title: '九九バトル | 九九おうこく',
    description: '30秒で敵HPに一致する2枚カードの組み合わせを選んで撃破。コンボでメダル獲得。基本3＋でんせつ2の全5ステージ。',
    ogType: 'article', changefreq: 'monthly', priority: '0.7',
    breadcrumbName: 'バトル',
    fallbackHtml: `<h1>九九バトル</h1><p>30秒のあいだ、ならんだカード（5〜7枚）から2枚を選び、その積が敵のHPと一致したら撃破できるカードバトルモードです。連続撃破でコンボが増え、20体撃破で「勇気の大剣」メダル、100体で「伝説の王者」メダルがもらえます。10級合格で「はじまりの草原」、7級合格で「しずかな森」、4級合格で「ゴツゴツ洞窟」が解放されます。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
  {
    slug: 'tower',
    title: '九九のタワー | 九九おうこく',
    description: '30秒で解いた答えの合計だけタワーが伸びる。100mで雲の上、300mで成層圏、1000mで宇宙、2000mで深宇宙へ。',
    ogType: 'article', changefreq: 'monthly', priority: '0.7',
    breadcrumbName: 'タワー',
    fallbackHtml: `<h1>九九のタワー</h1><p>30秒間、問題を解くたびに答えの数字だけタワーが高くなるタイムアタックモードです。100mで雲の上、300mで成層圏、1000mで宇宙、2000mで深宇宙の背景に変化します。300m到達で「知恵の原石」メダル、1000m到達で「光の剣」メダル。9級合格で「そよ風の塔」、6級合格で「雲海の見張り塔」、3級合格で「迅雷の尖塔」が解放されます。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
  {
    slug: 'blank',
    title: 'くもくも（あなあき九九） | 九九おうこく',
    description: '「？×4=12」のような穴あき問題を10問解く逆引きクイズ。九九を「答えから引く」力が鍛えられる。',
    ogType: 'article', changefreq: 'monthly', priority: '0.7',
    breadcrumbName: 'くもくも',
    fallbackHtml: `<h1>くもくも（あなあき九九）</h1><p>「？ × 4 = 12」のような穴あき問題を10問解く逆引きクイズです。九九を「答えから逆に引く」力が身につき、わり算の準備運動としても効果的。8級合格で「しんキロウの森」、5級合格で「そらの雲海」、2級合格で「かみなりの山」が解放され、各難易度で金メダル獲得で「魔法の筆」「真実の鏡」「知の羅針盤」がもらえます。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
  {
    slug: 'empire',
    title: 'おうこく | 九九おうこく',
    description: 'KPでなかまを招待し、1秒ごとに自動でKPを稼ぐ放置ゲーム要素。熟練度バッジや祝祭で生産力アップ。',
    ogType: 'article', changefreq: 'weekly', priority: '0.7',
    breadcrumbName: 'おうこく',
    fallbackHtml: `<h1>おうこく</h1><p>知識ポイント(KP)をなかまの招待コストに使って、王国を育てていく放置ゲーム要素のあるモードです。招待したなかまは1秒ごとに自動でKPを集めてくれます。なかまの生産力は、その段の九九を解いた回数（熟練度バッジ：銅・銀・金）、段位認定試験の合格（×2ボーナス）、アタックでクリアした直後の「おうこくの祝祭」（30分間 1.5〜5倍）で強化されます。オフラインの間も最大12時間までKPがたまり続けます。100万KP到達で昇段（プレステージ）が可能になり、KPがリセットされる代わりに全体生産力が×2になります。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
  {
    slug: 'trial',
    title: '暗黒の試練 | 九九おうこく',
    description: 'おうこくの奥に眠るいにしえの門。九九の真の力が試される高難度チャレンジ。',
    ogType: 'article', changefreq: 'monthly', priority: '0.7',
    breadcrumbName: '暗黒の試練',
    fallbackHtml: `<h1>暗黒の試練</h1><p>おうこくを充分に発展させたプレイヤーの前にだけ姿を現す、いにしえの門。九九の真の力が試される高難度チャレンジです。挑戦資格を得るには、まずおうこくでなかまをじっくり集めましょう。</p><p><a href="/kuku-oukoku/empire/">← おうこくへ</a></p>`,
  },
  {
    slug: 'map',
    title: '九九の地図 | 九九おうこく',
    description: '1×1 から 9×9 までの九九をひと目で見渡せる早見表ページ。マスをタップすると読みかたも確認できます。',
    ogType: 'article', changefreq: 'monthly', priority: '0.6',
    breadcrumbName: '九九の地図',
    fallbackHtml: `<h1>九九の地図</h1><p>1×1 から 9×9 までの 81 マスを一覧できる九九の早見表です。マスをタップすると読みかたを確認できます。九九を視覚的に俯瞰したいとき、九九表として印刷代わりに使うのもおすすめです。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
  {
    slug: 'collection',
    title: 'ずかん | 九九おうこく',
    description: '集めた賢者の印・王国の秘宝・挑戦のメダル・探索の証など40種類のコレクション一覧。',
    ogType: 'article', changefreq: 'monthly', priority: '0.6',
    breadcrumbName: 'ずかん',
    fallbackHtml: `<h1>ずかん</h1><p>九九おうこくでは、段位の印20種、王国の秘宝10種、挑戦のメダル4種、探索の証6種の合計40種類のコレクションがあります。条件を達成すると自動的に獲得され、ずかんに記録されます。すべてを集めると「究極の玉座」がもらえます。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
  {
    slug: 'calendar',
    title: 'がくしゅうカレンダー | 九九おうこく',
    description: '毎日の学習履歴とストリーク（連続日数）を確認できるカレンダー。3日連続学習で「時空の時計」メダル獲得。',
    ogType: 'article', changefreq: 'weekly', priority: '0.5',
    breadcrumbName: 'カレンダー',
    fallbackHtml: `<h1>がくしゅうカレンダー</h1><p>毎日の学習履歴とストリーク（連続学習日数）を確認できるモードです。学習した日には花マークが表示されます。3日連続学習すると「時空の時計」のメダルがもらえます。まいにち少しずつでも続けるのが上達のコツです。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
  {
    slug: 'settings',
    title: 'せってい | 九九おうこく',
    description: '学習設定、統計の確認、データのリセット。',
    ogType: 'article', changefreq: 'yearly', priority: '0.3',
    breadcrumbName: 'せってい',
    fallbackHtml: `<h1>せってい</h1><p>学習設定（まなぶモードのヒント表示など）、統計情報の確認、データのリセットが行えます。データはお使いのブラウザの localStorage に保存されているため、ブラウザのデータを削除しても進捗がリセットされます。</p><p><a href="/kuku-oukoku/">← ホーム</a></p>`,
  },
];

function renderPage(p: Page): string {
  const url = `${BASE_URL}/${p.slug ? p.slug + '/' : ''}`;
  let html = baseHtml;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(p.title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeHtml(p.description)}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeHtml(p.title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeHtml(p.description)}" />`
  );
  html = html.replace(
    /<meta property="og:type" content="[^"]*" \/>/,
    `<meta property="og:type" content="${p.ogType}" />`
  );
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${escapeHtml(p.title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${escapeHtml(p.description)}" />`
  );

  // Breadcrumb / Top JSON-LD
  const baseLd = p.slug
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: p.title.split(' | ')[0],
        description: p.description,
        author: PUBLISHER,
        publisher: PUBLISHER,
        inLanguage: 'ja',
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        url,
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${BASE_URL}/`,
        inLanguage: 'ja',
        publisher: PUBLISHER,
      };

  const breadcrumb = p.slug
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: p.breadcrumbName ?? p.title.split(' | ')[0], item: url },
        ],
      }
    : null;

  const jsonLds = [baseLd, ...(breadcrumb ? [breadcrumb] : []), ...(p.extraJsonLd ?? [])];
  const jsonLdScript = jsonLds
    .map((ld) => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
    .join('\n');

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><div style="max-width:720px;margin:0 auto;padding:20px 16px;font-family:'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif;line-height:1.8;color:#1f2937">${p.fallbackHtml}</div></div>\n    ${jsonLdScript}`
  );

  return html;
}

for (const p of PAGES) {
  const outDir = p.slug ? path.join(DIST, p.slug) : DIST;
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), renderPage(p), 'utf-8');
  console.log(`✓ Generated /${p.slug ? p.slug + '/' : ''}`);
}

// Sitemap (every indexable page)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES
  .map(
    (p) =>
      `  <url><loc>${BASE_URL}/${p.slug ? p.slug + '/' : ''}</loc><lastmod>${TODAY}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap, 'utf-8');
console.log(`✓ Generated sitemap.xml (${PAGES.length} URLs)`);

console.log(`\n✓ Prerender complete (${PAGES.length} unique pages with custom meta + content)`);
