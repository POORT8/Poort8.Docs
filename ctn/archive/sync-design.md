## Architecture document: Keycloak v26 wrapper with no sync issues

### Scope

We are building an application wrapper on top of a managed Keycloak v26 (Cloud-IAM). The wrapper becomes the control plane for identity operations. Keycloak remains the identity system. The app DB remains the domain system.

---

## Design principles

### P1. One logical fact has one authoritative store

* Every field is owned by exactly one system.
* The non-owner system may hold a cache or projection only. It must be rebuildable.

Critical review:

* This is the only reliable way to avoid “Keycloak vs DB drift.” Any approach that treats both as authoritative becomes a dual-write problem.

### P2. Single-writer for Keycloak state

* All Keycloak mutations go through the wrapper service account.
* No manual console edits in production, except break-glass.

Critical review:

* “Policy only” is not enough. You must enforce via permissions. Otherwise drift returns.

### P3. Keycloak stores identity. The app DB stores domain

* Keycloak: users, orgs, memberships, roles, clients, authentication-relevant verification flags.
* App DB: organizational profile, billing, settings, business records, verification evidence, audit trails.

Critical review:

* Storing “domain data in Keycloak or DB” is the main sync trap. If you keep it, you will eventually duplicate fields and drift.
* Exception: small authorization metadata that must appear in tokens can live in Keycloak, but you treat it as identity-adjacent, not domain.

### P4. No cross-system invariants without an orchestrator

* Any multi-step provisioning is a workflow. It cannot be a distributed transaction.
* Use idempotency + saga semantics.

Critical review:

* If you try to “make it atomic” with write-through across Keycloak and DB, you create partial-failure states you cannot reason about.

### P5. Idempotent APIs and deterministic retries

* Every mutating wrapper endpoint is idempotent.
* Keycloak Admin API calls are retried safely.

Critical review:

* Without idempotency, retries create duplicates (duplicate roles, memberships, orgs).

### P6. Auditability and drift detection are part of the design

* Every mutation emits an audit record.
* Keycloak admin events are enabled for forensic traceability.
* Periodic reconciliation detects break-glass changes.

Cloud-IAM and Keycloak support saving events and including representations for admin events, which helps audits. ([Cloud-IAM Documentation][1])

### P7. Tokens carry only what services need for authorization

* Prefer role and org identifiers in tokens.
* Avoid large domain payloads in tokens.

Keycloak Organizations claims do not include org id and attributes by default. You can enable “Add organization id” and “Add organization attributes” in the mapper when needed. ([Red Hat Docs][2])

---

## Data ownership and invariants

### Authoritative ownership

**Keycloak (SoT)**

* User identity: username, email, status, credentials, required actions
* Organization: org entity, domains, membership linkage
* Roles and role mappings
* Clients (if you truly need runtime client provisioning)
* Verification flags that affect authentication or authorization (examples: `email_verified`, “MFA enabled”, “KYC level”)

**App DB (SoT)**

* Organization profile: display name, billing ids, plan, settings, feature flags
* Verification evidence and history (documents, steps, timestamps, approvers)
* Application audit log (who did what, correlation ids)
* Idempotency records
* Provisioning workflow state

### Forbidden duplication rule

* If a field exists in both Keycloak and DB, one of them must be explicitly labeled as:

  * **cache**, or
  * **read model projection**, rebuildable from events.

### Acceptable temporary states

To keep the system simple and correct, allow these temporary states:

* `Keycloak org exists` but `app org_profile is not ready` (provisioning in progress)
* `app org_profile exists` but `Keycloak org not ready` (if you choose DB-first workflow)

Your services must treat “not ready” as a hard stop for domain actions.

---

## High-level architecture

### Components

1. **Keycloak (Cloud-IAM managed)**

* Handles login, tokens, identity storage, org membership, role mappings.
* Admin REST API used by the wrapper.

2. **IAM Wrapper Service (your application)**

* Public API for all identity mutations and identity reads your product needs.
* Anti-corruption layer over Keycloak Admin APIs.
* Enforces invariants, validation, authorization, and audit.

3. **App Database**

* Domain system of record.
* Stores workflow state, audit logs, and domain entities.

4. **Optional worker** (defer until needed)

* Executes multi-step provisioning workflows from an outbox.
* Add only if you need guaranteed delivery at scale.

5. **Optional cache** (defer until needed)

* Cache-aside for read-heavy identity lookups.
* Never authoritative.

### Text diagram

```
[Apps / Admin UI / Services]
          |
          v
   [IAM Wrapper Service]  ----->  [Keycloak Admin API]  -----> [Keycloak]
          |                       (resilient HTTP client)
          v
      [App DB]
      (domain data only)
```

---

## Key design decisions with critical review

### Decision D1: Domain data lives in the app DB, not “either place”

Why:

