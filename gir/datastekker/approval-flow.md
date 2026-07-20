# Phase 1 — Approval Flow

> Part of the [Datastekker – Installer Access Flow](./README.md). This phase runs once per installer / building combination.

The TechniekNederland form collects the access request and hands it off to Keyper. Keyper notifies the building owner, who authenticates and approves. On approval, Keyper automatically registers the policy in GIR — no further action is needed from the installer or TechniekNederland.

| Actor | Role |
|-------|------|
| **TechniekNederland Form** | Collects request data and calls Keyper. |
| **Keyper** | Orchestrates the approval flow. Registers the policy in GIR on approval. |
| **Building owner** | Approves or rejects the request. |
| **GIR** | Stores the resulting delegation policy. |

```likec4
// view: datastekker_approval_flow
specification {
  element actor
  element system
}

model {
  form = system 'TechniekNederland Form'
  keyper = system 'Keyper'
  owner = actor 'Building Owner'
  gir = system 'GIR'
}

views {
  dynamic view datastekker_approval_flow {
    title 'Phase 1 — Approval Flow'
    variant sequence

    form -> keyper 'POST /v1/api/approval-links (vboId, installer KvK, owner KvK, validity)'
    keyper -> owner 'Approval link by email'
    owner -> keyper 'Authenticate and approve'
    keyper -> gir 'Register delegation policy (installer ↔ vboId)'
  }
}
```

## Technical Implementation

### What the form must collect

Before calling Keyper, TechniekNederland collects the following information:

| Field | Description |
|-------|-------------|
| `vboId` | BAG Verblijfsobjectidentificatie — 16-digit building identifier |
| Installer KvK | KvK number of the installation company requesting access |
| Building owner KvK | KvK number of the owner who must approve |
| Building owner email | Recipient of the Keyper approval link |
| Validity period | Start and end date of the requested access |
| Data-element set | Which performance data becomes accessible — see [Open Question 4](./README.md#open-questions) |
| License conditions | Terms of use — see [Open Question 5](./README.md#open-questions) |

> ℹ️ The form may optionally query GIR first to display the installations registered at the given building. See [Retrieve Multiple Installations](../retrieve-installations.md).

### Step 1 — Create the approval link in Keyper

```http
POST https://keyper-preview.poort8.nl/v1/api/approval-links
Authorization: Bearer <KEYPER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "requester": {
    "name": "<INSTALLER NAME>",
    "email": "<INSTALLER EMAIL>",
    "organization": "<INSTALLER COMPANY NAME>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<INSTALLER_KVK>"
  },
  "approver": {
    "name": "<BUILDING OWNER NAME>",
    "email": "<BUILDING OWNER EMAIL>",
    "organization": "<BUILDING OWNER ORGANISATION>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<BUILDING_OWNER_KVK>"
  },
  "dataspace": {
    "baseUrl": "https://gir-preview.poort8.nl"
  },
  "reference": "<UNIQUE_REFERENCE>",
  "addPolicyTransactions": [
    {
      "type": "GIRDatastekkerAccess",
      "action": "read",
      "license": "[PLACEHOLDER]",
      "issuedAt": "<UNIX_TIMESTAMP>",
      "issuerId": "did:ishare:EU.NL.NTRNL-<BUILDING_OWNER_KVK>",
      "attribute": "*",
      "notBefore": "<UNIX_TIMESTAMP>",
      "subjectId": "did:ishare:EU.NL.NTRNL-<INSTALLER_KVK>",
      "expiration": "<UNIX_TIMESTAMP>",
      "resourceId": "<VBOID>",
      "serviceProvider": "did:ishare:EU.NL.NTRNL-<2BA_KVK>"
    }
  ],
  "orchestration": {
    "flow": "dsgo.gir-datastekker@v1"
  }
}
```

Store the returned `id` to poll for approval status if needed.

### Steps 2–4 — Keyper handles the rest

After the approval link is created:

1. **Keyper sends an email** to the building owner with a unique approval link.
2. **The building owner authenticates** (for example via eHerkenning) and reviews the request — which building, which installer, which data, for how long — then approves or rejects.
3. **On approval, Keyper registers the policy in GIR.** The policy is immediately active; Datastekker can enforce it on every subsequent data request.

If the building owner rejects, the link expires. TechniekNederland can initiate a new request with a new `reference`.

## References

- [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)

## Next

[Phase 2 — Token Acquisition](./token-acquisition.md)
