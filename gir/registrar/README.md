# Registrar Integration Guide

This guide explains the end-to-end flow for registrars that want to publish and maintain installation data in GIR.

It is intentionally an overview page. It describes how the flow works across Keyper, DSGO, and GIR, while the step-specific implementation details are documented in the dedicated guides listed at the bottom of this page.

To successfully publish data to GIR, two conditions must be met:

- Your organization must have an approved write policy for the target building.
- Your application must call GIR with a valid DSGO bearer token.

## Parties

| Party | DSGO role | Description |
|-------|-----------|-------------|
| Registrar (your application) | Data service provider | Submits and maintains installation data for buildings it is authorized to write. |
| Installation owner | Data service rights holder | Approves write access for a specific building via Keyper. |
| Keyper *(Poort8)* | — | Orchestrates the owner approval flow via eHerkenning. Registers write policies in GIR on approval. |
| GIR | Installation register and authorization registry | Validates token and write policy at write time. Stores records and governs visibility. |
| DSGO Participant Registry | — | Validates DSGO membership and certificate chain when a token is requested. |

## End-to-end flow

```likec4
// view: registrar_full_flow
specification {
  element actor
  element system
}

model {
  app = actor 'Your Application'
  keyper = system 'Keyper'
  owner = actor 'Installation Owner'
  gir = system 'GIR'
  sat = system 'DSGO Participant Registry'
}

views {
  dynamic view registrar_full_flow {
    title 'Registrar Flow – End to End'
    variant sequence

    app -> keyper 'Request write access for a VBO-ID'
    keyper -> owner 'Notify owner'
    owner -> keyper 'Authenticate and approve'
    keyper -> gir 'Register write policy'
    app -> gir 'Request DSGO bearer token'
    gir -> sat 'Validate membership and certificate chain'
    sat -> gir 'Membership active'
    gir -> app 'Bearer token issued'
    app -> gir 'Submit installation data'
    gir -> app 'Record stored as Active or Pending'
  }
}
```

## Four phases

| Phase | Goal | Result |
|-------|------|--------|
| [Phase 1 — Keyper Approval](./keyper-approval.md) | Obtain owner-approved write access for a building | Write policy becomes active in GIR |
| [Phase 2 — Token Acquisition](./token-acquisition.md) | Authenticate your application to GIR | DSGO bearer token available |
| [Phase 3 — Submit Installation](./submit-installation.md) | Create or update installation data | Record stored as `Active` or `Pending` |
| [Phase 4 — Activation Verification](./activation-verification.md) | Verify post-approval visibility | Record transitions to `Active` when authorized |

For repeated updates on the same building, Phase 1 usually does not need to be repeated until policy expiration or scope changes. Phase 2 is repeated whenever the current token expires.

## Execution paths

Choose the path that fits your operational situation.

### Path A: approval-first (fastest activation)

1. Create approval link.
2. Poll until status is `Approved`.
3. Obtain DSGO bearer token.
4. Submit installation write.
5. Expect write status `Active`.

### Path B: write-first (deferred activation)

1. Obtain DSGO bearer token.
2. Submit installation write before approval.
3. Expect write status `Pending`.
4. Create and complete owner approval flow.
5. Re-check installation until status is `Active`.

## Registrar implementation checklist

Use this sequence for a new registrar integration:

1. Create a Keyper approval-link request for the target VBO-ID — see [Keyper Approval](./keyper-approval.md).
2. Store the returned `id`, `reference`, `expiresAtUtc`, and initial `status`.
3. Poll `GET /v1/api/approval-links/{id}` until status is final (`Approved`, `Rejected`, or `Expired`).
4. If approved, obtain a DSGO bearer token — see [Token Acquisition](./token-acquisition.md).
5. Submit the installation message — see [Submit Installation](./submit-installation.md).
6. Inspect `metadata.status` in the write response (`Active` or `Pending`).
7. Verify outcome — see [Activation Verification](./activation-verification.md).
8. On `Rejected` or `Expired`, create a new approval request with a new `reference`.

## Runtime decision matrix

| Approval status | Token status | Write attempt result | What to do next |
|-----------------|--------------|----------------------|-----------------|
| `Approved` | Valid | `Active` | Continue normal updates |
| `Approved` | Missing/expired | `401` | Refresh token and retry |
| `Active` | Valid | `Pending` | Validate policy scope alignment (`resourceId`, identifiers, classification filters) |
| `Rejected` | Valid | Not attempted | Create a new approval request |
| `Expired` | Valid | Not attempted | Create a new approval request |

## Operational monitoring

Track these fields per request cycle:

- Keyper approval-link `id`
- `reference`
- `resourceId` (VBO-ID)
- Installation ID used in GIR writes
- Write `metadata.status`

Recommended alerts:

- `Pending` records that stay unresolved beyond expected approval SLA
- High number of `Expired` approval links
- Repeated scope mismatches for the same `resourceId`

## Related guides

- [../data-consumer-flow.md](../data-consumer-flow.md)
- [../README.md](../README.md)
