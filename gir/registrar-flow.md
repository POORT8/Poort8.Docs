# Registrar Flow – "May I register installations in this building?"

>**Note**: This guide covers version 1 (v1) of the Keyper API, of which the POST endpoint has been updated. If you're looking for coverage of the previous version (v0) of the Keyper API, please refer to the [legacy version of this guide](legacy/registrar-flow.md) instead.

This guide walks through the approval workflow for installers/registrars who need permission to register building installations on behalf of property owners.

🔗 **[API Docs](https://keyper-preview.poort8.nl/scalar/v1#tag/approval-links/post/v1/api/approval-links)** – Interactive endpoint testing

## **Sequence Diagram – Registrar Flow**

```mermaid
sequenceDiagram
    participant RegistrarApp
    participant GIR
    participant Keyper
    participant Owner

    RegistrarApp->>GIR: POST /GIRBasisdataMessage<br/>(installationID)
    GIR-->>RegistrarApp: 201 Created, status Pending

    RegistrarApp->>RegistrarApp: When Status = pending,<br/>start approval request
    rect rgb(221, 242, 255)
        note right of RegistrarApp: Create Approval link
        RegistrarApp->>Keyper: POST /approval-links<br/>(request write policy)
        Keyper-->>RegistrarApp: Approval link status = Active
        Keyper->>Owner: Approval e-mail
        Owner->>Keyper: Authenticate & Approve
        Keyper->>GIR: Register write policy
        GIR->>GIR: Pending → Active
        GIR-->Keyper: Confirm
        Keyper-->Owner: Redirect to success URL
    end
    RegistrarApp->>GIR: GET /GIRBasisdataMessage<br/>(Pending + Active)
    
    rect rgb(221, 242, 255)
        note right of RegistrarApp: Updating installation
        RegistrarApp->>GIR: POST same installation<br/>(installationID)
        GIR-->>RegistrarApp: 200 OK
    end
```

## **Minimum Payload for POST /approval-links**

| **JSON path** | **Filled by** | **Value / validation** |
| -- | -- | -- |
| requester.\* | **App** | Registrar e-mail, name, organizationId="NL.KVK.<REG_KVK>" |
| approver.\* | **App** | Owner e-mail, name, organizationId="NL.KVK.<OWNER_KVK>" |
| dataspace.\* | **Fixed** | baseUrl:"https://gir-preview.poort8.nl" |
| description | **App** | Shown to owner |
| reference | **App** | Internal ID (not used by Keyper) |
| addPolicyTransactions\[0\] | **App** | Single **write** policy (registrar) – see example |
| addPolicyTransactions\[1\] | **App** | Single **read** policy (data-consumer, e.g. EDSN) – see example |
| orchestration.flow | **Fixed** | "dsgo.gir@v1" |
| addOROrganizationTransaction | **Optional** | Include if owner not in OR – see section on [Missing Owner](#missing-owner-in-the-organization-register) below |

**Notes:**
- **One policy per VBO-ID** – use separate policy transactions in a single approval-link for different buildings
- **BAG validation**: `resourceId` must be a valid 16-digit BAG VBO-ID; Keyper returns 400 if not found

## **JSON Skeleton**

```json
{
  "requester": {
    "name": "<REGISTRAR_NAME>",
    "email": "<REGISTRAR_EMAIL>",
    "organization": "<REGISTRAR_ORGANIZATION_NAME>",
    "organizationId": "NL.KVK.<REGISTRAR_KVK>"
  },
  "approver": {
    "name": "<OWNER_NAME>",
    "email": "<OWNER_EMAIL>",
    "organization": "<OWNER_ORGANIZATION_NAME>",
    "organizationId": "NL.KVK.<OWNER_KVK>"
  },
  "dataspace": {
    "baseUrl": "https://gir-preview.poort8.nl"
  },
  "description": "GIR registration approval",
  "reference": "<APP_REFERENCE>",
  "addPolicyTransactions": [
    {
      "useCase": "GIR",
      "issuedAt": "<NOW>",
      "notBefore": "<NOW>",
      "expiration": "<NOW_PLUS_3Y>",
      "issuerId": "NL.KVK.<OWNER_KVK>",
      "subjectId": "NL.KVK.<REGISTRAR_KVK>",
      "serviceProvider": "NL.KVK.27248698",
      "action": "write",
      "resourceId": "<VBO_ID>",
      "type": "vboID",
      "attribute": "*",
      "license": "0005"
    },
    {
      "useCase": "GIR",
      "issuedAt": "<NOW>",
      "notBefore": "<NOW>",
      "expiration": "<NOW_PLUS_3Y>",
      "issuerId": "NL.KVK.<OWNER_KVK>",
      "subjectId": "NL.KVK.39098825",
      "serviceProvider": "NL.KVK.27248698",
      "action": "read",
      "resourceId": "<VBO_ID>",
      "type": "vboID",
      "attribute": "*",
      "license": "0005",
      "rules": "Classificaties(NLSfB-55.21,NLSfB-56.21,NLSfB-61.15,NLSfB-62.32,NLSfB-61.10)"
    }
  ],
  "orchestration": { "flow": "dsgo.gir@v1" }
}
```

| Field | Notes |
|-------|-------|
| `issuedAt`, `notBefore`, `expiration` | Unix timestamps. Keyper may override if in the past |
| `subjectId` (2nd policy) | `NL.KVK.39098825` = EDSN (data consumer) |
| `rules` | Fixed subset of NL/SfB codes for EDSN |

**⚠️ Note**: 
 - In preview, the RegistrarApp (FormulierenApp) already adds the DataConsumer's read policy to the approval link, on behalf of EDSN.
 - In production, `serviceProvider` changes to **NL.KVK.41084554** (Stichting Ketenstandaard).

## **Authentication Example**

### **Approval link Token**

```bash
curl -X POST https://poort8.eu.auth0.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
        "client_id": "<REGISTRAR_CLIENT_ID>",
        "client_secret": "<REGISTRAR_CLIENT_SECRET>",
        "audience": "Poort8-Dataspace-Keyper-Preview",
        "grant_type": "client_credentials"
      }'
```

*No scope required. In production, use `audience`: `Poort8-Dataspace-Keyper`.*

## **Complete Example Request**

```bash
curl -X POST https://keyper-preview.poort8.nl/v1/api/approval-links \
  -H "Authorization: Bearer <REGISTRAR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "requester": {
      "name": "Installer representative",
      "email": "installer@example.com",
      "organization": "Example Installer BV",
      "organizationId": "NL.KVK.12345678"
    },
    "approver": {
      "name": "Building owner",
      "email": "owner@building.com",
      "organization": "Building Owner BV", 
      "organizationId": "NL.KVK.87654321"
    },
    "dataspace": {
      "baseUrl": "https://gir-preview.poort8.nl"
    },
    "description": "Permission to register building installations for VBO 0344010000126888",
    "reference": "INSTALL-REQ-2025-001",
    "addPolicyTransactions": [
      {
        "useCase": "GIR",
        "issuedAt": 1739881378,
        "notBefore": 1739881378,
        "expiration": 1839881378,
        "issuerId": "NL.KVK.87654321",
        "subjectId": "NL.KVK.12345678",
        "serviceProvider": "NL.KVK.27248698",
        "action": "write",
        "resourceId": "0344010000126888",
        "type": "vboID",
        "attribute": "*",
        "license": "0005"
      },
      {
        "useCase": "GIR",
        "issuedAt": 1739881378,
        "notBefore": 1739881378,
        "expiration": 1839881378,
        "issuerId": "NL.KVK.87654321",
        "subjectId": "NL.KVK.39098825",
        "serviceProvider": "NL.KVK.27248698",
        "action": "read",
        "resourceId": "0344010000126888",
        "type": "vboID",
        "attribute": "*",
        "license": "0005",
        "rules": "Classificaties(NLSfB-55.21,NLSfB-56.21,NLSfB-61.15,NLSfB-62.32,NLSfB-61.10)"
      }
    ],
    "orchestration": { "flow": "dsgo.gir@v1" }
  }'
```

### **Example Response**

```json
{
  "id": "e9e6773f-517f-4b05-9229-3cac2065ab9f",
  "reference": "INSTALL-REQ-2025-001",
  "url": "https://keyper-preview.poort8.nl/approve?id=e9e6773f-517f-4b05-9229-3cac2065ab9f",
  "expiresAtUtc": 1739884978,
  "status": "Active"
}
```

The `url` is the approval link to share with the owner. Once they approve, `status` changes to `Approved`.

> **Note**: By default, Keyper sends an email to the approver when the approval link is created. You don't need to send the URL manually unless you want to use a custom notification flow.

## **Common Error Responses**

| **Status** | **Scenario** | **Solution** |
|------------|--------------|--------------|
| `400` | Invalid/unknown VBO-ID | Verify BAG VBO-ID format (16 digits) |
| `400` | Invalid organizationId format | Use "NL.KVK." prefix + valid KVK number |

## **Missing Owner in the Organization Register?**

If the installation owner is not yet registered in the Organization Register, include an `addOROrganizationTransaction` in your approval-link request with at least:

```json
{
  "identifier": "NL.KVK.<OWNER_KVK>",
  "name": "<Owner name>",
  "adherence": { "status": "Active" }
}
```

This ensures the owner organization is properly registered before the approval flow begins. See the full [iSHARE specification](https://dev.ishare.eu/participant-registry-role/create-entitled-party) for complete details.  ⚠️ In production this transaction will potentially change to match the interface of the DSGO Participant register.

## **Follow-up Actions**

After the approval of the approval link by the owner, existing and new installations registered by the registrar on the indicated `vboId` will get status `Active` immediately.

```bash
GET /api/GIRBasisdataMessage
```

**Status behavior**: Installations will be registered as `Pending` until owner approval completes, then automatically become `Active`. Only the registrar can see pending installations during this phase.

For complete implementation details, see the [Register Installations](register-installations.md) guide.