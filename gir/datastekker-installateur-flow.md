# Datastekker – Installer Access Flow

> **⚠️ Design document — not ready for implementation**
>
> This document describes the intended flow for the Datastekker use case. Several open questions remain unresolved (see [Open Questions](#open-questions)), in particular componentId-to-installationId resolution and license conditions.

Datastekker (developed by 2BA) retrieves performance data from installation manufacturers and translates it into uniform performance data using the Heatpump Common Ontology. To access this data, an installer needs explicit consent from the building owner. GIR manages that authorization.

This guide describes how an installer requests access through a form on the TechniekNederland website, how the building owner approves the request via Keyper, and how Datastekker validates authorization against the GIR delegation endpoint on every data request.

🔗 [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)
🔗 [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)

## Parties

| Role | Party | Description |
|------|-------|-------------|
| Datastekker | 2BA | Data service provider; retrieves installation data from manufacturers and exposes it via an API |
| Installer (installateur) | Installation company | Data service consumer; requests access to performance data for installations they maintain |
| Building owner (gebouw-eigenaar) | Property owner | Approves the access request; has authority over the installations in the building |
| TechniekNederland | Industry association | Hosts the form through which the access request is initiated |
| GIR | Gebouw-Installatie-Registratie | Manages policy registration and enforces authorization via the delegation endpoint |
| Keyper | Poort8 | Orchestrates the approval flow and registers the policy in GIR after approval |

## Overview

The flow has two phases: a one-time approval flow and a recurring operational data access pattern.

```likec4
// view: datastekker_overview
specification {
  element actor
  element system
}

model {
  form = system 'TechniekNederland Form'
  keyper = system 'Keyper'
  owner = actor 'Building Owner'
  gir = system 'GIR'
  ds = system 'Datastekker (2BA)'
  inst = actor 'Installer'
}

views {
  dynamic view datastekker_overview {
    title 'Datastekker – Installer Access Flow'
    variant sequence

    form -> keyper 'Create access request for vboId'
    keyper -> owner 'Approval link by email'
    owner -> keyper 'Authenticate and approve'
    keyper -> gir 'Register policy (installer ↔ vboId)'

    inst -> ds 'Data request with componentId'
    ds -> gir 'Resolve componentId → installationId + manufacturer info [TBD]'
    gir -> ds 'GIRBasisdataMessage (installationId + manufacturer info)'
    ds -> gir 'Verify delegation for installer + installationId'
    gir -> ds 'Delegation evidence (Permit)'
    ds -> inst 'Authorised performance data'
  }
}
```

### Steps

**Approval flow (one-time per installer / building)**

1. The form submits an access request for the vboId to Keyper.
2. Keyper sends the building owner an approval link by email.
3. The building owner authenticates and approves.
4. Keyper registers the policy in GIR.

**Operational data access (bilateral, recurring)**

5. The installer sends a data request with a componentId to Datastekker.
6. Datastekker obtains a DSGO bearer token from GIR
7. Datastekker queries GIR to resolve the componentId to installationId and manufacturer info [TBD — see Open Questions].
8. Datastekker checks the GIR delegation endpoint to obtain delegationEvidence
9. Datastekker returns authorised performance data and manufacturer info to the installer.

## Before the Approval Flow

The TechniekNederland form collects the following information before triggering the Keyper flow:

| Field | Description |
|-------|-------------|
| vboId | BAG Verblijfsobjectidentificatie (16-digit building identifier) |
| Installer (KvK) | KvK number of the installation company requesting access |
| Building owner (KvK) | KvK number of the owner who approves the request |
| Validity period | Start and end date of the requested access |
| Data-element set | Which set of performance data becomes accessible [TBD — see open questions] |
| License conditions | Terms of use for the data [TBD — see open questions] |

> ℹ️ This step is outside the scope of GIR and Keyper. TechniekNederland builds and manages the form.

The form may optionally query GIR to display the installations registered at the given building, so the user can scope the request:

```http
GET https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage?vboID={vboId}
Authorization: Bearer <ACCESS_TOKEN>
Accept: application/json
```

This returns a list of registered installations including their `installationID.value` and component information. See [Retrieve Multiple Installations](retrieve-installations.md) for the full parameter reference and the required DSGO token.

## Approval Flow

### Step 1: Form Submits Access Request to Keyper *(Poort8)*

After the form is submitted, TechniekNederland sends a request to the Keyper API. Keyper generates an approval link and sends a notification email to the building owner.

**Keyper Approve API example:**

```http
POST https://keyper-preview.poort8.nl/v1/api/approval-links
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "requester": {
    "name": "<INSTALLER NAME>",
    "email": "<INSTALLER EMAIL>",
    "organization": "<INSTALLER COMPANY NAME>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<INSTALLER KVK>"
  },
  "approver": {
    "name": "<BUILDING OWNER NAME>",
    "email": "<BUILDING OWNER EMAIL>",
    "organization": "<BUILDING OWNER ORGANISATION>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<BUILDING OWNER KVK>"
  },
  "dataspace": {
    "baseUrl": "https://gir-preview.poort8.nl"
  },
  "reference": "<UNIQUE REFERENCE>",
  "addPolicyTransactions": [
    {
      "type": "<DICO:GIR-DATASTEKKER>",
      "action": "read",
      "license": "[PLACEHOLDER]",
      "issuedAt": "<UNIX TIMESTAMP>",
      "issuerId": "did:ishare:EU.NL.NTRNL-<BUILDING OWNER KVK>",
      "attribute": "*",
      "notBefore": "<UNIX TIMESTAMP>",
      "subjectId": "did:ishare:EU.NL.NTRNL-<INSTALLER KVK>",
      "expiration": "<UNIX TIMESTAMP matching validity period>",
      "resourceId": "<VBOID — BAG Verblijfsobjectidentificatie>",
      "serviceProvider": "did:ishare:EU.NL.NTRNL-<2BA (DATASTEKKER) KVK>"
    }
  ],
  "orchestration": {
    "flow": "dsgo.gir-datastekker@v1"
  }
}
```

See the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1) for full field documentation.

### Step 2: Keyper Sends Approval Link to Building Owner *(Poort8)*

Keyper generates a unique approval link and sends a notification email to the building owner. No action is required from the installer or TechniekNederland at this point.

### Step 3: Building Owner Authenticates and Approves *(Poort8)*

The building owner opens the approval link and:

1. Authenticates (for example via eHerkenning).
2. Inspects the requested access: which building, which installer, which data, for how long.
3. Clicks **Approve** or **Reject**.

If the building owner rejects the request, the approval link expires and TechniekNederland can initiate a new request.

### Step 4: Keyper Registers Policy in GIR *(Poort8)*

On approval, Keyper automatically registers the policy in the GIR Authorization Register. The installer does not need to take any action. The policy is now active and Datastekker can enforce it on every subsequent data request.

## Operational Data Access

### Step 5: Installer Sends Data Request to Datastekker *(external)*

The data exchange between the installer and Datastekker is bilateral and does not flow through GIR. The installer calls the Datastekker API directly, using a **componentId** (such as an SGTIN or serial number) as the identifier.

> ℹ️ The Datastekker API endpoints are outside the scope of this document. Contact 2BA for the technical specifications.

### Step 6: Datastekker Obtains a DSGO Bearer Token *(Poort8)*

Before querying GIR, Datastekker obtains a DSGO bearer token. See [Obtaining a DSGO Bearer Token](connect-token.md) for the full procedure:

```http
POST https://gir-preview.poort8.nl/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=iSHARE&client_id=did:ishare:EU.NL.NTRNL-<2BA KVK>&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=<SIGNED_JWT>
```

### Step 7: Datastekker Resolves componentId to installationId and Retrieves Manufacturer Info *(Poort8)*

Before checking the delegation policy, Datastekker must resolve the componentId to an installationId. This step also retrieves the `GIRBasisdataMessage`, which contains manufacturer information for the installation.

> **⚠️ Open point**: GIR does not currently provide a filter parameter for componentId. The mechanism for resolving a componentId to an installationId has not yet been specified. See [Open Questions](#open-questions).

Once the installationId is known, Datastekker queries GIR for the full `GIRBasisdataMessage` using the bearer token from step 6:

```http
GET https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage?installationIDValue=<INSTALLATION_ID>
Authorization: Bearer <DSGO_ACCESS_TOKEN>
Accept: application/json
```

The response includes `component[].productInformation.manufacturerName` and related fields, which Datastekker uses to include manufacturer details in its response to the installer.

### Step 8: Datastekker Checks Delegation in GIR *(Poort8)*

Using the DSGO bearer token obtained in step 6, Datastekker calls the GIR delegation endpoint to verify that an active and valid policy exists for the installer:

```http
POST https://gir-preview.poort8.nl/delegation
Authorization: Bearer <DSGO_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "delegationRequest": {
    "policyIssuer": "did:ishare:EU.NL.NTRNL-<BUILDING OWNER KVK>",
    "target": {
      "accessSubject": "did:ishare:EU.NL.NTRNL-<INSTALLER KVK>"
    },
    "policySets": [
      {
        "policies": [
          {
            "target": {
              "resource": {
                "type": "<DICO:GIR-DATASTEKKER>",
                "identifiers": ["<INSTALLATION_ID>"],
                "attributes": ["*"]
              },
              "actions": ["read"],
              "environment": {
                "serviceProviders": ["did:ishare:EU.NL.NTRNL-<2BA KVK>"]
              }
            }
          }
        ]
      }
    ]
  }
}
```


GIR responds with a `delegationEvidence` object. Datastekker inspects this to confirm the policy covers the requested data elements and has not expired:

```json
{
  "delegationEvidence": {
    "notBefore": "<UNIX TIMESTAMP>",
    "notOnOrAfter": "<UNIX TIMESTAMP>",
    "policyIssuer": "did:ishare:EU.NL.NTRNL-<BUILDING OWNER KVK>",
    "target": {
      "accessSubject": "did:ishare:EU.NL.NTRNL-<INSTALLER KVK>"
    },
    "policySets": [
      {
        "maxDelegationDepth": 0,
        "target": {
          "environment": {
            "licenses": ["[PLACEHOLDER]"]
          }
        },
        "policies": [
          {
            "target": {
              "resource": {
                "type": "<DICO:GIR-DATASTEKKER>",
                "identifiers": ["<INSTALLATION_ID>"],
                "attributes": ["*"]
              },
              "actions": ["read"],
              "environment": {
                "serviceProviders": ["did:ishare:EU.NL.NTRNL-<2BA KVK>"]
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

If no matching policy exists or the policy has expired, GIR returns a response without a `Permit` rule. Datastekker treats any non-permit result as an authorization failure and returns an error to the installer.

### Step 9: Datastekker Returns Authorised Data *(2BA)*

If authorization succeeds, Datastekker returns the authorised performance data together with the manufacturer information retrieved from the `GIRBasisdataMessage` in step 7.

## Policy Parameters

| Parameter | Where used | Description | Status |
|-----------|------------|-------------|--------|
| `issuerId` | Keyper request, delegation request | DID of the building owner (policy issuer) | Required |
| `subjectId` | Keyper request, delegation request | DID of the installer (access subject) | Required |
| `serviceProvider` | Keyper request, delegation request | DID of Datastekker / 2BA (the data service provider) | Required |
| `resourceId` / `identifiers` | Keyper request, delegation request | Hierarchical resource identifier — a vboId (building) covers all its installations; an installationId scopes to a single installation. Consent may be granted at building level and enforced at installation level. | Required |
| `notBefore` / `expiration` | Keyper request, delegation evidence | Validity period: start and end of the granted access | Required |
| `attribute` | Keyper request, delegation request | `*` (wildcard); use a predefined dataset identifier to restrict scope. See open questions #4 and #6 for the future attribute hierarchy. | `*` |
| `type` | Keyper request, delegation request | Resource type identifier used in policy matching | `<DICO:GIR-DATASTEKKER>` |
| `action` | Keyper request, delegation request | Permitted action on the resource | `read` |
| `useCase` | Keyper request | Use case identifier for policy scoping. Optional: when omitted, Keyper derives it automatically from `orchestration.flow` by stripping the version suffix. | `dsgo.gir-datastekker` |
| `license` / `licenses` | Keyper request, delegation evidence | License identifier expressing the terms of use for the data | `[PLACEHOLDER]` |
| `componentId` | Datastekker internal | Component identifier provided by the installer; must be resolved to an installationId before the GIR query and delegation check | Open point — see Open Questions |

## Open Questions

The following points are unresolved and must be answered before the integration can be fully specified.

**1. Boundary between legal and technical aspects**

The line between what is legal and what is technical in nature is still unclear. Discussions span both domains simultaneously, making it difficult to reach concrete technical decisions. It would be beneficial to document the legal framework separately before locking in technical implementation choices.

**2. Requirements on software parties versus installers**

Why must a software party operating on behalf of an installer meet more requirements than an installer who has written their own software and acts directly? The basis for this distinction needs to be clarified.

**3. Validation of the installer with the manufacturer**

Should an installer also be validated by the installation manufacturer — for example before being allowed to adjust installation parameters? It is not yet clear whether this becomes part of the authorization flow and what the implications are for the policy model.

One option is for Datastekker to forward the `delegationEvidence` token it receives from GIR along with its data requests to manufacturers. This would allow a manufacturer to independently verify the authorization envelope — confirming who approved access, for which building, for which dataset, and for how long — before providing data to Datastekker. Adopting this pattern would also enable manufacturers to enforce their own access control based on the same GIR policy, without a separate authorization check.

**4. Predefined data-element sets**

Which fixed sets of data elements can be authorized? This has a direct impact on the requirements for the Datastekker API: the API must recognise the requested set and filter on it. The definition of these sets is a prerequisite before the `attribute` field in the policy and delegation request can be filled in.

**5. License conditions**

Which license conditions apply to the use of performance data? Considerations include:

- Obligation to delete data after use (purpose limitation)
- Prohibition on re-use or onward sharing with third parties
- GDPR requirements for buildings with occupants, where performance data may indirectly constitute personal data

**6. Attribute hierarchy in the GIR Authorization Register (optional)**

Consent is granted at the level of a predefined data-element set (the `attribute` field). At runtime, Datastekker may need to evaluate access at the level of individual data elements — for example to enforce that only a specific subset of a set's properties is returned.

This could be supported by declaring an attribute hierarchy on the GIR Authorization Register, modelled on the Heatpump Common Ontology (SAREF-based). A coarser `attribute` value in the policy would then implicitly cover the finer-grained ontology terms beneath it, allowing Datastekker to check per-data-element access without requiring the building owner to enumerate every individual field.

TechniekNederland, as the governing organisation for the predefined datasets, would be responsible for maintaining this hierarchy.

Open points:

- Does GIR support attribute hierarchies today, or would this require a new capability?
- How are the predefined sets mapped to ontology terms in the Heatpump Common Ontology / SAREF?
- What is the governance process for adding or updating sets (versioning, backwards compatibility)?

**7. ComponentId-to-installationId resolution**

The installer provides a componentId (such as an SGTIN or serial number). GIR does not currently support filtering `GET /v1/api/GIRBasisdataMessage` by componentId. The mechanism for resolving a componentId to an installationId — for example via a new GIR endpoint, an external registry, or a mapping table maintained by 2BA — has not yet been specified.

---

## Further Reading

- [Data-Consumer Flow](data-consumer-flow.md) — alternative data-access flow through GIR
- [Retrieve Multiple Installations](retrieve-installations.md) — querying GIRBasisdataMessage by vboId
- [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)
- [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)
- [NoodleBar Documentation](../noodlebar/)