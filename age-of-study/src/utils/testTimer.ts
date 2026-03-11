export interface RemainingSecondsInput {
  limitSeconds: number;
  startedAtMs: number;
  nowMs: number;
}

export function calculateRemainingSeconds({
  limitSeconds,
  startedAtMs,
  nowMs,
}: RemainingSecondsInput): number {
  const safeLimit = Math.max(0, Math.floor(limitSeconds));
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  return Math.max(0, safeLimit - elapsedSeconds);
}

export function shouldTriggerOneMinuteWarning(
  prevSeconds: number,
  nextSeconds: number,
): boolean {
  return prevSeconds > 60 && nextSeconds <= 60;
}