* It prevents ownership ambiguity.
* Keycloak is optimized for identity, not arbitrary domain aggregates.

Tradeoff:

* You do one extra call (or join) when a screen needs both identity and domain profile data.
  Mitigation:
* Build a read API in the wrapper that composes Keycloak + DB responses.
* Add cache-aside if needed.

### Decision D2: Use Keycloak org claim for authorization, not DB joins inside services

Why:

* Services can authorize based on token claims without calling the wrapper for every request.

Keycloak supports adding organization id and attributes into the organization claim via mapper settings. ([Red Hat Docs][2])

Tradeoff:

* Token size and claim stability.
  Mitigation:
* Include only `org_id` (and possibly a small `tenant_uid` attribute). Keep it minimal.

### Decision D3: Avoid write-through as a “sync strategy”

Write-through is only acceptable when the second write is:

* a cache, or
* a rebuildable read model.

Critical review:

* Write-through across Keycloak + DB as two sources of truth is a dual-write failure mode. It is not “simple correctness.” It is “simple to implement, hard to operate.”

### Decision D4: Start with synchronous calls, add outbox only if needed

Why:

* Most operations are single-step (one Keycloak call).
* Resilient HTTP clients with retry policies handle transient failures.
* The outbox pattern adds operational complexity (worker, table, monitoring).

Guideline:

* Use synchronous calls with retry for single-step operations (add member, assign role, update user).
* Reserve outbox + worker for true multi-step workflows only if you hit reliability issues at scale.
* Start simple. Add complexity when you have evidence you need it.

### Decision D5: Extensions in Keycloak are optional, not required

Cloud-IAM supports custom extensions, but on dedicated deployments and with support plan prerequisites. ([Cloud-IAM Documentation][3])

Critical review:

* Extensions increase operational coupling to Keycloak upgrades and restarts.
* Start without them. Add only if you need server-side event streaming or deep customization.

---

## Architecture details

## 1) Wrapper service responsibilities

### API surface

* **Commands** (mutations)

  * Create organization
  * Update organization identity-adjacent metadata (domains, membership policy)
  * Invite / add member
  * Remove member
  * Create user
  * Update user identity fields
  * Assign roles
  * Set verification flags (auth-relevant)
* **Queries** (reads)

  * Get organization (composed: Keycloak org + DB org_profile)
  * Get user (Keycloak + optional DB user_profile if you ever add one)
  * List org members (Keycloak) with profile summary (DB)

### Internal modules (simple structure)

* `api`: HTTP handlers, request validation, authz
* `keycloak_adapter`: typed wrapper over Admin REST APIs
* `domain_store`: DB repositories
* `workflow`: saga/outbox logic
* `audit`: structured audit log + correlation ids

### Design patterns applied

* Anti-corruption layer (wrapper isolates Keycloak model)
* Command handlers + domain services (explicit invariants)
* Natural key idempotency (e.g., KvK number uniqueness)
* Saga for multi-step operations (if needed)
* Transactional outbox (defer until needed)

---

## 2) Data model in the app DB (minimal)

### Tables

Add tables only when you have domain data that doesn't belong in Keycloak.

1. `org_profile` (add when needed)

* `keycloak_org_id` (unique, indexed) — reference to Keycloak org
* `tenant_id` (PK, your domain identifier) — decouples from Keycloak
* `display_name`
* `billing_customer_id`
* `plan`
* `settings_json`
* timestamps

Note: If orgs don't have billing, plans, or settings yet, skip this table entirely. Use Keycloak orgs directly.

2. `outbox` (add later if needed)

Only add this table if you need multi-step workflows with guaranteed delivery:

* `message_id` (PK)
* `idempotency_key` — doubles as idempotency record
* `type`
* `payload_json`
* `status`
* `attempts`
* `next_attempt_at`
* `locked_until` — prevents concurrent processing
* timestamps

---

## 3) Provisioning workflows

### Workflow W1: Create organization (recommended Keycloak-first for simplicity)

Goal: create org in Keycloak, optionally create `org_profile` if domain data is needed.

Steps (simple path):

1. Wrapper receives `POST /orgs` with `Idempotency-Key`.
2. Check idempotency table — return cached response if exists.
3. Call Keycloak Admin API to create org (with resilient HTTP client + retry).
4. If you need domain data: create `org_profile` in DB with `keycloak_org_id`.
5. Store response in idempotency table.
6. Return success.

Why Keycloak-first:

* Synchronous response — simpler UX, easier to debug.
* No worker, no outbox table, no background job monitoring.
* Keycloak org creation is the critical path; if it fails, you want to know immediately.

Keycloak provides an admin organizations resource with create and search capabilities. ([keycloak.org][4])

**Idempotency via natural keys:**

When you have a natural unique identifier (e.g., KvK number), use it for idempotency instead of a separate table:

