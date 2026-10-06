# Phase 2 — SupplierDelegation

> **Context**: This is Phase 2 of the [Digitaal Onderhoudsboekje flow](digitaal-onderhoudsboekje.md). It is only required if a New Installation Service Company uses an external Software Supplier to call GIR data services on their behalf. This phase can be executed independently or simultaneously with Phase 1.

## Functional Overview

The New Installation Service Company authorizes their Software Supplier to call GIR data services on their behalf. Unlike an `AccessRight` (which is issued by the building owner and scoped to a specific building/VBO-id), a `SupplierDelegation` is issued by the New Installation Service Company itself and is **generic**: it covers all transactions of a given data service type, regardless of VBO-id. One registration covers all buildings and customers of that New Installation Service Company for that type.

Because the New Installation Service Company is both requester and approver, Keyper forwards the requester directly to the approval link — no separate owner involvement is needed. On approval, Keyper registers the `SupplierDelegation` policy in GIR.

| | `AccessRight` | `SupplierDelegation` |
|---|---|---|
| **Issuer** | Building owner (rights holder) | New Installation Service Company |
| **Subject** | New Installation Service Company | Software Supplier |
| **Scope** | Resource-specific (VBO-id) | Generic (type level, `resourceId: "*"`) |
| **Trigger** | Once per customer/building relationship | Once per software relationship |

| Actor | Role |
|-------|------|
| **New Installation Service Company** | Initiates and self-approves the delegation to their Software Supplier. |
| **TN GIR App** | Collects Software Supplier details and hands off to Keyper. |
| **Keyper** | Orchestrates the self-approval flow and registers the policy in GIR. |
| **Software Supplier** | Receives the delegation; authorized to call GIR data services on behalf of the New Installation Service Company in Phase 3. |
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

    supplier_delegation_ni -> supplier_delegation_app 'Supply Software Supplier details'
    supplier_delegation_app -> supplier_delegation_keyper 'SupplierDelegation request (New Installation Service Company as requester and approver)'
    supplier_delegation_app -> supplier_delegation_ni 'Redirect to Keyper approval screen'
    supplier_delegation_ni -> supplier_delegation_keyper 'Authenticate via eHerkenning and approve'
    supplier_delegation_keyper -> supplier_delegation_gir 'Register SupplierDelegation (New Installation Service Company → Software Supplier)'
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

The New Installation Service Company supplies the Software Supplier details in the TN GIR App and selects which GIR data service types to delegate. For `digitaal onderhoudsboekje`, this is `GIRBasisdataMessage` and `GIRMaintenanceLog`. The TN GIR App forwards the user directly to the Keyper approval screen. The New Installation Service Company authenticates via eHerkenning and self-approves.

The TN GIR App submits the approval link request to Keyper with both the requester and approver set to the New Installation Service Company (self-approval flow):

```http
POST https://keyper-preview.poort8.nl/v1/api/approval-links
Authorization: Bearer <APP_ACCESS_TOKEN>
Content-Type: application/json

{
  "requester": {
    "name": "<NEW INSTALLATION SERVICE COMPANY CONTACT>",
    "email": "<NEW_INSTALLATION_SERVICE_COMPANY_EMAIL>",
    "organization": "<NEW INSTALLATION SERVICE COMPANY>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<NEW_INSTALLATION_SERVICE_COMPANY_KVK>"
  },
  "approver": {
    "email": "<NEW_INSTALLATION_SERVICE_COMPANY_APPROVER_EMAIL>",
    "organization": "<NEW INSTALLATION SERVICE COMPANY>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<NEW_INSTALLATION_SERVICE_COMPANY_KVK>"
  },
  "dataspace": {
    "baseUrl": "https://gir-preview.poort8.nl"
  },
  "addPolicyTransactions": [
    {
      "type": "GIRMaintenanceLog",
      "action": "*",
      "license": "DSGO.0010",
      "subjectId": "did:ishare:EU.NL.NTRNL-<SOFTWARE_SUPPLIER_KVK>",
      "resourceId": "*",
      "attribute": "*",
      "notBefore": "<UNIX TIMESTAMP>",
      "expiration": "<UNIX TIMESTAMP>"
    },
    {
      "type": "GIRBasisdataMessage",
      "action": "*",
      "license": "DSGO.0010",
      "subjectId": "did:ishare:EU.NL.NTRNL-<SOFTWARE_SUPPLIER_KVK>",
      "resourceId": "*",
      "attribute": "*",
      "notBefore": "<UNIX TIMESTAMP>",
      "expiration": "<UNIX TIMESTAMP>"
    }
  ],
  "orchestration": {
    "flow": "dsgo.gir-supplier-delegation@v1"
  }
}
```

