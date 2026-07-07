import { prisma } from "@/lib/db";

interface DefaultRule {
  name: string;
  eventType: string;
  field: string;
  matchType: string;
  matchValue: string;
  addLabels: string;
  postComment: string;
  sendSlack: boolean;
}

const DEFAULT_RULES: DefaultRule[] = [
  {
    name: "Welcome Comment on new PRs",
    eventType: "pull_request",
    field: "any",
    matchType: "always",
    matchValue: "*",
    addLabels: "",
    postComment:
      "Thanks for opening this pull request! A maintainer will review it shortly. 🚀",
    sendSlack: false,
  },
  {
    name: "Auto-Label Bug Issues",
    eventType: "issues",
    field: "title",
    matchType: "contains",
    matchValue: "bug",
    addLabels: "bug",
    postComment: "🐛 Bug report acknowledged. Triage and tracking initiated.",
    sendSlack: false,
  },
  {
    name: "Feature Request Tagger",
    eventType: "issues",
    field: "title",
    matchType: "starts_with",
    matchValue: "feat",
    addLabels: "feature-request, enhancement",
    postComment:
      "💡 Thanks for the feature suggestion! We'll evaluate this for the roadmap.",
    sendSlack: false,
  },
  {
    name: "Hotfix PR Detector",
    eventType: "pull_request",
    field: "title",
    matchType: "contains",
    matchValue: "fix",
    addLabels: "hotfix, urgent",
    postComment:
      "⚠️ This PR has been flagged as a hotfix. Prioritizing review.",
    sendSlack: false,
  },
  {
    name: "Security Issue Alert",
    eventType: "issues",
    field: "any",
    matchType: "contains",
    matchValue: "security",
    addLabels: "security, critical, p0",
    postComment:
      "🔒 Security concern detected. This has been escalated to the security team.",
    sendSlack: false,
  },
  {
    name: "Docs Change Tagger",
    eventType: "pull_request",
    field: "title",
    matchType: "contains",
    matchValue: "docs",
    addLabels: "documentation",
    postComment:
      "📚 Documentation update detected. Auto-labeling as docs-only.",
    sendSlack: false,
  },
];

/**
 * Seeds the default automation rules for a newly created user.
 * Skips seeding if the user already has rules (e.g. returning user).
 */
export async function seedDefaultRules(userId: string): Promise<void> {
  try {
    const existingCount = await prisma.rule.count({ where: { userId } });
    if (existingCount > 0) {
      console.log(
        `User ${userId} already has ${existingCount} rules. Skipping default seed.`
      );
      return;
    }

    console.log(`Seeding ${DEFAULT_RULES.length} default rules for user ${userId}`);

    await prisma.rule.createMany({
      data: DEFAULT_RULES.map((rule) => ({
        ...rule,
        userId,
        isDefault: true,
      })),
    });

    console.log(`Successfully seeded default rules for user ${userId}`);
  } catch (error) {
    // Non-fatal — don't crash the auth flow if seeding fails
    console.error("Failed to seed default rules:", error);
  }
}
