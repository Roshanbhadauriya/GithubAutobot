const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_NAMES = [
  "Welcome Comment on new PRs",
  "Auto-Label Bug Issues",
  "Feature Request Tagger",
  "Hotfix PR Detector",
  "Security Issue Alert",
  "Docs Change Tagger",
  "Slack Alert on All Issues",
];

async function main() {
  const result = await prisma.rule.updateMany({
    where: { name: { in: DEFAULT_NAMES } },
    data: { isDefault: true },
  });
  console.log(`Marked ${result.count} rules as default.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
