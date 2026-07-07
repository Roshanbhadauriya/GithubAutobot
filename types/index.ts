export interface Repository {
  id: string | null;
  githubId: number;
  name: string;
  fullName: string;
  ownerName: string;
  htmlUrl: string;
  isConnected: boolean;
  defaultBranch?: string;
  pushedAt?: string;
  updatedAt?: string;
  description?: string | null;
}

export interface Rule {
  id: string;
  name: string;
  eventType: string;
  field: string;
  matchType: string;
  matchValue: string;
  addLabels: string;
  postComment: string | null;
  sendSlack: boolean;
  slackWebhookUrl: string | null;
  isActive: boolean;
  isDefault?: boolean;
  createdAt?: string;
}

export interface WebhookLog {
  id: string;
  deliveryId: string;
  eventType: string;
  action: string;
  status: "success" | "failed" | "skipped" | "pending";
  actionsTaken: string; // JSON string array
  aiSummary: string | null;
  aiPriority: string | null;
  aiLabels: string | null;
  errorMessage: string | null;
  payload: string; // JSON string
  processedAt: string;
  retryCount: number;
  repository: {
    fullName: string;
  };
}

export interface SessionPayload {
  userId: string;
  githubId: number;
  username: string;
}

export interface WebhookPayload {
  action?: string;
  issue?: {
    number: number;
    title: string;
    body: string | null;
    user: { login: string };
    html_url: string;
  };
  pull_request?: {
    number: number;
    title: string;
    body: string | null;
    user: { login: string };
    html_url: string;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
    html_url: string;
  };
  sender: {
    login: string;
    avatar_url?: string;
  };
  pusher?: {
    name: string;
    email: string;
  };
  ref?: string;
  commits?: Array<{
    id: string;
    message: string;
    url: string;
    author: { name: string; email: string };
  }>;
  compare?: string;
}
