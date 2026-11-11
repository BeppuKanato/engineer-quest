# Cloud Tasks feedback generation (dev)

This change moves **FeedbackV1** generation into an authenticated Cloud Tasks HTTP request on the existing `engineer-quest-back-dev` Cloud Run service. The public feedback APIs and frontend polling do not change.

## Existing user-provisioned resources

- GCP project: `enginner-quest` (verify against the Cloud Run project).
- Region: `asia-northeast1`
- Queue: `feedback-generation-dev`; confirmed `RUNNING` by its owner.
- Queue settings: `maxConcurrentDispatches=2`, `maxDispatchesPerSecond=1`, `maxAttempts=3`.
- Enqueuer service identity: `engineer-quest-dev-back@PROJECT_ID.iam.gserviceaccount.com`.
- Task OIDC identity: `eq-feedback-tasks-dev@PROJECT_ID.iam.gserviceaccount.com`.

## Deployment prerequisite — MUST run before merge/deploy

**The dev deployment workflow does not run database migrations.**
This code references `FeedbackV1.runToken`, `runExpiresAt`, `runAttempts` as soon as it is deployed, even for ordinary feedback GETs. The migration must be applied to `DATABASE_URL_DEV` **before** the code is deployed.

From a checked-out revision that contains `back/prisma/migrations/20261111190000_feedback_v1_task_leases/`, run under `back/`:

```bash
npm ci
DATABASE_URL="$(gcloud secrets versions access latest --secret=DATABASE_URL_DEV)" npx prisma migrate deploy
```

Run from a trusted local machine or Cloud Shell with access to the dev secret. Do not print, commit, or paste the secret. Confirm `migrate deploy` reports the new migration as applied before merging.

## Runtime configuration

`.github/scripts/deploy-dev.sh` sets the environment variables automatically:

- `FEEDBACK_TASKS_ENABLED=true`
- `FEEDBACK_TASKS_QUEUE=feedback-generation-dev`
- `FEEDBACK_TASKS_REGION=asia-northeast1`
- `FEEDBACK_TASKS_CALLER_SA=eq-feedback-tasks-dev@PROJECT_ID.iam.gserviceaccount.com`
- `FEEDBACK_TASKS_HANDLER_URL=<current backend service URL>/internal/feedback/generate`
- `FEEDBACK_TASKS_AUDIENCE=<current backend service URL>`
- `GOOGLE_CLOUD_PROJECT=<project ID>`

The backend Cloud Run keeps `--cpu-throttling`. The queue calls the worker as a normal authenticated HTTP request. The worker validates the Google-signed OIDC token and enforces the exact caller service account email. Since the rest of the app uses Firebase authentication, **do not** remove `--allow-unauthenticated` from the shared public backend without a separate API-auth design change.

The backend service account requires `roles/cloudtasks.enqueuer` on the queue and `roles/iam.serviceAccountUser` for the caller identity. The task caller requires `roles/run.invoker` on the dev backend. The Cloud Tasks service agent must have the required service-agent rights.

## Behavior and recovery

1. The user POSTs a feedback event. The backend snapshots `input` in `FeedbackV1`, creates a deterministic Cloud Task, then returns `GENERATING`.
2. Cloud Tasks POSTs the task payload (`feedbackId`, `kind`, `eventId`) to the OIDC-protected internal handler.
3. An atomic row update claims a 300-second worker lease. Up to three LLM attempts are allowed. Requests take up to 290 seconds per dispatch; the Cloud Run request timeout is 300 seconds.
4. Success persists `COMPLETED`; validation failures persist `FAILED` without retry. Transient failures return HTTP 503 for Cloud Tasks retry.
5. Repeated tasks for `COMPLETED` / `FAILED` rows are acknowledged without LLM generation.
6. If a duplicate task finds a worker lease, a recovery task is scheduled after the lease expiry, accounting for a killed instance. A `GENERATING` record older than 35 minutes is considered expired when polled.

The queue gives **at-least-once delivery**, not exactly-once execution. The DB lease and immutable completion result guard against duplicated persisted feedback; overlapping or retried LLM calls can still incur charges in abnormal failures. This is a bounded-retry design, not a guarantee against every infrastructure outage.

## Verification

Before deploying:

```bash
cd back
npm ci
npx prisma generate
npm run typecheck
npm run verify:feedback-tasks
npm run verify:feedback-v1-storage
npm run verify:feedback-candidates
```

After merging and deploying, create a **new completion event** (previous `FAILED` records are not regenerated). Check:

- Cloud Tasks queue dispatches (including retries).
- `FeedbackV1.status` transitions from `GENERATING` to `COMPLETED`.
- `FeedbackV1Call` includes `analysis` and `selection` logs, with `reasoningEffort: "low"`.
- A deliberately unauthorized request to `/internal/feedback/generate` is rejected (401).
- Repeated POST or task delivery does not overwrite already completed feedback.

**No live OpenAI, PostgreSQL, or Cloud Run smoke test has been performed by this patch.** Do not assume deployed correctness until verified.