```csharp
// Check if org already exists (idempotent)
if (await identity.GetOrganizationByKvk(req.KvkNumber, ct) is { } existing)
    return existing.Id;

// Create with unique alias (Keycloak enforces uniqueness)
try
{
    org = await identity.CreateOrganization(new(req.Name, req.KvkNumber), ct);
}
catch (ApiException ex) when (ex.ResponseStatusCode == 409)
{
    // Race condition: another request created it first
    return (await identity.GetOrganizationByKvk(req.KvkNumber, ct))!.Id;
}
```

This approach is simpler than a dedicated idempotency table and leverages Keycloak's built-in uniqueness constraints.

Failure handling:

* Keycloak call fails → return error, client retries with same idempotency key.
* Keycloak succeeds, DB fails → use inline compensation:
  1. Attempt to disable the orphaned Keycloak org (3 retries with exponential backoff).
  2. If compensation succeeds, re-throw the original error for client retry.
  3. If compensation fails after all retries, log as `ORPHAN` alert for manual cleanup.

```csharp
catch (Exception ex)
{
    var compensated = false;
    for (var i = 0; i < 3; i++)
    {
        try { await keycloak.DisableOrganization(org.Id, ct); compensated = true; break; }
        catch { await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, i)), ct); }
    }
    if (!compensated)
        Log.Error("P8.err ORPHAN: Keycloak org {OrgId} needs manual cleanup", org.Id);
    throw;
}
```

This approach is immediate, bounded (3 attempts), and leaves a clear audit trail for rare failures.

Alternative (DB-first with outbox):

* Use this only if you need guaranteed delivery at scale or have strict SLAs.
* Adds: outbox table, background worker, provisioning status tracking.

### Workflow W2: Invite member

* Wrapper validates org status ACTIVE.
* Wrapper calls Keycloak to add member or send invitation.
* Wrapper writes audit record.

### Workflow W3: Set verification status

* Wrapper stores evidence and history in DB.
* Wrapper sets only the relevant flag in Keycloak (or required action), so auth decisions use Keycloak data.

---

## 4) Authorization and token strategy

### Token contents

* Roles
* `organization` claim with:

  * org id
  * optionally org attributes (only those needed)

Keycloak org id and org attributes are not included by default in org claim, but can be enabled in the mapper. ([Red Hat Docs][2])

Rule:

* Domain services authorize from token only.
* Domain services do not call Keycloak for authorization.

### Wrapper authorization

* Wrapper must check the caller’s token roles and org membership before mutating Keycloak.
* Wrapper uses a service account to Keycloak Admin API with minimal permissions.

---

## 5) Consistency and failure handling

### What “no sync issues” means in this design

* There is no “sync loop” between Keycloak and DB for the same fields.
* The only cross-system coupling is the provisioning workflow state.

### Failure modes and handling

1. Keycloak write fails

* Workflow retries with backoff.
* Org stays PROVISIONING.
* No domain operations allowed.

2. Wrapper crashes mid-request

* Idempotency key ensures safe retry.

3. Break-glass change in Keycloak console

* Detected by:

  * periodic reconciliation job, and or
  * Keycloak admin event logs (recommended)

Cloud-IAM documentation recommends enabling admin events and optionally including full representations for audits. ([Cloud-IAM Documentation][1])

4. Keycloak upgrade changes org claim behavior

* You treat token claim format as a contract.
* Add automated integration tests that validate issued tokens.

---

## 6) Observability and audit

### Wrapper

* Structured logs with `correlation_id`
* Audit log table for every mutation
* Metrics: Keycloak call latency, error rates, retry counts, provisioning age

### Keycloak (Cloud-IAM)

* Enable admin events and event retention for forensics. ([Cloud-IAM Documentation][1])
* Forward logs to your SIEM via log collectors if needed. ([Cloud-IAM Documentation][1])

### Optional: Event streaming extension

If you want near-real-time projections:

* Implement Keycloak event listener or exporter.
* Cloud-IAM supports extensions, but requires dedicated deployment and the right support plan/process. ([Cloud-IAM Documentation][3])

---

## Recommended “minimum viable” architecture baseline

The simplest version that prevents sync issues:

1. Keycloak is SoT for identity.
2. App DB is SoT for domain (add tables only when you have domain data).
3. Wrapper is single writer to Keycloak.
4. **Synchronous Keycloak calls with resilient HTTP client** (retry policies, circuit breaker).
5. Idempotency keys on mutation endpoints.
6. Tokens include `org_id`.
7. Keycloak admin events enabled for audit.

### What to defer until you need it

* `org_profile` table — add when you have billing, plans, or settings.
* Outbox + worker — add when you need guaranteed multi-step workflows.
* Cache layer — add when read latency becomes a problem.
* Reconciliation job — add when break-glass edits become a concern.

This is simple. It is correct under partial failures. It lets you add complexity incrementally based on real needs.

---
