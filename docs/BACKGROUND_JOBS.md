# Background Jobs — Inngest

This document captures the decision to use Inngest for durable background workflows, the checkpointing configuration, and the 260s/300s timing requirement. See also GUIDE.md Phase 7.

## Why Inngest (not `after()` or BullMQ)

- **Next.js `after()`:** Shares the same 300-second Vercel timeout as the main request. If the instance spins down or a call times out mid-execution, the task is lost. No durability, retries, or observability. Suitable only for fire-and-forget notifications, not multi-step workflows.

- **BullMQ:** Requires a persistent Node.js worker polling Redis over a long-lived TCP connection. Vercel’s serverless model tears down after each request, so there is no persistent process. BullMQ fits VPS/container deployments where you run a worker process, not Vercel.

- **Inngest:** Built for serverless. Functions are exposed at `/api/inngest`; Inngest’s cloud calls that endpoint over signed HTTP when a step runs. Each `step.run()` is a separate invocation, so Vercel’s 300s limit applies per step, not to the whole workflow. Workflows can span days with `step.waitForEvent` and `step.sleep`.

## Checkpointing configuration

The Inngest client in `apps/agency-admin/src/inngest/client.ts` uses checkpointing for low inter-step latency:

- **maxRuntime: '260s'** — Kept below Vercel’s default `maxDuration` of 300s so Inngest can flush checkpoints before the function is terminated.
- **bufferedSteps: 2** — Number of steps that can be buffered for execution.
- **maxInterval: '10s'** — Maximum interval between checkpoint flushes.

`maxRuntime` should stay at roughly 80% of the route’s `maxDuration` (e.g. 260s when `maxDuration = 300`).

## 260s / 300s timing requirement

The `/api/inngest` route exports `maxDuration = 300` for Vercel. Each Inngest step runs as one serverless invocation. To avoid mid-checkpoint timeouts when the platform kills the function at 300s, the Inngest client’s `maxRuntime` is set to 260s. That leaves time for the SDK to persist step state before the runtime stops.

## Functions in this app

- **client-onboarding** (`agency/client.created`): Provisions the DB tenant (upsert into `tenants`), sends a welcome email (stub), waits up to 7 days for `agency/client.profile-completed` (matching `data.tenantId`), then sends a follow-up (stub) if the timeout is reached.
- **email-sequence** (`agency/client.created`): Time-delayed drip: after 1 day and 3 days, sends emails (stubs). Real sending (e.g. Resend/SendGrid) will be wired in a later task.

Email sending and any additional provisioning logic are currently stubs (logs / no-op); production implementation is out of scope for this setup.

## Local verification (T-16.07–T-16.09)

To run and verify Inngest locally:

1. **Start the admin app** (port 3001): from repo root run `pnpm dev --filter=@agency/agency-admin`.
2. **Start the Inngest dev server**: in a second terminal run `npx inngest-cli@latest dev -u http://localhost:3001/api/inngest`. The dev UI is at http://localhost:8288.
3. **Trigger an event**: in the dev UI use “Test Event”, or send a POST request to `http://localhost:8288/e/123` (dummy key `123`) with body:
   ```json
   {
     "name": "agency/client.created",
     "data": {
       "tenantId": "<uuid>",
       "clientName": "Riverside Hotel",
       "clientEmail": "admin@example.com"
     }
   }
   ```
   Use a valid UUID for `tenantId`. Step “provision-database” requires local Supabase running and `apps/agency-admin/.env.local` to have `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; otherwise step 1 fails but step order and retry behaviour can still be confirmed in the UI.
