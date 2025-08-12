# DVU Implementation: Access to EAN(s) directly

This guide explains how to implement the Keyper Approve workflow for requesting energy data access for a EAN codes directly, without requiring an address. This method is used when the policy is submitted directly with the approval request, bypassing the front-end stepper for address selection.

## Overview

For applications that need to request access to one or more EANs directly, the process involves creating a Keyper approval link with an embedded policy. This approach differs from the standard DVU flow, which uses DVU metadata services (also known as the "front end stepper") to assemble the required policies based on address lookups. In the direct EAN flow, the policy is constructed and submitted directly with the approval request, bypassing the address selection and metadata enrichment steps.

## Implementation Steps

### Step 1: Keyper API Integration

To initiate the request, send a `POST` request to the Keyper Approve API with a specially crafted JSON body that includes the policy transaction.

**Endpoint:** [https://keyper-preview.poort8.nl/api/approval-links](https://keyper-preview.poort8.nl/scalar/#tag/approval-links/POST/api/approval-links)

```http
POST https://keyper-preview.poort8.nl/api/approval-links
Content-Type: application/json
```

#### JSON Request Body Example for Single EAN

The request body must include an `addPolicyTransactions` array containing the policy that grants access to the specified EAN.

```json
{
  "authenticationMethods": ["eherkenning"],
  "requester": {
    "email": "<REQUESTER_EMAIL>",
    "organization": "<REQUESTER_ORGANIZATION>",
    "organizationId": "<REQUESTER_EORI>"
  },
  "approver": {
    "email": "<ENERGY_CONTRACTOR_EMAIL>",
    "organization": "<ENERGY_CONTRACTOR_ORGANIZATION>",
    "organizationId": "<ENERGY_CONTRACTOR_EORI>"
  },
  "dataspace": {
    "name": "dvu",
    "policyUrl": "https://dvu-test.azurewebsites.net/api/policies/",
    "organizationUrl": "https://dvu-test.azurewebsites.net/api/organization-registry/__ORGANIZATIONID__",
    "resourceGroupUrl": "https://dvu-test.azurewebsites.net/api/resourcegroups/"
  },
  "description": "Request for access to EAN via DVU",
  "reference": "<YOUR_REFERENCE>",
  "expiresInSeconds": "<VALIDITY_PERIOD>",
  "redirectUrl": "<COMPLETION_REDIRECT_URL>",
  "addPolicyTransactions": [
    {
      "useCase": "dvu",
      "issuedAt": "<NOW>", // Unix timestamp - Keyper may override if in past
      "notBefore": "<NOW>", // Keyper may override if in past
      "expiration": "<NOW_PLUS_10Y>", // Expiry date as required
      "issuerId": "<ENERGY_CONTRACTOR_EORI>",
      "subjectId": "EU.EORI.NL807234916", // Organisation ID of RVO
      "serviceProvider": "EU.EORI.NL851872426", // Organisation ID of SDS
      "action": "Read",
      "resourceId": "<EAN number>",
      "type": "P4",
      "attribute": "*",
      "license": "iSHARE.0002"
    },
    ... // add a policy for each EAN in this array
  ],
  "orchestration": { "flow": "dvu.basic@1" }
}
```
#### **Authentication**

**⚠️ Approval link Token** - required soon

```bash
curl -X POST https://poort8.eu.auth0.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
        "client_id": "<REQUESTER_CLIENT_ID>",
        "client_secret": "<REQUESTER_CLIENT_SECRET>",
        "audience": "Poort8-Dataspace-Keyper-Preview",
        "grant_type": "client_credentials"
      }'
```

*No scope required*

#### Orchestration Configuration

**Important orchestration settings:**
- **`flow`**: `"dvu.basic@1"` activates the flow without metadata services.

**Expected Behavior:**
1. After creation, the application receives an approval link with "Active" status
2. When the approver opens the link, they are automatically redirected to Keyper Approve for final approval

## Data Retrieval After Approval

After the request is approved via Keyper Approve, developers can retrieve the energy data by querying the SDS APIs, following Step 5 and further from the [Bulk Building Access](bulk-buildings.md) guide.