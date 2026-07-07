const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching Webhook Logs from DB...");
  const logs = await prisma.webhookLog.findMany({
    orderBy: { processedAt: "desc" },
    take: 10,
  });

  if (logs.length === 0) {
    console.log("No logs found in database.");
    return;
  }

  for (const log of logs) {
    console.log(`\n----------------------------------------`);
    console.log(`ID: ${log.id}`);
    console.log(`Event: ${log.eventType}`);
    console.log(`Action: ${log.action}`);
    console.log(`Status: ${log.status}`);
    console.log(`Processed At: ${log.processedAt}`);
    console.log(`Actions Taken: ${log.actionsTaken}`);
    if (log.errorMessage) {
      console.log(`Error Message: ${log.errorMessage}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
