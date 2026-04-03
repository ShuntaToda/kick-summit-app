export type ActionState = { success: boolean; error?: string; timestamp?: number };

export function ts(): number {
  return Date.now();
}

export function str(fd: FormData, key: string): string {
  return (fd.get(key) as string) ?? "";
}

export function strOrNull(fd: FormData, key: string): string | null {
  const v = fd.get(key) as string | null;
  return v || null;
}

export function json(fd: FormData, key: string): unknown {
  return JSON.parse(str(fd, key));
}