The Keyper response includes a `url` field — the TN GIR App must redirect the New Installation Service Company to this URL to complete the self-approval.

On approval, Keyper registers one `SupplierDelegation` policy per selected data service type in GIR (example for `GIRMaintenanceLog`):

```json
{
  "type": "GIRMaintenanceLog",
  "action": "*",
  "license": "DSGO.0010",
  "issuedAt": "<UNIX TIMESTAMP>",
  "issuerId": "did:ishare:EU.NL.NTRNL-<NEW INSTALLATION SERVICE COMPANY KVK>",
  "subjectId": "did:ishare:EU.NL.NTRNL-<SOFTWARE SUPPLIER KVK>",
  "serviceProvider": "*",
  "resourceId": "*",
  "attribute": "*",
  "notBefore": "<UNIX TIMESTAMP>",
  "expiration": "<UNIX TIMESTAMP or open-ended>"
}
```

- `resourceId: "*"` and `attribute: "*"` make the delegation generic — not tied to a specific VBO-id or NL/SfB scope.
- `action: "*"` covers all actions the New Installation Service Company is authorized to perform on that type.
- One policy entry per data service type (separate entries for `GIRBasisdataMessage` and `GIRMaintenanceLog`).
- The New Installation Service Company may have multiple active `SupplierDelegation` policies simultaneously — for example, different Software Suppliers per data type, or two suppliers in parallel during a migration.
- A generic `SupplierDelegation` does not widen what the Software Supplier can see. It only says *who* may call on the New Installation Service Company's behalf — the underlying `AccessRight` from Phase 1 remains the limiting factor, including any NL/SfB classification restriction (`rules: "Classificaties(...)"`) set on it.

> The `SupplierDelegation` mechanism is defined in the [DSGO afsprakenstelsel ➚](https://afsprakenstelseldsgo.atlassian.net/wiki/spaces/dsgo/pages/1025933400).

🔗 [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)

### Step 2: Inform the Software Supplier

After approval, the New Installation Service Company informs their Software Supplier of the delegation. The Software Supplier also needs the relevant VBO-id(s) from the New Installation Service Company for business context (which buildings to query), but this is separate from the delegation itself — the `SupplierDelegation` already covers all buildings and customers of the New Installation Service Company for the delegated type.

### Step 3: Revoke a SupplierDelegation

The New Installation Service Company can revoke a `SupplierDelegation` themselves via the Keyper Manager portal. No involvement of the building owner is required.

🔗 [Keyper Manager ➚](https://keyper-preview.poort8.nl/)

---

## Authorization check in Phase 3

For the full authorization check flow, including how to handle the case where a Software Supplier calls on behalf of the New Installation Service Company, see [Step 3: Verify the AccessRight in GIR](https://docs.poort8.nl/#/gir/digitaal-onderhoudsboekje-m2m-maintenance-data-transfer?id=step-3-verify-the-accessright-in-gir).

> This describes the generic third-party data service pattern (e.g. `GIRMaintenanceLog`), where combined `AccessRight` + `SupplierDelegation` resolution is not yet implemented. For a Software Supplier retrieving **GIR's own** `GIRBasisdataMessage` records on behalf of an installer, GIR instead supports a `delegation_evidence` header on its `GET` endpoints today — see [Supplier delegation](retrieve-installations.md#supplier-delegation) in the retrieval docs.
