# B2B Federated OAuth Architecture

A conceptual exploration of federated authorization for business-to-business API ecosystems.

## The Problem

Modern enterprises integrate with dozens of external APIs: logistics providers, financial services, government systems, industry platforms. Each integration requires:

- Separate credential management per API
- Custom authentication flows per vendor
- No unified audit trail across integrations
- Repeated compliance verification (KYC, certifications)

This creates an **N×M integration problem**: N applications connecting to M APIs, each with bilateral trust relationships.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   App A     │────▶│   API 1     │     │   API 2     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   ▲                   ▲
      │                   │                   │
      ▼                   │                   │
┌─────────────┐           │                   │
│   App B     │───────────┴───────────────────┘
└─────────────┘

Each arrow = separate integration, credentials, contract
```

## The Vision

A federated model where organizations join once, then seamlessly access any API in the ecosystem:

```
┌─────────────┐                         ┌─────────────┐
│   App A     │──┐                  ┌──▶│   API 1     │
└─────────────┘  │   ┌──────────┐   │   └─────────────┘
                 ├──▶│ Federation│───┤
┌─────────────┐  │   └──────────┘   │   ┌─────────────┐
│   App B     │──┘                  └──▶│   API 2     │
└─────────────┘                         └─────────────┘

Join once → access all
```

**Key principle**: The federation handles trust and token issuance. Data flows directly between parties.

## Core Concepts

### Organizations, Not Users

In B2B, the primary identity is the **organization**, not an individual user. When "Acme Corp" calls an API, the API cares about:

1. Is Acme Corp a legitimate, verified organization?
2. Is Acme Corp authorized to access this API?
3. Is this request actually from Acme Corp (not an imposter)?

Individual users matter for audit trails and internal authorization, but the trust relationship is organization-to-organization.

### Identity Layers

Three distinct identity types exist in B2B integrations:

| Identity Type | Description | Example | Token Claim |
|---------------|-------------|---------|-------------|
| **Organization** | Legal entity, the trust anchor | Acme Corp B.V. (KvK: 12345678) | `sub` |
| **Client / Workload** | Software making the HTTP call | Acme's ERP instance, integration service | `client_id` |
| **User** (optional) | Human identity for audit or authorization | jan@acme.com | `user_id` |

All access tokens MUST identify both the organization and the calling client/workload. They MAY also carry user claims when a human initiated the request.

Why this separation matters:
- **Organization** establishes accountability and contractual responsibility
- **Client** enables rate limiting, incident response, and "which integration did this?"
- **User** provides audit trails and optional fine-grained access control

### The Three Parties

| Role | Description | Example |
|------|-------------|---------|
| **Consumer** | Organization that needs data | Acme Corp's ERP system calling a logistics API |
| **Provider** | Organization that exposes an API | Shipping carrier's track & trace API |
| **Federation** | Trusted third party that verifies identities and issues tokens | Industry consortium, government body, or commercial trust provider |

**Terminology note**:
- A *Consumer* may act for itself or on behalf of another organization (see [Delegation](#delegation-acting-on-behalf-of-another-organization))
- A *Provider* (API operator) may or may not be the data owner (see [Appendix: Dataspace Roles](#appendix-dataspace-roles-model))

### What the Federation Does

The federation is **not** a data broker. It never sees the actual data exchanged between parties.

| Federation responsibility | Direct between parties |
|---------------------------|------------------------|
| Verify organization identity | API requests |
| Issue access tokens | Data exchange |
| Maintain organization registry | Business contracts |
| Enforce scope policies | Fine-grained authorization |
| Audit token issuance | Audit data access |

#### Federation Subcomponents

Operationally, the federation comprises several logical components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Org Verification│───▶│ Trust Registry  │───▶│  Grant/Policy   │
│  (onboarding)   │    │ (orgs + IdPs)   │    │    Engine       │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
                       ┌─────────────────┐    ┌────────▼────────┐
                       │ Audit/Eventing  │◀───│  Token Service  │
                       │   (logs, SIEM)  │    │ (AS, JWKS, etc) │
                       └─────────────────┘    └─────────────────┘
```

| Component | Purpose |
|-----------|---------|
| **Trust Registry** | Organizations, identifiers, verification evidence, trusted IdPs/keys |
| **Grant/Policy Engine** | Who can request which scopes for which APIs |
| **Token Service** | Token issuance, signing keys, discovery metadata (`.well-known`) |
| **Audit/Eventing** | Issuance logs, security events, optional revocation signals |

