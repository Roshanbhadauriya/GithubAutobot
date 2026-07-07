const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NEW_RULES = [
  {
    name: "Feature Request Tagger",
    eventType: "issues",
    field: "title",
    matchType: "starts_with",
    matchValue: "feat",
    addLabels: "feature-request, enhancement",
    postComment: "💡 Thanks for the feature suggestion! We'll evaluate this for the roadmap.",
    sendSlack: false,
  },
  {
    name: "Hotfix PR Detector",
    eventType: "pull_request",
    field: "title",
    matchType: "contains",
    matchValue: "fix",
    addLabels: "hotfix, urgent",
    postComment: "⚠️ This PR has been flagged as a hotfix. Prioritizing review.",
    sendSlack: false,
  },
  {
    name: "Security Issue Alert",
    eventType: "issues",
    field: "any",
    matchType: "contains",
    matchValue: "security",
    addLabels: "security, critical, p0",
    postComment: "🔒 Security concern detected. This has been escalated to the security team.",
    sendSlack: false,
  },
  {
    name: "Docs Change Tagger",
    eventType: "pull_request",
    field: "title",
    matchType: "contains",
    matchValue: "docs",
    addLabels: "documentation",
    postComment: "📚 Documentation update detected. Auto-labeling as docs-only.",
    sendSlack: false,
  },
];

async function main() {
  // Get the first user (your account)
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found in database.");
    return;
  }

  console.log(`Found user: ${user.username} (${user.id})`);

  // Check which rules already exist by name
  const existing = await prisma.rule.findMany({
    where: { userId: user.id },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((r) => r.name));

  const toCreate = NEW_RULES.filter((r) => !existingNames.has(r.name));

  if (toCreate.length === 0) {
    console.log("All default rules already exist. Nothing to seed.");
    return;
  }

  console.log(`Seeding ${toCreate.length} new rules...`);
  await prisma.rule.createMany({
    data: toCreate.map((r) => ({ ...r, userId: user.id })),
  });

  console.log("Done! New rules seeded:");
  toCreate.forEach((r) => console.log(`  ✓ ${r.name}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
