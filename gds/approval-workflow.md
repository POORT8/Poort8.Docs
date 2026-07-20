# Keyper Approval Workflow

This guide is for **David** — a data service consumer who needs to request building owner approval before accessing building sensor data. It covers how to use the Keyper API to create approval requests and track their status.

## When to use this

[Requesting API Access](requesting-api-access.md) grants your application the ability to *call* a provider's API. This guide covers the next step: obtaining **data-level authorization** for specific buildings through building owner approval.

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Application registered | You have registered your application in the Self-Service Portal — see [Requesting API Access](requesting-api-access.md) Step 1 |
| API access approved | Charlie has approved your application's access to their API |
| Keyper API access approved | You have requested access to **Keyper** for your application in the Self-Service Portal and the request is approved |
| Building details known | VBO ID of the target building and building owner's organization |

### One-time setup: Request access to Keyper

Keyper is registered as an API in the GDS Self-Service Portal, just like any other system. Before you can call the Keyper API, your application needs access to it.

1. Log in to the [Self-Service Portal](https://gds-preview.poort8.nl/portal)
2. Navigate to the **Catalogue** and search for **Keyper**
3. Click **Request Access**

Your request will have status **Pending** until approved.

> **You can continue implementing while you wait.** The repeatable steps in this guide can be built and tested independently of your access request status. Your approval requests will not go through until your application has been granted access to Keyper.

## Overview

```likec4
// view: approval_workflow
specification {
  element actor
  element system
}

model {
  alice = actor 'Building Manager (Alice)'
  david = actor 'Your Platform'
  keyper = system 'Keyper Approve'
  bob = actor 'Building Owner (Bob)'
  ar = system 'GDS Authorization Registry'
}

views {
  dynamic view approval_workflow {
    title 'Keyper Approval Workflow'
    variant sequence

    alice -> david 'Requests access to building data'
    david -> keyper 'POST /v1/api/approval-links'
    keyper -> david '201 Created (approval link ID)'
    keyper -> bob 'Email with approval link'
    bob -> keyper 'Opens link, reviews request'
    bob -> keyper 'Approves + enters verification code'
    keyper -> ar 'Registers policies'
    ar -> keyper 'Policies stored'
    david -> keyper 'GET /v1/api/approval-links/{id}'
    keyper -> david 'Status = Approved'
  }
}
```

## Step 1 — Authenticate with Keyper

Use the same M2M application credentials registered in the Self-Service Portal (see [Requesting API Access](requesting-api-access.md#step-1--register-your-application)) to request an access token. Specify `keyper-api` as the scope:

```http
POST https://auth.poort8.nl/realms/gds-preview/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
scope=keyper-api
```

Response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 300
}
```

> **Token lifetime:** Tokens are valid for **5 minutes**. Request a new token before the current one expires. Do not cache tokens beyond their expiry.

## Step 2 — Prepare required data

Gather the following before creating an approval request:

For GDS, EUID is the chosen identifier format. Use EUID consistently for `organizationId`, `issuerId`, `subjectId`, and `serviceProvider`.

### Requester information (your platform's user)

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Person initiating the request | `Alice Anderson` |
| `email` | Their email address | `alice@building-opt.nl` |
| `organization` | Consumer organization name | `Building Optimization Corp` |
| `organizationId` | Consumer organization EUID | `NLNHR.12345678` |

### Approver information (building owner)

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Building owner who will approve | `Bob Johnson` |
| `email` | Where the approval link is sent | `bob@building-owner.nl` |
| `organization` | Building owner's organization name | `Johnson Properties BV` |
| `organizationId` | Building owner's organization EUID | `NLNHR.87654321` |

### Building and policy information

| Field | Description | Example |
|-------|-------------|---------|
| `resourceId` | VBO ID (16 digits) from the Dutch BAG registry | `0363010000659001` |
| `serviceProvider` | IoT platform's organization EUID | `NLNHR.23456789` |
| `action` | `GET` (read) or `POST` (write/control) | `GET` |

> **VBO ID lookup:** Use the [PDOK BAG API ➚](https://www.pdok.nl/introductie/-/article/basisregistratie-adressen-en-gebouwen-ba-1) to find VBO IDs by building address.

## Step 3 — Understand policy levels

| Level | Resource type | Resource ID | Actions | Description |
|-------|--------------|-------------|---------|-------------|
| Building | `building` | VBO ID | `GET` / `POST` | Access to entire building and all assets |
| Asset | `asset` | Asset ID | `GET` / `POST` | Access to a specific sensor or control point |

**Action semantics:**
- `GET` — Read data (sensor measurements, metadata)
- `POST` — Write data or send control commands. Implicitly grants `GET` access

> **Pilot scope:** During the test phase, only a `GET` policy on building level (VBO ID) is used.

### Bundling policies

You can request multiple permissions in a single approval request. The building owner receives one email and makes one approval decision for all bundled policies.

Example: bundle `GET` and `POST` on the same building, or request access to multiple resource types.

## Step 4 — Create approval request

```http
POST https://keyper-preview.poort8.nl/v1/api/approval-links
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

### Request body

```json
{
  "requester": {
    "name": "Alice Anderson",
    "email": "alice@building-opt.nl",
    "organization": "Building Optimization Corp",
    "organizationId": "NLNHR.12345678"
  },
  "approver": {
    "name": "Bob Johnson",
    "email": "bob@building-owner.nl",
    "organization": "Johnson Properties BV",
    "organizationId": "NLNHR.87654321"
  },
  "dataspace": {
    "baseUrl": "https://gds-preview.poort8.nl"
  },
  "reference": "SENSOR-OPT-2025-Q4-001",
  "addPolicyTransactions": [
    {
      "license": "0005",
      "type": "building",
      "issuerId": "NLNHR.87654321",
      "subjectId": "NLNHR.12345678",
      "serviceProvider": "NLNHR.23456789",
      "action": "GET",
      "resourceId": "0363010000659001",
      "attribute": "*",
      "notBefore": 1730736000,
      "expiration": 2147483647
    }
  ],
  "orchestration": {
    "flow": "gds.klimaatsensoren@v1"
  }
}
```

### Key fields

| Field | Description |
|-------|-------------|
| `dataspace.baseUrl` | GDS Authorization Registry URL |
| `reference` | Your internal tracking reference |
| `addPolicyTransactions` | Array of policies to register upon approval |
| `orchestration.flow` | Approval workflow identifier (`gds.klimaatsensoren@v1`) |
| `notBefore` | Policy start time (Unix timestamp) |
| `expiration` | Policy end time (`2147483647` for no expiration) |

## Step 5 — Handle the response

### Success (201 Created)

```json
{
  "id": "474e19af-8165-4b85-ad03-be81f9f8dcc2",
  "reference": "SENSOR-OPT-2025-Q4-001",
  "url": "https://keyper-preview.poort8.nl/approve?id=474e19af-8165-4b85-ad03-be81f9f8dcc2&app=your-app-id",
  "expiresAtUtc": 1730739600,
  "status": "Active"
}
```

| Field | Description |
|-------|-------------|
| `id` | Unique approval link ID |
| `reference` | Your tracking reference (echoed) |
| `url` | Approval link sent to building owner |
| `expiresAtUtc` | When the link expires (Unix timestamp) |
| `status` | Status of the **approval link**: `Active` (awaiting decision), `Approved` (approver accepted), `Rejected` (approver declined), or `Expired` (link timed out). This reflects the state of the approval link only — it does **not** indicate whether the resulting policy is active or valid. Policy state is managed separately in the GDS Authorization Registry. |

**What happens next:**
1. Keyper emails Bob with the approval link
2. Bob opens the link and reviews the request
3. Bob approves or rejects
4. If approved, Bob enters an email verification code
5. Keyper registers policies in the GDS Authorization Registry

### Error responses

| Code | Cause | Action |
|------|-------|--------|
| `400 Bad Request` | Missing or invalid fields | Check `errors` object, correct fields, retry |
| `401 Unauthorized` | Missing or expired token | Request a new token, retry |
| `500 Internal Server Error` | Server-side error | Retry after short delay; contact Poort8 if persistent |

## Step 6 — Check approval status

Poll the approval link status:

```http
GET https://keyper-preview.poort8.nl/v1/api/approval-links/{APPROVAL_LINK_ID}
Authorization: Bearer <ACCESS_TOKEN>
```

Response:
```json
{
  "id": "474e19af-8165-4b85-ad03-be81f9f8dcc2",
  "reference": "SENSOR-OPT-2025-Q4-001",
  "status": "Approved"
}
```

> **Note:** The GET response returns the full approval link entity. The `status` field is the most relevant for polling purposes. It reflects the state of the **approval link** — a status of `Approved` means the approver accepted the request and Keyper has attempted to register the policies. It does **not** directly reflect whether the resulting policy is active or valid in the GDS Authorization Registry.

**Status values:**

| Status | Meaning |
|--------|---------|
| `Active` | Awaiting building owner's decision |
| `Approved` | Approved — policies are registered |
| `Rejected` | Building owner rejected the request |
| `Expired` | Link expired before a decision was made |

**Polling strategy:** Check every 5–10 minutes while status is `Active`. Stop when status changes.

## After approval

Once status is `Approved`:
1. Policies are registered in the GDS Authorization Registry
2. Your platform can request building data from Charlie's API
3. Charlie will verify the policy via [Authorization Enforcement](authorization.md) and deliver data

## Support

For questions or issues with the Keyper approval workflow:

- **Contact:** hello@poort8.nl
- **API reference:** [Keyper API documentation ➚](https://keyper-preview.poort8.nl/scalar/?api=v1)
