const crypto = require("crypto");

// Setup defaults or read from environment
const secret = process.env.GITHUB_WEBHOOK_SECRET || "your_secure_random_webhook_secret_key";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Command line arguments: node simulate-webhook.js <event_type> <action> <title> <repo_id>
const eventType = process.argv[2] || "issues";
const action = process.argv[3] || "opened";
const title = process.argv[4] || "test: Critical bug in login module";
const repoId = Number(process.argv[5]) || 999999; // Replace with your repository github ID

const bodyText = `This is a test description. We have a major bug here that breaks login.
Steps to reproduce:
1. Go to login page
2. Input credentials
3. Press enter, get a 500 server error!
`;

// Construct mock payload
const payload = {
  action: action,
  repository: {
    id: repoId,
    name: "test-repo",
    full_name: "test-owner/test-repo",
    owner: { login: "test-owner" },
  },
  sender: {
    login: "tester-bot",
  },
};

if (eventType === "issues") {
  payload.issue = {
    number: 42,
    title: title,
    body: bodyText,
    user: { login: "tester-bot" },
    html_url: "https://github.com/test-owner/test-repo/issues/42",
  };
} else if (eventType === "pull_request") {
  payload.pull_request = {
    number: 77,
    title: title,
    body: "This PR fixes the login crash. Verified locally.",
    user: { login: "tester-bot" },
    html_url: "https://github.com/test-owner/test-repo/pull/77",
  };
} else if (eventType === "push") {
  payload.ref = "refs/heads/main";
  payload.commits = [
    {
      id: "c0ffee123456",
      message: title,
      url: "https://github.com/test-owner/test-repo/commit/c0ffee123456",
      author: { name: "Tester Bot", email: "bot@test.com" },
    },
  ];
  payload.compare = "https://github.com/test-owner/test-repo/compare/a1b2c3d4...c0ffee12";
}

const rawBody = JSON.stringify(payload);

// Calculate signature
const hmac = crypto.createHmac("sha256", secret);
const signature = "sha256=" + hmac.update(rawBody).digest("hex");

// Generate delivery ID
const deliveryId = crypto.randomUUID();

console.log(`--- Simulating GitHub Webhook Event ---`);
console.log(`Event Type  : ${eventType}`);
console.log(`Action      : ${action}`);
console.log(`Payload     : ${title}`);
console.log(`Delivery ID : ${deliveryId}`);
console.log(`Sending to  : ${appUrl}/api/webhook`);
console.log(`---------------------------------------`);

async function sendRequest() {
  try {
    const res = await fetch(`${appUrl}/api/webhook`, {
      method: "POST",
      headers: {
        "x-hub-signature-256": signature,
        "x-github-event": eventType,
        "x-github-delivery": deliveryId,
        "Content-Type": "application/json",
      },
      body: rawBody,
    });

    const status = res.status;
    const text = await res.text();
    
    console.log(`Response Status: ${status}`);
    console.log(`Response Body  : ${text}`);
    console.log(`---------------------------------------`);
  } catch (error) {
    console.error("Error sending mock webhook request:", error);
  }
}

sendRequest();
