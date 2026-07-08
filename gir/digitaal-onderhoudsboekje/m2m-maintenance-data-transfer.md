# Phase 3 — M2M Maintenance Data Transfer

> **Context**: This is Phase 3 of the [Digitaal Onderhoudsboekje flow](./README.md). It starts after Phase 1 (building owner authorized the New Installation Service Company via Keyper) and (optionally) Phase 2 (New Installation Service Company delegated to their software) have completed.
>
> **Audience**: Unlike Phases 1 and 2, which are addressed to the New Installation Service Company, this phase is addressed to **you as the data provider** — the platform that holds the maintenance data and must verify authorization before serving it.

## Functional Overview

The New Installation Service Company's software calls your platform to retrieve maintenance data for a building. Your platform verifies that the caller holds a valid `AccessRight` in GIR before serving any data. Your platform is responsible for the authorization check — the caller's software does not pre-verify.

| Actor | Role |
|-------|------|
| **New Installation Service Company's software** | Software of the new installation service company. Calls your platform with DSGO eSeal authentication. |
| **Your platform** | Data provider. Verifies authorization and serves data. |
| **GIR** | Authorization registry. Evaluates the `AccessRight` at request time. |

```likec4
// view: dob_phase3
specification {
  element system
}

model {
  ni_software = system 'NI software'
  your_platform = system 'Your platform'
  gir = system 'GIR'
}

views {
  dynamic view dob_phase3 {
    title 'Phase 3 — M2M Maintenance Data Transfer'
    variant sequence

    ni_software -> your_platform 'Authenticate (eSeal) + request maintenance data'
    your_platform -> gir 'Obtain access token'
    gir -> your_platform 'Access token'
    your_platform -> gir 'Verify AccessRight (owner → New Installation Service Company) for installationId'
    gir -> your_platform 'Permit or Deny'
    your_platform -> ni_software 'Maintenance data or 403 Forbidden'
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

### Step 1: Receive the request from the New Installation Service Company's software

The New Installation Service Company's software authenticates to your platform using the same DSGO client credentials flow described in [Obtaining a DSGO Bearer Token](../connect-token.md), then requests maintenance data:

```http
GET <YOUR_ENDPOINT>/maintenance-data?installationId=<INSTALLATION_ID>
Authorization: Bearer <ACCESS_TOKEN>
```

The `installationId` is the 16-digit BAG VBO-id (Verblijfsobjectidentificatie) identifying the building.

### Step 2: Obtain a GIR access token

Use the DSGO client credentials flow to get a bearer token from GIR. See [Obtaining a DSGO Bearer Token](../connect-token.md) for the full procedure.

> The GIR access token is valid for 3600 seconds and can be reused across multiple requests within that window.

### Step 3: Verify the AccessRight in GIR

> **Important**: use the subject identity from the validated DSGO bearer token as `accessSubject` — **not** a hardcoded KVK. The caller may be the New Installation Service Company itself, or a software company acting on their behalf (Phase 2 SupplierDelegation). See the note below the request.

```http
POST https://gir-preview.poort8.nl/v1/api/delegation
Authorization: Bearer <GIR_ACCESS_TOKEN>
Content-Type: application/json

{
  "delegationRequest": {
    "policyIssuer": "did:ishare:EU.NL.NTRNL-<OWNER_KVK>",
    "target": {
      "accessSubject": "<DSGO_TOKEN_SUBJECT>"
    },
    "policySets": [{
      "policies": [{
        "target": {
          "resource": {
            "type": "GIRMaintenanceLog",
            "identifiers": ["<INSTALLATION_ID>"],
            "attributes": ["*"]
          },
          "actions": ["read"],
          "environment": {
            "serviceProviders": ["did:ishare:EU.NL.NTRNL-<YOUR_KVK>"]
          }
        }
      }]
    }]
  }
}
```

**`<DSGO_TOKEN_SUBJECT>`** is the `sub` claim from the validated DSGO bearer token received in Step 1:

| Scenario | Value of `accessSubject` |
|----------|--------------------------|
| New Installation Service Company calls directly (no Phase 2) | `did:ishare:EU.NL.NTRNL-<NEW_INSTALLATION_SERVICE_COMPANY_KVK>` |
| Software company calls on their behalf (Phase 2 applied) | `did:ishare:EU.NL.NTRNL-<SOFTWARE_COMPANY_KVK>` |

> **Dev task (GIR)**: When a software company calls, GIR must resolve that *both* the `AccessRight` (owner → New Installation Service Company) and the `SupplierDelegation` (New Installation Service Company → software company) are in place. This combined resolution is not yet implemented.

Check `delegationEvidence.policySets[0].policies[0].rules[0].effect` in the response:

- `"Permit"` → proceed to serve data
- `"Deny"` → return `403 Forbidden` to the caller

> **NL/SfB scoping**: if authorization is scoped to a specific installation type, replace `"attributes": ["*"]` with the applicable NL/SfB code (e.g. `["L"]` for mechanical, `["L1"]` for HVAC).

### Step 4: Serve data or deny

Return the maintenance data set on Permit. On Deny or any GIR error, return `403 Forbidden`.

🔗 [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)

---

## Known blockers

| Blocker | Status |
|---------|--------|
| **Endpoint discovery** — The GIR policy does not capture the endpoint URL. How the New Installation Service Company's software discovers which previous platform to call has not been specified. | Open |
| **DICO standard** — The content and format of the maintenance data set (`GIRMaintenanceLog`) is being developed by Ketenstandaard and not yet published. | Open |
| **Combined delegation resolution (GIR dev task)** — When a software company calls on behalf of the New Installation Service Company, GIR must verify both the `AccessRight` and the `SupplierDelegation` in a single check. This is not yet implemented. | Open |
