# 🤖 AutoBot — GitHub Automation Platform

A full-stack GitHub automation platform that connects to your repositories via OAuth, listens for webhook events, and executes configurable automation rules — auto-labeling issues, posting welcome comments on PRs, sending Slack notifications, and triaging with Google Gemini AI.

---

## ✨ Features

- **GitHub OAuth Login** — Secure authentication via GitHub OAuth 2.0
- **Repository Management** — Connect/disconnect repos with automatic webhook provisioning
- **Automation Rules Engine** — Flexible rule system with `field/matchType/matchValue` pattern matching
  - Auto-label issues (e.g., label "bug" when title contains "bug")
  - Post comments on PRs (e.g., welcome message on every new PR)
  - Send Slack notifications on matching events
- **7 Default Rules** — Pre-configured rules for common workflows (welcome comments, bug labeling, security alerts, etc.)
- **AI Triage** — Google Gemini analyzes incoming issues/PRs for priority, suggested labels, and summary
- **Real-time Dashboard** — Polling-based dashboard showing webhook logs, repo status, and rule management
- **Debounced Search** — 300ms debounced search across all dashboard views
- **Pagination** — All list views paginated (10 items/page for logs & rules, 6 for repos)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Prisma |
| Styling | Tailwind CSS |
| AI | Google Gemini (gemini-2.0-flash) |
| GitHub API | Octokit |
| Auth | Custom JWT sessions via GitHub OAuth |
| Notifications | Slack Incoming Webhooks |
| Deployment | Vercel |

---

## 🏗️ Architecture

```
GitHub Event (push/issue/PR)
    │
    ▼
POST /api/webhooks/github
    │
    ├─ Log delivery (idempotency via X-GitHub-Delivery)
    ├─ Match against user's active Rules
    ├─ Execute actions: label, comment, Slack
    ├─ AI triage via Gemini (priority, summary, labels)
    └─ Update log status (success/failed/skipped)
```

**Data Model** (4 tables):
- `User` — GitHub OAuth identity + access token
- `Repository` — Connected repos with webhook IDs
- `Rule` — Automation rules with conditional matching
- `WebhookLog` — Full audit trail of every webhook delivery

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (we recommend [Neon](https://neon.tech) for serverless)
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))
- A Google Gemini API key ([get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/github-automation.git
cd github-automation

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Fill in your real values in .env

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

The app will be running at `http://localhost:3000`.

### For Webhook Testing (Development)

Since GitHub needs a public URL to deliver webhooks, use a tunnel:

```bash
# Option A: Cloudflare Quick Tunnel (free, no signup)
npx cloudflared tunnel --url http://localhost:3000

# Option B: ngrok
ngrok http 3000
```

Update `NEXT_PUBLIC_APP_URL` and `GITHUB_CALLBACK_URL` in `.env` with the tunnel URL.

---

## 🔐 Environment Variables

See [`.env.example`](.env.example) for the full template. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon recommended) |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `GITHUB_CALLBACK_URL` | OAuth callback URL (`<your-url>/api/auth/callback`) |
| `NEXT_PUBLIC_APP_URL` | Public app URL (localhost or tunnel URL) |
| `GITHUB_WEBHOOK_SECRET` | Random hex string for webhook signature |
| `JWT_SECRET` | Random hex string for session tokens |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SLACK_WEBHOOK_URL` | *(Optional)* Slack incoming webhook URL |

---

## 🧪 How to Test

1. **Login**: Visit the app and click "Login with GitHub"
2. **Connect a repo**: Go to Dashboard, find a repo, toggle the switch to connect
3. **Enable rules**: Go to Automation Rules tab — default rules are pre-loaded. Enable the ones you want.
4. **Trigger an event**: On the connected GitHub repo:
   - Open a new Issue with "bug" in the title → auto-labeled as `bug`
   - Open a new Pull Request → welcome comment posted
   - Create an issue with "security" in the title → gets `security` label + Slack alert
5. **View logs**: Switch to Logs & Actions tab to see webhook deliveries, AI triage results, and actions taken

### Test Credentials

Use your own GitHub account to OAuth login. No special credentials needed — the app creates your user record on first login. Any public or private repo you have admin access to can be connected.

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx                 # Landing page
│   ├── dashboard/page.tsx       # Main dashboard (repos, logs, rules)
│   └── api/
│       ├── auth/                # OAuth login, callback, session
│       ├── repos/               # Repository CRUD + webhook management
│       ├── rules/               # Automation rules CRUD
│       ├── logs/                # Webhook log retrieval
│       └── webhooks/github/     # Webhook receiver endpoint
├── components/dashboard/        # Dashboard UI components
│   ├── sidebar.tsx
│   ├── repos-tab.tsx
│   ├── logs-tab.tsx
│   ├── rules-tab.tsx
│   ├── rule-detail-modal.tsx
│   └── create-rule-form.tsx
├── hooks/
│   └── use-debounce.ts          # Shared debounce hook
├── services/
│   ├── default-rules.ts         # 7 default automation rules
│   └── gemini.ts                # Gemini AI triage service
├── prisma/
│   └── schema.prisma            # Database schema
└── types/index.ts               # TypeScript interfaces
```

---

## 🌐 Deployment

Deployed on **Vercel** with **Neon PostgreSQL**.

- Production URL: *[provided separately]*
- Database: Neon serverless PostgreSQL (auto-scaling, connection pooling)
- Webhooks: GitHub delivers to the Vercel deployment URL

To deploy your own:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all environment variables in the Vercel dashboard. Update `GITHUB_CALLBACK_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel domain.

---

## 📝 License

MIT
