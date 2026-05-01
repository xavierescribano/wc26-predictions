import { PrismaClient, PhaseType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEAMS: { name: string; shortCode: string; group: string; flagEmoji: string }[] = [
  // Group A
  { name: "Spain", shortCode: "ESP", group: "A", flagEmoji: "🇪🇸" },
  { name: "United States", shortCode: "USA", group: "A", flagEmoji: "🇺🇸" },
  { name: "Argentina", shortCode: "ARG", group: "A", flagEmoji: "🇦🇷" },
  { name: "Morocco", shortCode: "MAR", group: "A", flagEmoji: "🇲🇦" },
  // Group B
  { name: "France", shortCode: "FRA", group: "B", flagEmoji: "🇫🇷" },
  { name: "Mexico", shortCode: "MEX", group: "B", flagEmoji: "🇲🇽" },
  { name: "South Korea", shortCode: "KOR", group: "B", flagEmoji: "🇰🇷" },
  { name: "DR Congo", shortCode: "COD", group: "B", flagEmoji: "🇨🇩" },
  // Group C
  { name: "England", shortCode: "ENG", group: "C", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Canada", shortCode: "CAN", group: "C", flagEmoji: "🇨🇦" },
  { name: "Saudi Arabia", shortCode: "KSA", group: "C", flagEmoji: "🇸🇦" },
  { name: "South Africa", shortCode: "RSA", group: "C", flagEmoji: "🇿🇦" },
  // Group D
  { name: "Germany", shortCode: "GER", group: "D", flagEmoji: "🇩🇪" },
  { name: "Brazil", shortCode: "BRA", group: "D", flagEmoji: "🇧🇷" },
  { name: "Japan", shortCode: "JPN", group: "D", flagEmoji: "🇯🇵" },
  { name: "Tunisia", shortCode: "TUN", group: "D", flagEmoji: "🇹🇳" },
  // Group E
  { name: "Portugal", shortCode: "POR", group: "E", flagEmoji: "🇵🇹" },
  { name: "Uruguay", shortCode: "URU", group: "E", flagEmoji: "🇺🇾" },
  { name: "Senegal", shortCode: "SEN", group: "E", flagEmoji: "🇸🇳" },
  { name: "Jamaica", shortCode: "JAM", group: "E", flagEmoji: "🇯🇲" },
  // Group F
  { name: "Netherlands", shortCode: "NED", group: "F", flagEmoji: "🇳🇱" },
  { name: "Colombia", shortCode: "COL", group: "F", flagEmoji: "🇨🇴" },
  { name: "Egypt", shortCode: "EGY", group: "F", flagEmoji: "🇪🇬" },
  { name: "Australia", shortCode: "AUS", group: "F", flagEmoji: "🇦🇺" },
  // Group G
  { name: "Italy", shortCode: "ITA", group: "G", flagEmoji: "🇮🇹" },
  { name: "Ecuador", shortCode: "ECU", group: "G", flagEmoji: "🇪🇨" },
  { name: "Nigeria", shortCode: "NGA", group: "G", flagEmoji: "🇳🇬" },
  { name: "Jordan", shortCode: "JOR", group: "G", flagEmoji: "🇯🇴" },
  // Group H
  { name: "Belgium", shortCode: "BEL", group: "H", flagEmoji: "🇧🇪" },
  { name: "Switzerland", shortCode: "SUI", group: "H", flagEmoji: "🇨🇭" },
  { name: "Iran", shortCode: "IRN", group: "H", flagEmoji: "🇮🇷" },
  { name: "New Zealand", shortCode: "NZL", group: "H", flagEmoji: "🇳🇿" },
  // Group I
  { name: "Denmark", shortCode: "DEN", group: "I", flagEmoji: "🇩🇰" },
  { name: "Croatia", shortCode: "CRO", group: "I", flagEmoji: "🇭🇷" },
  { name: "Venezuela", shortCode: "VEN", group: "I", flagEmoji: "🇻🇪" },
  { name: "Cameroon", shortCode: "CMR", group: "I", flagEmoji: "🇨🇲" },
  // Group J
  { name: "Serbia", shortCode: "SRB", group: "J", flagEmoji: "🇷🇸" },
  { name: "Slovakia", shortCode: "SVK", group: "J", flagEmoji: "🇸🇰" },
  { name: "Panama", shortCode: "PAN", group: "J", flagEmoji: "🇵🇦" },
  { name: "Iraq", shortCode: "IRQ", group: "J", flagEmoji: "🇮🇶" },
  // Group K
  { name: "Austria", shortCode: "AUT", group: "K", flagEmoji: "🇦🇹" },
  { name: "Belgium B", shortCode: "HON", group: "K", flagEmoji: "🇭🇳" },
  { name: "New Zea", shortCode: "IDN", group: "K", flagEmoji: "🇮🇩" },
  { name: "Honduras", shortCode: "HON2", group: "K", flagEmoji: "🇭🇳" },
  // Group L
  { name: "Turkey", shortCode: "TUR", group: "L", flagEmoji: "🇹🇷" },
  { name: "Romania", shortCode: "ROU", group: "L", flagEmoji: "🇷🇴" },
  { name: "Uzbekistan", shortCode: "UZB", group: "L", flagEmoji: "🇺🇿" },
  { name: "Costa Rica", shortCode: "CRC", group: "L", flagEmoji: "🇨🇷" },
];

// Clean version with no duplicates
const TEAMS_CLEAN: { name: string; shortCode: string; group: string; flagEmoji: string }[] = [
  // Group A
  { name: "Spain", shortCode: "ESP", group: "A", flagEmoji: "🇪🇸" },
  { name: "United States", shortCode: "USA", group: "A", flagEmoji: "🇺🇸" },
  { name: "Argentina", shortCode: "ARG", group: "A", flagEmoji: "🇦🇷" },
  { name: "Morocco", shortCode: "MAR", group: "A", flagEmoji: "🇲🇦" },
  // Group B
  { name: "France", shortCode: "FRA", group: "B", flagEmoji: "🇫🇷" },
  { name: "Mexico", shortCode: "MEX", group: "B", flagEmoji: "🇲🇽" },
  { name: "South Korea", shortCode: "KOR", group: "B", flagEmoji: "🇰🇷" },
  { name: "DR Congo", shortCode: "COD", group: "B", flagEmoji: "🇨🇩" },
  // Group C
  { name: "England", shortCode: "ENG", group: "C", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Canada", shortCode: "CAN", group: "C", flagEmoji: "🇨🇦" },
  { name: "Saudi Arabia", shortCode: "KSA", group: "C", flagEmoji: "🇸🇦" },
  { name: "South Africa", shortCode: "RSA", group: "C", flagEmoji: "🇿🇦" },
  // Group D
  { name: "Germany", shortCode: "GER", group: "D", flagEmoji: "🇩🇪" },
  { name: "Brazil", shortCode: "BRA", group: "D", flagEmoji: "🇧🇷" },
  { name: "Japan", shortCode: "JPN", group: "D", flagEmoji: "🇯🇵" },
  { name: "Tunisia", shortCode: "TUN", group: "D", flagEmoji: "🇹🇳" },
  // Group E
  { name: "Portugal", shortCode: "POR", group: "E", flagEmoji: "🇵🇹" },
  { name: "Uruguay", shortCode: "URU", group: "E", flagEmoji: "🇺🇾" },
  { name: "Senegal", shortCode: "SEN", group: "E", flagEmoji: "🇸🇳" },
  { name: "Jamaica", shortCode: "JAM", group: "E", flagEmoji: "🇯🇲" },
  // Group F
  { name: "Netherlands", shortCode: "NED", group: "F", flagEmoji: "🇳🇱" },
  { name: "Colombia", shortCode: "COL", group: "F", flagEmoji: "🇨🇴" },
  { name: "Egypt", shortCode: "EGY", group: "F", flagEmoji: "🇪🇬" },
  { name: "Australia", shortCode: "AUS", group: "F", flagEmoji: "🇦🇺" },
  // Group G
  { name: "Italy", shortCode: "ITA", group: "G", flagEmoji: "🇮🇹" },
  { name: "Ecuador", shortCode: "ECU", group: "G", flagEmoji: "🇪🇨" },
  { name: "Nigeria", shortCode: "NGA", group: "G", flagEmoji: "🇳🇬" },
  { name: "Jordan", shortCode: "JOR", group: "G", flagEmoji: "🇯🇴" },
  // Group H
  { name: "Belgium", shortCode: "BEL", group: "H", flagEmoji: "🇧🇪" },
  { name: "Switzerland", shortCode: "SUI", group: "H", flagEmoji: "🇨🇭" },
  { name: "Iran", shortCode: "IRN", group: "H", flagEmoji: "🇮🇷" },
  { name: "New Zealand", shortCode: "NZL", group: "H", flagEmoji: "🇳🇿" },
  // Group I
  { name: "Denmark", shortCode: "DEN", group: "I", flagEmoji: "🇩🇰" },
  { name: "Croatia", shortCode: "CRO", group: "I", flagEmoji: "🇭🇷" },
  { name: "Venezuela", shortCode: "VEN", group: "I", flagEmoji: "🇻🇪" },
  { name: "Cameroon", shortCode: "CMR", group: "I", flagEmoji: "🇨🇲" },
  // Group J
  { name: "Serbia", shortCode: "SRB", group: "J", flagEmoji: "🇷🇸" },
  { name: "Slovakia", shortCode: "SVK", group: "J", flagEmoji: "🇸🇰" },
  { name: "Panama", shortCode: "PAN", group: "J", flagEmoji: "🇵🇦" },
  { name: "Iraq", shortCode: "IRQ", group: "J", flagEmoji: "🇮🇶" },
  // Group K
  { name: "Austria", shortCode: "AUT", group: "K", flagEmoji: "🇦🇹" },
  { name: "Indonesia", shortCode: "IDN", group: "K", flagEmoji: "🇮🇩" },
  { name: "Honduras", shortCode: "HON", group: "K", flagEmoji: "🇭🇳" },
  { name: "Ghana", shortCode: "GHA", group: "K", flagEmoji: "🇬🇭" },
  // Group L
  { name: "Turkey", shortCode: "TUR", group: "L", flagEmoji: "🇹🇷" },
  { name: "Romania", shortCode: "ROU", group: "L", flagEmoji: "🇷🇴" },
  { name: "Uzbekistan", shortCode: "UZB", group: "L", flagEmoji: "🇺🇿" },
  { name: "Costa Rica", shortCode: "CRC", group: "L", flagEmoji: "🇨🇷" },
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

  // Upsert teams
  for (const team of TEAMS_CLEAN) {
    await prisma.team.upsert({
      where: { shortCode: team.shortCode },
      update: {},
      create: team,
    });
  }
  console.log(`✅ Seeded ${TEAMS_CLEAN.length} teams`);

  // Upsert phases
  for (const phase of PHASES) {
    await prisma.phase.upsert({
      where: { type: phase.type },
      update: {},
      create: phase,
    });
  }
  console.log(`✅ Seeded ${PHASES.length} phases`);

  // Create knockout match stubs (R32 = 16 matches, R16 = 8, QF = 4, SF = 2, F = 1)
  const phaseMatches: { phaseType: PhaseType; count: number; descFn: (i: number) => string }[] = [
    {
      phaseType: PhaseType.ROUND_OF_32,
      count: 16,
      descFn: (i) => `R32 Match ${i + 1}`,
    },
    {
      phaseType: PhaseType.ROUND_OF_16,
      count: 8,
      descFn: (i) => `R16 Match ${i + 1}`,
    },
    {
      phaseType: PhaseType.QUARTERFINALS,
      count: 4,
      descFn: (i) => `Quarterfinal ${i + 1}`,
    },
    {
      phaseType: PhaseType.SEMIFINALS,
      count: 2,
      descFn: (i) => `Semifinal ${i + 1}`,
    },
    {
      phaseType: PhaseType.FINAL,
      count: 1,
      descFn: () => "World Cup Final",
    },
  ];

  for (const { phaseType, count, descFn } of phaseMatches) {
    const phase = await prisma.phase.findUnique({ where: { type: phaseType } });
    if (!phase) continue;

    const existingCount = await prisma.match.count({ where: { phaseId: phase.id } });
    if (existingCount === 0) {
      for (let i = 0; i < count; i++) {
        await prisma.match.create({
          data: {
            phaseId: phase.id,
            matchNumber: i + 1,
            description: descFn(i),
          },
        });
      }
    }
  }
  console.log("✅ Seeded knockout match stubs");

  // Create default admin user if not exists
  const adminEmail = process.env.ADMIN_EMAIL || "admin@wc26.local";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: hashed,
        role: "ADMIN",
      },
    });
    console.log(`✅ Created admin user: ${adminEmail}`);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
