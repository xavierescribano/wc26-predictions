// Group Stage: +1 per correct position, +1 bonus if all 4 correct (max 5 per group)
export function calcGroupPoints(
  predicted: string[], // [pos1Id, pos2Id, pos3Id, pos4Id]
  actual: string[]     // [pos1Id, pos2Id, pos3Id, pos4Id]
): number {
  let pts = 0;
  for (let i = 0; i < 4; i++) {
    if (predicted[i] === actual[i]) pts += 1;
  }
  if (pts === 4) pts += 1; // bonus
  return pts;
}

// Knockout: +1 per correct pick
// Bonus: +5 if ALL picks in the round are correct (handled at round-level)
export function calcKnockoutPoints(pickedTeamId: string, winnerId: string | null): number {
  if (!winnerId) return 0;
  return pickedTeamId === winnerId ? 1 : 0;
}

// Final: +25 if correct winner
export function calcFinalPoints(pickedTeamId: string, winnerId: string | null): number {
  if (!winnerId) return 0;
  return pickedTeamId === winnerId ? 25 : 0;
}

// Golden Pick: 50 - (changes * 10), floor 0
export function calcGoldenPickPoints(isCorrect: boolean, changes: number): number {
  if (!isCorrect) return 0;
  return Math.max(0, 50 - changes * 10);
}

export const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  ROUND_OF_32: "Round of 32",
  ROUND_OF_16: "Round of 16",
  QUARTERFINALS: "Quarterfinals",
  SEMIFINALS: "Semifinals",
  FINAL: "Final",
};
