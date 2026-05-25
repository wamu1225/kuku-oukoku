import * as fs from 'fs';
import * as path from 'path';

const DIST = path.resolve(process.cwd(), 'dist');
const BASE_URL = 'https://study-apps.com/kuku-oukoku';
const TODAY = new Date().toISOString().split('T')[0];

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
  noindex?: boolean;
  extraJsonLd?: object[];
}

const PAGES: Page[] = [
  {
    slug: '',
    title: '九九おうこく | 九九を解くと王国が広がる学習ゲーム',
    description:
      '小学2年生向けの九九学習ゲーム。問題を解くたびにKP（知識ポイント）がたまり、なかまが集まり、おうこくが大きくなる。広告なし・追加課金なしの安心設計。',
    ogType: 'website',
    changefreq: 'weekly',
    priority: '1.0',
    fallbackHtml: `
<h1>九九おうこく</h1>
<p>九九おうこくは、小学2年生から楽しめる九九の学習ゲームです。「まなぶ」モードで1の段から練習を始めると、しだいに新しいモードが開放されていきます。解いた問題はすべて知識ポイント(KP)になり、KPで「なかま」を招待すると、そのなかまが自動的にもっとKPを集めてくれます。広告も追加課金もない、安心して遊べる作りです。</p>
<h2>主なモード</h2>
<ul>
  <li><strong>まなぶ</strong>：九九を1の段から順に練習</li>
  <li><strong>アタック</strong>：タイムを競って金メダルを目指す</li>
  <li><strong>だんいにんてい</strong>：15問を90秒以内で解いて昇段</li>
  <li><strong>おうこく</strong>：KPでなかまを招待して王国を発展させる放置要素</li>
  <li><strong>バトル</strong>：2枚のカードで敵HPを撃破する30秒チャレンジ</li>
  <li><strong>タワー</strong>：30秒で解いた答えの合計分だけタワーが高くなる</li>
  <li><strong>くもくも</strong>：「？×4=12」のような穴あき九九を10問</li>
  <li><strong>ずかん</strong>：集めた印・宝物・メダル一覧</li>
  <li><strong>カレンダー</strong>：学習履歴とストリーク</li>
</ul>
<p><a href="/kuku-oukoku/guide/">あそびかたを詳しく見る →</a></p>`,
    extraJsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: '九九おうこく',
        url: `${BASE_URL}/`,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web Browser',
        inLanguage: 'ja',
        description:
          '九九を解くと王国が広がる、小学2年生向けの算数学習ゲーム。広告なし・追加課金なし。',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
        audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
      },
    ],
  },
  {
    slug: 'guide',
    title: 'あそびかた | 九九おうこく',
    description:
      '九九おうこくの遊び方ガイド。まなぶ・アタック・だんいにんてい・おうこくの各モードの使い方と上達のコツを紹介。',
    ogType: 'article',
    changefreq: 'monthly',
    priority: '0.8',
    fallbackHtml: `
<h1>あそびかた</h1>
<p>九九おうこくは、九九を解くたびに「知識ポイント (KP)」がたまり、なかまが集まり、王国が大きくなっていく小学生向けの学習ゲームです。ここでは初めて遊ぶ人向けに、ゲームの流れと各モードのコツを紹介します。</p>
<h2>1. まずは「まなぶ」から</h2>
<p>ホーム画面から「まなぶ」を選び、1の段から順番に練習しましょう。最初は答えが見える状態で九九を確認できます。「もんだいをといてみる」ボタンを押すと、実際に答えを入力するクイズが始まります。9問すべて正解すると、その段はクリア。100 KPとはなまるスタンプを1個ゲットできます。最初に1の段をクリアすると「アタック」モードが解放されます。</p>
<h2>2. 「アタック」でタイムにちょうせん</h2>
<p>9問をできるだけ速く解いてゴールタイムを縮めるモードです。3秒のカウントダウンの後、ランダムな順番で問題が出題されます。15秒以内で金メダル、25秒以内で銀メダル、40秒以内で銅メダル。1の段のアタックをクリアすると、「だんいにんてい」と「おうこく」が解放されます。</p>
<h2>3. 「だんいにんてい」で昇段</h2>
<p>段位認定試験は、15問を制限時間90秒以内に全問正解すると合格となるモードです。10級（1の段）から始まり、級が上がるごとに出題範囲が広がっていきます。合格すると、その段のメダルがずかんに記録され、なかまの生産力にもボーナスが付きます。</p>
<h2>4. 「おうこく」でなかまを集める</h2>
<p>おうこくは、KPをなかまの招待コストに使って、王国を育てていく放置ゲーム要素のあるモードです。招待したなかまは1秒ごとに自動でKPを集めてくれます。なかまの生産力は、九九を解いた回数（熟練度バッジ）や段位試験の合格、アタック直後の「おうこくの祝祭」（30分間 1.5〜5倍）で強化されます。オフラインの間も最大12時間までKPがたまり続けます。</p>
<h2>5. 「バトル」「タワー」「くもくも」</h2>
<p>段位試験に合格していくと、3種類の対戦・タイムアタック型モードがアンロックされます。バトルは30秒のあいだに敵HPに一致する2枚のカードを選んで撃破。タワーは30秒で解いた答えの合計だけ高さが伸びていきます（100mで雲の上、300mで成層圏、1000mで宇宙）。くもくもは「？×4=12」のような穴あき九九を10問解く逆引きクイズです。</p>
<h2>6. 「ずかん」で集めた証を確認</h2>
<p>段位の印・王国の秘宝・挑戦のメダル・探索の証など、さまざまな項目を集める要素があります。条件を達成すると自動的に獲得され、ずかんに記録されます。</p>
<h2>続けるコツ</h2>
<p>まいにち少しずつ続けるほど、なかまの熟練度バッジが上がり、王国の発展も加速していきます。カレンダー画面では学習した日が記録されるので、連続日数を伸ばしていきましょう。3日間続けると「時空の時計」のメダルもゲットできます。</p>`,
  },
  {
    slug: 'about',
    title: 'このサイトについて | 九九おうこく',
    description:
      '九九おうこくのコンセプトと運営方針、動作環境について。広告なし・追加課金なし・データはブラウザ内に保存。',
    ogType: 'article',
    changefreq: 'monthly',
    priority: '0.6',
    fallbackHtml: `
<h1>このサイトについて</h1>
<p>「九九おうこく」は、小学2年生の九九学習を、楽しく続けられるようにデザインされた無料のブラウザ向け学習ゲームです。広告は控えめで、追加課金もないため、お子さんが安心して遊べる環境を提供します。</p>
<h2>コンセプト</h2>
<p>「九九を解くたびに、王国が広がる」がコアアイデアです。解いた問題はすべて知識ポイント (KP) に変わり、なかまを呼ぶことで、さらに自動でKPがたまる仕組みになっています。学習の成果が、ただの数字ではなく「自分の王国」として可視化されるので、モチベーションが続きやすい設計です。</p>
<h2>3つの方針</h2>
<ul>
<li><strong>学習を最優先</strong>：ゲーム要素はあくまで学習のモチベーションを上げるためのもの。</li>
<li><strong>安心・安全</strong>：広告は最小限。追加課金や個人情報を求める機能はありません。学習データはお使いの端末のブラウザ内に保存されます。</li>
<li><strong>段階的な解放</strong>：学習の進捗に応じて新しいモードが現れます。</li>
</ul>
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
    fallbackHtml: `
<h1>プライバシーポリシー</h1>
<p>本サイト「九九おうこく」（以下「当サイト」）における、ユーザーの個人情報・利用情報の取り扱い方針をここに定めます。</p>
<h2>1. 学習データの保存場所</h2>
<p>当サイトの学習進捗（解いた問題、KP、なかま、段位など）はすべて、お使いのブラウザのlocalStorageに保存されます。当サイト側のサーバには送信されず、外部に共有されることもありません。</p>
<h2>2. アクセス解析（Google Analytics）</h2>
<p>当サイトはGoogle Analytics 4を使用してアクセス状況を把握しています。Google Analyticsは個人を特定しない形でデータを収集します。</p>
<h2>3. 広告配信（Google AdSense）</h2>
<p>当サイトはGoogle AdSenseによる広告を配信する場合があります。Googleを含む第三者配信事業者は、Cookieを使用して過去のアクセス情報をもとに広告を配信します。パーソナライズド広告はGoogle広告設定で無効化できます。</p>
<h2>4. 個人情報の取得</h2>
<p>当サイトでは、お問い合わせやアカウント登録など、個人情報を直接取得する機能を提供していません。</p>
<h2>5. 免責事項</h2>
<p>当サイトのコンテンツは学習支援を目的としていますが、内容の正確性・完全性については保証しません。</p>`,
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

  if (p.noindex) {
    html = html.replace(/<head>/, `<head>\n    <meta name="robots" content="noindex, follow" />`);
  }

  // Insert fallback content + JSON-LD
  const breadcrumb = p.slug
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ホーム', item: `${BASE_URL}/` },
          { '@type': 'ListItem', position: 2, name: p.title.split(' | ')[0], item: url },
        ],
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '九九おうこく',
        url: `${BASE_URL}/`,
        inLanguage: 'ja',
      };

  const jsonLds = [breadcrumb, ...(p.extraJsonLd ?? [])];
  const jsonLdScript = jsonLds
    .map((ld) => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
    .join('\n');

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><div style="max-width:720px;margin:0 auto;padding:20px 16px;font-family:'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif;line-height:1.8;color:#1f2937">${p.fallbackHtml}</div></div>\n    ${jsonLdScript}`
  );

  return html;
}

// Write each page
for (const p of PAGES) {
  const outDir = p.slug ? path.join(DIST, p.slug) : DIST;
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), renderPage(p), 'utf-8');
  console.log(`✓ Generated /${p.slug ? p.slug + '/' : ''}`);
}

// Interactive routes — render with default meta (no fallback content needed for SEO; they require JS).
const INTERACTIVE_ROUTES = [
  'learn',
  'attack',
  'dan',
  'battle',
  'tower',
  'blank',
  'empire',
  'collection',
  'calendar',
  'settings',
];
for (const r of INTERACTIVE_ROUTES) {
  const outDir = path.join(DIST, r);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), baseHtml, 'utf-8');
  console.log(`✓ Generated /${r}/ (interactive)`);
}

// Sitemap
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.filter((p) => !p.noindex)
  .map(
    (p) =>
      `  <url><loc>${BASE_URL}/${p.slug ? p.slug + '/' : ''}</loc><lastmod>${TODAY}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap, 'utf-8');
console.log(`✓ Generated sitemap.xml`);

console.log(`\n✓ Prerender complete (${PAGES.length} static + ${INTERACTIVE_ROUTES.length} interactive)`);
