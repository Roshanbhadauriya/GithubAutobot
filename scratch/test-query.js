const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const userId = 'da76ce0c-f764-4788-9bd4-12a7f1eb2a34';
  const logs = await prisma.webhookLog.findMany({
    where: {
      repository: {
        userId: userId,
      },
    },
    include: {
      repository: true,
    }
  });
  console.log("MATCHING LOGS COUNT:", logs.length);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
