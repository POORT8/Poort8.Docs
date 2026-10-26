# Phase 3 — Submit Installation

> Part of the [Registrar Integration Guide](registrar.md). Requires a valid bearer token from [Token Acquisition](registrar-token-acquisition.md). A write policy from [Keyper Approval](registrar-keyper-approval.md) is needed for the record to become `Active`; without it the record is stored as `Pending`.

| Actor | Role |
|-------|------|
| **Your application** | Submits the installation payload with the bearer token. |
| **GIR** | Validates token, schema, and write policy. Returns resulting status. |

```likec4
// view: registrar_step3
specification {
  element actor
  element system
}

model {
  app = actor 'Your Application'
  gir = system 'GIR'
}

views {
  dynamic view registrar_step3 {
    title 'Step 3 — Submit Installation'
    variant sequence

    app -> gir 'POST installation payload with bearer token'
    gir -> gir 'Validate token'
    gir -> gir 'Validate schema and domain constraints'
    gir -> gir 'Check write policy for registrar and VBO-ID'
    gir -> app 'Record stored as Active or Pending'
  }
}
```

## Technical Implementation

The same endpoint handles create and update. Submitting the same installation ID again overwrites the existing record.

| Scenario | HTTP | `metadata.status` |
|----------|------|-------------------|
| Matching write policy exists | `201` / `200` | `Active` |
| No matching write policy | `201` / `200` | `Pending` |

For payload schema and field requirements, see [Register or Update an Installation](insert-installation.md) and [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1).

## Submitting on behalf of another registrar

Submit installations with your own DSGO token and your own KvK number in `registrarChamberOfCommerceNumber`. A Software Supplier may submit on behalf of a registrar only with a [Supplier Delegation](supplier-delegation.md) from that registrar, presenting delegation evidence (action `can_write`) in the `delegation_evidence` header. GIR then checks the registrar's write policy; without valid evidence the submission is rejected with `403 Forbidden`. See [Submit on behalf of another registrar](insert-installation.md#submit-on-behalf-of-another-registrar-software-supplier) for the steps.

> **⚠️ Upcoming change** — This section describes the intended behaviour; GIR does not enforce it yet. Today, GIR does not accept a `delegation_evidence` header on `POST /api/gir/v0/gir-basisdata-messages` and does not compare the caller with `registrarChamberOfCommerceNumber`: it checks the write policy of the registrar named in the body, whoever submits. Once the change is live, a submission on behalf of another registrar without valid delegation evidence is rejected with `403 Forbidden`. Planned date: [TBD]. If your software submits on behalf of registrars today, set up a [Supplier Delegation](supplier-delegation.md) per registrar now.

## Next

[Activation Verification](registrar-activation-verification.md)
