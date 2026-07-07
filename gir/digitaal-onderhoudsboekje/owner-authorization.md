# Phase 1 — Owner Authorization

> **Context**: This is Phase 1 of the [Digitaal Onderhoudsboekje flow](./README.md). The New Installation Service Company initiates a request for the building owner to authorize the maintenance data transfer. Phase 1 and Phase 2 are independent of each other and can be initiated simultaneously.

## Functional Overview

The New Installation Service Company submits a request via the TN GIR App. Keyper sends an approval link to the building owner, who authenticates via eHerkenning and approves. On approval, Keyper registers the `AccessRight` policy in GIR.

| Actor | Role |
|-------|------|
| **New Installation Service Company** | Initiates the request. Receives confirmation after approval. |
| **TN GIR App** | Collects request data and hands off to Keyper. Holds no credentials of its own. |
| **Keyper** | Orchestrates the approval flow via eHerkenning. Registers the policy in GIR on approval. |
| **Building owner** | Approves or rejects the request via eHerkenning. |
| **GIR** | Stores the resulting `AccessRight` policy. |

```likec4
// view: dob_phase1
specification {
  element actor
  element system
}

model {
  ni = actor 'New Installation Service Company'
  app = system 'TN GIR App'
  keyper = system 'Keyper'
  owner = actor 'Building Owner'
  gir = system 'GIR'
}

views {
  dynamic view dob_phase1 {
    title 'Phase 1 — Owner Authorization'
    variant sequence

    ni -> app 'Submit request (owner, building, scope, validity)'
    app -> keyper 'Approval request'
    keyper -> owner 'Approval link by email'
    owner -> keyper 'Authenticate via eHerkenning and approve'
    keyper -> gir 'Register AccessRight policy (owner → New Installation Service Company)'
    keyper -> app 'Confirmation'
    app -> ni 'Confirmation'
  }
}
```

## Technical Implementation

### Prerequisites

| Requirement | Details |
|-------------|---------|
| DSGO membership | All parties must be registered in DSGO with their respective roles |
| Building owner details | Name, email, and KVK number of the building owner |

### Step 1: Submit the request via the TN GIR App

The New Installation Service Company opens the Digitaal Onderhoudsboekje flow in the TN GIR App. The app looks up VBO-ids for the selected building via the Kadaster/BAG API.

Collected before handoff to Keyper:

| Field | Description |
|-------|-------------|
| Building owner email | Recipient of the approval link |
| Validity period | Start and end date of the requested access |
| NL/SfB filter | *(Planned)* Optional — restricts access to specific installation types (e.g. `L` for mechanical, `L1` for HVAC) |

### Step 2: Keyper sends an approval link to the building owner

Keyper sends the building owner an email with an approval link. The owner authenticates via eHerkenning and can review the full request — which buildings, which New Installation Service Company, which scope, for how long — before approving or rejecting.

On rejection, the link expires and a new request must be initiated.

🔗 [Toestemmingen App ➚](#) <!-- TODO: replace with actual URL -->

### Step 3: Keyper registers the AccessRight in GIR

On approval, Keyper registers two `AccessRight` policies in GIR on behalf of the building owner:

```json
{
  "requester": {
    "organizationId": "did:ishare:EU.NL.NTRNL-<NEW_INSTALLATION_SERVICE_COMPANY_KVK>"
  },
  "approver": {
    "organizationId": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>"
  },
  "dataspace": {
    "baseUrl": "https://gir-preview.poort8.nl"
  },
  "addPolicyTransactions": [
    {
      "type": "GIRMaintenanceLog",
      "action": "read",
      "issuerId": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>",
      "subjectId": "did:ishare:EU.NL.NTRNL-<NEW_INSTALLATION_SERVICE_COMPANY_KVK>",
      "serviceProvider": "*",
      "resourceId": "<VBOID>",
      "attribute": "*",
      "notBefore": "<UNIX TIMESTAMP>",
      "expiration": "<UNIX TIMESTAMP>"
    },
    {
      "type": "GIRBasisdataMessage",
      "action": "read",
      "issuerId": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>",
      "subjectId": "did:ishare:EU.NL.NTRNL-<NEW_INSTALLATION_SERVICE_COMPANY_KVK>",
      "serviceProvider": "did:ishare:EU.NL.NTRNL-<GIR_KVK>",
      "resourceId": "<VBOID>",
      "attribute": "*",
      "notBefore": "<UNIX TIMESTAMP>",
      "expiration": "<UNIX TIMESTAMP>"
    }
  ],
  "orchestration": {
    "flow": "dsgo.gir@v1"
  }
}
```

> Multiple VBO-ids require one entry per VBO-id in `addPolicyTransactions`.

> **NL/SfB scoping** *(planned)*: Access can be restricted to specific NL/SfB codes by replacing `"attribute": "*"` with an NL/SfB code (e.g. `"L"` for all mechanical, `"L1"` for HVAC). Both policy entries must use the same value. This is not yet supported and requires additional development.

🔗 [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)

---

## Known blockers

| Blocker | Description | Status |
|---------|-------------|--------|
| **`license` field value** | The license identifier to use in `addPolicyTransactions` has not been finalized. | Open |
| **NL/SfB scoping via `attribute`** | Restricting access by NL/SfB code using the `attribute` field is not yet implemented. Applies to both `GIRMaintenanceLog` and `GIRBasisdataMessage`. | Open (dev task) |

