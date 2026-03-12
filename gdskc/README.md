# Green Data Space — Functional Overview

> **Pilot notice:** This GDS Participant Registry is a separate trust service for demo purposes. After the pilot period, this Participant Registry will be merged into the integrated [GDS Authorization Registry](../gds/). Until then, organization registration and identity verification are managed here.

The Green Data Space (GDS) Participant Registry (PR) is a trust service that manages organization identities, verifications, and system registrations for participants in the Green Data Space. It enables organizations to register, be verified, and participate in secure data exchange.

## Personas

The GDS PR involves five key personas from the Poort8 dataspace ecosystem:

| Persona | Role | Primary Tool |
|---------|------|-------------|
| **Emma** — Dataspace Administrator | Manages participants, verifies registrations, maintains trust | Admin Portal |
| **Alice** — End User | Member of a participating organization, consumes data services | Self-Service Portal |
| **Bob** — Data Rights Holder | Owns or controls access to data; approves or rejects access requests from David. May be the same person as Alice when the end user and the data owner belong to the same organization | Self-Service Portal / Email |
| **Charlie** — Data Service Provider | Registers APIs and makes data available to the dataspace | Self-Service Portal |
| **David** — Data Service Consumer | Registers applications that consume APIs on behalf of end users | Self-Service Portal |


## Access and Environments

