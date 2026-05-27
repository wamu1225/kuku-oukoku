/**
 * 端末・ブラウザが navigator.vibrate を実装しているか。
 * iOS Safari など未対応では false。
 */
function hapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

function safeVibrate(pattern: number | number[]) {
  if (!hapticsSupported()) return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}

/** 正解時の短い振動 (15ms)。対応端末でのみ自動発動 */
export function vibrateCorrect() {
  safeVibrate(15);
}

/** 不正解時の振動 (60-40-60 パターン)。対応端末でのみ自動発動 */
export function vibrateWrong() {
  safeVibrate([60, 40, 60]);
}

/** 後方互換：旧 API。今は使われていない */
export function vibrate(durationMs: number) {
  safeVibrate(durationMs);
}
