# Phase 4 — Activation Verification

> Part of the [Registrar Integration Guide](registrar.md). Applies when a record from [Submit Installation](registrar-submit-installation.md) is stored as `Pending`.

After the owner approval in Keyper completes, GIR automatically promotes matching `Pending` records to `Active`.

```likec4
// view: registrar_activation_verification
specification {
  element actor
  element system
}

model {
  app = actor 'Your Application'
  gir = system 'GIR'
}

views {
  dynamic view registrar_activation_verification {
    title 'Activation Verification'
    variant sequence

    app -> gir 'Retrieve installation'
    gir -> app 'Record with Active or Pending status'
  }
}
```

## Visibility

| Status | Visible to |
|--------|------------|
| `Pending` | Registrar only |
| `Active` | All parties with a matching read or write authorization |

### Software Supplier access

A Software Supplier can retrieve a registrar's records through a [Supplier Delegation](supplier-delegation.md): it fetches delegation evidence from GIR for one installation and sends it in the `delegation_evidence` header (see [Supplier Delegation — Step 2](supplier-delegation.md#step-2-the-software-supplier-fetches-delegation-evidence)). GIR then evaluates the registrar's **read** policy. Being the record's registrar is not enough: the registrar needs its own read policy for the building, otherwise the Software Supplier gets an empty result (or `403` for a single record).

## Common causes of records staying Pending

- Owner has not yet approved the Keyper request.
- Write targets a different VBO-ID than the approved policy.
- Classification rules in the policy do not cover the submitted installation.
- Submission made by a Software Supplier with its own KvK number in `registrarChamberOfCommerceNumber` instead of the registrar's. Use the registrar's KvK number and delegation evidence — see [Submit on behalf of another registrar](insert-installation.md#submit-on-behalf-of-another-registrar-software-supplier).

Verify that `resourceId`, organization identifiers, and `attribute` in the write request exactly match the approved policy.

## Technical Implementation

Filter by installation ID to check status:

```http
POST https://gir-preview.poort8.nl/api/gir/v0/gir-basisdata-messages/_search
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{ "installationID": "<INSTALLATION_ID>" }
```

Use `installationID` to look up the record by its installation identifier. The single-record endpoint `GET /api/gir/v0/gir-basisdata-messages/{guid}` requires the GIR record GUID, not the installation ID.

For filtered list retrieval, see [Retrieve Multiple Installations](retrieve-installations.md) and [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1).
