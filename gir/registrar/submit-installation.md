# Phase 3 — Submit Installation

> Part of the [Registrar Integration Guide](./README.md). Requires a valid bearer token from [Token Acquisition](./token-acquisition.md). A write policy from [Keyper Approval](./keyper-approval.md) is needed for the record to become `Active`; without it the record is stored as `Pending`.

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

For payload schema and field requirements, see [Register or Update an Installation](../insert-installation.md) and [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1).

## Next

[Activation Verification](./activation-verification.md)
