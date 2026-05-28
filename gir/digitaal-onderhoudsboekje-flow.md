# Digitaal Onderhoudsboekje – Maintenance Data Transfer Flow

> **⚠️ Implementation decisions pending**
>
> Several policy field values and integration points have not yet been finalised. All open points are listed in [Open Decisions](#open-decisions). Do not use this document as the basis for implementation until those items have been resolved.

The Digitaal Onderhoudsboekje enables a building owner to authorize a new installation service party to retrieve maintenance history from the previous installation service party. GIR manages the authorization; Keyper orchestrates owner approval; the actual maintenance data exchange happens directly between the software parties via M2M, authenticated with eSeals.

This guide describes the New Installer-initiated flow, where the new installer starts the authorization through the TechniekNederland GIR app or directly via the Keyper API, then delegates SW2 as authorized data service consumer. The initial request contains the building owner and VBO-id scope. SW1 acts as the data service provider in the M2M phase.

🔗 [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)
🔗 [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)

## Parties

| Role | Party | DSGO role | Description |
|------|-------|-----------|-------------|
| Building owner (gebouweigenaar) | Property owner | Data service rights holder | Approves the transfer; holds authority over the installations in the building. Authenticates via eHerkenning. |
| New installer (NI) | New installation service party | Legal data service consumer | Initiates the authorization request and receives an `AccessRight` from the building owner. |
| SW2 | Software party of NI | Authorized data service consumer | Receives a `SupplierDelegation` from NI; retrieves maintenance data via M2M on behalf of NI. |
| SW1 | Software party serving the maintenance data | Data service provider | Serves maintenance data via M2M and verifies the `AccessRight` in GIR at request time. |
| TN GIR app | TechniekNederland | — | Shared permission request portal for GIR use cases. For Digitaal Onderhoudsboekje, the operational flow starts with the new installer (NI). In this flow, the app also acts as the metadata app that derives the previous installer(s) from GIR registration metadata. The app has no credentials of its own; all authentication is via eHerkenning through Keyper. |
| GIR | Gebouw-Installatie-Registratie | Third-party authorization registry | Stores the `AccessRight` policy (building owner → NI) as PAP/PRP/PDP; enforces authorization via the delegation endpoint. |
| Keyper | Poort8 | — | Orchestrates the approval flow, provides eHerkenning authentication in-session, and registers the `AccessRight` policy in GIR after approval. |

## Overview

The flow has three phases: a one-time owner authorization (`AccessRight` via Keyper), NI issuing a `SupplierDelegation` to SW2, and a one-off M2M data transfer.

```likec4
// view: dob_overview
specification {
  element actor
  element system
}

model {
  app = system 'TN GIR App'
  keyper = system 'Keyper'
  owner = actor 'Building Owner'
  gir = system 'GIR'
  sw1 = system 'SW1'
  ni = actor 'New Installer (NI)'
  sw2 = system 'SW2'
}

views {
  dynamic view dob_overview {
    title 'Digitaal Onderhoudsboekje – Full Flow'
    variant sequence

    app -> keyper 'Approval request (owner, VBO-ids, NI); two policies: maintenance data + GIR basisdata read'
    keyper -> owner 'Approval link'
    owner -> keyper 'Authenticate via eHerkenning and approve'
    keyper -> gir 'Register both AccessRight policies (building owner → NI)'
    gir -> keyper 'Policies registered'
    keyper -> ni 'Confirmation'
    ni -> app 'Supply SW2 party details'
    app -> keyper 'SupplierDelegation request (NI as requester and approver)'
    keyper -> ni 'Approval link'
    ni -> keyper 'Authenticate via eHerkenning and approve'
    keyper -> gir 'Register SupplierDelegation (NI → SW2) for vboId'
    ni -> sw2 'SupplierDelegation details + vboId'
    sw2 -> sw1 'Authenticate (eSeal) + request maintenance data by installationId'
    sw1 -> gir 'Verify AccessRight (building owner → NI) for installationId'
    gir -> sw1 'Delegation evidence (Permit)'
    sw1 -> sw2 'Standard maintenance data set'
  }
}
```

## Prerequisites

Before any phase of this flow can operate, all parties must be onboarded in DSGO with their respective roles:

| Party | Required DSGO role |
|-------|-------------------|
| Building owner | Data service rights holder |
| New installer (NI) | Legal data service consumer |
| SW2 | Authorized data service consumer |
| SW1 | Data service provider |
| GIR | Third-party authorization registry |

All parties must be registered in the DSGO participant register before any step in this flow can be executed. All parties with M2M connections (SW1, SW2, Keyper, GIR) require a DSGO-approved Electronic Seal.

## DSGO Authorization Types

DSGO distinguishes two authorization types that apply in this flow:

| Type | Meaning | Where used |
|------|---------|------------|
| `AccessRight` | The data service rights holder (building owner) authorizes a legal data service consumer (NI) to access a data service. | Registered in GIR by Keyper after owner approval (phase 1). |
| `SupplierDelegation` | A legal party authorizes an authorized party to act on its behalf. | NI → SW2 (consumer side, phase 2). |

---

## Phase 1 — Owner Authorization

The Digitaal Onderhoudsboekje flow starts with the new installer (NI). NI submits the request through the TN GIR app or directly via the Keyper API, after which Keyper handles the building owner's approval through eHerkenning. The TN GIR app itself holds no credentials.

```likec4
// view: dob_phase1
specification {
  element actor
  element system
}

model {
  ni = actor 'New Installer (NI)'
  app = system 'TN GIR App'
  girdata = system 'GIR Basisdata'
  keyper = system 'Keyper'
  owner = actor 'Building Owner'
  gir = system 'GIR'
}

views {
  dynamic view dob_phase1 {
    title 'Phase 1 — Owner Authorization'
    variant sequence

    ni -> app 'Select use case'
    app -> app 'VBO-id lookup via Kadaster/BAG'
    app -> girdata 'Query GIRBasisdataMessages for VBO-id scope'
    girdata -> app 'Installation records + metadataissuer'
    app -> ni 'Show request form'
    ni -> app 'Submit owner, VBO-ids, NL/SfB filter, validity period'
    app -> keyper 'Initiate eHerkenning session + submit approval request'
    keyper -> owner 'Approval link by email'
    owner -> keyper 'Authenticate via eHerkenning and approve'
    keyper -> gir 'POST /connect/token (client credentials)'
    gir -> keyper 'Access token'
    keyper -> gir 'Register AccessRight policy (building owner → NI)'
    gir -> keyper 'AccessRight registered'
    keyper -> ni 'Confirmation'
    keyper -> owner 'Link to Keyper Manager for ongoing management'
  }
}
```

### Step 1: Start the Request in the TN GIR App *(TechniekNederland)*

The TN GIR app presents the Digitaal Onderhoudsboekje entry point for the new installer (NI), acting on behalf of themselves.

The same app handles other GIR permission flows (registrar write access, Datastekker access) through additional entry points.

### Step 2: VBO-id Lookup *(TechniekNederland)*

The TN GIR app looks up VBO-ids for the relevant buildings via the Kadaster/BAG API. The building can be identified by address or direct VBO-id entry. The BAG API does not require DSGO credentials.

### Step 3: Determine Previous Installers from GIR Metadata and Complete the AccessRight Request *(TechniekNederland)*

The TN GIR app acts as a metadata app for the selected VBO-id scope. It queries previously registered `GIRBasisdataMessage` records and uses the `metadataissuer` of the most recent registration per installation to derive one or more previous installers.

The previous installer is therefore derived from GIR metadata, not entered by the user.

> ℹ️ `registrarChamberOfCommerceNumber` in the `GIRBasisdataMessage` identifies the registering installer. The DSGO-id of the app that performed the registration is stored separately by GIR as metadata (`metadataissuer`) and is used to derive the previous installer(s) for this flow.

The TN GIR app collects the following before handing off to Keyper:

| Field | Description |
|-------|-------------|
| VBO-id(s) | BAG Verblijfsobjectidentificatie (16-digit); one or more |
| NL/SfB filter | Optional: scope to specific installation types by NL/SfB code |
| New installer (NI) | The requester and future legal data service consumer |
| Previous installer(s) | Derived by the metadata app from GIR registration metadata (`metadataissuer`) |
| Building owner email | Recipient of the approval link |
| Validity period | Start and end date of the requested access |

> ℹ️ The building owner's authoritative identity is confirmed by eHerkenning in Keyper.

This flow uses Variant A: no pre-approval installation display. The TN GIR app submits the request based on the entered VBO-id scope and optional NL/SfB filter without first querying GIR through Keyper.

### Step 4: Keyper Approval Flow *(Poort8)*

The TN GIR app initiates the Keyper approval flow for the building owner. The same request can also be created directly against the Keyper API without the TN GIR app.

The approval request includes:

```json
{
  "requester": {
    "name": "<NI NAME>",
    "email": "<NI EMAIL>",
    "organization": "<NI COMPANY NAME>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<NI KVK>"
  },
  "approver": {
    "name": "<BUILDING OWNER NAME>",
    "email": "<BUILDING OWNER EMAIL>",
    "organization": "<BUILDING OWNER ORGANISATION>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<OWNER KVK>"
  },
  "dataspace": {
    "baseUrl": "https://gir-preview.poort8.nl"
  },
  "reference": "<UNIQUE REFERENCE>",
  "addPolicyTransactions": [
    {
      "type": "GIRMaintenanceLog",
      "action": "read",
      "license": "[PLACEHOLDER]",
      "useCase": "dsgo.gir-digitaalonderhoudsboekje@v1",
      "issuedAt": "<UNIX TIMESTAMP>",
      "issuerId": "did:ishare:EU.NL.NTRNL-<OWNER KVK>",
      "subjectId": "did:ishare:EU.NL.NTRNL-<NI KVK>",
      "serviceProvider": "*",
      "resourceId": "<VBOID>",
      "attribute": "*",
      "notBefore": "<UNIX TIMESTAMP>",
      "expiration": "<UNIX TIMESTAMP>"
    },
    {
      "type": "GIRBasisdataMessage",
      "action": "read",
      "license": "[PLACEHOLDER]",
      "useCase": "dsgo.gir-digitaalonderhoudsboekje@v1",
      "issuedAt": "<UNIX TIMESTAMP>",
      "issuerId": "did:ishare:EU.NL.NTRNL-<OWNER KVK>",
      "subjectId": "did:ishare:EU.NL.NTRNL-<NI KVK>",
      "serviceProvider": "did:ishare:EU.NL.NTRNL-<GIR KVK>",
      "resourceId": "<VBOID>",
      "attribute": "*",
      "notBefore": "<UNIX TIMESTAMP>",
      "expiration": "<UNIX TIMESTAMP>"
    }
  ],
  "orchestration": {
    "flow": "dsgo.gir-digitaalonderhoudsboekje@v1"
  }
}
```

> ℹ️ Multiple VBO-ids require one entry per VBO-id in the `addPolicyTransactions` block. The `resourceId` field takes a single identifier.

> ℹ️ **NL/SfB scoping**: To restrict access to specific installation types, replace `"attribute": "*"` with an NL/SfB code — for example `"L"` (mechanical installations) or `"L1"` (HVAC). Both the `GIRMaintenanceLog` and `GIRBasisdataMessage` entries must use the same code. See [Authorization Granularity](#authorization-granularity) for the full overview of scoping options.

See the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1) for the full field documentation and authentication flow.

Keyper sends the approval link to the building owner by email. The building owner opens the link, authenticates via eHerkenning, and reviews and approves the request.

The building owner can:

1. Review the requested access: which buildings, which new installer, which previous installer(s), which scope, for how long.
2. Click **Approve** or **Reject**.

On rejection, the approval link expires and a new request can be initiated.

### Step 5: Keyper Registers the AccessRight in GIR *(Poort8)*

On approval, Keyper obtains a GIR access token and registers both `AccessRight` policies in GIR-AR:

```http
POST https://gir-preview.poort8.nl/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=iSHARE&client_id=did:ishare:EU.NL.NTRNL-<KEYPER KVK>&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=<SIGNED_JWT>
```

The building owner also receives a link to Keyper Manager, where active authorizations can be reviewed and revoked.

### Step 6: Notify NI After Approval *(Poort8)*

Once the `AccessRight` is registered, Keyper sends NI a confirmation that includes:

- The approved policy details (VBO-ids, NL/SfB scope, validity period).
- The previous installer(s) derived from GIR registration metadata.

---

## Phase 2 — SupplierDelegation

NI must complete this phase before the M2M data transfer (phase 3) can proceed. NI delegates its `AccessRight` to SW2 via Keyper, scoped to the authorized VBO-id(s). No GIR query is needed in this phase; installation-level scoping is deferred to a later refinement.

```likec4
// view: dob_phase2
specification {
  element actor
  element system
}

model {
  ni = actor 'New Installer (NI)'
  app = system 'TN GIR App'
  gir = system 'GIR'
  keyper = system 'Keyper'
  sw2 = system 'SW2'
}

views {
  dynamic view dob_phase2 {
    title 'Phase 2 — SupplierDelegation'
    variant sequence

    ni -> app 'Supply SW2 party details'
    app -> keyper 'SupplierDelegation request (NI as requester and approver)'
    keyper -> ni 'Approval link'
    ni -> keyper 'Authenticate via eHerkenning and approve'
    keyper -> gir 'Register SupplierDelegation (NI → SW2) for vboId'
    gir -> keyper 'Policy registered'
    ni -> sw2 'SupplierDelegation details + vboId'
  }
}
```

### Step 7: NI Issues SupplierDelegation to SW2 *(Poort8)*

NI delegates its `AccessRight` to SW2 by registering a `SupplierDelegation` policy in GIR, scoped to the authorized VBO-id(s). NI supplies the SW2 party details in the TN GIR app, which kicks off a Keyper approval flow. Because NI is both the requesting party and the approving party, Keyper sends the approval link to NI's own email address.

NI authenticates via eHerkenning and approves. On approval, Keyper registers the `SupplierDelegation` policy in GIR.

> ℹ️ The `SupplierDelegation` mechanism is defined in the [DSGO afsprakenstelsel ➚](https://afsprakenstelseldsgo.atlassian.net/wiki/spaces/dsgo/pages/1025933400). Exact data format and field values will be determined during technical configuration and are not detailed here.

NI then informs SW2 of the delegation details.

---

## Phase 3 — M2M Maintenance Data Transfer

This phase is the implementation guide for the M2M data transaction. It is triggered once phase 2 is complete. SW1 is responsible for verifying authorization at request time; SW2 does not pre-verify.

```likec4
// view: dob_phase3
specification {
  element actor
  element system
}

model {
  sw2 = system 'SW2 (software NI)'
  sw1 = system 'SW1 (data service provider)'
  gir = system 'GIR'
}

views {
  dynamic view dob_phase3 {
    title 'Phase 3 — M2M Maintenance Data Transfer'
    variant sequence

    sw2 -> sw1 'POST /connect/token (eSeal client assertion)'
    sw1 -> sw2 'Access token'
    sw2 -> sw1 'GET /maintenance-data?installationId=<INSTALLATION_ID>'
    sw1 -> gir 'POST /connect/token (eSeal client assertion)'
    gir -> sw1 'Access token'
    sw1 -> gir 'POST /delegation — verify AccessRight (building owner → NI) for installationId'
    gir -> sw1 'Delegation evidence (Permit)'
    sw1 -> sw2 'Standard maintenance data set'
  }
}
```

### Authentication to SW1 *(external)*

SW2 authenticates to SW1 using its eSeal (DSGO certificate) to obtain an access token:

```http
POST <SW1 ENDPOINT>/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=<SIGNED_JWT>
```

### Maintenance Data Request *(external)*

```http
GET <SW1 ENDPOINT>/maintenance-data?installationId=<INSTALLATION_ID>
Authorization: Bearer <SW1_ACCESS_TOKEN>
```

### GIR Access Token *(Poort8)*

Before verifying the authorization, SW1 obtains a GIR access token using its DSGO eSeal. See [Obtaining a DSGO Bearer Token](connect-token.md) for the full procedure.

```http
POST https://gir-preview.poort8.nl/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=iSHARE&client_id=did:ishare:EU.NL.NTRNL-<SW1 KVK>&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=<SIGNED_JWT>
```

### AccessRight Verification *(Poort8)*

SW1 verifies that NI holds a valid `AccessRight` covering the requested installation:

```http
POST https://gir-preview.poort8.nl/delegation
Authorization: Bearer <GIR_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "delegationRequest": {
    "policyIssuer": "did:ishare:EU.NL.NTRNL-<OWNER KVK>",
    "target": {
      "accessSubject": "did:ishare:EU.NL.NTRNL-<NI KVK>"
    },
    "policySets": [
      {
        "policies": [
          {
            "target": {
              "resource": {
                "type": "GIRMaintenanceLog",
                "identifiers": ["<INSTALLATION_ID>"],
                "attributes": ["*"]
              },
              "actions": ["read"],
              "environment": {
                "serviceProviders": ["did:ishare:EU.NL.NTRNL-<SW1 KVK>"]
              }
            },
            "rules": [
              { "effect": "Permit" }
            ]
          }
        ]
      }
    ]
  }
}
```

### Maintenance Data Response *(external)*

If GIR returns a `Permit`, SW1 returns the standard maintenance data set for the authorized installation. Any non-permit result causes SW1 to return an authorization error to SW2.

> **⚠️ Open decision**: The content and format of the standard maintenance data set is defined by the DICO standard `GIRMaintenanceLog` developed by Ketenstandaard.

---

## Authorization Granularity

Authorization can be scoped at two levels:

| Level | Scope | `attribute` value | Use case |
|-------|-------|-------------------|----------|
| VBO-id | All installations in a building | `*` | Full portfolio transfer (e.g. housing corporation handing over all units) |
| VBO-id + NL/SfB | Specific installation types within a building | NL/SfB code, e.g. `L` or `L1` | Partial transfer (e.g. only HVAC, not electrical) |

The NL/SfB code is set in the `attribute` field of both `addPolicyTransactions` entries in the Keyper request, and in the delegation check in phase 3. Using `*` grants access to all installation types registered under the VBO-id.

## Policy Parameters

| Parameter | Where used | Description | Status |
|-----------|------------|-------------|--------|
| `issuerId` | Keyper request, delegation request | DID of the building owner (policy issuer) | Required |
| `subjectId` | Keyper request, delegation request | DID of NI (the data service consumer) | Required |
| `serviceProvider` | Phase 1 Keyper request (`GIRMaintenanceLog`) | `*` (wildcard) — any SW1 may serve maintenance data; no specific SW1 endpoint is captured in the policy | `*` |
| `serviceProvider` | Phase 1 Keyper request (`GIRBasisdataMessage`) | DID of GIR (basisdata read) | Required |
| `serviceProvider` | Phase 2 Keyper request, delegation request | DID of SW1 (data service provider in the SupplierDelegation) | Required |
| `resourceId` | Phase 1 Keyper request | VBO-id; covers all registered installations in the building | Required |
| `resourceId` / `identifiers` | Phase 2 Keyper request, delegation request | VBO-id; delegates NI's AccessRight to SW2 at building scope. Installation-level scoping is deferred to a later phase. | Required |
| `notBefore` / `expiration` | Keyper request, delegation evidence | Validity period of the authorization | Required |
| `attribute` | Keyper request, delegation request | NL/SfB code to restrict access to specific installation types (e.g. `L` for mechanical, `L1` for HVAC); use `*` for all installation types. Both policy entries must use the same value. | `*` (wildcard) or NL/SfB code |
| `action` | Keyper request, delegation request | `read` | `read` |
| `type` | Keyper request, delegation request | Resource type identifier used in policy matching | `GIRMaintenanceLog` (maintenance data), `GIRBasisdataMessage` (basisdata read) |
| `useCase` | Keyper request | Use case identifier for policy scoping | `dsgo.gir-digitaalonderhoudsboekje@v1` |
| `license` / `licenses` | Keyper request, delegation evidence | License identifier expressing the terms of use for the data | `[PLACEHOLDER]` |

---

## Open Decisions

The following must be resolved before the corresponding parts of this flow can be implemented.

**1. Policy field values (`type`, `useCase`, `attribute`, `license`, `orchestration.flow`)**

The following values are used for all policy transactions in this flow:

- `type`: `GIRMaintenanceLog` (maintenance data), `GIRBasisdataMessage` (basisdata read)
- `useCase`: `dsgo.gir-digitaalonderhoudsboekje@v1`
- `attribute`: `*` (wildcard for all installation types) or an NL/SfB code to restrict scope (e.g. `L`, `L1`)
- `license`: `[PLACEHOLDER]`
- `action`: `read`

These values apply to both the Phase 1 AccessRight and the Phase 2 SupplierDelegation. No further technical configuration is required for these fields.

**2. SW1 discovery by SW2**

The `serviceProvider` field in the `GIRMaintenanceLog` policy is a wildcard (`*`), meaning no specific SW1 endpoint is captured during the authorization flow. It is an open question how SW2 discovers which SW1 party (or parties) holds the relevant maintenance data for a given installation. A building may have data registered by more than one previous software party. The discovery mechanism — for example via GIR metadata, the DSGO participant register, or out-of-band communication — has not been specified.

**3. Standard maintenance data set**

The content and format of the maintenance data transferred in phase 3 will be defined by a DICO standard developed by Ketenstandaard. Phase 3 implementation is blocked until this standard is published.

**4. Authentication under DSGO: client credentials, eSeals, and PKI-Overheid certificates**

All parties with M2M connections (SW1, SW2, Keyper, GIR) are described as requiring a DSGO-approved Electronic Seal (eSeal). It is an open question what DSGO authentication with client credentials means in practice, and whether PKI-Overheid certificates are an accepted alternative to eSeals for parties that hold them. The implications for onboarding requirements and the trust model need to be clarified.

**5. Multiple new installers**

How should the flow handle a building that is handed over to more than one new installer simultaneously? The proposed approach is that each new installer initiates their own approval request, scoped to the relevant VBO-id(s) and optional NL/SfB filter. The building owner then approves (or rejects) each request independently. This needs to be confirmed and reflected in the TN GIR app design.

**6. Multiple previous installers**

A building may have installation data registered by more than one previous installer. For the current phase, only the most recent registrar per installation is in scope — the TN GIR app derives a single previous installer from the `metadata.issuer` of the latest `GIRBasisdataMessage` per installation. For a later phase, the approval flow may query GIR for all `GIRBasisdataMessage` records for the relevant VBO-ids where the building owner is the `installationOwnerChamberOfCommerceNumber`, collect all unique `registrarChamberOfCommerceNumber` values from that history, and present them to the approver for optional deselection. A policy would then be created for each selected (previous) issuer.

---

## Further Reading

- [Datastekker – Installer Access Flow](datastekker-installateur-flow.md) — similar authorization pattern for a different use case
- [Data-Consumer Flow](data-consumer-flow.md) — standard GIR data access flow
- [Registrar Flow](registrar-flow.md) — how installation data is submitted to GIR
- [Obtaining a DSGO Bearer Token](connect-token.md) — acquiring DSGO credentials for GIR API calls
- [Retrieve Multiple Installations](retrieve-installations.md) — GIRBasisdataMessage by VBO-id
- [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)
- [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)