These may be separate services or combined, depending on scale and governance requirements.

## A Concrete Example

**Scenario**: Acme Corp uses an ERP system that needs to fetch invoice data from their accounting SaaS provider (FinanceCloud) and shipping status from their logistics partner (LogiTrack).

### Without Federation (Current State)

```mermaid
sequenceDiagram
    participant ERP as Acme ERP
    participant FC as FinanceCloud
    participant LT as LogiTrack

    Note over ERP,FC: Integration 1: FinanceCloud
    ERP->>FC: Register as API client
    FC->>ERP: client_id + client_secret
    ERP->>FC: POST /oauth/token (client credentials)
    FC->>ERP: access_token (FinanceCloud-issued)
    ERP->>FC: GET /invoices + token
    FC->>ERP: invoice data

    Note over ERP,LT: Integration 2: LogiTrack (repeat everything)
    ERP->>LT: Register as API client
    LT->>ERP: client_id + client_secret
    ERP->>LT: POST /oauth/token
    LT->>ERP: access_token (LogiTrack-issued)
    ERP->>LT: GET /shipments + token
    LT->>ERP: shipment data
```

Each API has its own OAuth server, its own credentials, its own registration process.

### With Federation

```mermaid
sequenceDiagram
    participant ERP as Acme ERP
    participant Fed as Federation
    participant FC as FinanceCloud
    participant LT as LogiTrack

    Note over ERP,Fed: One-time: Acme joins federation
    ERP->>Fed: Register organization (KvK, certificates)
    Fed->>ERP: Verified ✓

    Note over ERP,FC: Access FinanceCloud
    ERP->>Fed: Request token for FinanceCloud
    Fed->>ERP: access_token (aud=financecloud)
    ERP->>FC: GET /invoices + token
    Note over FC: Validates token from Federation
    FC->>ERP: invoice data

    Note over ERP,LT: Access LogiTrack (same token source)
    ERP->>Fed: Request token for LogiTrack
    Fed->>ERP: access_token (aud=logitrack)
    ERP->>LT: GET /shipments + token
    Note over LT: Validates token from Federation
    LT->>ERP: shipment data
```

One registration, one credential, multiple APIs.

### Client Authentication

When clients authenticate to the federation, prefer **asymmetric methods** over shared secrets:

| Method | Security | Recommendation |
|--------|----------|----------------|
| `client_secret_basic` / `client_secret_post` | Shared secret, can leak | Avoid for production |
| `private_key_jwt` | Client proves possession of private key | Recommended |
| `tls_client_auth` (mTLS) | Client certificate bound to org | Recommended for high security |

Shared client secrets are painful at scale, more likely to leak in enterprise environments, and don't provide sender-constrained tokens.

## Organization Identity

A fundamental question: how do we know "Acme Corp" is really Acme Corp?

### Option A: Central Organization Registry

The federation maintains a registry of verified organizations.

```
┌─────────────────────────────────────────────┐
│           Federation Registry               │
├─────────────────────────────────────────────┤
│ Org ID      │ Name           │ Verified By  │
├─────────────┼────────────────┼──────────────┤
│ 12345678    │ Acme Corp B.V. │ KvK extract  │
│ 87654321    │ LogiTrack B.V. │ KvK extract  │
│ ...         │ ...            │ ...          │
└─────────────┴────────────────┴──────────────┘
```

**Organization identifiers** (for Dutch/EU context):

| Identifier | Description | Stability |
|------------|-------------|-----------|
| KvK number | Dutch Chamber of Commerce, 8 digits | Stable, universal in NL |
| EORI | EU customs identifier, derived from KvK | Stable, EU-wide |
| LEI | Legal Entity Identifier, ISO 17442 | Stable, global, annual renewal |
| VAT number | Tax identifier | May change on restructuring |

**Verification methods**:

- Extract from official registry (KvK, company house)
- Certificate from qualified trust service provider (eIDAS)
- Domain validation + DNS records
- Manual verification with legal documents

**Advantages**:
- Single source of truth for organization identity
- Federation controls verification standards
- Consistent identity across all APIs

**Disadvantages**:
- Organizations must register with federation
- Federation becomes identity bottleneck
- May duplicate existing enterprise identity systems

### Option B: Federated Organization Identity Providers

