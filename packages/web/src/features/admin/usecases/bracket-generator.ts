export function calcBracketSize(teamCount: number): number {
  return teamCount >= 2 ? Math.pow(2, Math.ceil(Math.log2(teamCount))) : 0;
}

export function calcTotalRounds(bracketSize: number): number {
  return bracketSize >= 2 ? Math.ceil(Math.log2(bracketSize)) : 0;
}

export function buildRoundLabels(totalRounds: number): string[] {
  const labels: string[] = [];
  for (let r = 1; r <= totalRounds; r++) {
    if (r === totalRounds && totalRounds >= 2) labels.push("決勝");
    else if (r === totalRounds - 1 && totalRounds >= 3) labels.push("準決勝");
    else labels.push(`${r}回戦`);
  }
  return labels;
}
