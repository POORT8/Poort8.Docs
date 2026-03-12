# Organization Registry – Keycloak Integration

> **Status**: Draft

---

## 1. Principle

**Keycloak is the source of truth for identity.** The OR database stores only business data.

If Keycloak can store it, don't duplicate it.

---

## 2. Data Ownership

| Keycloak (Identity) | OR Database (Business) |
|---------------------|------------------------|
| Users, credentials | Agreements |
| Organizations | Certificates |
| Memberships | Services |
| Roles | Verifications |
| KvK number (org attribute) | Properties |

---

## 3. Keycloak Configuration (Required)

| Setting | Value | Why |
|---------|-------|-----|
| Organizations | Enabled | Core feature |
| Client scope | `organization:*` | All orgs in token (no re-login for org switch) |
| Organization Membership mapper | **Add organization id** = ON | Otherwise `TenantContext.OrgId` is null |
| Organization Membership mapper | Add organization attributes = optional | If you need KvK in token |

Token claim shape (with mapper configured):
```json
{
  "organization": {
    "kvk-12345678": { "id": "uuid-here", "name": "Org Name" }
  }
}
```

> ⚠️ Without "Add organization id" enabled, your runtime will silently return `OrgId = null`.

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        APPLICATION                           │
│                                                             │
│   IIdentityDirectory ─── identity operations (Keycloak)     │
│   IOrganizationRegistry ─ business data (OR database)       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                       INFRASTRUCTURE                         │
│                                                             │
│   KeycloakIdentityDirectory : IIdentityDirectory            │
│   OrganizationRegistry : IOrganizationRegistry              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                          DOMAIN                              │
│                                                             │
│   Identity: User, Organization, Membership                  │
│   Business: Agreement, Certificate, Service, Verification   │
│                                                             │
│   No Keycloak DTOs. Clean domain models only.               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```
┌──────────────┐         ┌──────────────┐
│   Keycloak   │         │ OR Database  │
│              │         │              │
│  Users       │         │  Org FK      │
│  Orgs        │         │  Agreements  │
│  Members     │         │  Certs       │
│  Roles       │         │  Services    │
│  KvK attr    │         │  Verifs      │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │ IIdentityDirectory     │ IOrganizationRegistry
       │                        │
       └────────────┬───────────┘
                    │
            ┌───────▼───────┐
            │   Services    │
            └───────────────┘
```

---

## 5. Interfaces

### IIdentityDirectory

One interface for all identity operations. Application code never calls Keycloak directly.

```csharp
public interface IIdentityDirectory
{
    // Organizations
    Task<Organization?> GetOrganization(string id, CancellationToken ct = default);
    Task<Organization?> GetOrganizationByKvk(string kvkNumber, CancellationToken ct = default);
    Task<IReadOnlyList<Organization>> GetOrganizations(CancellationToken ct = default);
    Task<Organization> CreateOrganization(CreateOrganizationRequest request, CancellationToken ct = default);
    Task UpdateOrganization(string id, UpdateOrganizationRequest request, CancellationToken ct = default);
    Task DisableOrganization(string id, CancellationToken ct = default);

    // Users
    Task<User?> GetUser(string id, CancellationToken ct = default);
    Task<User?> GetUserByEmail(string email, CancellationToken ct = default);
    Task<User> CreateUser(CreateUserRequest request, CancellationToken ct = default);
    Task DeleteUser(string id, CancellationToken ct = default);
    Task SendPasswordSetupEmail(string userId, CancellationToken ct = default);

    // Membership (unmanaged: user lifecycle independent of org)
    Task<IReadOnlyList<Membership>> GetOrganizationMembers(string orgId, CancellationToken ct = default);
    Task AddMember(string orgId, string userId, bool isAdmin, CancellationToken ct = default);
    Task RemoveMember(string orgId, string userId, CancellationToken ct = default); // Unlinks only, never deletes user
    Task SetMemberAdmin(string orgId, string userId, bool isAdmin, CancellationToken ct = default);
}
```

