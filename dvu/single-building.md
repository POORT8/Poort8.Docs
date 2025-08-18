# DVU Implementation: Single Building Access

This guide explains how to implement the Keyper Approve workflow for requesting energy data access for a single building through DVU.

## Overview

Users of DVU applications need to request permission from energy contractors to access energy data. This is accomplished through a form on the application website and a backend API call to Keyper Approve.

## Implementation Steps

### Step 1: Website Form

Create a form with the following fields:

#### Requester Information (Form User)

- Email address
- Organization name
- Organization ID (EORI format, example: EU.EORI.NL860730499)
- Building address:
  - Street name
  - House number  
  - Postal code
  - City

#### Energy Contractor Information (Approver)

- Email address
- Organization name
- Organization ID (EORI format, example: EU.EORI.NL860730499)

**Validation Requirements:**
- Client-side validation required for email, EORI number, and mandatory fields
- Note: DVU currently does not support KVK (Chamber of Commerce) numbers

### Step 2: Keyper API Integration

When the form is submitted, send a POST request to the Keyper Approve API:

**Endpoint:** [https://keyper-preview.poort8.nl/api/approval-links](https://keyper-preview.poort8.nl/scalar/#tag/approval-links/POST/api/approval-links)

```http
POST https://keyper-preview.poort8.nl/api/approval-links
Content-Type: application/json
```

#### JSON Request Body Example

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
  "description": "DVU energy data access request for single building",
  "reference": "<YOUR_REFERENCE>",
  "expiresInSeconds": <VALIDITY_PERIOD>,
  "redirectUrl": "<COMPLETION_REDIRECT_URL>",
  "orchestration": {
    "flow": "dvu.voeg-gebouw-toe@1",
    "payload": {
      "address": "<COMPLETE_ADDRESS>",
      "dataServiceConsumer": "<DATA_SERVICE_CONSUMER_EORI>" //For example Bespaargarant EU.EORI.NL807234916
    }
  }
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

### Step 3: User Flow

1. **Link Creation**: After creation, the application receives an approval link with "Active" status
2. **Pre-Approval**: When the approver opens the link, they are automatically redirected to the DVU metadata app for building data entry
3. **After Metadata Entry**: User returns to Keyper Approve for final approval
4. **After Approval**: User is redirected to the specified `redirectUrl`

## Configuration Details

### Orchestration Object

- **`flow`**: `"dvu.voeg-gebouw-toe@1"` activates the single building metadata flow
- **`payload.address`**: Complete building address (e.g., "Stationsplein 45 3013 AK Rotterdam")
- **`redirectUrl`**: URL where user is directed after completing the approval

### Additional Parameters

- **Validity Period**: Set expiration time in seconds (e.g., 1 week = 604,800 seconds)
- **Reference**: Use a unique reference for tracking in your application

## Important Considerations

### Redirect Strategy

Consider the appropriate completion page for your users:
- Dashboard
- Building connection screen  
- Thank you page
- Next steps in your application flow

### Test Environment

The test environment does **not perform complete verifications** such as:
- eHerkenning authentication
- Organization data validation

Use the test environment only for functional testing.

### Development Status

The **orchestration** object is still under development. Breaking changes are expected in this area.

## Next Steps

- Implement error handling for API responses
- Set up monitoring for approval link usage
- Test the complete flow in the test environment
- Plan migration to production environment

---

For bulk building access, see the [Bulk Building Access](bulk-buildings.md) guide.
