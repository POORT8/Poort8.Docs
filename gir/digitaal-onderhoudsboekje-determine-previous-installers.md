# Phase 4 — Determine Previous Installers from GIR Metadata

> **Context**: This is Phase 4 of the [Digitaal Onderhoudsboekje flow](digitaal-onderhoudsboekje.md). It runs after [Phase 1](digitaal-onderhoudsboekje-owner-authorization.md) and requires a read `AccessRight` on `GIRBasisdataMessage` for the VBO-id, obtained via the [Data Consumer flow](data-consumer-flow.md). The `AccessRight` from Phase 1 (`GIRMaintenanceLog`) does not give access to installation data.

## Functional Overview

This phase queries GIR for existing `GIRBasisdataMessage` registrations on the selected building (VBO-id), reads the `registrarChamberOfCommerceNumber` of each installation, and displays the identified previous installer(s) to the New Installation Service Company.

## Technical Implementation

### Step 1: Query GIR for existing registrations

Query the GIR endpoint for all `GIRBasisdataMessage` records matching the selected VBO-id:

```http
POST https://gir-preview.poort8.nl/api/gir/v0/gir-basisdata-messages/_search
Authorization: Bearer <GIR_ACCESS_TOKEN>
Content-Type: application/json

{ "vboID": "<VBO_ID>" }
```

Response:

```json
{
  "data": [
    {
      "guid": "<GUID>",
      "registrarChamberOfCommerceNumber": "<PREVIOUS_INSTALLER_KVK>",
      "installationBaseData": {
        "installationID": { "value": "<INSTALLATION_ID>", "type": "GUID" },
        "installationOwnerChamberOfCommerceNumber": "<OWNER_KVK>",
        "installationLocation": {
          "vboID": "<VBO_ID>"
        },
        "classifications": [...]
      },
      "metadata": {
        "issuer": "did:ishare:EU.NL.NTRNL-<SUBMITTER_KVK>",
        "createdAt": "2026-01-15T10:30:00Z",
        "updatedAt": "2026-07-20T14:45:00Z",
        "status": "Active"
      }
    }
  ],
  "meta": {
    "nextCursor": null,
    "limit": 100,
    "totalItems": 1
  }
}
```

### Step 2: Read the previous installer per installation

GIR keeps one registration per installation. Its `registrarChamberOfCommerceNumber` is the KvK number of the previous installer.

Do not use `metadata.issuer`: that is the DSGO identity that submitted the registration, which can be the installer's Software Supplier.

### Step 3: Resolve the company name (optional)

Optionally, look up the company name from the DSGO registry using the KvK number. This improves the user experience by showing company names instead of KvK numbers.

### Step 4: Display to the New Installation Service Company

Show the identified previous installer(s) in the TN GIR App:

```
🏢 Building: De Witte Lelie, Amsterdam (VBO-id: 0363100000123456)

Previous installations found:
  □ Installation ID: HVAC-2019
    Previous installer: ABC Installation (KvK: 12345678)
    Last updated: 2026-07-20

  □ Installation ID: ELECTRICAL-2020
    Previous installer: ABC Installation (KvK: 12345678)
    Last updated: 2026-06-15

  □ Installation ID: PLUMBING-2018
    Previous installer: XYZ Service Company (KvK: 87654321)
    Last updated: 2026-01-10

[Next →] [Cancel]
```

🔗 [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)

---

## Known blockers

| Blocker | Status |
|---------|--------|
| Company name lookup (DSGO registry) | Open — depends on DSGO registry availability |
| Multi-installer history selection | Open — currently shows only the most recent per installation |
| NL/SfB-scoped installer lookup | Open — planned as a later refinement |
