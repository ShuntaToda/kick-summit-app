let _mockNow: number | null = null;
const _listeners = new Set<() => void>();

export function getNow(): number {
  if (_mockNow !== null) return _mockNow;
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_MOCK_NOW
  ) {
    return new Date(process.env.NEXT_PUBLIC_MOCK_NOW).getTime();
  }
  return Date.now();
}

export function setMockNow(timestamp: number | null): void {
  _mockNow = timestamp;
  _listeners.forEach((l) => l());
}

export function getMockNow(): number | null {
  return _mockNow;
}

export function onNowChange(listener: () => void): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}
