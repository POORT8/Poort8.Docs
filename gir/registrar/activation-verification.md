# Phase 4 — Activation Verification

> Part of the [Registrar Integration Guide](./README.md). Applies when a record from [Submit Installation](./submit-installation.md) is stored as `Pending`.

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

## Common causes of records staying Pending

- Owner has not yet approved the Keyper request.
- Write targets a different VBO-ID than the approved policy.
- Classification rules in the policy do not cover the submitted installation.

Verify that `resourceId`, organization identifiers, and `attribute` in the write request exactly match the approved policy.

## Technical Implementation

Retrieve by installation ID to check status:

```http
GET https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage/<INSTALLATION_ID>
Authorization: Bearer <ACCESS_TOKEN>
```

For filtered list retrieval, see [Retrieve Multiple Installations](../retrieve-installations.md) and [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1).
