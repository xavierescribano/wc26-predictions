import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Fetch all data in parallel ──────────────────────────────────
  const [users, groupPredictions, knockoutPicks, goldenPicks,
         playerPicks, teamPicks, fights, fightPicks] = await Promise.all([
    prisma.user.findMany({
      where: { role: "PLAYER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.groupPrediction.findMany({
      orderBy: [{ groupLetter: "asc" }, { user: { name: "asc" } }],
      include: {
        user:      { select: { name: true, email: true } },
        position1: { select: { name: true } },
        position2: { select: { name: true } },
        position3: { select: { name: true } },
        position4: { select: { name: true } },
      },
    }),
    prisma.knockoutPick.findMany({
      orderBy: [{ match: { phase: { order: "asc" } } }, { user: { name: "asc" } }],
      include: {
        user:       { select: { name: true, email: true } },
        match: {
          include: {
            phase:    { select: { type: true } },
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } },
          },
        },
        pickedTeam: { select: { name: true } },
      },
    }),
    prisma.goldenPick.findMany({
      orderBy: { user: { name: "asc" } },
      include: {
        user: { select: { name: true, email: true } },
        team: { select: { name: true } },
      },
    }),
    prisma.topScorerPlayerPick.findMany({
      orderBy: { user: { name: "asc" } },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.topScorerTeamPick.findMany({
      orderBy: { user: { name: "asc" } },
      include: {
        user: { select: { name: true, email: true } },
        team: { select: { name: true } },
      },
    }),
    prisma.countriesFight.findMany({
      orderBy: { createdAt: "asc" },
    }),
    prisma.countriesFightPick.findMany({
      orderBy: [{ fight: { createdAt: "asc" } }, { user: { name: "asc" } }],
      include: {
        user:  { select: { name: true, email: true } },
        fight: { select: { title: true, teamAName: true, teamBName: true, resultA: true, resultB: true } },
      },
    }),
  ]);

  // ── Helper: phase label ─────────────────────────────────────────
  const phaseLabel: Record<string, string> = {
    GROUP_STAGE: "Fase de Grupos",
    ROUND_OF_32: "Octavos de Final",
    ROUND_OF_16: "Ronda de 16",
    QUARTERFINALS: "Cuartos de Final",
    SEMIFINALS: "Semifinales",
    FINAL: "Final",
  };

  // ── Sheet 1: Leaderboard / Resumen ──────────────────────────────
  const userMap: Record<string, {
    groupPts: number; knockoutPts: number; goldenPts: number;
    playerPts: number; teamPts: number; fightPts: number;
  }> = {};
  for (const u of users) {
    userMap[u.id] = { groupPts: 0, knockoutPts: 0, goldenPts: 0, playerPts: 0, teamPts: 0, fightPts: 0 };
  }
  for (const g of groupPredictions)  userMap[g.userId]  && (userMap[g.userId].groupPts   += g.pointsEarned   ?? 0);
  for (const k of knockoutPicks)     userMap[k.userId]  && (userMap[k.userId].knockoutPts += k.pointsEarned   ?? 0);
  for (const g of goldenPicks)       userMap[g.userId]  && (userMap[g.userId].goldenPts   += g.pointsEarned   ?? 0);
  for (const p of playerPicks)       userMap[p.userId]  && (userMap[p.userId].playerPts   += p.pointsEarned   ?? 0);
  for (const t of teamPicks)         userMap[t.userId]  && (userMap[t.userId].teamPts      += t.pointsEarned  ?? 0);
  for (const f of fightPicks)        userMap[f.userId]  && (userMap[f.userId].fightPts     += f.pointsEarned  ?? 0);

  const leaderboardRows = users
    .map((u) => {
      const m = userMap[u.id] ?? { groupPts:0, knockoutPts:0, goldenPts:0, playerPts:0, teamPts:0, fightPts:0 };
      const total = m.groupPts + m.knockoutPts + m.goldenPts + m.playerPts + m.teamPts + m.fightPts;
      return { total, u, m };
    })
    .sort((a, b) => b.total - a.total)
    .map(({ total, u, m }, i) => ({
      "Pos.":              i + 1,
      "Jugador":           u.name ?? u.email,
      "Email":             u.email,
      "Grupos (pts)":      m.groupPts,
      "Eliminación (pts)": m.knockoutPts,
      "Golden Pick (pts)": m.goldenPts,
      "Máx. Goleador (pts)": m.playerPts,
      "Equipo Goleador (pts)": m.teamPts,
      "Countries Fight (pts)": m.fightPts,
      "TOTAL":             total,
    }));

  // ── Sheet 2: Group Stage Predictions ────────────────────────────
  const groupRows = groupPredictions.map((g) => ({
    "Jugador":   g.user.name ?? g.user.email,
    "Grupo":     g.groupLetter,
    "1.º":       g.position1.name,
    "2.º":       g.position2.name,
    "3.º":       g.position3.name,
    "4.º":       g.position4.name,
    "Puntos":    g.pointsEarned ?? "—",
  }));

  // ── Sheet 3: Knockout Picks ──────────────────────────────────────
  const knockoutRows = knockoutPicks.map((k) => ({
    "Jugador":  k.user.name ?? k.user.email,
    "Fase":     phaseLabel[k.match.phase.type] ?? k.match.phase.type,
    "Partido":  `${k.match.homeTeam?.name ?? "TBD"} vs ${k.match.awayTeam?.name ?? "TBD"}`,
    "Apuesta":  k.pickedTeam.name,
    "Correcto": k.isCorrect === true ? "✓" : k.isCorrect === false ? "✗" : "—",
    "Puntos":   k.pointsEarned ?? "—",
  }));

  // ── Sheet 4: Golden Pick ─────────────────────────────────────────
  const goldenRows = goldenPicks.map((g) => ({
    "Jugador":  g.user.name ?? g.user.email,
    "Equipo":   g.team.name,
    "Cambios":  g.changes,
    "Correcto": g.isCorrect === true ? "✓" : g.isCorrect === false ? "✗" : "—",
    "Puntos":   g.pointsEarned ?? "—",
  }));

  // ── Sheet 5: Special Picks ───────────────────────────────────────
  const specialPlayerRows = playerPicks.map((p) => ({
    "Tipo":     "Jugador Goleador",
    "Jugador":  p.user.name ?? p.user.email,
    "Apuesta":  p.playerName,
    "Correcto": p.isCorrect === true ? "✓" : p.isCorrect === false ? "✗" : "—",
    "Puntos":   p.pointsEarned ?? "—",
  }));
  const specialTeamRows = teamPicks.map((t) => ({
    "Tipo":     "Equipo Goleador",
    "Jugador":  t.user.name ?? t.user.email,
    "Apuesta":  t.team.name,
    "Correcto": t.isCorrect === true ? "✓" : t.isCorrect === false ? "✗" : "—",
    "Puntos":   t.pointsEarned ?? "—",
  }));
  const specialRows = [...specialPlayerRows, ...specialTeamRows];

  // ── Sheet 6: Countries Fight ─────────────────────────────────────
  const fightRows = fightPicks.map((f) => ({
    "Duelo":        f.fight.title,
    "Equipo A":     f.fight.teamAName,
    "Equipo B":     f.fight.teamBName,
    "Jugador":      f.user.name ?? f.user.email,
    "Goles A":      f.goalsA,
    "Goles B":      f.goalsB,
    "Resultado A":  f.fight.resultA ?? "—",
    "Resultado B":  f.fight.resultB ?? "—",
    "Correcto":     f.isCorrect === true ? "✓" : f.isCorrect === false ? "✗" : "—",
    "Puntos":       f.pointsEarned ?? "—",
  }));

  // ── Build workbook ───────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  function addSheet(name: string, data: Record<string, unknown>[]) {
    const ws = XLSX.utils.json_to_sheet(data.length ? data : [{}]);
    // Column widths
    const cols = data.length ? Object.keys(data[0]).map((k) => ({ wch: Math.max(k.length, 14) })) : [];
    ws["!cols"] = cols;
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  addSheet("🏆 Clasificación", leaderboardRows as any);
  addSheet("🏟️ Grupos", groupRows as any);
  addSheet("⚽ Eliminación", knockoutRows as any);
  addSheet("🥇 Golden Pick", goldenRows as any);
  addSheet("⭐ Especiales", specialRows as any);
  addSheet("⚔️ Countries Fight", fightRows as any);

  // ── Stream as .xlsx ──────────────────────────────────────────────
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="WC26_backup_${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
