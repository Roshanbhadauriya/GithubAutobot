const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rules = await prisma.rule.findMany({ orderBy: { createdAt: "desc" } });
  for (const r of rules) {
    console.log(`\n--- Rule: "${r.name}" ---`);
    console.log(`  Event: ${r.eventType} | Field: ${r.field} | Match: ${r.matchType} "${r.matchValue}"`);
    console.log(`  Labels: "${r.addLabels}" | Comment: "${r.postComment}"`);
    console.log(`  Slack: ${r.sendSlack} | Webhook: ${r.slackWebhookUrl}`);
    console.log(`  Active: ${r.isActive}`);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
