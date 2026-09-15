# Phase 1 — Approval Flow

> Part of the [Data Consumer Integration Guide](data-consumer-flow.md). Can be started simultaneously with [Token Acquisition](connect-token.md).

| Actor | Role |
|-------|------|
| **Your application** | Creates the approval link request in Keyper. |
| **Keyper** | Orchestrates the approval flow via eHerkenning. Registers the read policy in GIR on approval. |
| **Installation owner** | Approves or rejects the request. |
| **GIR** | Stores the resulting read policy. |

```likec4
// view: data_consumer_approval_flow
specification {
  element actor
  element system
}

model {
  app = actor 'Your Application'
  keyper = system 'Keyper'
  owner = actor 'Installation Owner'
  gir = system 'GIR'
}

views {
  dynamic view data_consumer_approval_flow {
    title 'Approval Flow'
    variant sequence

    app -> keyper 'Create approval link'
    keyper -> owner 'Send approval request'
    owner -> keyper 'Authenticate and approve'
    keyper -> gir 'Register read policy'
  }
}
```

## Technical Implementation

### Step 1 — Create approval link

The `resourceId` and data consumer `subjectId` must exactly match what you will use in the GIR read request, or the query may return no data even though the approval flow itself succeeded. Keyper derives the policy's `issuerId` from `approver.organizationId`.

For full request and response schema, see [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1).

```http
POST https://keyper-preview.poort8.nl/v1/api/approval-links
Authorization: Bearer <KEYPER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
    "requester": {
        "name": "<CONSUMER_NAME>",
        "email": "<CONSUMER_EMAIL>",
        "organization": "<CONSUMER_ORGANIZATION>",
        "organizationId": "did:ishare:EU.NL.NTRNL-<DATA_SERVICE_CONSUMER_KVK>"
    },
    "approver": {
        "name": "<OWNER_NAME>",
        "email": "<OWNER_EMAIL>",
        "organization": "<OWNER_ORGANIZATION>",
        "organizationId": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>"
    },
    "dataspace": { "baseUrl": "https://gir-preview.poort8.nl" },
    "addPolicyTransactions": [
        {
            "subjectId": "did:ishare:EU.NL.NTRNL-<DATA_SERVICE_CONSUMER_KVK>",
            "resourceId": "<BAG_VBO_ID_16_DIGITS>"
        }
    ],
    "orchestration": { "flow": "dsgo.gir-consumer@v1" }
}
```

Keyper supplies these policy values: `issuerId` = `approver.organizationId`, `type` = `GIRBasisdataMessage`, `action` = `can_read`, `serviceProvider` = `did:ishare:EU.NL.NTRNL-76660680`, `license` = `DSGO.0010`, and `useCase` = `dsgo.gir-consumer`. `attribute` is optional and defaults to `*` (see [Attribute filtering](#attribute-filtering) below). `notBefore` and `expiration` are optional Unix timestamps in seconds; if omitted, Keyper defaults them to `now` and `now` + 1 year respectively. `issuedAt` is set when the policy is approved and must not be supplied. Supplying a different flow-owned value returns `400 Bad Request`.

Store the returned `id` for status polling.

### Step 2 — Poll for approval status

```http
GET https://keyper-preview.poort8.nl/v1/api/approval-links/{id}
Authorization: Bearer <KEYPER_ACCESS_TOKEN>
```

Status lifecycle: `Active` → `Approved`, `Rejected`, or `Expired`. On `Rejected` or `Expired`, create a new request.

> **Note:** The `status` field reflects the state of the **approval link**, not the state of the resulting read policy in GIR. A status of `Approved` means the installation owner accepted the request and Keyper has registered the policy — but you must still verify the actual data retrieval separately (see [Step 3: Retrieve installation data](data-consumer-flow.md#step-3-retrieve-installation-data)).

### Attribute filtering

`attribute` is optional and defaults to `*` for unrestricted read access to the target VBO-id. Classification-based scoping (via a policy's `rules` field) can further restrict access to specific installations — see [Digitaal Onderhoudsboekje — Phase 1](digitaal-onderhoudsboekje-owner-authorization.md#step-3-keyper-registers-the-accessright-in-gir) for how `rules` scoping and NL/SfB classifications work; the same mechanism applies here.

### NL/SfB filtering

NL/SfB is the standard classification for building and installation elements used across the Dutch construction sector. `NLSfB-<code>` refers to *table 1* of that standard (functional elements/installations) — e.g. `52.16` identifies heat pumps. A future change ([NB-1748](https://linear.app/poort8/issue/NB-1748/nlsfb-filtering-wijziging-naar-attribute-notatie)) will let requesters pass NL/SfB codes directly via `attribute` claim notation, e.g. `gir:class:nlsfb_tabel1=52.16 gir:class:nlsfb_tabel1=52.20`.

## References

- [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)

## Next

[Step 2: Obtain a DSGO bearer token](data-consumer-flow.md#step-2-obtain-a-dsgo-bearer-token)
