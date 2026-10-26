# Phase 3 — M2M Maintenance Data Transfer

> **Context**: This is Phase 3 of the [Digitaal Onderhoudsboekje flow](digitaal-onderhoudsboekje.md). It starts after Phase 1 (building owner authorized the New Installation Service Company via Keyper) and (optionally) Phase 2 (New Installation Service Company delegated to their Software Supplier) have completed.
>
> **Audience**: Unlike Phases 1 and 2, which are addressed to the New Installation Service Company, this phase is addressed to **you as the data provider** — the platform that holds the maintenance data and must verify authorization before serving it.

## Functional Overview

The New Installation Service Company's software (or its Software Supplier) calls your platform to retrieve maintenance data for a building. Your platform verifies that the New Installation Service Company holds a valid `AccessRight` in GIR before serving any data. When a Software Supplier calls, it adds delegation evidence from GIR in the `delegation_evidence` header, which your platform validates first ([Supplier Delegation](supplier-delegation.md), DSGO Delegaties option 3). Your platform is responsible for the authorization check — the caller's software does not pre-verify.

| Actor | Role |
|-------|------|
| **New Installation Service Company (or its Software Supplier)** | Software of the New Installation Service Company, or — if Phase 2 was completed — their Software Supplier acting on their behalf. Calls your platform with DSGO eSeal authentication. |
| **Your platform** | Data provider. Verifies authorization and serves data. |
| **GIR** | Authorization registry. Evaluates the `AccessRight` at request time. |

```likec4
// view: dob_phase3
specification {
  element actor
  element system
}

model {
  new_installer_software = system 'New Installation Service Company (or its Software Supplier)'
  your_platform = system 'Your platform'
  gir = system 'GIR'
}

views {
  dynamic view dob_phase3 {
    title 'Phase 3 — M2M Maintenance Data Transfer'
    variant sequence

    new_installer_software -> your_platform 'Authenticate (eSeal) + request maintenance data (+ delegation_evidence if Software Supplier)'
    your_platform -> your_platform 'Validate delegation evidence (Software Supplier only)'
    your_platform -> gir 'Obtain access token'
    gir -> your_platform 'Access token'
    your_platform -> gir 'Verify AccessRight (owner → New Installation Service Company) for installationId'
    gir -> your_platform 'Permit or Deny'
    your_platform -> new_installer_software 'Maintenance data or 403 Forbidden'
  }
}
```

## Technical Implementation

### Prerequisites

| Requirement | Details |
|-------------|---------|
| DSGO membership | Registered with `EU.DS.NL.DSGO` dataspace membership |
| RSA key pair + eSeal | An eIDAS-qualified electronic seal (eSeal) certificate issued by a Trust Service Provider, containing an RSA key pair. Used to sign the JWT client assertion in the DSGO client credentials flow. |
| Organization DIDs of your company and for any installation owner | `did:ishare:EU.NL.NTRNL-<KVK>` |

### Step 1: Receive the request from the New Installation Service Company (or its Software Supplier)

The New Installation Service Company's software — or, if Phase 2 was completed, their Software Supplier acting on their behalf — authenticates to your platform using the same DSGO client credentials flow described in [Obtaining a DSGO Bearer Token](connect-token.md), then requests maintenance data:

```http
GET <YOUR_ENDPOINT>/maintenance-data?installationId=<INSTALLATION_ID>
Authorization: Bearer <ACCESS_TOKEN>
delegation_evidence: <DELEGATION_TOKEN>
```

The `installationId` is the 16-digit BAG VBO-id (Verblijfsobjectidentificatie) identifying the building. The `delegation_evidence` header is only present when a Software Supplier calls on behalf of the New Installation Service Company.

### Step 2: Obtain a GIR access token

Use the DSGO client credentials flow to get a bearer token from GIR. See [Obtaining a DSGO Bearer Token](connect-token.md) for the full procedure.

> The GIR access token is valid for 3600 seconds and can be reused across multiple requests within that window.

### Step 3: Verify authorization in GIR

First determine on whose behalf the request is made:

| Scenario | `delegation_evidence` header | New Installation Service Company DID |
|----------|------------------------------|--------------------------------------|
| New Installation Service Company calls directly | Absent | The `sub` of the validated DSGO bearer token |
| Software Supplier calls on their behalf (Phase 2) | Present | The `policyIssuer` of the validated delegation evidence |

If the header is present, validate the delegation evidence as described in [Supplier Delegation — Step 4](supplier-delegation.md#step-4-the-data-service-provider-validates-the-evidence): signature by GIR, expiry, `accessSubject` equals the caller, `Permit`, type `GIRMaintenanceLog`, action `can_read`, and your DID as service provider. If validation fails, return `403 Forbidden`.

Then verify the `AccessRight` of the New Installation Service Company — **not** the Software Supplier:

```http
POST https://gir-preview.poort8.nl/v1/api/delegation
Authorization: Bearer <GIR_ACCESS_TOKEN>
Content-Type: application/json

{
  "delegationRequest": {
    "policyIssuer": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>",
    "target": {
      "accessSubject": "did:ishare:EU.NL.NTRNL-<NEW_INSTALLATION_SERVICE_COMPANY_KVK>"
    },
    "policySets": [{
      "policies": [{
        "target": {
          "resource": {
            "type": "GIRMaintenanceLog",
            "identifiers": ["<INSTALLATION_ID>"],
            "attributes": ["*"]
          },
          "actions": ["can_read"],
          "environment": {
            "serviceProviders": ["did:ishare:EU.NL.NTRNL-<YOUR_KVK>"]
          }
        }
      }]
    }]
  }
}
```

Check `delegationEvidence.policySets[0].policies[0].rules[0].effect` in the response:

- `"Permit"` → proceed to serve data
- `"Deny"` → return `403 Forbidden` to the caller

> **NL/SfB scoping**: if the underlying `AccessRight` was scoped to specific NL/SfB classifications (via `rules: "Classificaties(...)"`, see [Phase 1 — Owner Authorization](digitaal-onderhoudsboekje-owner-authorization.md)), GIR enforces that scope using its own registered classification for the installation.

### Step 4: Serve data or deny

Return the maintenance data set on Permit. On Deny or any GIR error, return `403 Forbidden`.

🔗 [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)

---

## Known blockers

| Blocker | Status |
|---------|--------|
| **Endpoint discovery** — The GIR policy does not capture the endpoint URL. How the New Installation Service Company's software discovers which previous platform to call has not been specified. | Open |
| **DICO standard** — The content and format of the maintenance data set (`GIRMaintenanceLog`) is being developed by Ketenstandaard and not yet published. | Open |