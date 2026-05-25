import { LearningEngine } from './LearningEngine';

let cached: boolean | null = null;

export function vibrate(durationMs: number) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  if (cached === null) {
    const state = LearningEngine.loadState();
    cached = state.settings?.hapticsEnabled !== false;
  }
  if (cached) {
    try { navigator.vibrate(durationMs); } catch { /* ignore */ }
  }
}

export function refreshHapticsSetting() {
  cached = null;
}
