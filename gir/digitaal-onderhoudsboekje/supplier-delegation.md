# Phase 2 — SupplierDelegation

> **Context**: This is Phase 2 of the [Digitaal Onderhoudsboekje flow](./README.md). It is only required if an Installation Service Company uses an external software supplier to call GIR data services on their behalf. This phase can be executed independently or simultaneously with Phase 1.

## Functional Overview

The New Installation Service Company authorizes their software supplier to call GIR data services on their behalf. Unlike an `AccessRight` (which is issued by the building owner and scoped to a specific building/VBO-id), a `SupplierDelegation` is issued by the installation company itself and is **generic**: it covers all transactions of a given data service type, regardless of VBO-id. One registration covers all buildings and customers of that installation company for that type.

Because the New Installation Service Company is both requester and approver, Keyper forwards the requester directly to the approval link — no separate owner involvement is needed. On approval, Keyper registers the `SupplierDelegation` policy in GIR.

| | `AccessRight` | `SupplierDelegation` |
|---|---|---|
| **Issuer** | Building owner (rights holder) | New installation company itself (NI) |
| **Subject** | New installation company (NI) | Software supplier (SW2) |
| **Scope** | Resource-specific (VBO-id) | Generic (type level, `resourceId: "*"`) |
| **Trigger** | Once per customer/building relationship | Once per software relationship |

| Actor | Role |
|-------|------|
| **New Installation Service Company** | Initiates and self-approves the delegation to their software supplier. |
| **TN GIR App** | Collects software supplier details and hands off to Keyper. |
| **Keyper** | Orchestrates the self-approval flow and registers the policy in GIR. |
| **New Installation Service Supplier's software** | Receives the delegation; authorized to call GIR data services on behalf of NI in Phase 3. |
| **GIR** | Stores the resulting `SupplierDelegation` policy. |

```likec4
// view: dob_phase2
specification {
  element actor
  element system
}

model {
  supplier_delegation_ni = actor 'New Installation Service Company'
  supplier_delegation_app = system 'TN GIR App'
  supplier_delegation_keyper = system 'Keyper'
  supplier_delegation_gir = system 'GIR'
}

views {
  dynamic view dob_phase2 {
    title 'Phase 2 — SupplierDelegation'
    variant sequence

    supplier_delegation_ni -> supplier_delegation_app 'Supply software supplier details'
    supplier_delegation_app -> supplier_delegation_keyper 'SupplierDelegation request (NI as requester and approver)'
    supplier_delegation_app -> supplier_delegation_ni 'Redirect to Keyper approval screen'
    supplier_delegation_ni -> supplier_delegation_keyper 'Authenticate via eHerkenning and approve'
    supplier_delegation_keyper -> supplier_delegation_gir 'Register SupplierDelegation (New Installation Service Company → NI software)'
    supplier_delegation_gir -> supplier_delegation_ni 'Confirm'
  }
}
```

## Technical Implementation

### Prerequisites

| Requirement | Details |
|-------------|---------|
| DSGO membership | All parties must be registered in DSGO with their respective roles |

### Step 1: Submit the SupplierDelegation request

The New Installation Service Company supplies the software supplier details in the TN GIR App and selects which GIR data service types to delegate. For `digitaal onderhoudsboekje`, this is `GIRBasisdataMessage` and `GIRMaintenanceLog`. The TN GIR App forwards the user directly to the Keyper approval screen. The New Installation Service Company authenticates via eHerkenning and self-approves.

The TN GIR App submits the approval link request to Keyper with both the requester and approver set to the New Installation Service Company (self-approval flow):

