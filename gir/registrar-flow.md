# Registrar Flow – "May I register installations in this building?"

This guide walks through the approval workflow for installers/registrars who need permission to register building installations on behalf of property owners.

🔗 **[Live API Documentation](https://keyper-preview.poort8.nl/scalar/#tag/approval-links/POST/api/approval-links)** – Interactive endpoint testing

## **Sequence Diagram – Registrar Flow**

```mermaid
sequenceDiagram
    participant RegistrarApp
    participant GIR
    participant Keyper
    participant Owner


    RegistrarApp->>GIR: POST /GIRBasisdataMessage\n (installationID)
    GIR-->>RegistrarApp: 201 Created, status Pending

        RegistrarApp->>RegistrarApp:When Status = pending, start approval request
    rect rgb(221, 242, 255)
        note right of RegistrarApp: Create Approval link
        RegistrarApp->>Keyper: POST /approval-links\n(request write policy)
        Keyper-->>RegistrarApp: Approval link status = Active
        Keyper->>Owner: Approval e-mail
        Owner->>Keyper: eHerkenning login\nApprove
        Keyper->>GIR: Register write policy
        GIR->>GIR: Pending → Active
        GIR-->Keyper:Confirm
        Keyper-->Owner:To redirect URL
    end
    RegistrarApp->>GIR: GET /GIRBasisdataMessage\n(Own registrations Pending + Active)
    
    rect rgb(221, 242, 255)
        note right of RegistrarApp: Updating installation
        RegistrarApp->>GIR: POST same installation<br>(installationID)
        GIR-->>RegistrarApp: 200 OK
    end
````

## **Minimum Payload for POST /approval-links**

| **JSON path** | **Filled by** | **Value / validation** |
| -- | -- | -- |
| authenticationMethods | **Fixed** | \["email","eHerkenning"\] (⚠️ email only allowed in preview) |
| requester.\* | **App** | Registrar e-mail, name, organizationId="NL.KVK.<REG_KVK>" |
| approver.\* | **App** | Owner e-mail, name, organizationId="NL.KVK.<OWNER_KVK>" |
| dataspace.\* | **Fixed** | name:"DSGO" · policyUrl:"https://gir-preview.poort8.nl/api/policies/" · organizationUrl:".../organization-registry/\_\_ORGANIZATIONID\_\_" · resourceGroupUrl:".../resourcegroups/" |
| description | **App** | Shown to owner |
| reference | **App** | Internal ID (not used by Keyper) |
| expiresInSeconds | **App** | *Guideline*: 604800 (1 week) |
| redirectUrl | **App** | Landing page after approval |
| addPolicyTransactions\[0\] | **App** | Single **write** policy (registrar) – see example |
| addPolicyTransactions\[1\] | **App** | Single **read** policy (data-consumer, e.g. EDSN) – see example |
| orchestration.flow | **Fixed** | "dsgo.gir@1" |
| addOROrganizationTransaction | **Optional** | Include if owner not in OR – see section on [Missing Owner](#missing-owner-in-the-organization-register) below |

**Notes:**
- **One policy per VBO-ID** – use separate policy transactions in a single approval-link for different buildings
- **BAG validation**: `resourceId` must be a valid 16-digit BAG VBO-ID; Keyper returns 400 if not found
- **Authentication methods**: ⚠️ In production, must include `"eHerkenning"` only, preview allows `"email"` as well

## **JSON Skeleton**

```json
{
  "authenticationMethods": ["email","eHerkenning"],
  "requester": {
    "email": "<REGISTRAR_EMAIL>",
    "organization": "<REGISTRAR_NAME>",
    "organizationId": "NL.KVK.<REGISTRAR_KVK>"
  },
  "approver": {
    "email": "<OWNER_EMAIL>",
    "organization": "<OWNER_NAME>",
    "organizationId": "NL.KVK.<OWNER_KVK>"
  },
  "dataspace": {
    "name": "DSGO",
    "policyUrl": "https://gir-preview.poort8.nl/api/policies/",
    "organizationUrl": "https://gir-preview.poort8.nl/api/organization-registry/__ORGANIZATIONID__",
    "resourceGroupUrl": "https://gir-preview.poort8.nl/api/resourcegroups/"
  },
  "description": "GIR registration approval",
  "reference": "<APP_REFERENCE>",
  "expiresInSeconds": 604800,
  "redirectUrl": "<APP_REDIRECT>",
  "addPolicyTransactions": [
    {
      "useCase": "GIR",
      "issuedAt": "<NOW>", // Unix timestamp - Keyper may override if in past
      "notBefore": "<NOW>", // Keyper may override if in past
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
        "issuedAt": "<NOW>", // Unix timestamp - Keyper may override if in past
        "notBefore": "<NOW>", // Keyper may override if in past
        "expiration": "<NOW_PLUS_3Y>",
        "issuerId": "NL.KVK.<OWNER_KVK>",
        "subjectId": "NL.KVK.39098825", // Policy request on behalf of Data Consumer EDSN
        "serviceProvider": "NL.KVK.27248698",
        "action": "read",
        "resourceId": "<VBO_ID>",
        "type": "vboID",
        "attribute": "*",
        "license": "0005",
        "rules": "Classificaties(NLSfB-55.21,NLSfB-56.21,NLSfB-61.15,NLSfB-62.32,NLSfB-61.18)" //Fixed subset of NL/SfB codes for EDSN
      }
  ],
  "orchestration": { "flow": "dsgo.gir@1" }
}
```

**⚠️ Notea**: 
 - In preview, the RegistrarApp (FormulierenApp) already adds the DataConsumer's read policy to the approval link, on behalf of EDSN. See the full example below
 - In production, `serviceProvider` changes to **NL.KVK.41084554** (Stichting Ketenstandaard).

## **Authentication Example**

### **⚠️ Approval link Token** - required soon

```bash
curl -X POST https://poort8.eu.auth0.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
        "client_id": "<REGISTRAR_CLIENT_ID>",
        "client_secret": "<REGISTRAR_CLIENT_SECRET>",
        "audience": "GIR-Dataspace-CoreManager",
        "grant_type": "client_credentials"
      }'
```

*No scope required*

## **Complete Example Request**

```bash
curl -X POST https://keyper-preview.poort8.nl/api/approval-links \
  -H "Authorization: Bearer <REGISTRAR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "authenticationMethods": ["email","eHerkenning"],
    "requester": {
      "email": "installer@example.com",
      "organization": "Example Installer BV",
      "organizationId": "NL.KVK.12345678"
    },
    "approver": {
      "email": "owner@building.com",
      "organization": "Building Owner BV", 
      "organizationId": "NL.KVK.87654321"
    },
    "dataspace": {
      "name": "DSGO",
      "policyUrl": "https://gir-preview.poort8.nl/api/policies/",
      "organizationUrl": "https://gir-preview.poort8.nl/api/organization-registry/__ORGANIZATIONID__",
      "resourceGroupUrl": "https://gir-preview.poort8.nl/api/resourcegroups/"
    },
    "description": "Permission to register building installations for VBO 0344010000126888",
    "reference": "INSTALL-REQ-2025-001",
    "expiresInSeconds": 604800,
    "redirectUrl": "https://installer-app.example.com/approval-complete",
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
      }
    ],
    "orchestration": { "flow": "dsgo.gir@1" }
  }'
```

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