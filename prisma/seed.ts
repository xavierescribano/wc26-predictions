import { PrismaClient, PhaseType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEAMS: { name: string; shortCode: string; group: string; flagEmoji: string }[] = [
  // Group A
  { name: "Mexico", shortCode: "MEX", group: "A", flagEmoji: "🇲🇽" },
  { name: "South Africa", shortCode: "RSA", group: "A", flagEmoji: "🇿🇦" },
  { name: "South Korea", shortCode: "KOR", group: "A", flagEmoji: "🇰🇷" },
  { name: "Czech Republic", shortCode: "CZE", group: "A", flagEmoji: "🇨🇿" },
  // Group B
  { name: "Canada", shortCode: "CAN", group: "B", flagEmoji: "🇨🇦" },
  { name: "Bosnia and Herzegovina", shortCode: "BIH", group: "B", flagEmoji: "🇧🇦" },
  { name: "Qatar", shortCode: "QAT", group: "B", flagEmoji: "🇶🇦" },
  { name: "Switzerland", shortCode: "SUI", group: "B", flagEmoji: "🇨🇭" },
  // Group C
  { name: "Brazil", shortCode: "BRA", group: "C", flagEmoji: "🇧🇷" },
  { name: "Morocco", shortCode: "MAR", group: "C", flagEmoji: "🇲🇦" },
  { name: "Haiti", shortCode: "HAI", group: "C", flagEmoji: "🇭🇹" },
  { name: "Scotland", shortCode: "SCO", group: "C", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  // Group D
  { name: "United States", shortCode: "USA", group: "D", flagEmoji: "🇺🇸" },
  { name: "Paraguay", shortCode: "PAR", group: "D", flagEmoji: "🇵🇾" },
  { name: "Australia", shortCode: "AUS", group: "D", flagEmoji: "🇦🇺" },
  { name: "Turkey", shortCode: "TUR", group: "D", flagEmoji: "🇹🇷" },
  // Group E
  { name: "Germany", shortCode: "GER", group: "E", flagEmoji: "🇩🇪" },
  { name: "Curaçao", shortCode: "CUW", group: "E", flagEmoji: "🇨🇼" },
  { name: "Ivory Coast", shortCode: "CIV", group: "E", flagEmoji: "🇨🇮" },
  { name: "Ecuador", shortCode: "ECU", group: "E", flagEmoji: "🇪🇨" },
  // Group F
  { name: "Netherlands", shortCode: "NED", group: "F", flagEmoji: "🇳🇱" },
  { name: "Japan", shortCode: "JPN", group: "F", flagEmoji: "🇯🇵" },
  { name: "Sweden", shortCode: "SWE", group: "F", flagEmoji: "🇸🇪" },
  { name: "Tunisia", shortCode: "TUN", group: "F", flagEmoji: "🇹🇳" },
  // Group G
  { name: "Belgium", shortCode: "BEL", group: "G", flagEmoji: "🇧🇪" },
  { name: "Egypt", shortCode: "EGY", group: "G", flagEmoji: "🇪🇬" },
  { name: "Iran", shortCode: "IRN", group: "G", flagEmoji: "🇮🇷" },
  { name: "New Zealand", shortCode: "NZL", group: "G", flagEmoji: "🇳🇿" },
  // Group H
  { name: "Spain", shortCode: "ESP", group: "H", flagEmoji: "🇪🇸" },
  { name: "Cape Verde", shortCode: "CPV", group: "H", flagEmoji: "🇨🇻" },
  { name: "Saudi Arabia", shortCode: "KSA", group: "H", flagEmoji: "🇸🇦" },
  { name: "Uruguay", shortCode: "URU", group: "H", flagEmoji: "🇺🇾" },
  // Group I
  { name: "France", shortCode: "FRA", group: "I", flagEmoji: "🇫🇷" },
  { name: "Senegal", shortCode: "SEN", group: "I", flagEmoji: "🇸🇳" },
  { name: "Iraq", shortCode: "IRQ", group: "I", flagEmoji: "🇮🇶" },
  { name: "Norway", shortCode: "NOR", group: "I", flagEmoji: "🇳🇴" },
  // Group J
  { name: "Argentina", shortCode: "ARG", group: "J", flagEmoji: "🇦🇷" },
  { name: "Algeria", shortCode: "ALG", group: "J", flagEmoji: "🇩🇿" },
  { name: "Austria", shortCode: "AUT", group: "J", flagEmoji: "🇦🇹" },
  { name: "Jordan", shortCode: "JOR", group: "J", flagEmoji: "🇯🇴" },
  // Group K
  { name: "Portugal", shortCode: "POR", group: "K", flagEmoji: "🇵🇹" },
  { name: "DR Congo", shortCode: "COD", group: "K", flagEmoji: "🇨🇩" },
  { name: "Uzbekistan", shortCode: "UZB", group: "K", flagEmoji: "🇺🇿" },
  { name: "Colombia", shortCode: "COL", group: "K", flagEmoji: "🇨🇴" },
  // Group L
  { name: "England", shortCode: "ENG", group: "L", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Croatia", shortCode: "CRO", group: "L", flagEmoji: "🇭🇷" },
  { name: "Ghana", shortCode: "GHA", group: "L", flagEmoji: "🇬🇭" },
  { name: "Panama", shortCode: "PAN", group: "L", flagEmoji: "🇵🇦" },
];

const PHASES = [
  { type: PhaseType.GROUP_STAGE, order: 1 },
  { type: PhaseType.ROUND_OF_32, order: 2 },
  { type: PhaseType.ROUND_OF_16, order: 3 },
  { type: PhaseType.QUARTERFINALS, order: 4 },
  { type: PhaseType.SEMIFINALS, order: 5 },
  { type: PhaseType.FINAL, order: 6 },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing teams and dependent data to avoid stale entries
  await prisma.groupResult.deleteMany();
  await prisma.groupPrediction.deleteMany();
  await prisma.knockoutPick.deleteMany();
  await prisma.goldenPick.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  console.log("🗑️  Cleared existing team/match data");

  // Insert teams
  await prisma.team.createMany({ data: TEAMS });
  console.log(`✅ Seeded ${TEAMS.length} teams`);

  // Upsert phases
  for (const phase of PHASES) {
    await prisma.phase.upsert({
      where: { type: phase.type },
      update: {},
      create: phase,
    });
  }
  console.log(`✅ Seeded ${PHASES.length} phases`);

  // Create knockout match stubs
  const phaseMatches: { phaseType: PhaseType; count: number; descFn: (i: number) => string }[] = [
    { phaseType: PhaseType.ROUND_OF_32, count: 16, descFn: (i) => `R32 Match ${i + 1}` },
    { phaseType: PhaseType.ROUND_OF_16, count: 8, descFn: (i) => `R16 Match ${i + 1}` },
    { phaseType: PhaseType.QUARTERFINALS, count: 4, descFn: (i) => `Quarterfinal ${i + 1}` },
    { phaseType: PhaseType.SEMIFINALS, count: 2, descFn: (i) => `Semifinal ${i + 1}` },
    { phaseType: PhaseType.FINAL, count: 1, descFn: () => "World Cup Final" },
  ];

  for (const { phaseType, count, descFn } of phaseMatches) {
    const phase = await prisma.phase.findUnique({ where: { type: phaseType } });
    if (!phase) continue;
    for (let i = 0; i < count; i++) {
      await prisma.match.create({
        data: { phaseId: phase.id, matchNumber: i + 1, description: descFn(i) },
      });
    }
  }
  console.log("✅ Seeded knockout match stubs");

  // Create default admin user if not exists
  const adminEmail = process.env.ADMIN_EMAIL || "admin@wc26.local";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 12);
    await prisma.user.create({
      data: { email: adminEmail, name: "Admin", password: hashed, role: "ADMIN" },
    });
    console.log(`✅ Created admin user: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
