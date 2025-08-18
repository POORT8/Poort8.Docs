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
      "issuedAt": "<NOW>", // Unix timestamp - Not active in the DVU dataspace as it will always default to NOW
      "notBefore": "<NOW>", // Not active in the DVU dataspace as it will always default to NOW
      "expiration": "<NOW_PLUS_10Y>", // Expiry date as required
      "issuerId": "<ENERGY_CONTRACTOR_EORI>",
      "subjectId": "<DATASERVICE_CONSUMER>",
      "serviceProvider": "EU.EORI.NL851872426", // Organisation ID of SDS
      "action": "Read",
      "resourceId": "dvu:resource:groepjevaneans1",
      "type": "P4",
      "attribute": "*",
      "license": "iSHARE.0002" //Not active in the DVU dataspace as it will always default to iSHARE.0002
    }
  ],
  "addResourceGroupTransactions": [
    {
      "resourceGroupId": "dvu:resource:groepjevaneans1",
      "useCase": "dvu",
      "name": "groepjevaneans1",
      "description": "Alle eans van de lantarenpalen op de hoek",
      "provider": "DVU",
      "resources": [
        {
          "resourceId": "dvu:resource:<EAN>",
          "useCase": "dvu",
          "name": "<EAN>",
          "description": "ean: <EAN>",
          "properties": [
            {
              "key": "Grootverbruik",
              "value": "true",
              "isIdentifier": false
            },
            {
              "key": "SpecialMeteringPoint", //NOT NEEDED
              "value": "false",
              "isIdentifier": false
            },
            {
              "key": "Product", //Elektra or Gas, not needed for SDS, only on PDF
              "value": "Elektra",
              "isIdentifier": false
            },
            {
              "key": "GridOperatorEan", //NOT NEEDED
              "value": "<GRID-OPERATOR-EAN>",
              "isIdentifier": false
            },
            {
              "key": "MeasuringCompanyId", //ONLY NEEDED WHEN Grootverbruik = true
              "value": "IDMB002",
              "isIdentifier": false
            },
            {
              "key": "MeasuringCompanyName", //ONLY NEEDED WHEN Grootverbruik = true
              "value": "Joulz",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyId",
              "value": "<ENERGY_CONTRACTOR_EORI>",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyKvk",
              "value": "<ENERGY_CONTRACTOR_KVK>",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyName",
              "value": "<ENERGY_CONTRACTOR_ORGANIZATION>",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyContactFirstName", //ONLY NEEDED WHEN Grootverbruik = true
              "value": "<ENERGY_CONTRACTOR_FIRST_NAME>",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyContactLastName", //ONLY NEEDED WHEN Grootverbruik = true
              "value": "<ENERGY_CONTRACTOR_LAST_NAME>",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyContactEmail", //ONLY NEEDED WHEN Grootverbruik = true
              "value": "<ENERGY_CONTRACTOR_EMAIL>",
              "isIdentifier": false
            },
            {
              "key": "DataAvailableEmail", //Optional email adrress to receive a notification that the energy data at the service provider (SDS) is present
              "value": "<REQUESTER_EMAIL>",
              "isIdentifier": false
            }
          ]
        },
        {
          "resourceId": "dvu:resource:<EAN>",
          "useCase": "dvu",
          "name": "<EAN>",
          "description": "ean: <EAN>",
          "properties": [
            {
              "key": "Grootverbruik",
              "value": "true",
              "isIdentifier": false
            },
            {
              "key": "SpecialMeteringPoint", //NOT NEEDED
              "value": "false",
              "isIdentifier": false
            },
            {
              "key": "Product", //Elektra or Gas, not needed for SDS, only on PDF
              "value": "Gas",
              "isIdentifier": false
            },
            {
              "key": "GridOperatorEan", //NOT NEEDED
              "value": "<GRID-OPERATOR-EAN>",
              "isIdentifier": false
            },
            {
              "key": "MeasuringCompanyId", //ONLY NEEDED WHEN Grootverbruik = true
              "value": "IDMB003",
              "isIdentifier": false
            },
            {
              "key": "MeasuringCompanyName", //ONLY NEEDED WHEN Grootverbruik = true
              "value": "Fudura",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyId",
              "value": "<ENERGY_CONTRACTOR_EORI>",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyKvk",
              "value": "<ENERGY_CONTRACTOR_KVK>",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyName",
              "value": "<ENERGY_CONTRACTOR_ORGANIZATION>",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyContactFirstName", //ONLY NEEDED WHEN Grootverbruik = true
              "value": "<ENERGY_CONTRACTOR_FIRST_NAME>",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyContactLastName", //ONLY NEEDED WHEN Grootverbruik = true
              "value": "<ENERGY_CONTRACTOR_LAST_NAME>",
              "isIdentifier": false
            },
            {
              "key": "IssuingCompanyContactEmail", //ONLY NEEDED WHEN Grootverbruik = true
              "value": "<ENERGY_CONTRACTOR_EMAIL>",
              "isIdentifier": false
            },
            {
              "key": "DataAvailableEmail", //Optional email adrress to receive a notification that the energy data at the service provider (SDS) is present
              "value": "<REQUESTER_EMAIL>",
              "isIdentifier": false
            }
          ]
        }
      ]
    }
  ]
}
```

Note: The orchestration object is not needed for the direct EAN access flow

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