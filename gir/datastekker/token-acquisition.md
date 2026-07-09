# Phase 2 — Token Acquisition

> Part of the [Datastekker – Installer Access Flow](./README.md). This phase is repeated whenever the current token expires (every 3600 seconds).

Before querying GIR, Datastekker must obtain a DSGO bearer token. The token authenticates Datastekker as a DSGO participant; the delegation policy from Phase 1 authorizes the data access. Both are required.

| Actor | Role |
|-------|------|
| **Datastekker (2BA)** | Creates the signed JWT and requests the token. |
| **GIR** | Validates the JWT and certificate chain via the DSGO Participant Registry. Issues the access token. |
| **DSGO Participant Registry** | Validates DSGO membership and certificate chain. |

```likec4
// view: datastekker_token_acquisition
specification {
  element actor
  element system
}

model {
  ds = actor 'Datastekker (2BA)'
  gir = system 'GIR'
  sat = system 'DSGO Participant Registry'
}

views {
  dynamic view datastekker_token_acquisition {
    title 'Phase 2 — Token Acquisition'
    variant sequence

    ds -> gir 'POST /connect/token (signed JWT)'
    gir -> sat 'Validate membership and certificate'
    sat -> gir 'Membership active'
    gir -> ds 'access_token'
  }
}
```

## Technical Implementation

See [Obtaining a DSGO Token](../connect-token.md) for the full procedure and JWT construction details.

The token is valid for 3600 seconds and can be reused across multiple GIR requests within that window.

## References

- [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)
- [DSGO Developer Portal ➚](https://digigo-nu.gitbook.io/dsgo-developer-portal/)

## Next

[Phase 3 — Authorization Check](./authorization-check.md)
