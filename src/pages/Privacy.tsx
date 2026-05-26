import { navigate } from '../App';

export function Privacy() {
  return (
    <div className="screen content-page">
      <h1 className="screen-title">プライバシーポリシー</h1>

      <p>
        本サイト「九九おうこく」（以下「当サイト」）における、ユーザーの個人情報・利用情報の取り扱い方針をここに定めます。
      </p>

      <h2>1. 学習データの保存場所</h2>
      <p>
        当サイトの学習進捗（解いた問題、KP、なかま、段位など）はすべて、お使いのブラウザの
        localStorage に保存されます。当サイト側のサーバには送信されず、外部に共有されることもありません。
        ブラウザのデータを削除すると、進捗もリセットされる点にご注意ください。
      </p>

      <h2>2. アクセス解析（Google Analytics）</h2>
      <p>
        当サイトは Google Analytics 4 を使用してアクセス状況を把握しています。
        Google Analytics は Cookie を用いて、個人を特定しない形でデータを収集します。
        収集される情報は、ページビュー数・滞在時間・端末種別など、サイト改善の目的のみに使われます。
      </p>
      <p>
        Google による情報収集を停止したい場合は、ブラウザの Cookie 設定や
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google アナリティクス オプトアウト アドオン</a>
        をご利用ください。
      </p>

      <h2>3. 広告配信（Google AdSense）</h2>
      <p>
        当サイトは Google AdSense による広告を配信する場合があります。
        Google を含む第三者配信事業者は、Cookie を使用して、過去のアクセス情報をもとに広告を配信します。
      </p>
      <p>
        パーソナライズド広告は、
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google 広告設定</a>
        で無効化できます。
      </p>

      <h2>4. 個人情報の取得</h2>
      <p>
        当サイトでは、お問い合わせやアカウント登録など、個人情報を直接取得する機能を提供していません。
        将来的にそのような機能を追加する場合は、本ポリシーを更新した上で明示的な同意を求めます。
      </p>

      <h2>5. 免責事項</h2>
      <p>
        当サイトのコンテンツは学習支援を目的としていますが、内容の正確性・完全性については保証しません。
        当サイトの利用によって生じた損害について、運営者は責任を負いかねます。
      </p>

      <h2>6. ポリシーの変更</h2>
      <p>
        本ポリシーは、必要に応じて予告なく変更される場合があります。
        変更時にはこのページに最新の内容を掲示します。
      </p>

      <h2>7. 問い合わせ先</h2>
      <p>
        本ポリシーに関するお問い合わせは、サイト運営者まで <a href="https://study-apps.com/">study-apps.com</a> 経由でお願いいたします。
      </p>

      <p className="updated">最終更新日：2026年5月25日</p>

      <h2>次におすすめ</h2>
      <ul>
        <li><a href="/kuku-oukoku/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>ホームへ</a></li>
        <li><a href="/kuku-oukoku/guide/" onClick={(e) => { e.preventDefault(); navigate('/guide/'); }}>あそびかたガイド</a></li>
        <li><a href="/kuku-oukoku/about/" onClick={(e) => { e.preventDefault(); navigate('/about/'); }}>このサイトについて</a></li>
      </ul>

      <div className="cta-row">
        <button className="btn-primary" onClick={() => navigate('/')}>ホームへ</button>
      </div>
    </div>
  );
}
