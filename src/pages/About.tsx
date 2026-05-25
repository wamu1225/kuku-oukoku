import { navigate } from '../App';

export function About() {
  return (
    <div className="screen content-page">
      <h1 className="screen-title">このサイトについて</h1>

      <p>
        「九九おうこく」は、小学2年生の九九学習を、楽しく続けられるようにデザインされた
        無料のブラウザ向け学習ゲームです。広告は控えめで、追加課金もないため、
        お子さんが安心して遊べる環境を提供します。
      </p>

      <h2>コンセプト</h2>
      <p>
        「九九を解くたびに、王国が広がる」がコアアイデアです。
        解いた問題はすべて知識ポイント (KP) に変わり、なかまを呼ぶことで、
        さらに自動で KP がたまる仕組みになっています。
        学習の成果が、ただの数字ではなく「自分の王国」として可視化されるので、
        モチベーションが続きやすい設計です。
      </p>

      <h2>3つの方針</h2>
      <ul>
        <li>
          <strong>学習を最優先</strong>：ゲーム要素はあくまで学習のモチベーションを上げるためのもの。
          演出が学習の邪魔にならないようバランスを取っています。
        </li>
        <li>
          <strong>安心・安全</strong>：広告は最小限。追加課金や個人情報を求める機能はありません。
          学習データはすべて、お使いの端末のブラウザ内に保存されます（サーバには送信しません）。
        </li>
        <li>
          <strong>段階的な解放</strong>：いきなりすべての機能を解放するのではなく、
          学習の進捗に応じて新しいモードが現れます。これにより、達成感を継続的に得られます。
        </li>
      </ul>

      <h2>こんな人におすすめ</h2>
      <ul>
        <li>九九を覚えるのが「つらい」「つまらない」と感じるお子さん</li>
        <li>九九を一通り覚えた後、もっと早く解けるように練習したい人</li>
        <li>ゲーム性のある学習で集中力を続けたい家族</li>
      </ul>

      <h2>動作環境</h2>
      <p>
        最新の Chrome、Safari、Edge、Firefox などのモダンブラウザで動作します。
        スマートフォン・タブレット・PC のどれでも遊べます。
        インストールは不要で、ブラウザでアクセスするだけですぐに始められます。
      </p>

      <h2>運営について</h2>
      <p>
        「九九おうこく」は study-apps.com の学習サイト群の一つとして、個人開発で運営されています。
        ご意見・ご要望はサイト下部の問い合わせ先まで。
      </p>

      <h2>次におすすめ</h2>
      <ul>
        <li><a href="/kuku-oukoku/guide/" onClick={(e) => { e.preventDefault(); navigate('/guide/'); }}>あそびかたガイドを読む</a></li>
        <li><a href="/kuku-oukoku/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>「まなぶ」モードをはじめる</a></li>
        <li><a href="/kuku-oukoku/privacy/" onClick={(e) => { e.preventDefault(); navigate('/privacy/'); }}>プライバシーポリシー</a></li>
      </ul>

      <div className="cta-row">
        <button className="btn-primary" onClick={() => navigate('/')}>ホームへ戻る</button>
        <button className="btn-secondary" onClick={() => navigate('/privacy/')}>プライバシーポリシー</button>
      </div>
    </div>
  );
}
