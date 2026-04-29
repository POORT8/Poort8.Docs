# Datastekker – Installer Access Flow

> **⚠️ Design document — not ready for implementation**
>
> This document describes the intended flow for the Datastekker use case. Several open questions remain unresolved (see [Open Questions](#open-questions)). Policy field values, data-element sets, and license conditions have not been finalised. Do not use this document as the basis for implementation until it has been marked as approved.

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

```mermaid
sequenceDiagram
    participant Form as TechniekNederland Form
    participant Keyper as Keyper API
    participant Owner as Building Owner
    participant GIR as GIR API
    participant DS as Datastekker (2BA)
    participant Inst as Installer

    rect rgb(240, 248, 255)
        Note over Form,GIR: Approval flow (one-time per installer / building)
        Form->>GIR: Look up installations for vboId
        GIR-->>Form: List of installations at the building
        Form->>Keyper: Create access request for vboId
        Keyper->>Owner: Approval link by email
        Owner->>Keyper: Authenticates and approves
        Keyper->>GIR: Register policy (installer ↔ vboId)
    end

    rect rgb(255, 248, 240)
        Note over Inst,GIR: Operational data access (bilateral, recurring)
        Inst->>DS: Data request with installationId or componentId
        DS->>GIR: GET /v1/api/GIRBasisdataMessage?installationIDValue=...
        GIR-->>DS: Installation record including vboId
        DS->>GIR: POST /delegation — is policy valid for installer + vboId?
        GIR-->>DS: Delegation evidence
        DS-->>Inst: Authorised performance data
    end
```

### Steps

1. **Access request** — An installer or building owner fills in the form on TechniekNederland. The form queries GIR to show which installations are registered at the given building.
2. **Keyper triggered** — The form submits an access request to Keyper.
3. **Approval** — The building owner receives an approval link, authenticates, and approves the access. Keyper registers the policy in GIR.
4. **Bilateral data access** — The installer calls Datastekker directly. Datastekker looks up the vboId via GIR and verifies authorization via the GIR delegation endpoint.

## Step 1: Access Request via TechniekNederland *(external)*

An installer or the building owner fills in the form on the TechniekNederland website. The form collects the following information:

| Field | Description |
|-------|-------------|
| vboId | BAG Verblijfsobjectidentificatie (16-digit building identifier) |
| Installer (KvK) | KvK number of the installation company requesting access |
| Building owner (KvK) | KvK number of the owner who approves the request |
| Validity period | Start and end date of the requested access |
| Data-element set | Which set of performance data becomes accessible [TBD — see open questions] |
| License conditions | Terms of use for the data [TBD — see open questions] |

> ℹ️ This step is outside the scope of GIR and Keyper. TechniekNederland builds and manages the form.

## Step 2: Look Up Installations via GIRBasisdataMessage *(external)*

The form shows which installations are registered at the given building, so the user can scope the request. Policies are created at vboId level, but Datastekker enforces access at installationId level. The form queries GIR for this purpose:

```http
GET https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage?vboID={vboId}
Authorization: Bearer <ACCESS_TOKEN>
Accept: application/json
```

This returns a list of registered installations at the building, including their `installationID.value` and component information. See [Retrieve Multiple Installations](retrieve-installations.md) for the full parameter reference and the required DSGO token.

> ℹ️ This step is outside the scope of Keyper. The form uses the GIR API to display installations but does not write any data to GIR.

## Step 3: Keyper Triggered *(Poort8)*

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
      "type": "[TBD — instance-specific]",
      "action": "[TBD — instance-specific, e.g. read]",
      "license": "[TBD — see open questions]",
      "useCase": "[TBD — instance-specific]",
      "issuedAt": "<UNIX TIMESTAMP>",
      "issuerId": "did:ishare:EU.NL.NTRNL-<BUILDING OWNER KVK>",
      "attribute": "[TBD — identifier for the data-element set]",
      "notBefore": "<UNIX TIMESTAMP>",
      "subjectId": "did:ishare:EU.NL.NTRNL-<INSTALLER KVK>",
      "expiration": "<UNIX TIMESTAMP matching validity period>",
      "resourceId": "<VBOID — BAG Verblijfsobjectidentificatie>",
      "serviceProvider": "did:ishare:EU.NL.NTRNL-<2BA (DATASTEKKER) KVK>"
    }
  ],
  "orchestration": {
    "flow": "[TBD — instance-specific]"
  }
}
```

The fields `type`, `license`, `useCase`, `attribute`, and `orchestration.flow` are instance-specific and will be determined during technical configuration of the Datastekker integration. See the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1) for full field documentation.

## Step 4: Building Owner Approves *(Poort8)*

The building owner receives an email with a personal approval link. Through that link:

1. The building owner authenticates (for example via eHerkenning).
2. The owner inspects the requested access: which building, which installer, which data, for how long.
3. The owner clicks **Approve** or **Reject**.

After approval, Keyper automatically registers the policy in the GIR Authorization Register. The installer does not need to take any action at this point.

If the building owner rejects the request, the approval link expires and TechniekNederland can initiate a new request.

## Step 5: Policy Active *(external)*

After approval the policy is active in GIR. The installer can now request data via the Datastekker API. The approval step is one-time per installer–building combination; from that point Datastekker validates every request automatically against GIR.

## Step 6: Installer Calls Datastekker *(external)*

The data exchange between the installer and Datastekker is bilateral and does not flow through GIR. The installer calls the Datastekker API directly, using an installationId or componentId as the identifier.

> ℹ️ The Datastekker API endpoints are outside the scope of this document. Contact 2BA for the technical specifications.

## Step 7: Datastekker Validates Delegation with GIR *(Poort8)*

Before returning data, Datastekker verifies that an active and valid policy exists for the installer. Because the policy in GIR is registered at `vboId` level but the installer provides an `installationId` or `componentId`, Datastekker makes two sequential GIR calls.

### Resolve installationId to vboId

Datastekker looks up the corresponding vboId via GIR:

```http
GET https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage?installationIDValue=<INSTALLATION_ID>
Authorization: Bearer <ACCESS_TOKEN>
Accept: application/json
```

The response contains `installationBaseData.installationLocation.vboID`, which Datastekker uses in the next call.

### Delegation check

With the retrieved vboId, Datastekker calls the GIR delegation endpoint:

```http
POST https://gir-preview.poort8.nl/delegation
Authorization: Bearer <ACCESS_TOKEN>
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
                "type": "[TBD — instance-specific]",
                "identifiers": ["<VBOID>"],
                "attributes": ["[TBD — data-element set]"]
              },
              "actions": ["[TBD — instance-specific, e.g. read]"],
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

