import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
    <linearGradient id="crown" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(820, 130) scale(2)">
    <path d="M14 38 L18 22 L26 32 L32 18 L38 32 L46 22 L50 38 Z" fill="url(#crown)" stroke="#92400e" stroke-width="2" stroke-linejoin="round"/>
    <rect x="14" y="38" width="36" height="10" rx="2" fill="url(#crown)" stroke="#92400e" stroke-width="2"/>
    <circle cx="32" cy="43" r="3" fill="#ef4444"/>
  </g>
  <text x="80" y="220" font-family="'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" font-size="92" font-weight="900" fill="#fff">九九おうこく</text>
  <text x="80" y="310" font-family="'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" font-size="36" font-weight="700" fill="#fde047">九九を解くと、王国が広がる ✨</text>
  <text x="80" y="400" font-family="'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" font-size="22" fill="rgba(255,255,255,0.85)">小学2年生向けの九九学習ゲーム</text>
  <text x="80" y="434" font-family="'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" font-size="22" fill="rgba(255,255,255,0.85)">広告なし・追加課金なし・登録不要</text>
  <line x1="80" y1="510" x2="700" y2="510" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
  <text x="80" y="560" font-family="'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" font-size="22" fill="#fde047" font-weight="700">study-apps.com/kuku-oukoku/</text>
</svg>`;

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const outPath = path.join(PUBLIC_DIR, 'ogp.png');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✓ Generated ogp.png (1200x630) at ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