> ⚠️ **Managed vs Unmanaged:** Keycloak "remove member" can **delete the user** if membership is managed. We use unmanaged members: create realm user first, then link to org. This ensures `RemoveMember` only unlinks.
```

### IOrganizationRegistry

Scoped to business data only. References Keycloak org ID as foreign key.

```csharp
public interface IOrganizationRegistry
{
    Task<Verification> CreateVerification(Verification verification);
    Task LinkVerification(string orgId, string verificationId);
    Task<IReadOnlyList<Verification>> GetVerifications(string orgId);
    
    Task<Agreement> AddAgreement(string orgId, Agreement agreement);
    Task<IReadOnlyList<Agreement>> GetAgreements(string orgId);
    
    Task<Certificate> AddCertificate(string orgId, Certificate certificate);
    Task<IReadOnlyList<Certificate>> GetCertificates(string orgId);
    
    Task<Service> AddService(string orgId, Service service);
    Task<IReadOnlyList<Service>> GetServices(string orgId);
}
```

---

## 6. Role Model Decision

**Problem:** Realm roles are global. A single `org-admin` role cannot express "admin in Org A, member in Org B".

**Decision:** Encode per-org roles in client role names.

| Role pattern | Meaning |
|--------------|--------|
| `org:{orgId}:admin` | Admin of specific org |
| `org:{orgId}:member` | Member of specific org |

This keeps role data in Keycloak (no OR membership table) at the cost of many roles.

> ⚠️ **Known issue:** Keycloak v26 `GET /organizations/{id}/members` may return empty `realmRoles`. See [keycloak#37314](https://github.com/keycloak/keycloak/issues/37314). Workaround: fetch user roles separately if needed.

---

## 7. Domain Models

```csharp
// Identity (from Keycloak)
public record Organization(string Id, string Name, string Alias, string? KvkNumber, bool Enabled);
public record User(string Id, string Email, string? FirstName, string? LastName, bool Enabled);
public record Membership(string UserId, string OrganizationId, bool IsAdmin);

// Requests
public record CreateOrganizationRequest(string Name, string KvkNumber, string? Domain = null);
public record UpdateOrganizationRequest(string? Name = null, bool? Enabled = null);
public record CreateUserRequest(string Email, string? FirstName, string? LastName, string OrganizationId, bool IsAdmin);

---

## 8. Implementation

### KeycloakIdentityDirectory

Adapter that translates between domain models and Keycloak REST API.

```csharp
public class KeycloakIdentityDirectory : IIdentityDirectory
{
    private readonly KeycloakAdminApiClient _client;
    private readonly string _realm;

    public async Task<Organization?> GetOrganization(string id, CancellationToken ct)
    {
        var kc = await _client.Admin.Realms[_realm].Organizations[id].GetAsync(ct);
        return kc is null ? null : Map(kc);
    }

    public async Task<Organization?> GetOrganizationByKvk(string kvkNumber, CancellationToken ct)
    {
        var orgs = await _client.Admin.Realms[_realm].Organizations.GetAsync(
            c => c.QueryParameters.Q = $"KVK:{kvkNumber}", cancellationToken: ct);
        return orgs?.FirstOrDefault() is { } kc ? Map(kc) : null;
    }

    public async Task<Organization> CreateOrganization(CreateOrganizationRequest req, CancellationToken ct)
    {
        await _client.Admin.Realms[_realm].Organizations.PostAsync(new()
        {
            Name = req.Name,
            Alias = $"kvk-{req.KvkNumber}",
            Enabled = true,
            Attributes = new() { AdditionalData = { ["KVK"] = new List<string> { req.KvkNumber } } }
        }, ct);
        
        return (await GetOrganizationByKvk(req.KvkNumber, ct))!;
    }

    public async Task<IReadOnlyList<Membership>> GetOrganizationMembers(string orgId, CancellationToken ct)
    {
        // Paginate: Keycloak returns max 100 by default
        var all = new List<Membership>();
        int first = 0, max = 100;
        while (true)
        {
            var batch = await _client.Admin.Realms[_realm].Organizations[orgId].Members
                .GetAsync(c => { c.QueryParameters.First = first; c.QueryParameters.Max = max; }, ct);
            if (batch is null || batch.Count == 0) break;
            all.AddRange(batch.Select(m => new Membership(m.Id!, orgId, IsAdmin(m.RealmRoles, orgId))));
            if (batch.Count < max) break;
            first += max;
        }
        return all;
    }

    private static Organization Map(OrganizationRepresentation kc) => new(
        kc.Id!, kc.Name!, kc.Alias!,
        kc.Attributes?.AdditionalData.TryGetValue("KVK", out var v) == true ? (v as List<string>)?.FirstOrDefault() : null,
        kc.Enabled ?? false);

    private static bool IsAdmin(IEnumerable<string>? roles, string orgId) =>
        roles?.Contains($"org:{orgId}:admin") == true;
}
```

