# Phase 1 — Keyper Approval

> Part of the [Registrar Integration Guide](./README.md). Can be started simultaneously with [Token Acquisition](./token-acquisition.md).

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
    "requester": { "organizationId": "did:ishare:EU.NL.NTRNL-<REGISTRAR_KVK>" },
    "approver": { "organizationId": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>", "email": "<OWNER_EMAIL>" },
    "dataspace": { "baseUrl": "https://gir-preview.poort8.nl" },
    "reference": "<YOUR_REFERENCE>",
    "addPolicyTransactions": [
        {
            "type": "GIRBasisdataMessage",
            "action": "write",
            "issuerId": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>",
            "subjectId": "did:ishare:EU.NL.NTRNL-<REGISTRAR_KVK>",
            "resourceId": "<BAG_VBO_ID_16_DIGITS>",
            "attribute": "*",
            "serviceProvider": "did:ishare:EU.NL.NTRNL-<GIR_ORG_ID>"
        }
    ],
    "orchestration": { "flow": "dsgo.gir@v1" }
}
```

Store the returned `id` for status polling.

### Step 2 — Poll for approval status

```http
GET https://keyper-preview.poort8.nl/v1/api/approval-links/<APPROVAL_LINK_ID>
Authorization: Bearer <KEYPER_ACCESS_TOKEN>
```

Status lifecycle: `Active` → `Approved`, `Rejected`, or `Expired`. On `Rejected` or `Expired`, create a new request with a new `reference`.

### Attribute filtering

Set `attribute` to `*` for unrestricted write access, or use space-separated NLSFB tokens to limit scope:

```text
gir:class:nlsfb_tabel1=52.16 gir:class:nlsfb_tabel1=52.20
```

Multiple tokens are evaluated as OR. If no class token is present, classification is unfiltered.

## References

- [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)

## Next

[Token Acquisition](./token-acquisition.md)