Organizations bring their own identity. The federation trusts external Identity Providers.

```mermaid
flowchart TB
    subgraph Federation
        AS[Authorization Server]
    end
    
    AS ---|trusts| IdP1[Acme Corp<br/>Entra ID]
    AS ---|trusts| IdP2[LogiTrack<br/>Okta]
    AS ---|trusts| IdP3[FinanceCloud<br/>Auth0]
```

When Acme's ERP needs a token:

1. ERP authenticates to Acme's own Entra ID
2. Entra ID issues an identity assertion
3. ERP presents assertion to Federation
4. Federation validates the assertion and issues an access token

**Advantages**:
- Organizations keep their existing identity infrastructure
- No central user/credential database
- Scales with enterprise SSO patterns

**Disadvantages**:
- Federation must trust each organization's IdP
- Harder to verify "is this really Acme Corp?" vs "someone with an Acme Entra ID"
- More complex onboarding per organization

### Hybrid Approach (Recommended)

Combine both: the federation maintains a registry of **verified organizations** with their **trusted IdP endpoints**.

```
┌───────────────────────────────────────────────────────────┐
│                  Federation Registry                       │
├───────────────────────────────────────────────────────────┤
│ Org ID   │ Name      │ Verified │ IdP Endpoint            │
├──────────┼───────────┼──────────┼─────────────────────────┤
│ 12345678 │ Acme Corp │ KvK ✓    │ https://login.acme.com  │
│ 87654321 │ LogiTrack │ KvK ✓    │ https://auth.logitrack  │
└──────────┴───────────┴──────────┴─────────────────────────┘
```

The federation knows:
1. Organization X is verified (via KvK or similar)
2. Identity assertions from endpoint Y can be trusted for organization X