| Environment | URL |
|-------------|-----|
| **Admin Portal** (Emma) | [gdskc-preview.poort8.nl ➚](https://gdskc-preview.poort8.nl/) |
| **Self-Service Portal** (Alice, Bob, David, Charlie) | [gdskc-preview.poort8.nl/portal ➚](https://gdskc-preview.poort8.nl/portal) |

---

## Organization Onboarding

### Self-Service Registration

Any user (Alice, Bob, David, or Charlie) can register their organization through the self-service portal. The registering user:

1. **Provides organization details** — KvK number (auto-verified via KvK API)
2. **Creates a user account** — provides name, email, and phone number
3. **Accepts conditions of use**
4. **Receives a password setup email** to activate their account

After registration, the organization has status **"review-pending"** and awaits administrator approval.

### Manual Registration (Emma)

Emma can register organizations directly through the Admin Portal. This is primarily useful when onboarding existing GDS relations at dataspace launch. When Emma registers an organization manually, she can approve it immediately — even before the organization's users have completed automated verifications like email confirmation.

---

## Verifications

Each organization has a set of verification checks, organized into three categories. The verification count shows the number of completed verifications (e.g., "5") without a total, since not all checks are required for approval.

### Automatic Checks

These run automatically during registration:

| Check | What it does | Outcome |
|-------|-------------|---------|
| **Business register check** (KvK) | Validates the KvK number via the KvK API and checks the official name | Approved if name matches; rejected if mismatch or not found |
| **LEI check** | Looks up the organization in the GLEIF registry by registration number | Approved if LEI found; pending if not (informational — many legitimate businesses don't have an LEI) |
| **VAT/VIES check** | Validates the VAT number via the EU VIES service | Approved if valid; pending if not provided |
| **Conditions of use** | Records acceptance of the dataspace terms | Auto-approved during registration |

### Organization Checks (Alice, Bob)

These require action from the organization's members:

| Check | What it does | Outcome |
|-------|-------------|---------|
| **Email verification** | Confirms the registered user's email address via a verification link sent by the GDS Participant Registry | Approved when user clicks verification link |
| **Business register extract** | Upload of an official registration document (e.g., KvK extract) | Marked as uploaded when the user submits the document — **no automated content verification** |

### Administrator Checks (Emma)

These require explicit action from Emma:

| Check | What it does | Outcome |
|-------|-------------|---------|
| **Onboarding approval** | Emma's final decision on whether the organization may participate | Approved, rejected, or revoked |

---

## Administrator Processes (Emma)

### Approving a New Registration

When a new organization registers, it appears in the Admin Portal with status **"review-pending"**. Emma should review the following before approving:

**Step 1 — Review identifiers and automatic checks:**
- Verify the business register check passed (name matches the official KvK registry)
- Check the EUID is correct (`NLNHR.{kvkNumber}` format)
- Note the LEI status (informational — not blocking)
- Note the VAT/VIES status (informational — not blocking)

**Step 2 — Review the business register extract:**
- Open the uploaded document (if present)
- Cross-check that the document matches the registered organization name, registration number, and address

**Step 3 — Review users and email verification:**
- Check the Organizations page for the registered user(s)
- Note whether email verification is completed (shown as a status indicator)
- Email verification is not blocking for approval, but it gives confidence the contact details are valid

**Step 4 — Make a decision:**

| Situation | Action |
|-----------|--------|
| All details look legitimate | **Approve** — the organization becomes active and can participate |
| Something looks off but may be a mistake | **Contact** the registered user for clarification. Emma can adjust some input fields to correct for mistakes before approving |
| The organization is not legitimate | **Reject** — the organization cannot participate |

> **Important — EUID cannot be changed.** If an organization registered with incorrect details that resulted in a wrong EUID (e.g., wrong KvK number), Emma cannot correct this. The procedure is: **delete the organization** and either let the user re-register with the correct details, or re-register on their behalf.

### Periodic Compliance Review

Every **6 months**, Emma should review existing registrations to ensure they remain valid:

1. **Sort the organization list** by "Last Validated" date to find organizations not reviewed in the last 6 months
2. **For each organization due for review:**
   - Re-check the business register status — Emma can trigger a manual re-validation of the KvK check and the LEI check
   - Review that the organization is still active in the official registry
   - Check that member details are still current
3. **If everything is still valid:** **Reconfirm compliance** — this resets the verification date to today
4. **If issues are found:** Contact the organization for clarification, or **revoke** participation if the organization is no longer legitimate

### Revoking an Organization

Emma can revoke an active organization's participation at any time. This immediately prevents the organization from operating in the dataspace: no access tokens will be issued to the organization anymore. Reasons include:

- Organization is no longer active in the business register
- Compliance review reveals issues
- Breach of conditions of use

### Reactivating a Revoked Organization

If a revoked organization resolves the issues that led to revocation, Emma can **reactivate** it. Before reactivating, she should:

1. Verify the reason for revocation has been addressed
2. Re-run applicable verification checks (business register, LEI)
3. Review the business register extract (request a new one if the previous is outdated)
4. Confirm the organization is still legitimate

---

## System Registration (Bob, Charlie, David)

Organizations can register systems — APIs and applications — that participate in the dataspace.

### APIs (Charlie)

A data service provider registers APIs to make them discoverable and accessible:

1. **Register the API** via the self-service portal, including an OpenAPI specification upload
2. The API appears in the **catalogue** where other participants can view the documentation and request access
3. **Credentials** are issued by the GDS Participant Registry and shown in the portal
4. The API owner can **grant or revoke access** to applications that request it

### Private Applications (David)

When Alice (end user) and David (data service consumer) belong to the **same organization**, David registers a private application:

1. **Register the application** via the self-service portal
2. **Credentials** are issued by the GDS Participant Registry and shown in the portal
3. **Request access** to APIs through the catalogue
4. Access must be **confirmed by the API owner** before data exchange can begin

### Shared Applications and Token Exchange (Future Extension)

When Alice belongs to a **different organization** than David, a different model is needed: David registers a shared application, sets up token exchange, and requests access from Alice's organization to act on their behalf. This functionality is planned as a future extension and is not yet available.

### Administrator View (Emma)

Emma has **read access** to all registered systems across the dataspace:

- View the systems overview, filterable by type (API/APP)
- View systems per organization via the organization detail page
- View API documentation (OpenAPI spec rendered via Scalar)
- View access grants between systems

Emma does not manage systems directly — system registration and access control are the responsibility of the participating organizations.

---

## Catalogue

The catalogue provides a directory of published API services in the dataspace:

- **Alice, Bob, David, and Charlie** can browse published APIs, view documentation, request access, and manage access grants
- **Emma** can view the full catalogue including all systems and access grants
- Filter by API or application type
- View interactive API documentation via Scalar

---

## Authentication

The GDS Participant Registry uses **Keycloak** as the identity provider. Users authenticate via the self-service portal using email and password (set during registration).

| Flow | Description |
|------|-------------|
| **Interactive login** (Alice, Bob, David, Charlie, Emma) | Username + password via Keycloak; session managed by the BFF layer |
| **M2M authentication** (registered systems) | OAuth 2.0 Client Credentials via Keycloak; see [Requesting API Access](requesting-api-access.md) |

Token endpoint for the preview environment:

```
https://auth.poort8.nl/realms/gds-preview/protocol/openid-connect/token
```