### Caching (optional)

```csharp
public class CachingIdentityDirectory(IIdentityDirectory inner, HybridCache cache) : IIdentityDirectory
{
    public Task<IReadOnlyList<Organization>> GetOrganizations(CancellationToken ct) =>
        cache.GetOrCreateAsync("orgs:all", _ => inner.GetOrganizations(ct),
            new() { Expiration = TimeSpan.FromSeconds(60) });
    // Delegate other methods to inner
}
```

### Registration

```csharp
services.AddScoped<KeycloakIdentityDirectory>();
services.AddScoped<IIdentityDirectory>(sp => 
    new CachingIdentityDirectory(sp.GetRequiredService<KeycloakIdentityDirectory>(), sp.GetRequiredService<HybridCache>()));
```

---

## 9. Usage

### Service Layer

```csharp
public class OrganizationProvisioningService(IIdentityDirectory identity, IOrganizationRegistry registry)
{
    public async Task<string> ProvisionAsync(ProvisionRequest req, CancellationToken ct)
    {
        // Idempotent: return existing org
        if (await identity.GetOrganizationByKvk(req.KvkNumber, ct) is { } existing)
            return existing.Id;

        // Create org in Keycloak (alias kvk-{kvk} is unique, handles races)
        Organization org;
        try
        {
            org = await identity.CreateOrganization(new(req.Name, req.KvkNumber), ct);
        }
        catch (ApiException ex) when (ex.ResponseStatusCode == 409)
        {
            // Race: another request created it first
            return (await identity.GetOrganizationByKvk(req.KvkNumber, ct))!.Id;
        }

        try
        {
            // Create user in Keycloak
            var user = await identity.CreateUser(new(req.Email, req.FirstName, req.LastName, org.Id, OrganizationRole.Admin), ct);

            // Create business data in OR database
            var verification = new Verification(VerificationType.OnboardingApproval);
            await registry.CreateVerification(verification);
            await registry.LinkVerification(org.Id, verification.Id);

            // Send password email
            await identity.SendPasswordSetupEmail(user.Id, ct);

            return org.Id;
        }
        catch
        {
            // Compensate: retry disable with backoff, log if fails
            for (var i = 0; i < 3; i++)
            {
                try { await identity.DisableOrganization(org.Id, ct); break; }
                catch { await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, i)), ct); }
            }
            throw;
        }
    }
}
```

### Reading Current User (from JWT)

```csharp
public class TenantContext(IHttpContextAccessor accessor) : ITenantContext
{
    private readonly Dictionary<string, string> _userOrgs = ParseOrgs(accessor.HttpContext?.User);
    
    public string? UserId { get; } = accessor.HttpContext?.User.FindFirst("sub")?.Value;
    public string? Email { get; } = accessor.HttpContext?.User.FindFirst("email")?.Value;
    public string? OrgId => GetValidatedOrgId(accessor.HttpContext, _userOrgs);
    public bool IsOrgAdmin => accessor.HttpContext?.User.HasClaim("roles", $"org:{OrgId}:admin") ?? false;

    private static Dictionary<string, string> ParseOrgs(ClaimsPrincipal? user)
    {
        var claim = user?.FindFirst("organization")?.Value;
        if (string.IsNullOrEmpty(claim)) return [];
        var orgs = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(claim);
        return orgs?.ToDictionary(kv => kv.Value.GetProperty("id").GetString()!, kv => kv.Key) ?? [];
    }

    private static string? GetValidatedOrgId(HttpContext? ctx, Dictionary<string, string> userOrgs)
    {
        // Header must be validated against token
        if (ctx?.Request.Headers.TryGetValue("X-Organization-Id", out var header) == true)
        {
            var requested = header.ToString();
            if (!userOrgs.ContainsKey(requested))
                throw new UnauthorizedAccessException($"User not member of org {requested}");
            return requested;
        }
        
        // Single org: use it. Multiple: require header.
        return userOrgs.Count switch
        {
            0 => null,
            1 => userOrgs.Keys.First(),
            _ => throw new InvalidOperationException("Multiple orgs. Set X-Organization-Id header.")
        };
    }
}
```

