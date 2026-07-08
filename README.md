# 🤖 AutoBot — GitHub Automation Platform

AutoBot is a full-stack developer automation engine that connects to your GitHub repositories via OAuth, registers webhooks, and runs customizable workflow rules (auto-labeling, posting markdown welcome comments on issues/PRs, sending Slack notifications) backed by Google Gemini AI triage.

---

## 🔍 Getting Credentials & Setup

### 1. GitHub OAuth App Setup
To enable "Login with GitHub" and repository management:
1. Go to your GitHub profile -> **Settings** -> **Developer Settings** -> **OAuth Apps** -> **New OAuth App**.
2. Set the following fields:
   - **Application Name**: AutoBot
   - **Homepage URL**: `https://github-autobot.vercel.app` (or your local/tunnel URL)
   - **Authorization callback URL**: `https://github-autobot.vercel.app/api/auth/callback`
3. Click **Register Application**, then generate a **Client Secret**.
4. Save the **Client ID** and **Client Secret** to place in your environment variables.

### 2. GitHub Webhook Account Setup
Webhooks are automatically provisioned on repositories you connect via the dashboard. However, you need to define a shared webhook secret for request validation:
1. Create a random 64-character hex string (e.g. `openssl rand -hex 32`).
2. Add this string as `GITHUB_WEBHOOK_SECRET` in your environment variables.
3. When the dashboard creates webhooks on your repos, it will register this secret so GitHub signs every payload with a corresponding HMAC signature.

### 3. Slack Webhook Configuration
To enable rules that post alerts to Slack:
1. Create a Slack App in your workspace settings at [api.slack.com/apps](https://api.slack.com/apps).
2. Enable the **Incoming Webhooks** feature.
3. Click **Add New Webhook to Workspace** and select the channel.
4. Copy the generated Webhook URL (looks like `https://hooks.slack.com/services/...`) and save it as `SLACK_WEBHOOK_URL` in your environment variables.

---

## 🎨 Design & Development Roadmap
During planning, I spent time researching minimal, high-contrast dark user interfaces (like Vercel and Supabase). I selected a monochromatic `#0a0a0a` card layout with `#1f1f1f` borders and mapped out this roadmap:
1. **OAuth Authentication**: Verify the GitHub OAuth callback and JWT session flow.
2. **Webhook Ingestion**: Implement the POST webhook route with HMAC signature verification.
3. **Slack Pipeline**: Build the Block Kit formatting adapter.
4. **Rules Engine**: Create the conditional pattern matching utility.
5. **Activity Audit & Queue**: Build the logs view and manual retry handler.

---

## 🛡️ Production Security & Quality Bar

### 1. Replay & Forged Request Verification
The application enforces strict payload verification. Every request delivered to `/api/webhook` is verified using the `x-hub-signature-256` signature header signed with your `GITHUB_WEBHOOK_SECRET`. Requests with missing or mismatched signatures are immediately rejected with a `401 Unauthorized` status.

### 2. Idempotency & Duplicate Check
Every webhook event contains a unique `X-GitHub-Delivery` GUID. Before processing, AutoBot checks the database. If a log entry with that delivery ID already exists, the event is immediately skipped to prevent double comment posting or double notifications.

### 3. Resiliency & Error Diagnostics
AutoBot executes processing asynchronously in the background using Next.js `after()`, returning a `200 OK` to GitHub immediately so connections don't time out. If any step fails (e.g. GitHub rate limits, Slack is down, or database is locked), the exact stack trace is written to the `errorMessage` field in the log entry. The event status is marked as `failed`, and you can manually click **Retry** on the dashboard to replay the execution from the queue.

### 4. Secrets Integrity
All API tokens, database keys, and webhook secrets are resolved entirely on the server-side. No API credentials are leaked in public JavaScript bundles, client-side queries, or system logs.

---

## 🚀 Environment Variables

See [`.env.example`](.env.example) for template configuration. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `GITHUB_CALLBACK_URL` | OAuth authorization callback endpoint |
| `NEXT_PUBLIC_APP_URL` | Deployed URL of your application |
| `GITHUB_WEBHOOK_SECRET` | Shared secret to verify webhook signatures |
| `JWT_SECRET` | Secret key for JWT session encryption |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SLACK_WEBHOOK_URL` | Slack App incoming webhook URL |

---

## 📁 Monorepo Structure

```
├── app/
│   ├── page.tsx                 # High-performance landing page
│   ├── dashboard/page.tsx       # Primary dashboard panel
│   └── api/
│       ├── auth/                # Session and OAuth handling
│       ├── repos/               # Repo toggle and webhook creation
│       ├── rules/               # Automation rules endpoint
│       ├── logs/                # Audit logs and retries
│       └── webhook/             # Signed webhook receiver
├── components/dashboard/        # Slick dark UI tab panels
│   ├── sidebar.tsx
│   ├── repos-tab.tsx
│   ├── logs-tab.tsx
│   ├── rules-tab.tsx
│   ├── top-loader.tsx           # Global top loading bar
│   └── rule-detail-modal.tsx    # Compact edit modal
├── hooks/
│   └── use-debounce.ts          # Input debouncing hook
├── services/
│   ├── default-rules.ts         # Seeding for default rules
│   ├── gemini.ts                # Gemini AI triage utility
│   ├── slack.ts                 # Slack Block Kit composer
│   └── webhook-handler.ts       # Rules engine coordinator
├── prisma/
│   └── schema.prisma            # Schema definitions
└── types/index.ts               # TypeScript schemas
```

---

## 🧪 How to Test (Step-by-Step)

AutoBot is deployed and live. You do not need any special or throwaway credentials to test it, as it uses standard GitHub OAuth authentication.

### Step 1: Join the Slack Testing Workspace
To verify that Slack alerts are successfully triggered and delivered:
1. Join our dedicated Slack testing workspace using this invite link:
   👉 **[Join Slack Testing Workspace](https://join.slack.com/t/roshan-3dx1712/shared_invite/zt-435w5zi3p-fsLnZpxfDDT0Xm~rHohmcQ)**
2. Go to the `#github-bot` channel, where all webhook notifications are routed.

### Step 2: Log in and Connect a Repo
1. Go to the live URL: **`https://github-autobot.vercel.app`**
2. Click **Login with GitHub** and authorize the OAuth application.
3. Once in the dashboard, find any public or private repository you own and toggle the connection switch. (This automatically registers our secure webhook endpoint on your repository via the GitHub API).

### Step 3: Enable Rules
1. Go to the **Automation Rules** tab.
2. Ensure the pre-loaded default rules are toggled **ON** (especially **Slack Alert on All Issues** and **Welcome Comment on new PRs**).

### Step 4: Trigger Webhook Events
On your connected GitHub repository:
- **Test Slack & AI Triage**: Go to your repository and open a new Issue with any title (e.g. `bug: page is loading slow`).
  - Switch to your Slack workspace in the `#github-bot` channel to see the beautiful Block Kit notification containing the Gemini AI triage analysis (priority rating, issue summary, recommended labels) and list of executed actions.
- **Test Comment Posting**: Open a new Pull Request.
  - Check the PR thread on GitHub to see the automated markdown welcome comment posted by the bot, containing the collapsed AI triage analysis block.

### Step 5: Verify Audit Logs
1. Switch to the **Logs & Actions** tab on the AutoBot dashboard.
2. See the new logs showing status `Ready`, response duration, and event payload.
3. Click a log to view the details, run manual retries, or audit raw payload JSON.

---

## 📝 License

MIT
