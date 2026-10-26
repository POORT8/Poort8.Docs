# Supplier Delegation (optional)

An organization that uses GIR (an installer, registrar or data consumer) often lets its Software Supplier call data services on its behalf. In DSGO this is a **SupplierDelegation**: the organization (the *legal data service consumer*) authorizes its Software Supplier (the *authorized data service consumer*) to act for it.

Supplier delegation is optional in every GIR flow. GIR implements it as option 3 of the DSGO [Delegaties ➚](https://afsprakenstelseldsgo.atlassian.net/wiki/spaces/DSGOv13/pages/1066737242/Delegaties) page: the delegation is registered in GIR as an independent authorization registry, the Software Supplier fetches delegation evidence from GIR, and sends it along with its data service request in the `delegation_evidence` HTTP header. The data service provider validates the evidence and then checks the access right of the organization the supplier acts for.

> Presenting a SupplierDelegation via OAuth 2.0 Token Exchange (RFC 8693), as described on the DSGO page [Leveranciers machtigingen ➚](https://afsprakenstelseldsgo.atlassian.net/wiki/spaces/dsgo/pages/1025933400/Leveranciers+machtigingen), is not supported yet. Use the `delegation_evidence` header.

## Parties

| Party | DSGO role | Description |
|-------|-----------|-------------|
| Your organization | Legal data service consumer | Holds the access right (or write policy) and authorizes its Software Supplier. |
| Software Supplier | Authorized data service consumer | Calls the data service on behalf of your organization. |
| Keyper *(Poort8)* | — | Orchestrates the self-approval of the SupplierDelegation via eHerkenning and registers it in GIR. |
| GIR | Authorization registry | Stores the SupplierDelegation and issues signed delegation evidence via `POST /v1/api/delegation`. |
| Data service provider | Data service provider | Validates the delegation evidence and checks the access right of your organization. This is GIR itself for `GIRBasisdataMessage`, or a third party such as Datastekker. |

## How it works

```likec4
// view: supplier_delegation
specification {
  element actor
  element system
}

model {
  sd_org = actor 'Your organization'
  sd_supplier = system 'Software Supplier'
  sd_keyper = system 'Keyper'
  sd_gir = system 'GIR (authorization registry)'
  sd_provider = system 'Data service provider'
}

views {
  dynamic view supplier_delegation {
    title 'Supplier Delegation'
    variant sequence

    sd_org -> sd_keyper 'Request and self-approve SupplierDelegation (once)'
    sd_keyper -> sd_gir 'Register SupplierDelegation (your organization → Software Supplier)'
    sd_supplier -> sd_gir 'POST /v1/api/delegation (per request)'
    sd_gir -> sd_supplier 'delegation_token'
    sd_supplier -> sd_provider 'Data service request + delegation_evidence header'
    sd_provider -> sd_provider 'Validate delegation evidence'
    sd_provider -> sd_gir 'Check access right of your organization'
    sd_gir -> sd_provider 'Permit or Deny'
    sd_provider -> sd_supplier 'Data or 403 Forbidden'
  }
}
```

## Support per flow

| Flow | Delegated `type` | Action | Data service provider | Status |
|------|------------------|--------|-----------------------|--------|
| [Data Consumer](data-consumer-flow.md) — retrieve installations | `GIRBasisdataMessage` | `can_read` | GIR | Supported |
| [Registrar](registrar.md) — read back your own records | `GIRBasisdataMessage` | `can_read` | GIR | Supported, if the registrar also holds its own read policy (see [Limitations](#limitations)) |
| [Registrar](registrar.md) — submit installations | `GIRBasisdataMessage` | `can_write` | GIR | ⚠️ Upcoming — see [Submit on behalf of another registrar](insert-installation.md#submit-on-behalf-of-another-registrar-software-supplier) |
| [Digitaal Onderhoudsboekje](digitaal-onderhoudsboekje.md) | `GIRMaintenanceLog` | `can_read` | Previous installation service company's software | Supported; the provider implements [Step 4](#step-4-the-data-service-provider-validates-the-evidence) |
| [Datastekker](datastekker.md) | `GIRDatastekker` | `can_read` | Datastekker (2BA) | Supported; Datastekker implements [Step 4](#step-4-the-data-service-provider-validates-the-evidence) |

## Step 1: Register the SupplierDelegation

This is done once per software relationship. Your organization is both requester and approver: Keyper forwards you directly to the approval screen, where you authenticate via eHerkenning and approve. No building owner is involved.

```http
POST https://keyper-preview.poort8.nl/v1/api/approval-links
Authorization: Bearer <KEYPER_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "requester": {
    "name": "<YOUR CONTACT NAME>",
    "email": "<YOUR EMAIL>",
    "organization": "<YOUR ORGANIZATION>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<YOUR_KVK>"
  },
  "approver": {
    "email": "<YOUR APPROVER EMAIL>",
    "organization": "<YOUR ORGANIZATION>",
    "organizationId": "did:ishare:EU.NL.NTRNL-<YOUR_KVK>"
  },
  "dataspace": {
    "baseUrl": "https://gir-preview.poort8.nl"
  },
  "addPolicyTransactions": [
    {
      "type": "<DELEGATED TYPE>",
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

- Unlike the other GIR flows, Keyper does not fill in fixed values for this flow. Supply all fields shown above. Use the delegated `type` from the [table above](#support-per-flow); add one transaction per type.
- `resourceId: "*"` and `attribute: "*"` make the delegation generic: it covers all buildings and installations of your organization for that type.
- `action: "*"` covers every action your organization is itself authorized for.
- Leave `serviceProvider` out; it is stored as `*`. Keyper derives `issuerId` from `approver.organizationId`.
- Redirect the user to the `url` in the Keyper response to complete the approval.

A SupplierDelegation never widens access. It only says *who* may act for your organization; your organization's own access right (or read policy) remains the limiting factor, including any NL/SfB classification restriction on it.

To revoke a SupplierDelegation, use the [Keyper Manager ➚](https://keyper-preview.poort8.nl/). No building owner involvement is required.

## Step 2: The Software Supplier fetches delegation evidence

Before each data service request, the Software Supplier requests delegation evidence from GIR with its own DSGO bearer token (see [Obtaining a DSGO Bearer Token](connect-token.md)):

```http
POST https://gir-preview.poort8.nl/v1/api/delegation
Authorization: Bearer <SOFTWARE_SUPPLIER_GIR_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "delegationRequest": {
    "policyIssuer": "did:ishare:EU.NL.NTRNL-<YOUR_KVK>",
    "target": {
      "accessSubject": "did:ishare:EU.NL.NTRNL-<SOFTWARE_SUPPLIER_KVK>"
    },
    "policySets": [{
      "policies": [{
        "target": {
          "resource": {
            "type": "<DELEGATED TYPE>",
            "identifiers": ["<IDENTIFIER>"],
            "attributes": ["<ATTRIBUTE>"]
          },
          "actions": ["can_read"],
          "environment": {
            "serviceProviders": ["<DATA SERVICE PROVIDER DID>"]
          }
        }
      }]
    }]
  }
}
```

The request must contain exactly one policy set, one policy, and one value each for `identifiers`, `attributes`, `actions` and `serviceProviders`. Use the values the data service provider expects:

| Data service provider | `identifiers` | `attributes` | `serviceProviders` |
|-----------------------|---------------|--------------|--------------------|
| GIR (`GIRBasisdataMessage`) | The installation's `vboID` | The installation's `installationID.value` | `did:ishare:EU.NL.NTRNL-76660680` (Poort8) |
| Third-party provider (`GIRMaintenanceLog`, `GIRDatastekker`) | The VBO-id of the request | As agreed with the provider; `*` matches the generic SupplierDelegation | The provider's DID |

The response contains a `delegation_token`: a JWT signed by GIR (`iss` = `did:ishare:EU.NL.NTRNL-76660680`), addressed to the Software Supplier (`aud`), and valid for **30 seconds**. Its `delegationEvidence` claim holds the result; continue only if `policySets[0].policies[0].rules[0].effect` is `Permit`.

## Step 3: Send the data service request with the evidence

The Software Supplier calls the data service with its own DSGO bearer token and adds the `delegation_token` as the `delegation_evidence` header:

```http
GET <DATA SERVICE ENDPOINT>
Authorization: Bearer <SOFTWARE_SUPPLIER_ACCESS_TOKEN>
delegation_evidence: <DELEGATION_TOKEN>
```

Request new evidence for every request, because the token expires after 30 seconds.

## Step 4: The data service provider validates the evidence

When GIR is the data service provider, GIR performs these checks itself. A third-party provider must implement them:

1. **Validate the token.** Verify the signature using the certificate chain in the token's `x5c` header, check that `iss` and `sub` are GIR (`did:ishare:EU.NL.NTRNL-76660680`), that the token has not expired, and that `aud` is the caller identified by the bearer token.
2. **Validate the delegation evidence.** In the `delegationEvidence` claim, check that `target.accessSubject` equals the caller, that the current time lies between `notBefore` and `notOnOrAfter`, that `rules[0].effect` is `Permit`, and that `type`, `identifiers`, `actions` and `serviceProviders` match the request and your own DID.
3. **Determine who the supplier acts for.** This is the evidence's `policyIssuer`: the legal data service consumer.
4. **Check the access right of that organization in GIR.** Call `POST /v1/api/delegation` with `policyIssuer` = the building owner and `target.accessSubject` = the `policyIssuer` from step 3 — **not** the caller. See the flow-specific authorization check: [Digitaal Onderhoudsboekje Phase 3](digitaal-onderhoudsboekje-m2m-maintenance-data-transfer.md#step-3-verify-authorization-in-gir) or [Datastekker Phase 3](datastekker-authorization-check.md).
5. Serve the data only if both the evidence and the access right result in `Permit`; otherwise return `403 Forbidden`.

## Limitations

- **⚠️ Writes on GIR are upcoming.** GIR accepts `delegation_evidence` on `GET /api/gir/v0/gir-basisdata-messages/{guid}` and `POST /api/gir/v0/gir-basisdata-messages/_search` today. Accepting it on `POST /api/gir/v0/gir-basisdata-messages` (action `can_write`), and rejecting submissions on behalf of another registrar without it, is not live yet — see [Submit on behalf of another registrar](insert-installation.md#submit-on-behalf-of-another-registrar-software-supplier).
- **One installation per evidence on GIR.** GIR evidence is scoped to one `vboID` and one `installationID`, so a `_search` call returns at most one record through delegation. Request separate evidence per installation.
- **The delegating organization needs its own read policy on GIR.** GIR evaluates the read policy of the `policyIssuer`. Being the original registrar of a record is not enough; register a read policy for the registrar if it delegates retrieval to a Software Supplier.

## References

- [DSGO Delegaties ➚](https://afsprakenstelseldsgo.atlassian.net/wiki/spaces/DSGOv13/pages/1066737242/Delegaties)
- [DSGO /delegation ➚](https://afsprakenstelseldsgo.atlassian.net/wiki/spaces/DSGOv13/pages/1066739479/delegation)
- [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1) · [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)
