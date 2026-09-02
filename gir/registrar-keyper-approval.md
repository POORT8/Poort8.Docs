# Phase 1 — Keyper Approval

> Part of the [Registrar Integration Guide](registrar.md). Can be started simultaneously with [Token Acquisition](registrar-token-acquisition.md).

| Actor | Role |
|-------|------|
| **Your application** | Creates the approval link request in Keyper. |
| **Keyper** | Orchestrates the approval flow via eHerkenning. Registers the write policy in GIR on approval. |
| **Installation owner** | Approves or rejects the request. |
| **GIR** | Stores the resulting write policy. |

```likec4
// view: registrar_keyper_approval
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
  dynamic view registrar_keyper_approval {
    title 'Keyper Approval'
    variant sequence

    app -> keyper 'Create approval link'
    keyper -> owner 'Send approval request'
    owner -> keyper 'Authenticate and approve'
    keyper -> gir 'Register write policy'
  }
}
```

## Technical Implementation

### Step 1 — Create approval link

The `resourceId`, owner `issuerId`, and registrar `subjectId` must exactly match what you will use in the GIR write request, or records will remain `Pending`.

For full request and response schema, see [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1).

```http
POST https://keyper-preview.poort8.nl/v1/api/approval-links
Authorization: Bearer <KEYPER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
    "requester": {
        "name": "<REGISTRAR_NAME>",
        "email": "<REGISTRAR_EMAIL>",
        "organization": "<REGISTRAR_ORGANIZATION>",
        "organizationId": "did:ishare:EU.NL.NTRNL-<REGISTRAR_KVK>"
    },
    "approver": {
        "name": "<OWNER_NAME>",
        "email": "<OWNER_EMAIL>",
        "organization": "<OWNER_ORGANIZATION>",
        "organizationId": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>"
    },
    "dataspace": { "baseUrl": "https://gir-preview.poort8.nl" },
    "reference": "<YOUR_REFERENCE>",
    "addPolicyTransactions": [
        {
            "type": "GIRBasisdataMessage",
            "action": "can_write",
            "license": "DSGO.0010",
            "issuerId": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>",
            "subjectId": "did:ishare:EU.NL.NTRNL-<REGISTRAR_KVK>",
            "resourceId": "<BAG_VBO_ID_16_DIGITS>",
            "attribute": "*",
            "serviceProvider": "did:ishare:EU.NL.NTRNL-<GIR_ORG_ID>"
        }
    ],
    "orchestration": { "flow": "dsgo.gir-registrar@v1" }
}
```

Store the returned `id` for status polling.

### Step 2 — Poll for approval status

```http
GET https://keyper-preview.poort8.nl/v1/api/approval-links/{id}
Authorization: Bearer <KEYPER_ACCESS_TOKEN>
```

Status lifecycle: `Active` → `Approved`, `Rejected`, or `Expired`. On `Rejected` or `Expired`, create a new request with a new `reference`.

> **Note:** The `status` field reflects the state of the **approval link**, not the state of the resulting write policy in GIR. A status of `Approved` means the installation owner accepted the request and Keyper has registered the policy — but you must still verify the installation write result separately (see [Activation Verification](registrar-activation-verification.md)).

### Attribute filtering

Set `attribute` to `*` for write access — the registrar can write any installation without restriction, since it is the registrar's own write that establishes the installation's classification in the first place. Classification-based scoping (via a policy's `rules` field) applies only to read access — see [Digitaal Onderhoudsboekje — Phase 1](digitaal-onderhoudsboekje-owner-authorization.md#step-3-keyper-registers-the-accessright-in-gir).

### NL/SfB filtering

NL/SfB is the standard classification for building and installation elements used across the Dutch construction sector. `NLSfB-<code>` refers to *table 1* of that standard (functional elements/installations) — e.g. `52.16` identifies heat pumps. GIR stores one such code per registered installation, and read-side `rules` scoping matches against it.

## References

- [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)

## Next

[Token Acquisition](registrar-token-acquisition.md)
