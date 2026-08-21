/**
 * ブラウザの SpeechSynthesis API が使えるか。
 * 未対応環境（一部の古いブラウザ等）では false。
 */
export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';
}

/** 九九の読みを声に出す。対応環境でのみ発話し、非対応では何もしない */
export function speak(text: string) {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  } catch { /* ignore */ }
}
