# Data-Consumer Flow – "May I read installation data?"

This guide walks through the approval workflow for data consumers (like EDSN) who need read access to building installation data.

🔗 **[Live API Documentation](https://keyper-preview.poort8.nl/scalar/#tag/approval-links/POST/api/approval-links)** – Interactive endpoint testing

## **Overview**

The data-consumer flow uses exactly the same approval-link structure as the [registrar flow](registrar-flow.md) but with a read-policy instead of a write-policy.

## **Sequence Diagram – Data-Consumer Flow**

```mermaid
sequenceDiagram
    participant DataConsumerApp
    participant GIR
    participant Keyper
    participant Owner

    DataConsumerApp->>Keyper: POST /approval-links\n(request read policy)
    Keyper-->>DataConsumerApp: Approval link status = Active
    Keyper->>Owner: Approval e-mail
    Owner->>Keyper: eHerkenning login\nApprove
    Keyper->>GIR: Register read policy
    GIR-->Keyper:Confirm
    Keyper-->Owner:To redirect URL
    
    Note over DataConsumerApp: After approval
    DataConsumerApp->>GIR: GET /GIRBasisdataMessage?vboID=...\n(Active + authorized)
    GIR->>GIR: Check read permissions
    GIR-->>DataConsumerApp: Installation data (filtered by rules if applicable)
```

## **Minimum Payload for POST /approval-links**

| **JSON path** | **Filled by** | **Value / validation** |
| -- | -- | -- |
| authenticationMethods | **Fixed** | \["email","eHerkenning"\] (⚠️ email only allowed in preview) |
| requester.\* | **App** | Consumer e-mail, name, organizationId="NL.KVK.<CONSUMER_KVK>" |
| approver.\* | **App** | Owner e-mail, name, organizationId="NL.KVK.<OWNER_KVK>" |
| dataspace.\* | **Fixed** | name:"DSGO" · policyUrl:"https://gir-preview.poort8.nl/api/policies/" · organizationUrl:".../organization-registry/\_\_ORGANIZATIONID\_\_" · resourceGroupUrl:".../resourcegroups/" |
| description | **App** | Shown to owner |
| reference | **App** | Internal ID (not used by Keyper) |
| expiresInSeconds | **App** | *Guideline*: 604800 (1 week) |
| redirectUrl | **App** | Landing page after approval |
| addPolicyTransactions\[0\] | **App** | Single **read** policy (data-consumer) – see example |
| orchestration.flow | **Fixed** | "dsgo.gir@1" |
| addOROrganizationTransaction | **Optional** | Include if owner not in OR – see section on [Missing Owner](#missing-owner-in-the-organization-register) below |

**Notes:**
- **One policy per VBO-ID** – use separate policy transactions in a single approval-link for different buildings
- **BAG validation**: `resourceId` must be a valid 16-digit BAG VBO-ID; Keyper returns 400 if not found
- **Authentication methods**: ⚠️ In production, must include `"eHerkenning"` only, preview allows `"email"` as well
- **Rules filtering**: Optional `rules` field can specify NL/SfB classifications; omit for full building access

## **JSON Skeleton**

```json
{
  "authenticationMethods": ["email","eHerkenning"],
  "requester": {
    "email": "<CONSUMER_EMAIL>",
    "organization": "<CONSUMER_NAME>",
    "organizationId": "NL.KVK.<CONSUMER_KVK>"
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
  "description": "Data access approval for GIR installation data",
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
      "subjectId": "NL.KVK.<CONSUMER_KVK>",
      "serviceProvider": "NL.KVK.27248698",
      "action": "read",
      "resourceId": "<VBO_ID>",
      "type": "vboID",
      "attribute": "*",
      "license": "0005",
      "rules": "Classificaties(...)" // Optional - remove to expose all installations
    }
  ],
  "orchestration": { "flow": "dsgo.gir@1" }
}
```

**Note**: ⚠️ In production, `serviceProvider` changes to **NL.KVK.41084554** (Stichting Ketenstandaard).

## **Authentication Example**

### **⚠️ Data-Consumer Token** - required soon

```bash
curl -X POST https://poort8.eu.auth0.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
        "client_id": "<CONSUMER_CLIENT_ID>",
        "client_secret": "<CONSUMER_CLIENT_SECRET>",
        "audience": "Poort8-Dataspace-Keyper",
        "grant_type": "client_credentials"
      }'
```

*No scope required*

## **Complete Example Request**

### **Example 1: Access with NL/SfB Classification Filter**

```bash
curl -X POST https://keyper-preview.poort8.nl/api/approval-links \
  -H "Authorization: Bearer <CONSUMER_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "authenticationMethods": ["email","eHerkenning"],
    "requester": {
      "email": "data@edsn.nl",
      "organization": "EDSN",
      "organizationId": "NL.KVK.39098825"
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
    "description": "EDSN access to building installation data for energy monitoring",
    "reference": "EDSN-ACCESS-2025-001",
    "expiresInSeconds": 604800,
    "redirectUrl": "https://edsn.nl/approval-complete",
    "addPolicyTransactions": [
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
        "rules": "Classificaties(NLSfB-55.21,NLSfB-56.21,NLSfB-61.15,NLSfB-62.32,NLSfB-61.18)"
      }
    ],
    "orchestration": { "flow": "dsgo.gir@1" }
  }'
```

### **Example 2: Full Building Access (No NL/SfB Classification Filter)**

```bash
curl -X POST https://keyper-preview.poort8.nl/api/approval-links \
  -H "Authorization: Bearer <CONSUMER_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "authenticationMethods": ["email","eHerkenning"],
    "requester": {
      "email": "research@university.nl",
      "organization": "Research Institute",
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
    "description": "Research access to all building installation data",
    "reference": "RESEARCH-ACCESS-2025-001",
    "expiresInSeconds": 604800,
    "redirectUrl": "https://research.university.nl/approval-complete",
    "addPolicyTransactions": [
      {
        "useCase": "GIR",
        "issuedAt": 1739881378,
        "notBefore": 1739881378,
        "expiration": 1839881378,
        "issuerId": "NL.KVK.87654321",
        "subjectId": "NL.KVK.12345678",
        "serviceProvider": "NL.KVK.27248698",
        "action": "read",
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

This ensures the owner organization is properly registered before the approval flow begins. See the full [iSHARE specification](https://dev.ishare.eu/participant-registry-role/create-entitled-party) for complete details. ⚠️ In production this transaction will potentially change to match the interface of the DSGO Participant register.

## **Follow-up Actions**

After the approval of the approval link by the owner, the data-consumer can immediately begin querying installation data:

```bash
GET /api/GIRBasisdataMessage?vboID=<VBO_ID>
```

**Access behavior**: Only `Active` installations with matching read policies will be returned. If rules were specified in the policy, only installations matching those NL/SfB classifications will be visible.

For complete querying details, see the [main overview](README.md#5-querying-installations) guide.
