---
title: "Quick Start"
nav_order: 10
parent: "Keyper"
layout: default
---

## Goal

Enable a federated consumer app to request and obtain multi-party data access approvals via Keyper Approve.

## Prerequisites

- Obtain Keyper Approve API credentials from Poort8.
- Embed form logic in your app to collect requester and approver details and construct the POST body.

## Steps

1. **User submits consent form**
   Collect requester and approver fields: email, organization name, EORI, and building address.
2. **Call Keyper Approve API**
   POST to /api/approval-links with a JSON body derived from form inputs (dataspace URLs, expiresInSeconds, redirectUrl, orchestration settings).

   **Implementation-specific documentation:**
   - [DVU Data Services Integration](implementations/dvu/context.html) - For DVU service providers requesting energy data approval
  - [GIR Implementation](implementations/gir/index.html) - Global Installation Registry
   - [CDA Implementation](implementations/cda/context.html) - Centralized Data Access
   - [GDS Implementation](implementations/gds/context.html) - Global Data Space
3. **Verify link status**
   Inspect the response; when "status": "Active", the approval link is live and the approver has been notified by email.
4. **Redirect user**
   Send the requester or approver to your dashboard or thank-you page via the redirectUrl, including the approval link ID and any encoded parameters.
