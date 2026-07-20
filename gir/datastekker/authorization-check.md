# Phase 3 — Authorization Check

> Part of the [Datastekker – Installer Access Flow](./README.md). Runs on every data request from an installer.

For each data request, Datastekker resolves the installer-provided componentId to an installationId, checks the delegation policy in GIR, and returns authorised performance data.

| Actor | Role |
|-------|------|
| **Installer** | Sends a data request with a componentId to Datastekker. |
| **Datastekker (2BA)** | Resolves the componentId, verifies authorization in GIR, and returns data. |
| **GIR** | Evaluates the delegation policy and returns delegation evidence. |

```likec4
// view: datastekker_authorization_check
specification {
  element actor
  element system
}

model {
  inst = actor 'Installer'
  ds = system 'Datastekker (2BA)'
  gir = system 'GIR'
}

views {
  dynamic view datastekker_authorization_check {
    title 'Phase 3 — Authorization Check'
    variant sequence

    inst -> ds 'Data request with componentId'
    ds -> gir 'GET GIRBasisdataMessage — resolve componentId → installationId [TBD]'
    gir -> ds 'GIRBasisdataMessage (installationId + manufacturer info)'
    ds -> gir 'POST /v1/api/delegation — check installer + installationId'
    gir -> ds 'Delegation evidence (Permit or Deny)'
    ds -> inst 'Authorised performance data'
  }
}
```

## Technical Implementation

### Step 1 — Resolve componentId to installationId

> **⚠️ Open point**: GIR does not currently provide a filter parameter for componentId. The mechanism for resolving a componentId to an installationId has not yet been specified — see [Open Question 7](./README.md#open-questions).

Once the installationId is known, query GIR for the full `GIRBasisdataMessage` using the bearer token from Phase 2. The response includes `component[].productInformation.manufacturerName` and related fields used in the final response to the installer.

```http
GET https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage?installationIDValue=<INSTALLATION_ID>
Authorization: Bearer <DSGO_ACCESS_TOKEN>
Accept: application/json
```

### Step 2 — Check the delegation policy in GIR

```http
POST https://gir-preview.poort8.nl/v1/api/delegation
Authorization: Bearer <DSGO_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "delegationRequest": {
    "policyIssuer": "did:ishare:EU.NL.NTRNL-<BUILDING_OWNER_KVK>",
    "target": {
      "accessSubject": "did:ishare:EU.NL.NTRNL-<INSTALLER_KVK>"
    },
    "policySets": [
      {
        "policies": [
          {
            "target": {
              "resource": {
                "type": "GIRDatastekkerAccess",
                "identifiers": ["<INSTALLATION_ID>"],
                "attributes": ["*"]
              },
              "actions": ["read"],
              "environment": {
                "serviceProviders": ["did:ishare:EU.NL.NTRNL-<2BA_KVK>"]
              }
            }
          }
        ]
      }
    ]
  }
}
```

### Step 3 — Interpret the response

GIR returns a `delegationEvidence` object:

```json
{
  "delegationEvidence": {
    "notBefore": "<UNIX_TIMESTAMP>",
    "notOnOrAfter": "<UNIX_TIMESTAMP>",
    "policyIssuer": "did:ishare:EU.NL.NTRNL-<BUILDING_OWNER_KVK>",
    "target": {
      "accessSubject": "did:ishare:EU.NL.NTRNL-<INSTALLER_KVK>"
    },
    "policySets": [
      {
        "maxDelegationDepth": 0,
        "target": {
          "environment": {
            "licenses": ["[PLACEHOLDER]"]
          }
        },
        "policies": [
          {
            "target": {
              "resource": {
                "type": "GIRDatastekkerAccess",
                "identifiers": ["<INSTALLATION_ID>"],
                "attributes": ["*"]
              },
              "actions": ["read"],
              "environment": {
                "serviceProviders": ["did:ishare:EU.NL.NTRNL-<2BA_KVK>"]
              }
            },
            "rules": [
              { "effect": "Permit" }
            ]
          }
        ]
      }
    ]
  }
}
```

| Result | Action |
|--------|--------|
| Policy contains `{ "effect": "Permit" }` | Return authorised performance data and manufacturer info to the installer. |
| No matching policy, policy expired, or no `Permit` rule | Return an authorization error to the installer. Do not serve data. |

## References

- [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)
