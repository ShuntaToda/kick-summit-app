export function buildEventUrl(path: string, eventId?: string): string {
  if (!eventId || eventId === "default") return path;
  return `${path}?id=${encodeURIComponent(eventId)}`;
}

export function eventIdSuffix(eventId?: string): string {
  if (!eventId || eventId === "default") return "";
  return `?id=${encodeURIComponent(eventId)}`;
}
