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

> Visibility is evaluated only against the exact calling identity's own policies (or self-authorship of the record). A related company acting on a registrar's behalf — even via a `SupplierDelegation`-style policy — will not see that registrar's records through delegation; see [Known blockers](#known-blockers) below.

## Common causes of records staying Pending

- Owner has not yet approved the Keyper request.
- Write targets a different VBO-ID than the approved policy.
- Classification rules in the policy do not cover the submitted installation.
- Submission made by a delegated or related party rather than the exact registrar identity named in the approved policy — see [Known blockers](#known-blockers) below.

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

## Known blockers

| Blocker | Description | Status |
|---------|-------------|--------|
| **No delegated/multi-party visibility** | Listing and retrieving records only checks the calling identity's own read/write policies, plus a self-authorship fallback for the submitting registrar. A software platform or other related party querying on behalf of a registrar — even via a `SupplierDelegation`-style policy as used in [Digitaal Onderhoudsboekje](digitaal-onderhoudsboekje-supplier-delegation.md) — will get an empty result instead of seeing that registrar's records. | Open (dev task) |
