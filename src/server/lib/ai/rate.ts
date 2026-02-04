type BreakerState = { failures: number; openedAt?: number };

const breakers: Record<string, BreakerState> = {};

export function isOpen(provider: string): boolean {
  const b = breakers[provider];
  if (!b) return false;
  if (b.openedAt && Date.now() - b.openedAt < 5 * 60 * 1000) return true; // 5 minutes
  return false;
}

export function reportFailure(provider: string, status?: number) {
  const b = (breakers[provider] ||= { failures: 0 });
  b.failures += 1;
  if (status && (status === 429 || status >= 500)) {
    if (b.failures >= 3) b.openedAt = Date.now();
  }
}

export function reportSuccess(provider: string) {
  breakers[provider] = { failures: 0, openedAt: undefined };
}

export function getBreakerSnapshot() {
  return breakers;
}