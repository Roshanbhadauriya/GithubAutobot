# AI_NOTES.md

## AI Tools & Models Used

I used **Google Gemini CLI (Antigravity agent)** throughout the project — primarily the **Claude Opus 4.6** model for complex architectural work and **Claude Sonnet 4.6** for lighter iterations. The AI handled roughly 70–80% of the raw code output: component scaffolding, API routes, Prisma schema, webhook handler logic, CSS/Tailwind styling, and debugging. I directed every architectural decision, reviewed all output, tested manually, and course-corrected when things went wrong.

---

## Key Decisions I Made

1. **Next.js App Router + Prisma + Neon PostgreSQL**: I chose this stack for seamless Vercel deployment with serverless functions. The App Router's API routes act as both webhook receiver and dashboard backend, eliminating a separate server. Neon's serverless Postgres gives instant provisioning with connection pooling — critical for cold-start performance on Vercel.

2. **Rule-based automation engine with conditional matching**: Instead of hardcoding behaviors (e.g., "always label bug issues"), I designed a flexible `Rule` model with `field/matchType/matchValue` pattern matching. This lets users create rules for *any* GitHub event type with arbitrary conditions, making the system genuinely extensible. Default rules ship pre-configured but users can customize or add their own.

3. **Cloudflare Quick Tunnels for webhook development**: Rather than deploying to staging for every code change or paying for ngrok, I used `cloudflared` quick tunnels to expose localhost. This gave fast iteration cycles — edit code, save, test webhook delivery in seconds.

---

## Hardest Bug / Wrong Turn from AI

The trickiest issue was **stale environment variable caching after rotating Cloudflare Tunnel URLs**.

When a `cloudflared` tunnel session expired and I started a new one, the tunnel URL changed. I updated `.env` with the new URL, but webhooks kept silently failing. The AI initially said "just restart the dev server," but that didn't fix it — Next.js's Turbopack had cached the old compiled chunks with the previous URL baked in.

**How I noticed**: GitHub's webhook delivery tab showed successful 200s to the *old* tunnel URL (which was now dead), but my app received nothing. The mismatch between what GitHub thought and what my logs showed was the clue.

**The actual fix** required: (1) kill the dev server, (2) delete the entire `.next` cache directory, (3) update `.env` with the new tunnel URL, (4) restart fresh. The AI didn't initially account for framework-level compilation caching of environment variables — it treated `.env` changes as hot-reloadable, which they aren't for `NEXT_PUBLIC_*` vars that get inlined at build time.

---

## What I'd Improve With More Time

- **WebSocket/SSE for real-time updates** — replace the 5-second polling interval with push-based updates
- **GitHub App authentication** — so bot comments come from an app identity, not the user's personal account
- **Webhook signature verification (HMAC-SHA256)** — currently webhooks are accepted without cryptographic verification
- **Rate limiting** on the webhook endpoint to prevent abuse
- **Rule templates marketplace** — let users share and import community-created rules
- **Proper error boundaries** — React error boundary components for graceful UI failure recovery
- **E2E tests** with Playwright covering the full OAuth → connect repo → trigger webhook → see log flow