### Reading Other Users (from Keycloak API)

```csharp
public class MembersEndpoint(IIdentityDirectory identity, ITenantContext tenant) : EndpointWithoutRequest<List<Membership>>
{
    public override async Task HandleAsync(CancellationToken ct)
    {
        var members = await identity.GetOrganizationMembers(tenant.OrgId!, ct);
        await SendAsync(members.ToList(), cancellation: ct);
    }
}
```

---

## 10. Anti-Patterns

| Don't | Why |
|-------|-----|
| Store org name in OR database | Duplicates Keycloak |
| Store user email in OR database | Duplicates Keycloak |
| OrganizationMember table | Mirrors Keycloak membership |
| Background sync job | Complexity without benefit |
| CQRS / Event sourcing | Over-engineering |
| Keycloak SPI | Maintenance burden |

---

## 11. Migration

| Current | Action |
|---------|--------|
| `IKeycloakAdminService` | → `IIdentityDirectory` |
| `KeycloakAdminService` | → `KeycloakIdentityDirectory` |
| Inline claim parsing in BFF | → `ITenantContext` |
| `OrganizationMember` entity | Don't build |

**Database change:** Remove `Name`, `Adherence.Status` from `OrOrganization`. Keep only `Identifier` (Keycloak UUID) as FK for business relationships.

---

## 12. Non-Keycloak Deployments

```csharp
public class NoOpIdentityDirectory : IIdentityDirectory
{
    public Task<Organization?> GetOrganization(string id, CancellationToken ct) => Task.FromResult<Organization?>(null);
    public Task<IReadOnlyList<Membership>> GetOrganizationMembers(string orgId, CancellationToken ct) => Task.FromResult<IReadOnlyList<Membership>>([]);
    // Write operations throw NotSupportedException
}

// Registration
services.AddScoped<IIdentityDirectory>(keycloakEnabled 
    ? typeof(KeycloakIdentityDirectory) 
    : typeof(NoOpIdentityDirectory));
```

---

## 13. Design Decisions

| Question | Decision | Rationale |
|----------|----------|----------|
| Cache org listings? | `HybridCache`, 60s TTL | Stampede protection, simple API |
| M2M client metadata? | Store in OR | App-specific, not identity |
| Keycloak downtime? | Fail fast | No stale identity data |
| Multi-org users? | `X-Organization-Id` header, validated | Explicit + secure |
| Rollback failures? | Retry 3x with backoff, then log | Simple, manual cleanup acceptable |
| Per-org roles? | Client roles `org:{id}:admin` | Stays in Keycloak, no OR membership table |
| Membership lifecycle? | Unmanaged | `RemoveMember` unlinks, never deletes user |
| Pagination? | Internal loop, return full list | Org sizes small, simpler API |

---

## 14. Summary

```
┌─────────────────────────────────────────┐
│            Application Code             │
│                                         │
│  IIdentityDirectory → Keycloak          │
│  IOrganizationRegistry → OR Database    │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
┌─────────────────┐   ┌─────────────────┐
│    Keycloak     │   │   OR Database   │
│                 │   │                 │
│  Users          │   │  Agreements     │
│  Organizations  │   │  Certificates   │
│  Memberships    │   │  Services       │
│  Roles          │   │  Verifications  │
└─────────────────┘   └─────────────────┘
     Identity              Business
```

**Three rules:**
1. Identity → Keycloak
2. Business → OR database  
3. Don't duplicate
