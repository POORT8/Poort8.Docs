# Architecture

> **Note:** This documentation describes the **future state** of the GDS platform. Some features and `gds-preview` links are not yet available.

This guide explains how the GDS components work together to enable sovereign building data sharing.

## System components

```mermaid
flowchart TB
    subgraph "GDS Participant Registry (Keycloak)"
        KC[Identity & Access Management]
        CAT[API Catalogue]
    end

    subgraph "GDS Authorization Registry (NoodleBar)"
        OR[Organization Registry]
        AR[Authorization Registry]
    end

    subgraph "Keyper Approve"
        KA[Approval Workflow Manager]
    end

    subgraph "External"
        DSP[Data Service Provider<br/>Charlie's IoT Platform]
        DSC[Data Service Consumer<br/>David's Platform]
        BO[Building Owner<br/>Bob]
    end

    DSC -->|1. Authenticate| KC
    DSC -->|2. Call API| DSP
    DSP -->|3. Check policy| AR
    DSC -->|4. Request approval| KA
    KA -->|5. Notify| BO
    BO -->|6. Approve| KA
    KA -->|7. Register policy| AR
```

### GDS Participant Registry

The Participant Registry is a Keycloak-based identity service that manages:

- **Organization identities** — Registration, verification (KvK, LEI, VIES), and approval
- **User accounts** — Credentials, email verification, and organization membership
- **Application registrations** — OAuth2 clients for data service consumers (David)
- **API registrations** — Service definitions for data service providers (Charlie)
- **Access management** — API-level access grants between consumers and providers

The Participant Registry acts as the OAuth2 authorization server. It issues JWT access tokens that consumers present to providers.

**URL:** `https://gds-preview.poort8.nl`

### GDS Authorization Registry (NoodleBar)

The Authorization Registry stores and enforces data-level access policies:

- **Organization Registry** — Master list of all participating organizations
- **Authorization Registry** — Policy storage and enforcement (who can access what building data)

Policies are registered by Keyper after building owner approval. Data service providers query the Authorization Registry on every data request to verify the consumer is authorized.

**URL:** `https://gds-preview.poort8.nl` (same deployment, different API surface)

### Keyper Approve

Keyper manages the human approval workflow:

- Receives approval requests from data service consumers
- Sends email notifications to building owners
- Provides a secure web interface for reviewing and approving requests
- Verifies approver identity through email-based one-time codes
- Registers approved policies in the Authorization Registry

**URL:** `https://keyper-preview.poort8.nl`

## Authentication flow

All API communication uses OAuth2 with Keycloak as the identity provider.

```mermaid
sequenceDiagram
    autonumber
    participant App as David's Application
    participant KC as GDS Participant Registry<br/>(Keycloak)
    participant API as Charlie's API

    App->>KC: POST /token (client_credentials)
    Note over App,KC: client_id + client_secret + scope
    KC-->>App: JWT access token
    App->>API: GET /data + Authorization: Bearer {token}
    API->>API: Validate token (signature, expiry, audience)
    API-->>App: Response
```

**Token endpoint:**
```
https://auth.poort8.nl/realms/gds-preview/protocol/openid-connect/token
```

**JWKS endpoint (for token validation):**
```
https://auth.poort8.nl/realms/gds-preview/protocol/openid-connect/certs
```

Tokens are short-lived (5 minutes) and include an `organization` claim identifying the consumer's verified organization.

## Authorization model

Authentication answers "who are you?" — authorization answers "what are you allowed to do?"

GDS uses a **policy-based** authorization model. Even with a valid token and API access, data requests are only fulfilled when a matching policy exists in the Authorization Registry.

### Policy structure

Each policy specifies:

| Field | Description | Example |
|-------|-------------|---------|
| `issuerId` | Building owner who granted access (Bob) | `NLNHR.87654321` |
| `subjectId` | Organization consuming data (David) | `NLNHR.12345678` |
| `serviceProvider` | IoT platform providing data (Charlie) | `NLNHR.23456789` |
| `type` | Resource type: `building` or `asset` | `building` |
| `resourceId` | Resource identifier (VBO ID or asset ID) | `0363010000659001` |
| `action` | Permitted action: `GET` or `POST` | `GET` |

### Policy enforcement flow

```mermaid
sequenceDiagram
    autonumber
    participant David as Data Consumer
    participant Charlie as IoT Platform
    participant AR as Authorization Registry

    David->>Charlie: GET /buildings/{vboId} + Bearer token
    Charlie->>Charlie: Extract organization from token
    Charlie->>AR: GET /api/authorization/explained-enforce
    AR-->>Charlie: {allowed: true/false, policies: [...]}
    alt Allowed
        Charlie-->>David: 200 OK + building data
    else Not allowed
        Charlie-->>David: 403 Forbidden
    end
```

## Two access control layers

GDS separates API-level access from data-level authorization:

| Layer | What it controls | Who decides | When |
|-------|-----------------|-------------|------|
| **API access** | Can David's app call Charlie's API at all? | Charlie (via portal) | During onboarding |
| **Data authorization** | Can David access building X's sensor data? | Bob (via Keyper) | Per building, on request |

Both layers must be satisfied for data to flow. A consumer needs:
1. API access (granted by the provider through the portal)
2. A valid policy for the specific building (granted by the building owner through Keyper)

## Security layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| Transport | HTTPS (TLS 1.2+) | Encrypted communication |
| Authentication | OAuth2 + JWT | Verified participant identity |
| API access | Keycloak audience/scope | Authorized to call the API |
| Data authorization | Policy enforcement | Authorized to access specific data |
| Approval | Email verification (one-time code) | Human consent for data sharing |
| Audit | Logged authorization decisions | Compliance and incident response |

## Technical standards

| Standard | Usage in GDS |
|----------|--------------|
| OAuth 2.0 (client credentials) | Machine-to-machine authentication |
| JWT (RS256) | Token format with organization identity |
| JWKS | Public key distribution for token validation |
| REST / JSON | All API communication |
| OpenAPI 3.x | API specification format |
| iSHARE | Policy model for authorization enforcement |
| BAG / VBO | Dutch building identification for resource IDs |
