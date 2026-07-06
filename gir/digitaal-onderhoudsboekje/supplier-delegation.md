# Phase 2 — SupplierDelegation

> **Context**: This is Phase 2 of the [Digitaal Onderhoudsboekje flow](./README.md). It is only required if an Installation Service Company uses a software platform to call GIR data services on their behalf. This phase can be executed independently or simultaneously with Phase 1.

## Functional Overview

The New Installation Service Company authorizes their software platform to call GIR data services on their behalf. Unlike an `AccessRight` (which is issued by the building owner and scoped to a specific building/VBO-id), a `SupplierDelegation` is issued by the installation company itself and is **generic**: it covers all transactions of a given data service type, regardless of VBO-id. One registration covers all buildings and customers of that installation company for that type.

Because the New Installation Service Company is both requester and approver, Keyper forwards the requester directly to the approval link — no separate owner involvement is needed. On approval, Keyper registers the `SupplierDelegation` policy in GIR.

| | `AccessRight` | `SupplierDelegation` |
|---|---|---|
| **Issuer** | Building owner (rights holder) | Installation company itself (NI) |
| **Subject** | Installation company (NI) | Software platform (SW2) |
| **Scope** | Resource-specific (VBO-id) | Generic (type level, `resourceId: "*"`) |
| **Trigger** | Once per customer/building relationship | Once per software relationship |

| Actor | Role |
|-------|------|
| **New Installation Service Company** | Initiates and self-approves the delegation to their software platform. |
| **TN GIR App** | Collects software platform details and hands off to Keyper. |
| **Keyper** | Orchestrates the self-approval flow and registers the policy in GIR. |
| **New Installation Service Company's software** | Receives the delegation; authorized to call GIR data services on behalf of NI in Phase 3. |
| **GIR** | Stores the resulting `SupplierDelegation` policy. |

```likec4
// view: dob_phase2
specification {
  element actor
  element system
}

model {
  ni = actor 'New Installation Service Company'
  app = system 'TN GIR App'
  keyper = system 'Keyper'
  gir = system 'GIR'
  ni_software = system 'NI software'
}

views {
  dynamic view dob_phase2 {
    title 'Phase 2 — SupplierDelegation'
    variant sequence

    ni -> app 'Supply software platform details'
    app -> keyper 'SupplierDelegation request (NI as requester and approver)'
    keyper -> ni 'Approval link by email'
    ni -> keyper 'Authenticate via eHerkenning and approve'
    keyper -> gir 'Register SupplierDelegation (New Installation Service Company → NI software)'
    gir -> keyper 'Confirm'
    keyper -> ni_software 'Notify [optional]'
  }
}
```

## Technical Implementation

### Prerequisites

| Requirement | Details |
|-------------|---------|
| Software platform details | Name and DSGO DID of the New Installation Service Company's software party |

### Step 1: Submit the SupplierDelegation request

The New Installation Service Company supplies the software platform details in the TN GIR App and selects which GIR data service types to delegate. For `digitaal onderhoudsboekje`, this is `GIRBasisdataMessage` and `GIRMaintenanceLog`. The TN GIR App forwards the user directly to the Keyper approval screen. The New Installation Service Company authenticates via eHerkenning and self-approves.

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
- NI may have multiple active `SupplierDelegation` policies simultaneously — for example, different software platforms per data type, or two platforms in parallel during a migration.

> The `SupplierDelegation` mechanism is defined in the [DSGO afsprakenstelsel ➚](https://afsprakenstelseldsgo.atlassian.net/wiki/spaces/dsgo/pages/1025933400).

🔗 [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)

### Step 2: Inform the software platform

After approval, the New Installation Service Company informs their software platform of the delegation. The software platform also needs the relevant VBO-id(s) from the New Installation Service Company for business context (which buildings to query), but this is separate from the delegation itself — the `SupplierDelegation` already covers all buildings and customers of that installation company for the delegated type.

### Step 3: Revoke a SupplierDelegation

The New Installation Service Company can revoke a `SupplierDelegation` themselves via the Keyper Manager portal. No involvement of the building owner is required.

---

## Authorization check in Phase 3

When the previous installation service company's software receives a data request from NI's software platform (SW2), it performs two checks against GIR:

1. **AccessRight check** — Is there a valid `AccessRight` (owner → NI) for this specific VBO-id and data service type?
2. **SupplierDelegation check** — Is there a valid `SupplierDelegation` (NI → SW2) for this data service type? Since `resourceId` is always `"*"`, no VBO-id match is needed.

Both checks must pass for the request to be authorized. These may be implemented as a combined enforcement step in GIR.

## Known blockers

| Blocker | Description | Status |
|---------|-------------|--------|
| **Wildcard `resourceId`** | Whether GIR accepts `resourceId: "*"` or requires the field to be omitted for a generic match is to be confirmed during implementation. | Open |
| **`action: "*"`** | Whether GIR accepts `action: "*"` or requires separate policies per action (read/write) is to be confirmed during implementation. | Open |
| **`license` field value** | The license identifier to use has not been finalized. | Open |