This separates **organization verification** (done once, by federation) from **authentication** (done per request, by org's own IdP).

#### IdP Assertion Requirements

For M2M (machine-to-machine) flows, the IdP assertion MUST:

- Be **audience-restricted** to the federation's token endpoint
- Be **short-lived** (minutes, not hours)
- Include a **stable organization identifier** that matches the federation registry entry
- Be bound to a **specific client/workload identity** (not just an end-user session)
- Use **asymmetric cryptography** (signed with the organization's private key)

This ensures the federation trusts *organization-bound credentials*, not arbitrary user sessions.

## Authorization: Who May Access What?

Once we know *who* is requesting, we need to determine *what* they may access.

### Scope-Based Access

APIs define **scopes** — categories of access they offer:

```
financecloud.invoices.read      Read invoice data
financecloud.invoices.write     Create/update invoices
logitrack.shipments.read        Read shipment status
logitrack.shipments.create      Create new shipments
```

Scopes are **coarse-grained**. They define categories, not specific resources. "May read invoices" not "may read invoice #12345".

### Two Consent Layers

Access requires agreement from both the API provider and the consuming organization.

**Layer 1: API Provider → Consumer (Administrative)**

FinanceCloud decides: "Acme Corp may use our invoices.read scope"

This is typically:
- Part of a commercial contract
- Registered in the federation's grant registry
- May be auto-approved for certain scope categories

**Layer 2: Request-Time Validation**

At token request time, the federation checks:

```
Token request: Acme wants financecloud.invoices.read

Step 1: Is Acme a verified organization? → Yes
Step 2: Has FinanceCloud granted Acme access to invoices.read? → Yes
Step 3: Issue token with scope=financecloud.invoices.read
```

### Grant Registry

The federation maintains which organizations may request which scopes:

```
┌─────────────────────────────────────────────────────────────┐
│                      Grant Registry                          │
├──────────────┬──────────────┬───────────────────────────────┤
│ API Provider │ Consumer     │ Granted Scopes                │
├──────────────┼──────────────┼───────────────────────────────┤
│ financecloud │ acme-corp    │ [invoices.read, invoices.write]│
│ logitrack    │ acme-corp    │ [shipments.read]              │
│ logitrack    │ financecloud │ [shipments.read]              │
└──────────────┴──────────────┴───────────────────────────────┘
```

### Provider Onboarding

Just as consumers must join the federation, **API providers** must register too:

| Registration Item | Purpose | Example |
|-------------------|---------|--------|
| Resource identifier | The `aud` value for tokens | `https://api.financecloud.com` |
| Scopes offered | Categories of access the API supports | `invoices.read`, `invoices.write` |
| JWKS expectations | How to discover federation signing keys | `/.well-known/jwks.json` |
| Policy constraints | Which scopes require manual approval, certifications, etc. | `invoices.write` requires contract |

The provider registry enables:
- **Scope discovery**: Consumers know what access categories exist
- **Governance**: Federation can enforce rules (e.g., "this scope requires ISO 27001 certification")
- **Audience validation**: Tokens can only target registered providers

## Token Structure

When the federation issues a token, it contains:

```json
{
  "iss": "https://federation.example.com",
  "aud": "https://api.financecloud.com",
  "exp": 1706000000,
  "iat": 1705999700,
  "jti": "c0a8012e-3f7a-4b2a-9d1c-9c2d3c1b5f60",

  "sub": "12345678",
  "sub_type": "kvk",

  "client_id": "acme-erp-prod-01",

  "scope": "financecloud.invoices.read"
}
```

| Claim | Purpose | Required |
|-------|--------|----------|
| `iss` | Who issued this token (the federation) | Yes |
| `aud` | Which API this token is for (critical for security) | Yes |
| `exp` | When the token expires | Yes |
| `iat` | When the token was issued | Yes |
| `jti` | Unique token identifier (for revocation and incident response) | Yes |
| `sub` | Organization identifier (KvK number) | Yes |
| `sub_type` | Type of identifier (kvk, eori, lei) | Yes |
| `client_id` | The calling software/workload identity | Yes |
| `scope` | What access is granted | Yes |

**Note**: `org_name` (human-readable name) is omitted from the base token to reduce size and avoid staleness. Providers can resolve names via the trust registry when needed for display.

### Sender-Constrained Tokens (High Security)

For sensitive APIs, tokens can be bound to a cryptographic key held by the client:

```json
{
  "...": "(standard claims)",
  "cnf": {
    "jkt": "base64url-thumbprint-of-dpop-or-mtls-key"
  }
}
```

The `cnf` (confirmation) claim binds the token to a DPoP proof or mTLS client certificate. The API rejects requests where the presented key doesn't match.

### Audience Binding

**Critical security requirement**: Each token is valid for exactly one API.

A token for FinanceCloud cannot be used at LogiTrack. The API **must** validate that `aud` matches its own identifier.

Clients request tokens for a specific API using the `resource` parameter (RFC 8707):

```
POST /token
resource=https://api.financecloud.com
scope=financecloud.invoices.read
```

The federation issues a token with `aud` bound to that resource.

This prevents:
- Token replay attacks (using a stolen token at a different API)
- Confused deputy attacks (tricking an API into accepting a token meant for another)

## Token Validation

When FinanceCloud receives a request with a token:

```
GET /invoices
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

It validates:

1. **Signature**: Is this token really from the federation? (verify with federation's public key)
2. **Audience**: Is this token for me? (`aud` == my identifier)
3. **Expiry**: Is the token still valid? (`exp` > now)
4. **Scope**: Does the token allow this operation? (`scope` contains required value)

### Local vs. Remote Validation

| Approach | How it works | Trade-off |
|----------|--------------|-----------|
| **Local JWT validation** | API validates signature using cached public keys | Fast, works if federation is down, but can't revoke instantly |
| **Token introspection** | API calls federation to verify token | Slower, requires federation availability, but supports instant revocation |

**Recommendation**: Local validation with short token lifetimes (5-15 minutes). The risk window from a compromised token is limited.

## Fine-Grained Authorization

The federation handles **coarse-grained** authorization: may this organization access this category of data?

**Fine-grained** authorization happens at the API:

```
Federation decides: Acme may read invoices from FinanceCloud
FinanceCloud decides: Acme may only read their own invoices, not other customers'
```

This keeps the federation simple and gives APIs control over their own data.

## Putting It Together

Complete flow for Acme's ERP fetching invoices from FinanceCloud:

```mermaid
sequenceDiagram
    participant ERP as Acme ERP
    participant IdP as Acme IdP
    participant Fed as Federation
    participant FC as FinanceCloud API

    Note over ERP,IdP: 1. Authenticate to own IdP
    ERP->>IdP: Authenticate (client credentials or user login)
    IdP->>ERP: Identity assertion (signed JWT)

    Note over ERP,Fed: 2. Exchange for API token
    ERP->>Fed: Token request<br/>assertion + requested scope + target API
    Note over Fed: Validates assertion<br/>Checks grant registry<br/>Acme may access financecloud.invoices.read ✓
    Fed->>ERP: Access token (aud=financecloud, scope=invoices.read)

    Note over ERP,FC: 3. Call API
    ERP->>FC: GET /invoices<br/>Authorization: Bearer {token}
    Note over FC: Validates token signature<br/>Checks aud == me ✓<br/>Checks scope ✓<br/>Applies own business rules
    FC->>ERP: Invoice data
```

## Delegation (Acting on Behalf of Another Organization)

A common B2B pattern: one organization acts on behalf of another.

**Example**: A logistics service provider manages shipments for multiple shippers. When calling the carrier API, they need to act "as" the shipper.

This introduces a third consent layer:

```
Layer 1: API Provider → Direct Consumer
         "LogiProvider may use carrier.shipments scope"

Layer 2: Principal → Delegate  
         "Shipper authorizes LogiProvider to act on their behalf"

Layer 3: Request includes delegation context
         Token shows: org=logiprovider, acts_on_behalf_of=shipper
```

### Where Does Delegation Live?

**Option A: At the API**

The carrier API maintains its own delegation registry. When LogiProvider requests shipper data, the carrier checks internally if that delegation exists.

- Simple for the federation (no changes needed)
- Each API must implement delegation logic
- No central visibility into who delegates to whom

**Option B: At the Federation**

The federation maintains delegation relationships and includes them in tokens.

- APIs can trust the `acts_on_behalf_of` claim
- Central audit trail of all delegations
- More complex federation

#### How Federation-Level Delegation Works

**Step 1: Register the delegation relationship**

Shipper grants LogiProvider the right to act on their behalf. This is recorded in the federation's delegation registry:

```
┌────────────────────────────────────────────────────────────┐
│                   Delegation Registry                       │
├─────────────┬─────────────┬─────────────────┬──────────────┤
│ Principal   │ Delegate    │ Scopes          │ Expires      │
├─────────────┼─────────────┼─────────────────┼──────────────┤
│ shipper-bv  │ logiprovider│ [shipments.*]   │ 2026-12-31   │
│ shipper-bv  │ customs-agent│ [declarations.*]│ 2026-06-30   │
└─────────────┴─────────────┴─────────────────┴──────────────┘
```

**Step 2: Token request with delegation context**

LogiProvider requests a token, indicating they want to act on behalf of Shipper:

```mermaid
sequenceDiagram
    participant LP as LogiProvider
    participant Fed as Federation
    participant Carrier as Carrier API

    LP->>Fed: Token request<br/>org=logiprovider<br/>acts_on_behalf_of=shipper-bv<br/>scope=carrier.shipments.read<br/>audience=carrier-api
    
    Note over Fed: Validates:<br/>1. LogiProvider is authenticated ✓<br/>2. Shipper→LogiProvider delegation exists ✓<br/>3. Delegation covers shipments.* scope ✓<br/>4. Carrier granted Shipper access ✓
    
    Fed->>LP: Access token with delegation claims
    
    LP->>Carrier: GET /shipments?shipper=shipper-bv<br/>Authorization: Bearer {token}
    
    Note over Carrier: Validates token<br/>Trusts acts_on_behalf_of claim<br/>Returns Shipper's data
    
    Carrier->>LP: Shipment data
```

**Step 3: Token includes delegation context**

The issued token uses an **actor/subject** structure for clear separation:

```json
{
  "iss": "https://federation.example.com",
  "aud": "https://api.carrier.com",
  "scope": "carrier.shipments.read",
  "exp": 1706000000,
  "jti": "tok-xyz789",

  "sub": "22222222",
  "sub_type": "kvk",

  "act": {
    "sub": "11111111",
    "sub_type": "kvk",
    "client_id": "logiprovider-integration-prod"
  },

  "delegation_id": "del-abc123"
}
```

| Claim | Meaning |
|-------|---------|
| `sub` | The **principal** — whose data is being accessed (Shipper) |
| `act` | The **actor** — who is making the call (LogiProvider) |
| `act.client_id` | Which specific software is calling |

This structure makes authorization logic clear:
- Check scope
- Check `sub` matches the requested data partition
- Apply actor-specific restrictions (rate limits, allowlists)

#### Parameter Tampering Protection

**Critical**: The API MUST verify that request parameters match the token principal.

When LogiProvider calls:
```
GET /shipments?shipper=22222222
```

The API MUST validate: `request.shipper == token.sub`

Without this check, a delegate could request `shipper=99999999` (a different shipper) and the coarse scope alone wouldn't prevent it.

#### Trust Model

The trust chain for delegation:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Trust Chain                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Shipper ──trusts──▶ Federation ◀──trusts── Carrier API         │
│     │                    │                       │               │
│     │                    │                       │               │
│     ▼                    ▼                       ▼               │
│  "I authorize       "I verify the           "I trust the        │
│   LogiProvider       delegation exists       federation's       │
│   to act for me"     and include it          delegation claims" │
│                      in the token"                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**What each party trusts**:

| Party | Trusts | Does NOT need to trust |
|-------|--------|------------------------|
| Carrier API | Federation's signature and claims | LogiProvider directly; doesn't need own delegation registry |
| LogiProvider | Federation to honor their delegation rights | N/A |
| Shipper | Federation to only issue delegated tokens when valid | LogiProvider's systems |

**Key insight**: The Carrier API doesn't need to know about the Shipper→LogiProvider relationship. It only needs to trust that when the federation says `sub=shipper` with `act=logiprovider`, that delegation is valid.

#### Token Exchange (RFC 8693)

This pattern can use OAuth 2.0 Token Exchange. LogiProvider exchanges their own token for one that includes delegation:

```
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
subject_token={logiprovider's identity token}
subject_token_type=urn:ietf:params:oauth:token-type:jwt
requested_token_type=urn:ietf:params:oauth:token-type:access_token
audience=https://api.carrier.com
scope=carrier.shipments.read
actor_token={shipper's delegation grant}  # or just a claim
actor_token_type=urn:ietf:params:oauth:token-type:jwt
```

However, a simpler approach is often sufficient: LogiProvider simply includes `acts_on_behalf_of` as a parameter in their token request, and the federation validates it against the delegation registry.

#### When to Choose Federation-Level Delegation

| Choose API-level when... | Choose Federation-level when... |
|--------------------------|--------------------------------|
| Single API needs delegation | Multiple APIs need same delegation info |
| API has existing delegation logic | Want central audit of all delegations |
| Minimize federation complexity | APIs want to avoid implementing delegation |
| Delegation rules are API-specific | Delegation rules are consistent across APIs |

**Recommendation for initial implementation**: Start with delegation at the API level. Expand to federation-level delegation when cross-API consistency becomes important.

## Security Considerations

### Single Point of Trust

The federation becomes critical infrastructure. If compromised:
- Attacker can issue tokens for any organization
- All APIs in the ecosystem are exposed

**Mitigations**:
- Strict security controls on federation infrastructure
- Key rotation policies with HSM-backed signing keys
- Separate signing keys per environment/segment to limit blast radius
- Policy decision logic separated from signing operations
- Anomaly detection on token issuance patterns
- Short token lifetimes limit exposure window

### Key Discovery and Validation

Providers MUST:
- Validate the `iss` claim matches the expected federation
- Fetch federation signing keys via a stable discovery mechanism (`/.well-known/jwks.json`)
- Cache keys with appropriate TTL and handle rotation gracefully
- Reject tokens signed with unknown keys

### Token Theft

If an access token is stolen, it can be used until expiry.

**Mitigations**:
- Short lifetimes (5-15 minutes)
- Sender-constrained tokens (DPoP, mTLS) for high-security scenarios
- Introspection for critical operations

**Revocation strategy** (beyond short TTL):
- Emergency org-level kill switch ("invalidate all tokens for org X")
- Compromise response ("invalidate all tokens for client_id Y since time T")
- Optional: Security Event Tokens (SETs) to push revocation signals to providers

### Organization Impersonation

An attacker might try to register as "Acme Corp" or compromise Acme's IdP.

**Mitigations**:
- Rigorous organization verification during onboarding
- Certificate-based IdP trust (not just URL matching)
- Monitoring for suspicious registration patterns

## Comparison with Direct OAuth

| Aspect | Direct OAuth (per API) | Federated OAuth |
|--------|------------------------|-----------------|
| Credentials | N credentials for N APIs | 1 credential for federation |
| Registration | Register with each API | Register once with federation |
| Trust | Bilateral (you ↔ API) | Transitive (you ↔ federation ↔ API) |
| Audit | Fragmented per API | Centralized token issuance log* |
| Revocation | Per API | Central (organization level) |
| Complexity for consumer | High (N integrations) | Low (1 integration) |
| Complexity for provider | Low (own OAuth server) | Medium (trust federation tokens) |

\* **Note on audit**: The federation can centralize *token issuance* logs. A complete cross-integration audit trail also requires providers to emit *access events* (which endpoint, which data partition, decision). This is audit telemetry, not data brokering — the federation never sees the actual data.

## Open Questions

1. **Governance**: Who operates the federation? Industry consortium, government, commercial entity?

2. **Onboarding friction**: How do we balance security (thorough verification) with adoption (easy onboarding)?

3. **Scope standardization**: Should scope names be standardized across similar APIs, or is namespace-per-API sufficient?

4. **Cross-federation**: What if organization A is in federation X and API B is in federation Y?

5. **Liability**: When something goes wrong, who is responsible? The federation that issued the token? The API that accepted it?

---

## Appendix: Terminology Mapping

| This document | OAuth 2.0 | OpenID Connect |
|---------------|-----------|----------------|
| Consumer | Client | Relying Party |
| Provider | Resource Server | - |
| Federation | Authorization Server | OpenID Provider |
| Organization | - | - |
| Grant Registry | - (typically in AS config) | - |

---

## Appendix: Dataspace Roles Model

This appendix maps the OAuth concepts in this document to the **Poort8 Dataspace Roles Model**.

### The Four Personas

```
        ┌─────────┐                    ┌─────────┐
        │  David  │                    │ Charlie │
        │  (App)  │                    │  (API)  │
        └────┬────┘                    └────┬────┘
             │       ┌───────────┐          │
             └──────▶│ Dataspace │◀─────────┘
             ┌──────▶│           │◀─────────┐
             │       └───────────┘          │
        ┌────┴────┐                    ┌────┴────┐
        │  Alice  │                    │   Bob   │
        │(End-User)│                   │ (Data   │
        │         │                    │  Owner) │
        └─────────┘                    └─────────┘
```

| Persona | Role | Example |
|---------|------|---------|
| **David** | App / Service Consumer | TMS application, ERP system |
| **Charlie** | API / Service Provider | Carrier API, Port Community System |
| **Alice** | End-User (who needs the data) | Shipper, Forwarder, or employee thereof |
| **Bob** | Data Owner (whose data it is) | Shipper whose shipments are tracked |

### Mapping to OAuth

| Persona | OAuth Concept | In Token |
|---------|---------------|----------|
| David | Client | `act.client_id` (or `client_id` when no delegation) |
| Charlie | Resource Server | `aud` |
| Alice | The principal (whose data is accessed) | `sub` |
| Bob | Data Owner | Validated via grants, not in token |
| Dataspace | Authorization Server | `iss` |

### Bob ≠ Charlie: The Logistics Pattern

In logistics and supply chain scenarios, the **Data Owner (Bob)** is typically different from the **API Provider (Charlie)**:

```
Shipper (Bob) owns shipment data
    ↓
Carrier (Charlie) operates the API that exposes it
    ↓
Forwarder (Alice) needs to see the shipments
    ↓
TMS App (David) makes the API call
```

The dataspace must verify:
1. Bob granted Alice access to the data
2. Alice authorized David to act on their behalf
3. Charlie trusts the dataspace's token

### Human Alice

Alice can be an organization or a human. When Alice is human (e.g., an employee), they act within an organizational context:

```
Jan (human) works at ShipperCorp (organization)
Jan uses TMS App to view ShipperCorp's shipments
```

The token includes both identities:

```json
{
  "iss": "https://dataspace.example.com",
  "aud": "https://api.carrier.com",
  "scope": "carrier.shipments.read",
  "exp": 1706000000,
  "jti": "tok-abc123",

  "sub": "12345678",
  "sub_type": "kvk",

  "act": {
    "sub": "33333333",
    "sub_type": "kvk",
    "client_id": "tms-app-prod"
  },

  "user_id": "jan@shippercorp.nl",
  "user_name": "Jan de Vries"
}
```

Here `sub` is ShipperCorp (the principal/Alice), `act` is TMS App B.V. (the actor/David), and `user_*` identifies the human who initiated the request.

The organizational identity (KvK) remains the trust anchor. The user identity enables:
- **Authentication**: Proving Jan is who they claim
- **Audit**: Logging which human accessed what
- **Optional fine-grained access**: Role-based filtering at the API