```http
POST https://keyper-preview.poort8.nl/v1/api/approval-links
Authorization: Bearer <APP_ACCESS_TOKEN>
Content-Type: application/json

{
  "requester": {
    "organizationId": "did:ishare:EU.NL.NTRNL-<NI_KVK>"
  },
  "approver": {
    "organizationId": "did:ishare:EU.NL.NTRNL-<NI_KVK>"
  },
  "dataspace": {
    "baseUrl": "https://gir-preview.poort8.nl"
  },
  "addPolicyTransactions": [
    {
      "type": "GIRMaintenanceLog",
      "action": "*",
      "issuerId": "did:ishare:EU.NL.NTRNL-<NI_KVK>",
      "subjectId": "did:ishare:EU.NL.NTRNL-<SW2_KVK>",
      "serviceProvider": "*",
      "resourceId": "*",
      "attribute": "*",
      "notBefore": "<UNIX TIMESTAMP>",
      "expiration": "<UNIX TIMESTAMP>"
    },
    {
      "type": "GIRBasisdataMessage",
      "action": "*",
      "issuerId": "did:ishare:EU.NL.NTRNL-<NI_KVK>",
      "subjectId": "did:ishare:EU.NL.NTRNL-<SW2_KVK>",
      "serviceProvider": "*",
      "resourceId": "*",
      "attribute": "*",
      "notBefore": "<UNIX TIMESTAMP>",
      "expiration": "<UNIX TIMESTAMP>"
    }
  ],
  "orchestration": {
    "flow": "gir.registrar@v1"
  }
}
```

The Keyper response includes a `url` field — the TN GIR App must redirect the New Installation Service Company to this URL to complete the self-approval.

On approval, Keyper registers one `SupplierDelegation` policy per selected data service type in GIR (example for `GIRMaintenanceLog`):

```json
{
  "type": "GIRMaintenanceLog",
  "action": "*",
  "license": "[PLACEHOLDER]",
  "issuedAt": "<UNIX TIMESTAMP>",
  "issuerId": "did:ishare:EU.NL.NTRNL-<NI KVK>",
  "subjectId": "did:ishare:EU.NL.NTRNL-<SW2 KVK>",
  "serviceProvider": "*",
  "resourceId": "*",
  "attribute": "*",
  "notBefore": "<UNIX TIMESTAMP>",
  "expiration": "<UNIX TIMESTAMP or open-ended>"
}
```

- `resourceId: "*"` and `attribute: "*"` make the delegation generic — not tied to a specific VBO-id or NL/SfB scope.
- `action: "*"` covers all actions NI is authorized to perform on that type.
- One policy entry per data service type (separate entries for `GIRBasisdataMessage` and `GIRMaintenanceLog`).
- NI may have multiple active `SupplierDelegation` policies simultaneously — for example, different software suppliers per data type, or two suppliers in parallel during a migration.

> The `SupplierDelegation` mechanism is defined in the [DSGO afsprakenstelsel ➚](https://afsprakenstelseldsgo.atlassian.net/wiki/spaces/dsgo/pages/1025933400).

🔗 [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)

### Step 2: Inform the software supplier

After approval, the New Installation Service Company informs their software supplier of the delegation. The software supplier also needs the relevant VBO-id(s) from the New Installation Service Company for business context (which buildings to query), but this is separate from the delegation itself — the `SupplierDelegation` already covers all buildings and customers of that installation company for the delegated type.

### Step 3: Revoke a SupplierDelegation

The New Installation Service Company can revoke a `SupplierDelegation` themselves via the Keyper Manager portal. No involvement of the building owner is required.

🔗 [Keyper Manager ➚](https://keyper-preview.poort8.nl/)

---

## Authorization check in Phase 3

For the full authorization check flow, including how to handle the case where a software supplier calls on behalf of the New Installation Service Company, see [Step 3: Verify the AccessRight in GIR](https://docs.poort8.nl/#/gir/digitaal-onderhoudsboekje/m2m-maintenance-data-transfer?id=step-3-verify-the-accessright-in-gir).

## Known blockers

| Blocker | Description | Status |
|---------|-------------|--------|
| **`license` field value** | The license identifier to use has not been finalized. | Open |
