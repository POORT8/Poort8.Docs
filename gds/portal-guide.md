# Self-Service Portal

The GDS Self-Service Portal allows participants to manage their organization, register systems, browse the API catalogue, and manage access.

**URL:** [gds-preview.poort8.nl/portal ➚](https://gds-preview.poort8.nl/portal)

## Organization onboarding and approval

An organization must be onboarded and approved to access all dataspace features.

### Summary

1. The organization is onboarded through the Self-Service Portal
2. The onboarding user becomes the organization's first administrator
3. Poort8 reviews and approves or rejects the organization

Until Poort8 approves your organization, users from that organization cannot access dataspace systems.

For the complete onboarding and verification flow (KvK checks, email verification, and approval states), see [Organization Registration](onboarding.md).

### User roles in an organization

Users have one of two roles:

| Role | Capabilities |
|------|--------------|
| **Administrator** | Full organization management, including changing user roles and removing users |
| **Member** | Can use portal features available to the organization and invite new users |

The user who onboards the organization becomes the organization's first **administrator**.

## Portal capabilities by role

| Capability | David (Consumer) | Charlie (Provider) | Bob (Owner) |
|------------|-----------------|-------------------|-------------|
| View organization details | ✓ | ✓ | ✓ |
| Register an application | ✓ | — | — |
| Register an API | — | ✓ | — |
| Browse API catalogue | ✓ | ✓ | ✓ |
| Request API access | ✓ | — | — |
| Approve/reject access requests | — | ✓ | — |

## Register an application (David)

Data service consumers register applications that will call APIs on their behalf.

1. Log in to the Self-Service Portal
2. Navigate to **Systems** → **Register Application**
3. Fill in application details (name, description)
4. Submit the registration

After registration, the portal shows your **client credentials**:

| Credential | Description |
|------------|-------------|
| `client_id` | Your application's unique identifier |
| `client_secret` | Your application's secret |

> **Important:** The client secret is shown only once. Store it securely (e.g., in a secrets manager). If lost, you will need to generate a new one.

## Register an API (Charlie)

Data service providers register their APIs to make them discoverable in the catalogue.

1. Log in to the Self-Service Portal
2. Navigate to **Systems** → **Register API**
3. Fill in API details (name, description, base URL)
4. Upload your **OpenAPI specification** — rendered in the catalogue for consumers to browse
5. Submit the registration

After registration, your API appears in the **Catalogue**. Note your API's client ID — consumers will include this as the `aud` claim in their tokens.

## Browse the API catalogue

All participants can browse available APIs:

1. Navigate to the **Catalogue**
2. Browse or search for APIs
3. View API documentation (rendered from the OpenAPI spec)
4. For consumers: click **Request Access** to initiate an access request

## Manage access requests (Charlie)

When a consumer requests access to your API:

1. You receive a notification in the portal
2. Navigate to your API's detail page to see pending requests
3. Review the requesting organization's identity
4. **Approve** or **reject** the request

Once approved, the consumer can request tokens targeting your API. You can **revoke** access at any time.
