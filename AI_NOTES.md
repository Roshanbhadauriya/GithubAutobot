# AI_NOTES.md

## 🔍 Initial Research & Credentials Phase
Before starting implementation, I researched the API and credential ecosystem to plan secure integrations:
1. **GitHub OAuth**: I configured a new **GitHub OAuth App** under Developer Settings, defining the callback endpoint to point to our App Router authorization callback.
2. **Webhooks Setup**: I mapped out GitHub's webhook event formats (issue, pull request, push) and webhook signature generation (`HMAC-SHA256`) using a shared client webhook secret.
3. **Slack Hook**: I set up an **Incoming Webhook** in my Slack workspace workspace, creating a webhook URL to handle standard block layouts.
4. **Prerequisites for Testing**: Anyone wanting to test this flow can:
   - Create a GitHub OAuth application with callback set to the deployment URL.
   - Create an incoming Slack webhook URL.
   - Register a webhook on their repository matching the payload delivery URL.

---

## 🎨 UI & Design Inspiration
I researched clean, dark layouts of popular SaaS platforms (like Vercel and Supabase) to build a premium developer dashboard:
- **Theme**: Cohesive dark-mode theme utilizing deep `#0a0a0a` cards, `#1f1f1f` borders, and high-contrast typography.
- **Roadmap**:
  1. Verify the GitHub OAuth authentication sequence works.
  2. Implement webhook ingestion and signature validation.
  3. Wire up Slack block notifications.
  4. Develop the dynamic pattern-matching automation rules engine.
  5. Build the activity logs audit table and manual retry engine.

---

## 🛠️ AI Tools, Models, & Context Files
- **AI Tools**: I used **Google Gemini CLI (Antigravity agent)**. It primarily loaded **Claude Opus 4.6** for high-level structure/refactoring and **Claude Sonnet 4.6** for layout/styling.
- **Work Division**: I designed the database models, wrote the callback security, directed the rules logic, and debugged the Next.js runtime. The AI generated the React components, Tailwind styling, Prisma migrations, and mock data templates.
- **Context Files**: I did not use any external context files (e.g. `.cursorrules`, `CLAUDE.md`, or `AGENTS.md`) for this project; all instructions were managed interactively.

---

## 💡 Key Decisions
1. **Next.js App Router + Neon Serverless Postgres**: Allowed a unified serverless deployment on Vercel. Neon handles serverless connections efficiently with built-in connection pooling, keeping database roundtrips fast.
2. **Generic Rules Engine**: Used a matching schema (`field/matchType/matchValue`) instead of hardcoding actions. This makes the system extensible for custom triggers.
3. **Cloudflare Quick Tunnels**: Avoided deploying to production for each test. Exposing localhost dynamically made webhook validation immediate.

---

## 🐛 Hardest Bug & AI Wrong Turn
The trickiest bug was **stale environment variable caching inside Next.js's Turbopack compilation**. 
When my Cloudflare tunnel URL changed, I updated `.env` with the new callback and public app URLs. Webhook requests kept silently failing, while GitHub logs showed events being delivered to the old, expired tunnel URL. The AI suggested restarting the dev server, which didn't help. The issue was that Turbopack had compiled and cached the old public env variables in the `.next` output directory. 

**The Fix**: I terminated the compiler, manually deleted the `.next` cache directory, updated `.env`, and restarted the dev server. This forced a clean recompilation.

---

## 🛡️ Quality Bar Compliance (Production Readiness)
- **Signature Verification**: Validates the `x-hub-signature-256` HMAC-SHA256 signature using `GITHUB_WEBHOOK_SECRET` to reject forged requests.
- **Idempotency**: Webhook events are checked against the DB using the unique `x-github-delivery` header, ensuring duplicate deliveries are skipped.
- **Resiliency**: Webhook processing executes asynchronously (using Next.js `after()`) so the webhook endpoint responds immediately. If a downstream call fails, the exact stack trace is logged in the DB, the status is set to `failed`, and a manual **Retry** action is available on the dashboard.
- **Secret Protection**: All credentials are kept in process environment variables on Vercel and are never leaked to client bundles or logs.