GIR returns delegation evidence if the policy is valid. Datastekker uses this result to decide whether to return the performance data. If no valid policy exists, Datastekker returns an error to the installer.

## Policy Parameters

| Parameter | Description | Status |
|-----------|-------------|--------|
| `vboId` | BAG Verblijfsobjectidentificatie of the building | Registered in the Keyper policy |
| `installationId` | Installation identifier from GIRBasisdataMessage | Resolved by Datastekker via GIR |
| Validity period | Start and end date of access | Provided with the Keyper request |
| Data-element set | Which performance data is accessible | [TBD — see open questions] |
| License conditions | Terms of use and restrictions | [TBD — see open questions] |

## Open Questions

The following points are unresolved and must be answered before the integration can be fully specified.

**1. Boundary between legal and technical aspects**

The line between what is legal and what is technical in nature is still unclear. Discussions span both domains simultaneously, making it difficult to reach concrete technical decisions. It would be beneficial to document the legal framework separately before locking in technical implementation choices.

**2. Requirements on software parties versus installers**

Why must a software party operating on behalf of an installer meet more requirements than an installer who has written their own software and acts directly? The basis for this distinction needs to be clarified.

**3. Validation of the installer with the manufacturer**

Should an installer also be validated by the installation manufacturer — for example before being allowed to adjust installation parameters? It is not yet clear whether this becomes part of the authorization flow and what the implications are for the policy model.

**4. Predefined data-element sets**

Which fixed sets of data elements can be authorized? This has a direct impact on the requirements for the Datastekker API: the API must recognise the requested set and filter on it. The definition of these sets is a prerequisite before the `attribute` field in the policy and delegation request can be filled in.

**5. License conditions**

Which license conditions apply to the use of performance data? Considerations include:

- Obligation to delete data after use (purpose limitation)
- Prohibition on re-use or onward sharing with third parties
- GDPR requirements for buildings with occupants, where performance data may indirectly constitute personal data

---

## Further Reading

- [Data-Consumer Flow](data-consumer-flow.md) — alternative data-access flow through GIR
- [Retrieve Multiple Installations](retrieve-installations.md) — querying GIRBasisdataMessage by vboId
- [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)
- [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)
- [NoodleBar Documentation](../noodlebar/)
