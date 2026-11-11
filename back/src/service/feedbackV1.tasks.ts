import { createHash } from "node:crypto";
import { GoogleAuth, OAuth2Client } from "google-auth-library";
import { AppError } from "../error/appError";

export type FeedbackTaskPayload = { feedbackId: string; kind: "mission" | "create" | "phase" | "unit"; eventId: string };

const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
const oidcVerifier = new OAuth2Client();

export const tasksEnabled = () => process.env.FEEDBACK_TASKS_ENABLED === "true";

function config() {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const region = process.env.FEEDBACK_TASKS_REGION;
  const queue = process.env.FEEDBACK_TASKS_QUEUE;
  const handler = process.env.FEEDBACK_TASKS_HANDLER_URL;
  const serviceAccount = process.env.FEEDBACK_TASKS_CALLER_SA;
  const audience = process.env.FEEDBACK_TASKS_AUDIENCE;
  if (!project || !region || !queue || !handler || !serviceAccount || !audience) {
    throw new Error("FEEDBACK_TASKS_CONFIG_MISSING");
  }
  if (!handler.startsWith("https://") || !audience.startsWith("https://")) {
    throw new Error("FEEDBACK_TASKS_URL_INVALID");
  }
  return { project, region, queue, handler, serviceAccount, audience };
}

export async function enqueueFeedbackTask(payload: FeedbackTaskPayload, recoveryAttempt?: number, scheduleAt?: Date): Promise<void> {
  const settings = config();
  const digest = createHash("sha256").update(payload.feedbackId).digest("hex").slice(0, 32);
  const suffix = recoveryAttempt === undefined ? "" : "-recovery-" + recoveryAttempt;
  const parent = "projects/" + settings.project + "/locations/" + settings.region + "/queues/" + settings.queue;
  const task = {
    name: parent + "/tasks/feedback-" + digest + suffix,
    httpRequest: {
      httpMethod: "POST",
      url: settings.handler,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(JSON.stringify(payload), "utf8").toString("base64"),
      oidcToken: { serviceAccountEmail: settings.serviceAccount, audience: settings.audience },
    },
    dispatchDeadline: "290s",
    ...(scheduleAt ? { scheduleTime: scheduleAt.toISOString() } : {}),
  };
  const token = await auth.getAccessToken();
  if (!token) throw new Error("FEEDBACK_TASKS_TOKEN_MISSING");
  const response = await fetch("https://cloudtasks.googleapis.com/v2/" + parent + "/tasks", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ task }),
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 409) return; // Deterministic task name: already queued or recently delivered.
  if (!response.ok) throw new Error("FEEDBACK_TASK_ENQUEUE_FAILED:" + response.status + ":" + (await response.text()).slice(0, 200));
}

export async function verifyFeedbackTaskIdentity(authorization: string | undefined): Promise<void> {
  const settings = config();
  if (!authorization?.startsWith("Bearer ")) throw new AppError(401, "TASK_UNAUTHORIZED", "Task token missing");
  try {
    const ticket = await oidcVerifier.verifyIdToken({ idToken: authorization.slice("Bearer ".length), audience: settings.audience });
    const claims = ticket.getPayload();
    if (!claims || claims.email !== settings.serviceAccount || claims.email_verified !== true) {
      throw new Error("Invalid task service account");
    }
  } catch {
    throw new AppError(401, "TASK_UNAUTHORIZED", "Invalid task OIDC identity");
  }
}
