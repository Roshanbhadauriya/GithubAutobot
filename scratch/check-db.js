const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany();
  console.log(users);

  console.log("\n=== REPOSITORIES ===");
  const repos = await prisma.repository.findMany();
  console.log(repos);

  console.log("\n=== WEBHOOK LOGS ===");
  const logs = await prisma.webhookLog.findMany();
  console.log(logs.map(l => ({
    id: l.id,
    deliveryId: l.deliveryId,
    eventType: l.eventType,
    action: l.action,
    repositoryId: l.repositoryId,
    status: l.status,
    processedAt: l.processedAt
  })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
