# Phase 1 — Owner Authorization

> **Context**: This is Phase 1 of the [Digitaal Onderhoudsboekje flow](digitaal-onderhoudsboekje.md). The New Installation Service Company initiates a request for the building owner to authorize the maintenance data transfer. Phase 1 and Phase 2 are independent of each other and can be initiated simultaneously.

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
| NL/SfB filter | Optional — restricts access to specific NL/SfB classifications, e.g. `NLSfB-52.16` (see below) |

### Step 2: Keyper sends an approval link to the building owner

Keyper sends the building owner an email with an approval link. The owner authenticates via eHerkenning and can review the full request — which buildings, which New Installation Service Company, which scope, for how long — before approving or rejecting.

On rejection, the link expires and a new request must be initiated.

🔗 Toestemmingen App URL to be confirmed before publication.

### Step 3: Keyper registers the AccessRight in GIR

On approval, Keyper registers one `AccessRight` policy per VBO-id in GIR on behalf of the building owner:

```json
{
  "requester": {
    "name": "<INSTALLER NAME>",
    "email": "<INSTALLER EMAIL>",
    "organization": "<INSTALLER ORGANISATION>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<NEW_INSTALLER_KVK>"
  },
  "approver": {
    "email": "<BUILDING OWNER EMAIL>",
    "organization": "<BUILDING OWNER ORGANISATION>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>"
  },
  "dataspace": {
    "baseUrl": "https://gir-preview.poort8.nl"
  },
  "addPolicyTransactions": [
    {
      "type": "GIRMaintenanceLog",
      "action": "can_read",
      "license": "DSGO.0010",
      "issuerId": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>",
      "subjectId": "did:ishare:EU.NL.NTRNL-<NEW_INSTALLER_KVK>",
      "serviceProvider": "*",
      "resourceId": "<VBOID>",
      "attribute": "*",
      "notBefore": "<UNIX TIMESTAMP>",
      "expiration": "<UNIX TIMESTAMP>"
    }
  ],
  "orchestration": {
    "flow": "dsgo.gir-onderhoudsboekje@v1"
  }
}
```

> Multiple VBO-ids require one entry per VBO-id in `addPolicyTransactions`.

> **NL/SfB scoping**: to restrict access to specific NL/SfB classifications, add a `rules` field to the transaction, e.g. `"rules": "Classificaties(NLSfB-52.16,NLSfB-52.20)"`. Multiple codes are OR-matched. `rules` and `attribute` are independent conditions — GIR checks the classification it has itself registered for each installation and matches it against `rules` regardless of the `attribute` value; the requester cannot set the classification directly. `attribute` has its own, separate use: setting it to a specific installation id (instead of `"*"`) restricts the policy to that one installation, with or without a `rules` filter — see [Authorization scope](digitaal-onderhoudsboekje.md#authorization-scope).

🔗 [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)
