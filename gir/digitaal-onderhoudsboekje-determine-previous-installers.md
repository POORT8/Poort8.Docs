# Phase 4 — Determine Previous Installers from GIR Metadata

> **Context**: This is a substep within [Phase 1 — Owner Authorization](digitaal-onderhoudsboekje-owner-authorization.md). After the building owner is selected but before the approval request is submitted, the system must determine which installation companies previously registered data for this building, so the building owner can approve the transfer from a known previous installer.

## Overview

When a building changes installation service companies, the maintenance history is locked in the previous installer's system. Before authorizing the transfer, the building owner needs to know: *from which installer(s) should the data be transferred?*

This step queries GIR for existing `GIRBasisdataMessage` registrations on the selected building (VBO-id), extracts the `metadata.issuer` from the most recent registration per installation, and displays the identified previous installer(s) to the New Installation Service Company for confirmation.

## Data Flow

```
1. Building owner selects a building (VBO-id) in the TN GIR App
2. TN GIR App queries GIR for all GIRBasisdataMessages registered for that VBO-id
3. For each installation in the building:
   - Extract the most recent GIRBasisdataMessage
   - Read its metadata.issuer field (the DSGO-id of the previous installer)
   - Convert DSGO-id to KVK number and company name
4. Display the identified previous installer(s) to the New Installation Service Company
5. New Installation Service Company confirms and proceeds to Phase 1
```

## Implementation

### Step 1: Query GIR for Existing Registrations

Query the GIR endpoint for all `GIRBasisdataMessage` records matching the selected VBO-id:

```http
GET https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessages?vboID=<VBO_ID>
Authorization: Bearer <DSGO_ACCESS_TOKEN>
```

Response:

```json
{
  "items": [
    {
      "guid": "<GUID>",
      "installationID": "<INSTALLATION_ID>",
      "metadata": {
        "issuer": "did:ishare:EU.NL.NTRNL-<PREVIOUS_INSTALLER_KVK>",
        "createdAt": "2026-01-15T10:30:00Z",
        "updatedAt": "2026-07-20T14:45:00Z",
        "status": "Active"
      },
      "installationBaseData": {
        "installationOwnerChamberOfCommerceNumber": "<OWNER_KVK>",
        "installationLocation": {
          "vboID": "<VBO_ID>"
        },
        "classifications": [...]
      }
    },
    ...
  ]
}
```

### Step 2: Identify the Most Recent Registration Per Installation

Group the results by `installationID`. For each installation, select the registration with the most recent `metadata.updatedAt` timestamp.

```pseudocode
grouped = results.GroupBy(r => r.installationID)
for each installation in grouped:
  mostRecent = installation.OrderByDescending(r => r.metadata.updatedAt).First()
  previousInstallerDid = mostRecent.metadata.issuer
  add (installationID, previousInstallerDid) to list
```

### Step 3: Extract the Previous Installer's KVK

The `metadata.issuer` field contains a DSGO identifier in the format:

```
did:ishare:EU.NL.NTRNL-<KVK>
```

Extract the KVK number (rightmost segment after the final `-`):

```csharp
var issuer = "did:ishare:EU.NL.NTRNL-12345678";
var previousInstallerKvK = issuer.Split('-').Last();  // "12345678"
```

### Step 4: Resolve Company Name (Optional)

Optionally, look up the company name from a DSGO registry or local database using the KVK number. This improves the user experience by showing company names instead of KVK numbers:

```http
GET https://dsgo-registry.example.com/organizations/NL-<KVK>
```

### Step 5: Display to the New Installation Service Company

Show the identified previous installer(s) in the TN GIR App:

```
🏢 Building: De Witte Lelie, Amsterdam (VBO-id: 0363100000123456)

Previous installations found:
  □ Installation ID: HVAC-2019
    Previous installer: ABC Installation (KVK: 12345678)
    Last updated: 2026-07-20

  □ Installation ID: ELECTRICAL-2020
    Previous installer: ABC Installation (KVK: 12345678)
    Last updated: 2026-06-15

  □ Installation ID: PLUMBING-2018
    Previous installer: XYZ Service Company (KVK: 87654321)
    Last updated: 2026-01-10

[Next →] [Cancel]
```

### Step 6: Confirm and Proceed to Phase 1

The New Installation Service Company confirms the previous installer(s) and proceeds with Phase 1 (Owner Authorization). The approval request now includes verified previous installer information.

## Critical Implementation Notes

### `metadata.issuer` Must Be Populated from the DSGO Token Subject

For this mechanism to work, every `GIRBasisdataMessage` registration **must** have its `metadata.issuer` field set to the **subject claim (`sub`) from the DSGO bearer token** used to register it.

⚠️ **This is a security requirement**: The `metadata.issuer` must be cryptographically bound to the authentication token and cannot be derived from request body fields like `registrarChamberOfCommerceNumber`.

**Example (correct)**:
```csharp
// In the GIR registration endpoint
var dsgoBearerToken = /* extract from Authorization header */
var issuerFromToken = dsgoBearerToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
// issuerFromToken = "did:ishare:EU.NL.NTRNL-12345678"
entity.Issuer = issuerFromToken;  // ✅ Use token subject, not request body
```

**Example (WRONG)**:
```csharp
// INCORRECT - using request body field
entity.Issuer = $"did:ishare:EU.NL.NTRNL-{request.RegistrarChamberOfCommerceNumber}";  // ❌ WRONG
```

### Single Previous Installer Per Installation (Current Phase)

For the current phase, the TN GIR App displays the most recent `metadata.issuer` per installation. This assumes one previous installer per installation.

Later phases may support:
- Multiple previous installers (full history)
- Granular installer selection per NL/SfB classification
- Batched transfers across multiple previous installers

### No Manual Entry

The previous installer is **determined automatically from GIR metadata**, not entered manually by the New Installation Service Company. This prevents data entry errors and ensures the authorization is bound to verified registration data.

## Testing

When testing this flow:

1. **Register a GIRBasisdataMessage** with a known DSGO token (issuer A)
2. **Query GIR** for that VBO-id
3. **Verify** that `metadata.issuer` matches issuer A's DSGO-id
4. **Simulate a later registration** by a different installer (issuer B)
5. **Verify** that the most recent `metadata.issuer` is issuer B
6. **Confirm** the mechanism correctly identifies the current previous installer

🔗 [Digitaal Onderhoudsboekje — Owner Authorization](digitaal-onderhoudsboekje-owner-authorization.md) · [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)

---

## Known Limitations

| Limitation | Status |
|------------|--------|
| Company name lookup (DSGO registry) | Open — depends on DSGO registry availability |
| Multi-installer history selection | Open — currently shows only the most recent per installation |
| NL/SfB-scoped installer lookup | Open — planned as a later refinement |
