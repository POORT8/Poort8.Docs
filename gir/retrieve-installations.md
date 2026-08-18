# Retrieve Multiple GIRBasisdataMessages (`GET /v1/api/GIRBasisdataMessage`)

🔗 [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)

This guide explains how to retrieve a filtered list of installation records from GIR using query parameters.

> Looking for retrieval by a specific GUID? See [Retrieve an Installation](retrieve-installation.md).

## Prerequisites

- A valid DSGO bearer token. See [Obtaining a DSGO Bearer Token](connect-token.md).
- Your organization has a read policy, or is the original registrar for the installations you want to retrieve, **or** you present a `delegation_evidence` header on behalf of one of those organizations. A write policy alone does not grant read access. See [Authorization](#authorization) below.

## How it works

```mermaid
sequenceDiagram
    participant App as Your Application
    participant GIR as GIR API

    App->>GIR: GET /v1/api/GIRBasisdataMessage?vboID=...<br/>Authorization: Bearer <access_token>
    GIR->>GIR: Filter installations by query parameters
    GIR->>GIR: For each match: check read policy or registrar identity
    GIR-->>App: 200 OK — list of authorized installations (may be empty)
```

Note: this endpoint never returns `403` or `404`. Installations your organization is not authorized to view are silently excluded from the result. An empty array means either no records match the filters, or none of the matches are authorized for your organization.

## Request

```http
GET https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage
Authorization: Bearer <ACCESS_TOKEN>
Accept: application/json
delegation_evidence: <DELEGATION_TOKEN>
```

The `delegation_evidence` header is optional. See [Supplier delegation](#supplier-delegation) below for when to include it.

### Query parameters

All parameters are optional. Combine them to narrow results. Omitting all parameters returns every installation your organization is authorized to view.

| Parameter | Type | Description |
|-----------|------|-------------|
| `vboID` | string | Filter by BAG VBO-ID (16-digit building identifier) |
| `installationOwnerChamberOfCommerceNumber` | string | Filter by the KvK number of the installation owner |
| `registrarChamberOfCommerceNumber` | string | Filter by the KvK number of the registrar who created the records |
| `installationIDValue` | string | Filter by the installation's own identifier value |
| `energyConnectionID` | string | Filter by EAN energy connection ID |
| `componentID` | string | Filter by a component identifier recorded inside the installation |

### Examples

**Filter by VBO-ID (most common):**

```bash
curl "https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage?vboID=0344010000126888" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Accept: application/json"
```

**Combine filters:**

```bash
curl "https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage?vboID=0344010000126888&registrarChamberOfCommerceNumber=30276543" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Accept: application/json"
```

**Filter by component ID:**

```bash
curl "https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage?componentID=COMP-001-ABC" \
  -H "Authorization: ******" \
  -H "Accept: application/json"
```

## Authorization

Filtering and authorization are two separate steps. GIR first applies your query parameters, then checks each matching record individually. A record is included in the response if **any one** of these is true:

| Condition | Who qualifies |
|-----------|---------------|
| Active **read policy** exists with your organization as subject and the installation owner as issuer, for the installation's VBO-ID | Data consumer with an approved Keyper read policy |
| Your organization's DID matches the **registrar** who originally created the record | The registrar who registered the installation |
| A **SupplierDelegation** policy authorizes your organization to act for another organization that itself holds an active **read policy**, and you present a matching `delegation_evidence` header scoped to that read policy | Software supplier calling on behalf of an installer that has its own read policy (see [Supplier delegation](#supplier-delegation)) |

> A **write policy** alone does not grant read access to a record — only a read policy, registrar identity, or delegated read access (see below) is checked here. Write policies govern the `POST /api/GIRBasisdataMessage` endpoint, not retrieval.

Records that do not pass authorization are silently excluded — they do not cause an error.

To set up a read policy for your organization, see [Data-Consumer Flow](data-consumer-flow.md).

### Supplier delegation

If your organization was not the caller who obtained the read policy for a record, but you have a `SupplierDelegation` from that organization (see [Phase 2 — SupplierDelegation](digitaal-onderhoudsboekje-supplier-delegation.md)), you can still retrieve their records:

1. Call `POST /api/delegation` yourself (as the software supplier), with `policyIssuer` set to the installer's DID and `target.accessSubject` set to your own DID. Scope the request to the specific `vboID` and `installationID` you want to query, with `resource.type: "GIRBasisdataMessage"`, `actions: ["read"]`, and `environment.serviceProviders: ["did:ishare:EU.NL.NTRNL-27248698"]` (Techniek Nederland's DID — GIR rejects any other value). See [Step 3: Verify the AccessRight in GIR](digitaal-onderhoudsboekje-m2m-maintenance-data-transfer.md#step-3-verify-the-accessright-in-gir) for the request shape.
2. Take the resulting `delegation_token` from the response and pass it as the `delegation_evidence` header on your `GET` request.
3. GIR validates the token and checks that its scope (VBO-ID, installation ID, action, service provider) matches the record, then evaluates the **read policy** for the delegating installer instead of your own organization. The installer must have an active read policy for the same organization that granted them access in the first place — a write-only relationship is not enough.

The `delegation_evidence` header only ever widens access to records that match the token's exact scope — it never grants broader access than the delegating organization already has.

> **Limitation**: delegation only works on behalf of an organization that itself holds an active read policy for the record. If the delegating organization is only the record's original registrar (see the registrar-identity row above) and has no separate read policy, GIR does **not** fall back to registrar identity for the delegated caller — the request is denied. Register a read policy for the delegating organization if it needs to delegate retrieval to a software supplier.

## Response

A successful `200` response returns an array of `GIRBasisdataMessage` objects (empty array `[]` if no authorized matches are found):

```json
[
  {
    "guid": "550e8400-e29b-41d4-a716-446655440000",
    "registrarChamberOfCommerceNumber": "30276543",
    "installationBaseData": {
      "installationID": { "value": "INST-987-001", "type": "GUID" },
      "name": "Main Transformer Station",
      "operationalStatus": "Operational",
      "lifeCycleStatus": "Installed",
      "installationOwnerChamberOfCommerceNumber": "12345678",
      "installationLocation": {
        "vboID": "0344010000126888"
      },
      "installationProperties": {
        "controlSystemType": "GBS"
      },
      "component": [...]
    },
    "metadata": {
      "issuer": "did:ishare:EU.NL.NTRNL-30276543",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": null,
      "status": "Active"
    }
  }
]
```

### Response fields

| Field | Description |
|-------|-------------|
| `guid` | Unique identifier of the installation record |
| `registrarChamberOfCommerceNumber` | KvK number of the organization that registered this installation |
| `installationBaseData` | Full installation data — see [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1) for the complete schema |
| `metadata.issuer` | DID of the registrar |
| `metadata.createdAt` | When the record was first created |
| `metadata.updatedAt` | When the record was last updated, or `null` if never updated |
| `metadata.status` | `Active` or `Pending` — only `Active` installations are returned |

## Status codes

| Status | Meaning | Action |
|--------|---------|--------|
| `200 OK` | Request successful; list may be empty if no authorized matches exist | — |
| `400 Bad Request` | Invalid request format | Check query parameter names and values |
| `401 Unauthorized` | Missing or expired DSGO bearer token | Obtain a new token — see [Obtaining a DSGO Bearer Token](connect-token.md) |

## Common questions

**Why is my result empty even though installations exist?**
GIR returns an empty list when no records pass both the filter step and the authorization step. Check that:
- Your query parameter values match exactly (filters are case-insensitive, but the field must exist on the record).
- Your organization has an active read policy, registrar ownership, or valid delegated read access for those installations. A write policy alone does not grant read access.

**Does the response include `Pending` installations?**
No. Only `Active` installations are returned to organizations other than the registrar. Installations become `Active` after the registrar has an approved write policy from the owner. See [Register or Update an Installation](insert-installation.md#activation-after-write-approval) for the write-authorization lifecycle.

## API reference

- Interactive endpoint reference and full response schema: [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)