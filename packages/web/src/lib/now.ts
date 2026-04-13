export function getNow(): number {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_MOCK_NOW
  ) {
    return new Date(process.env.NEXT_PUBLIC_MOCK_NOW).getTime();
  }
  return Date.now();
}
