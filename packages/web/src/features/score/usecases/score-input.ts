export function normalizeScoreInput(raw: string): string {
  const digitsOnly = raw.replace(/[^0-9]/g, "").slice(0, 2);
  if (digitsOnly === "") return "";
  const withoutLeadingZeros = digitsOnly.replace(/^0+/, "");
  return withoutLeadingZeros === "" ? "0" : withoutLeadingZeros;
}
