const { PrismaClient } = require("@prisma/client");
const { Octokit } = require("@octokit/rest");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Webhook Diagnostics...");

  // 1. Fetch the user and token
  const user = await prisma.user.findFirst();
  if (!user || !user.accessToken) {
    console.error("❌ No user or access token found in the database.");
    return;
  }
  console.log(`✅ Found user: ${user.username}`);

  // 2. Fetch connected repositories
  const repos = await prisma.repository.findMany({
    where: { isConnected: true },
  });

  if (repos.length === 0) {
    console.warn("⚠️ No repositories are marked as connected (isConnected: true) in the database.");
    return;
  }

  console.log(`✅ Found ${repos.length} connected repositories in DB:`);
  for (const repo of repos) {
    console.log(`  - ${repo.fullName} (ID: ${repo.githubId}, Webhook ID: ${repo.webhookId})`);
  }

  const octokit = new Octokit({ auth: user.accessToken });

  // 3. For each repo, query GitHub's webhooks API
  for (const repo of repos) {
    console.log(`\n🔍 Fetching webhooks from GitHub for: ${repo.fullName}...`);
    try {
      const response = await octokit.repos.listWebhooks({
        owner: repo.ownerName,
        repo: repo.name,
      });

      const hooks = response.data;
      if (hooks.length === 0) {
        console.log("  ❌ GitHub reports 0 webhooks for this repository.");
        continue;
      }

      console.log(`  Found ${hooks.length} webhooks on GitHub:`);
      for (const hook of hooks) {
        console.log(`    ----------------------------------------`);
        console.log(`    ID: ${hook.id}`);
        console.log(`    Active: ${hook.active}`);
        console.log(`    URL: ${hook.config.url}`);
        console.log(`    Events: ${hook.events.join(", ")}`);
        
        if (hook.last_response) {
          console.log(`    Last Response Status: ${hook.last_response.status}`);
          console.log(`    Last Response Code: ${hook.last_response.code}`);
          console.log(`    Last Response Message: ${hook.last_response.message || "N/A"}`);
        } else {
          console.log(`    Last Response: No response logged yet.`);
        }
      }
    } catch (err) {
      console.error(`  ❌ Error querying GitHub for ${repo.fullName}:`, err.message || err);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
