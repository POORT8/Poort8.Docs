# ASR Minimal Viable Architecture

> **Scope**: Multi-tenant Association Registry with organization self-service portal, admin management, and M2M API access.

---

## 1. Context

### Client Types

| Client | Auth Method | Access Scope |
|--------|-------------|--------------|
| SPA + BFF | Cookie (OIDC via Keycloak) | Own organization only |
| Admin Portal (Blazor) | Cookie (OIDC via Keycloak) | All organizations |
| M2M API | JWT Bearer | Scoped by token claims |

### Principles

1. **Identity Provider**: Keycloak v26 with Organizations feature
2. **Source of Truth**: Keycloak for authentication, ASR database for authorization context
3. **Single Deployable**: CoreManager hosts Blazor, API, and BFF together
4. **Defense in Depth**: Endpoint policies + resource-based authorization (no tenant query filters)

---

## 2. Service Architecture

### Entry Points, Shared Core

All three client types share the same service layer — only the entry point differs:

```
┌─────────────────────────────────────────────────────────┐
│                    CoreManager                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   SPA (thin client) ──► /bff/* ──┐                     │
│                                  │                     │
│   Admin Portal (Blazor) ─────────┼──► Services ──► DB  │
│                                  │                     │
│   M2M clients ──► /api/* ────────┘                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

| Entry Point | Transport | Auth | Tenant Resolution |
|-------------|-----------|------|-------------------|
| `/bff/*` | HTTP | Cookie | Implicit (from session) |
| `/api/*` | HTTP | Bearer | Explicit (from token claims) |
| Blazor components | Direct DI | Cookie (circuit) | Implicit (from `ClaimsPrincipal`) |

### Why BFF Endpoints Are Private

The BFF pattern in this architecture serves a specific purpose: **moving logic from the SPA to the backend**. BFF endpoints are private because:

1. **Response shapes are SPA-driven** — not designed for general consumption
2. **No versioning commitment** — BFF and SPA deploy together
3. **Session concerns** — Cookie handling, CSRF enforcement, token refresh
4. **Implicit tenant** — relies on session state, not explicit parameters

This differs from `/api/*` endpoints which are public, versioned, and use explicit resource identifiers.

### Swagger Strategy

BFF endpoints are excluded from the public OpenAPI spec:

```csharp
public override void Configure()
{
    Get("/bff/verifications");
    Options(x => x.ExcludeFromDescription());
}
```

**Rationale:**
- Public spec stays clean for M2M integrators
- Cookie auth can't be tested via Swagger UI anyway
- Frontend types generated separately if needed

### Admin Portal: Direct Service Access

The Admin Portal (Blazor Server) bypasses HTTP entirely — it injects the same services:

```csharp
@inject IOrganizationRegistry OrganizationRegistry
@inject IAuthorizationService AuthService
```

This works because:
- `ITenantContext` reads from `HttpContext.User` (available in Blazor circuit)
- Authorization handlers work identically
- No HTTP overhead for internal operations

### Shared Concerns

| Concern | Implementation | Used By |
|---------|----------------|---------|
| Tenant resolution | `ITenantContext` | All |
| Authorization | `IAuthorizationService` + handlers | All |
| Business logic | `IOrganizationRegistry`, `IVerificationsService`, etc. | All |
| Data access | EF Core repositories | All |

### BFF-Specific Responsibilities

The BFF layer adds value only for browser clients:

| Concern | BFF | Admin Portal | M2M |
|---------|-----|--------------|-----|
| Session management | ✅ | Blazor circuit | N/A |
| CSRF enforcement | ✅ | N/A (same-origin) | N/A |
| Response shaping | ✅ | Direct service calls | Own mapping |
| Token refresh | ✅ (server-side) | Blazor handles | Client responsibility |

### Project Structure

Services live in the shared `Poort8.Dataspace.Services` project, accessible to all entry points:

```
Poort8.Dataspace.Services/
  Verifications/                  # BFF feature services
    IVerificationsService.cs
    VerificationsService.cs
    VerificationsResponse.cs
  OrganizationProvisioning/       # Onboarding services
    IOrganizationProvisioningService.cs
    OrganizationProvisioningService.cs

Poort8.Dataspace.CoreManager/
  Extensions/
    BffEndpointsExtension.cs      # Thin HTTP layer for /bff/*
```

---

## 3. Domain Model

```
┌─────────────────────────────────────────────────────────────┐
│                      ASR Database                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐     ┌─────────────────────────┐   │
│  │    Organization     │     │    OrganizationUser     │   │
│  ├─────────────────────┤     ├─────────────────────────┤   │
│  │ Identifier (PK)     │────<│ Id (PK, GUID)           │   │
│  │   (KC Org UUID)     │     │ OrganizationId (FK)     │   │
│  │ Name                │     │ KeycloakUserId (string) │   │
│  │ CreatedAt           │     │ Email                   │   │
│  │ UpdatedAt           │     │ Role (enum)             │   │
│  └─────────────────────┘     │ CreatedAt               │   │
│                              │ UpdatedAt               │   │
│                              └─────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Entity Interfaces

```csharp
// Marker interface for organization-scoped resources
public interface IOrganizationResource
{
    Guid OrganizationId { get; }
}

public class Organization : IOrganizationResource
{
    // Primary key - Keycloak Organization UUID (stored as string)
    // See ASR Data Model Decision 1a
    public string Identifier { get; set; } = default!;
    public string Name { get; set; } = default!;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    
    // IOrganizationResource implementation - parse Identifier to Guid
    public Guid OrganizationId => Guid.TryParse(Identifier, out var id) ? id : Guid.Empty;
    public ICollection<OrganizationUser> Users { get; set; } = [];
}

public class OrganizationUser : IOrganizationResource
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string KeycloakUserId { get; set; } = default!;  // Keycloak user UUID as string
    public string Email { get; set; } = default!;
    public OrganizationRole Role { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    
    public Organization Organization { get; set; } = default!;
}

public enum OrganizationRole
{
    Member = 0,
    Admin = 1
}
```

> **Naming Note:** This document uses `OrganizationUser` and `OrganizationRole` for simplicity. The [ASR Data Model](./asr-data-model-design.md) uses `OrganizationMember` and `OrganizationMemberRole` with additional fields (`JoinedAt`, `InvitedByUserId`, `IsActive`). Both refer to the same concept—the enum values map 1:1.

---

## 4. Keycloak Configuration

### Token Structure

When the `organization` scope is requested, Keycloak v26 returns:

```json
{
  "sub": "user-uuid",
  "preferred_username": "jane.doe@acme.com",
  "organization": {
    "acme-corp": {
      "id": "42c3e46f-2477-44d7-a85b-d3b43f6b31fa"
    }
  },
  "realm_access": {
    "roles": ["org-admin"]
  }
}
```

### Required Mapper Configuration

In Keycloak Admin Console → Clients → `ctn-bff` → Client Scopes → `organization` → Mappers → `Organization Membership`:

- ✅ Enable **Add organization id**
- ⬜ Add organization attributes (optional)

---

## 5. Authentication Layer

### Route-Based Authentication Separation

> **Design Decision**: Instead of a header-sniffing `PolicyScheme`, we use route-based separation where each endpoint group uses exactly one authentication scheme. This follows [IETF OAuth 2.0 for Browser-Based Applications (BCP)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps) and Microsoft recommendations.

**Route Structure:**
- `/bff/*` → Cookie authentication (SPA clients via OIDC)
- `/api/*` → Bearer authentication (M2M clients, Admin Portal)

```csharp
// Program.cs - Authentication configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    options.Cookie.Name = "__Host-session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;  // CSRF protection (OIDC callback handled separately)
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;
    
    // Return 401 instead of redirect for API-like paths
    options.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
})
.AddOpenIdConnect("oidc", options =>
{
    options.Authority = configuration["Keycloak:Authority"];
    options.ClientId = configuration["Keycloak:ClientId"];
    options.ClientSecret = configuration["Keycloak:ClientSecret"];
    options.ResponseType = "code";
    options.UsePkce = true;
    options.SaveTokens = true;
    options.MapInboundClaims = false;  // Preserve Keycloak claim names
    options.GetClaimsFromUserInfoEndpoint = true;
    options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("organization");
    options.Scope.Add("offline_access");
})
.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.Authority = configuration["Keycloak:Authority"];
    options.Audience = "asr-api";
    options.MapInboundClaims = false;
    
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        NameClaimType = "preferred_username"
    };
});
```

### Policy Configuration

> **Simplification**: With route-based separation, policies no longer need `.AddAuthenticationSchemes()`. The scheme is determined by the route group, not the policy.

```csharp
// Extension to existing AuthConstants.cs
public static class AsrAuthPolicies
{
    // API policies (used by /api/* endpoints - Bearer auth)
    public const string ReadOR = "ReadORPolicy";
    public const string WriteOR = "WriteORPolicy";
    public const string GlobalAdmin = "GlobalAdminPolicy";
    
    // BFF policies (used by /bff/* endpoints - Cookie auth)
    public const string OrganizationMember = "OrganizationMemberPolicy";
    
    public static void AddAsrPolicies(this AuthorizationOptions options)
    {
        // Read OR - requires scope
        options.AddPolicy(ReadOR, policy => policy
            .RequireAssertion(ctx => 
                ctx.User.HasScope("read:or") || 
                ctx.User.HasScope("read:or:delegated") ||
                ctx.User.IsInRole("platform-admin")));
        
        // Write OR - requires scope
        options.AddPolicy(WriteOR, policy => policy
            .RequireAssertion(ctx => 
                ctx.User.HasScope("write:or") || 
                ctx.User.HasScope("write:or:delegated") ||
                ctx.User.IsInRole("platform-admin")));
        
        // Global admin - platform admins only
        options.AddPolicy(GlobalAdmin, policy => policy
            .RequireRole("platform-admin"));
        
        // Organization member - must have organization claim (BFF only)
        options.AddPolicy(OrganizationMember, policy => policy
            .RequireAssertion(ctx => 
                ctx.User.FindFirst("organization") != null ||
                ctx.User.IsInRole("platform-admin")));
    }
}
```

### Route Group Configuration

```csharp
// Program.cs - After app.UseAuthorization()

// BFF routes use Cookie authentication (for SPA clients)
app.MapGroup("/bff")
    .RequireAuthorization(new AuthorizeAttribute 
    { 
        AuthenticationSchemes = CookieAuthenticationDefaults.AuthenticationScheme 
    });

// API routes use Bearer authentication (for M2M and Admin Portal)
app.MapGroup("/api")
    .RequireAuthorization(new AuthorizeAttribute 
    { 
        AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme 
    });
```

---

## 6. Tenant Context Service

> **MVP Limitation**: This implementation assumes each user belongs to exactly one organization. If Keycloak returns multiple organizations in the token, the request is rejected with a 403. See [Future: Multi-Org Support](#future-multi-org-support) for the planned enhancement.

### Interface

```csharp
// Poort8.Dataspace.API/Services/ITenantContext.cs
public interface ITenantContext
{
    /// <summary>Organization GUID from Keycloak token</summary>
    Guid? OrgId { get; }
    
    /// <summary>Organization alias (Keycloak organization name)</summary>
    string? OrgAlias { get; }
    
    /// <summary>Whether the current user is a platform admin</summary>
    bool IsGlobalAdmin { get; }
    
    /// <summary>Keycloak user ID (sub claim) - stored as string to match data model</summary>
    string? UserId { get; }
    
    /// <summary>User's role within their organization</summary>
    OrganizationRole? OrgRole { get; }
}
```

### Implementation

```csharp
// Poort8.Dataspace.API/Services/TenantContext.cs
using System.Security.Claims;
using System.Text.Json;

public class TenantContext : ITenantContext
{
    private readonly ILogger<TenantContext> _logger;
    
    public Guid? OrgId { get; }
    public string? OrgAlias { get; }
    public bool IsGlobalAdmin { get; }
    public string? UserId { get; }
    public OrganizationRole? OrgRole { get; }
    
    /// <summary>True if user has multiple orgs (not supported in MVP).</summary>
    public bool HasMultipleOrganizations { get; }

    public TenantContext(IHttpContextAccessor accessor, ILogger<TenantContext> logger)
    {
        _logger = logger;
        
        var user = accessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true)
            return;

        // Extract user ID (sub claim) - keep as string to match data model
        UserId = user.FindFirst("sub")?.Value;

        // Check global admin (platform-admin is a realm role)
        IsGlobalAdmin = user.IsInRole("platform-admin");

        // Parse Keycloak organization claim (nested JSON object)
        var orgClaim = user.FindFirst("organization")?.Value;
        if (!string.IsNullOrEmpty(orgClaim))
        {
            try
            {
                var orgDict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(orgClaim);
                if (orgDict is null || orgDict.Count == 0)
                {
                    _logger.LogDebug("P8.debug - No organizations in token for user {UserId}", UserId);
                    return;
                }
                
                // MVP: Reject if user has multiple organizations
                if (orgDict.Count > 1)
                {
                    HasMultipleOrganizations = true;
                    _logger.LogWarning("P8.warn - User {UserId} has {Count} organizations; multi-org not supported",
                        UserId, orgDict.Count);
                    return;  // Leave OrgId null - authorization will fail
                }
                
                var singleOrg = orgDict.First();
                OrgAlias = singleOrg.Key;
                
                if (singleOrg.Value.TryGetProperty("id", out var idProp))
                {
                    OrgId = Guid.TryParse(idProp.GetString(), out var orgId) ? orgId : null;
                }
                
                _logger.LogDebug("P8.debug - Resolved tenant: {OrgAlias} ({OrgId})", OrgAlias, OrgId);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "P8.warn - Failed to parse organization claim for user {UserId}", UserId);
                // Leave OrgId null - authorization will fail
            }
        }

        // Determine organization role from realm_access.roles
        // Note: When MapInboundClaims = false, roles appear as ClaimTypes.Role
        // after Keycloak.AuthServices processes the realm_access claim
        var roles = user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        
        // Fallback: parse realm_access JSON if roles weren't mapped
        if (roles.Count == 0)
        {
            var realmAccessClaim = user.FindFirst("realm_access")?.Value;
            if (!string.IsNullOrEmpty(realmAccessClaim))
            {
                try
                {
                    using var doc = JsonDocument.Parse(realmAccessClaim);
                    if (doc.RootElement.TryGetProperty("roles", out var rolesArray))
                    {
                        roles = rolesArray.EnumerateArray()
                            .Select(r => r.GetString()!)
                            .Where(r => r != null)
                            .ToList();
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "P8.warn - Failed to parse realm_access claim for user {UserId}", UserId);
                }
            }
        }
        
        if (roles.Contains("org-admin"))
            OrgRole = OrganizationRole.Admin;
        else if (roles.Contains("org-member") || OrgId.HasValue)
            OrgRole = OrganizationRole.Member;
    }
}
```

### Registration

```csharp
// Program.cs
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantContext, TenantContext>();
```

### Future: Multi-Org Support

> Per [Microsoft multi-tenant guidance](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/identity#grant-users-access-to-tenant-data): "If a single user needs to be granted access to multiple tenants... a clear mechanism should allow users to switch between tenants."

When multi-org support is needed:

1. **Add `X-Organization-Id` header** — BFF/API clients include the target org ID
2. **Validate against token claims** — Ensure requested org is in user's `organization` claim
3. **Update `TenantContext`** — Resolve org from header, fallback to single-org behavior

```csharp
// Future: Multi-org resolution
var requestedOrgId = accessor.HttpContext?.Request.Headers["X-Organization-Id"].FirstOrDefault();
if (!string.IsNullOrEmpty(requestedOrgId) && orgDict.ContainsKey(requestedOrgId))
{
    // User selected a valid org from their token
    OrgAlias = requestedOrgId;
    // ... extract ID from orgDict[requestedOrgId]
}
```

---

## 7. Authorization Layer

> **Design Principle**: Each handler checks exactly one thing (Single Responsibility). When multiple checks are needed, compose requirements in the policy definition. Per [Microsoft docs](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased), handlers use implicit deny (`return Task.CompletedTask`) rather than `context.Fail()` to allow other handlers to potentially succeed.

### Requirements

```csharp
// Poort8.Dataspace.API/Auth/Requirements/SameOrganizationRequirement.cs
/// <summary>Checks if user belongs to the same organization as the resource.</summary>
public class SameOrganizationRequirement : IAuthorizationRequirement { }

// Poort8.Dataspace.API/Auth/Requirements/OrganizationRoleRequirement.cs
/// <summary>Checks if user has the minimum required role. Does NOT check org ownership—compose with SameOrganizationRequirement.</summary>
public class OrganizationRoleRequirement(OrganizationRole minimumRole) : IAuthorizationRequirement
{
    public OrganizationRole MinimumRole { get; } = minimumRole;
}
```

### Handlers

```csharp
// Poort8.Dataspace.API/Auth/Handlers/SameOrganizationHandler.cs
public class SameOrganizationHandler(ITenantContext tenant, ILogger<SameOrganizationHandler> logger) 
    : AuthorizationHandler<SameOrganizationRequirement, IOrganizationResource>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        SameOrganizationRequirement requirement,
        IOrganizationResource resource)
    {
        // Global admins can access any organization
        if (tenant.IsGlobalAdmin)
        {
            logger.LogDebug("P8.debug - Authorization granted: user is global admin");
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check organization ownership
        if (tenant.OrgId.HasValue && resource.OrganizationId == tenant.OrgId.Value)
        {
            logger.LogDebug("P8.debug - Authorization granted: user owns organization {OrgId}", tenant.OrgId);
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        logger.LogInformation("P8.inf - Authorization denied: user {UserId} attempted access to org {ResourceOrgId}",
            tenant.UserId, resource.OrganizationId);
        
        return Task.CompletedTask;  // Implicit deny
    }
}

// Poort8.Dataspace.API/Auth/Handlers/OrganizationRoleHandler.cs
/// <summary>
/// Checks role level only. Use with SameOrganizationRequirement to enforce org ownership.
/// </summary>
public class OrganizationRoleHandler(ITenantContext tenant, ILogger<OrganizationRoleHandler> logger) 
    : AuthorizationHandler<OrganizationRoleRequirement, IOrganizationResource>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        OrganizationRoleRequirement requirement,
        IOrganizationResource resource)
    {
        // Global admins bypass role checks
        if (tenant.IsGlobalAdmin)
        {
            logger.LogDebug("P8.debug - Authorization granted: user is global admin");
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check role level (org ownership is checked by SameOrganizationHandler)
        if (tenant.OrgRole.HasValue && tenant.OrgRole.Value >= requirement.MinimumRole)
        {
            logger.LogDebug("P8.debug - Authorization granted: user has role {Role}", tenant.OrgRole);
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        logger.LogInformation("P8.inf - Authorization denied: user {UserId} has role {Role}, requires {Required}",
            tenant.UserId, tenant.OrgRole, requirement.MinimumRole);

        return Task.CompletedTask;  // Implicit deny - allows other handlers to run
    }
}
```

### Registration

```csharp
// Program.cs
builder.Services.AddAuthorization(options =>
{
    options.AddAsrPolicies();
    
    // Resource-based policies (used with IAuthorizationService)
    // Single requirement: org ownership check only
    options.AddPolicy("SameOrganization", policy =>
        policy.Requirements.Add(new SameOrganizationRequirement()));
    
    // Composed requirements: org ownership + admin role (both must pass)
    options.AddPolicy("OrganizationAdmin", policy =>
    {
        policy.Requirements.Add(new SameOrganizationRequirement());
        policy.Requirements.Add(new OrganizationRoleRequirement(OrganizationRole.Admin));
    });
});

// Handler registration - Scoped because they depend on ITenantContext (also scoped)
builder.Services.AddScoped<IAuthorizationHandler, SameOrganizationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, OrganizationRoleHandler>();
```

---

## 8. Endpoint Implementation

### FastEndpoints Pattern

```csharp
// Poort8.Dataspace.API/OROrganizations/GetOrganization/Endpoint.cs
public class Endpoint : Endpoint<Request, Response, Mapper>
{
    private readonly IOrganizationRegistry _registry;
    private readonly IAuthorizationService _authService;

    public Endpoint(IOrganizationRegistry registry, IAuthorizationService authService)
    {
        _registry = registry;
        _authService = authService;
    }

    public override void Configure()
    {
        Get("/api/organization-registry/{id}");
        Policies(AsrAuthPolicies.ReadOR);
        Options(x => x.WithTags("OrganizationRegistry"));
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var org = await _registry.ReadOrganization(req.Id);
        if (org is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        // Resource-based authorization check
        var authResult = await _authService.AuthorizeAsync(User, org, "SameOrganization");
        if (!authResult.Succeeded)
        {
            await SendForbiddenAsync(ct);
            return;
        }

        await SendMapped(org, 200, ct);
    }
}
```

### BFF Endpoint

```csharp
// Poort8.Dataspace.API/Bff/Home/Endpoint.cs
public class Endpoint : EndpointWithoutRequest<HomeResponse>
{
    private readonly ITenantContext _tenant;
    private readonly IOrganizationRegistry _registry;

    public Endpoint(ITenantContext tenant, IOrganizationRegistry registry)
    {
        _tenant = tenant;
        _registry = registry;
    }

    public override void Configure()
    {
        Get("/bff/home");
        Policies(AsrAuthPolicies.OrganizationMember);
        Options(x => x.WithTags("BFF"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (!_tenant.OrgId.HasValue)
        {
            await SendForbiddenAsync(ct);
            return;
        }

        var org = await _registry.ReadOrganization(_tenant.OrgId.Value.ToString());
        if (org is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        // No explicit auth check needed - tenant context guarantees ownership
        await SendAsync(new HomeResponse
        {
            OrganizationId = org.Identifier,
            OrganizationName = org.Name,
            UserRole = _tenant.OrgRole?.ToString() ?? "Member"
        }, cancellation: ct);
    }
}

public record HomeResponse
{
    public string OrganizationId { get; init; } = default!;
    public string OrganizationName { get; init; } = default!;
    public string UserRole { get; init; } = default!;
}
```

---

## 9. Authorization Matrix

| Endpoint | Policy | Resource Check | Who Can Access |
|----------|--------|----------------|----------------|
| `GET /bff/home` | `OrganizationMember` | Implicit (own org via tenant) | Org members, admins |
| `GET /bff/user` | `OrganizationMember` | None (returns claims) | Any authenticated user |
| `GET /api/organization-registry` | `ReadOR` | None (list all visible) | Global admins only |
| `GET /api/organization-registry/{id}` | `ReadOR` | `SameOrganization` | Own org, global admins |
| `PUT /api/organization-registry/{id}` | `WriteOR` | `OrganizationAdmin` | Org admins, global admins |
| `GET /api/.../members` | `ReadOR` | `SameOrganization` | Own org, global admins |
| `POST /api/.../members/invite` | `WriteOR` | `OrganizationAdmin` | Org admins, global admins |
| `PUT /api/.../members/{id}` | `WriteOR` | `OrganizationAdmin` | Org admins, global admins |
| `DELETE /api/.../members/{id}` | `WriteOR` | `OrganizationAdmin` OR self | Self, org admins, global admins |

---

## 10. Implementation Gaps

### Current State → Required

| Component | Current | Required | Priority |
|-----------|---------|----------|----------|
| `ITenantContext` | ❌ Missing | Create service | **High** |
| `IOrganizationResource` | ❌ Missing | Add interface | **High** |
| `SameOrganizationHandler` | ❌ In docs only | Implement | **High** |
| `OrganizationRoleHandler` | ❌ In docs only | Implement | **High** |
| `IOrganizationAuthorizationService` | ❌ Missing | Register service (see [Data Model §8.3](./asr-data-model-design.md#83-organization-authorization-service)) | **High** |
| Route-based auth groups | ❌ Missing | Configure `/bff` and `/api` groups | **High** |
| CSRF middleware | ❌ Missing | Add `X-CSRF` validation | **High** |
| Security headers middleware | ❌ Missing | Add X-Frame-Options, etc. | **High** |
| CORS policy | ❌ Missing | Configure for `/api` routes | **High** |
| Keycloak org ID mapper | ❌ Not configured | Enable "Add organization id" in Organization Membership mapper | **High** |
| Keycloak realm roles | ❌ Not created | Create `org-admin`, `org-member`, `platform-admin` realm roles | **High** |
| `/bff/home` endpoint | ❌ Missing | Create endpoint | **Medium** |
| `/bff/user` org context | ⚠️ Partial | Add org claims | **Medium** |
| `IAuditableEntity` | ❌ Missing | Add interface (see [Data Model §4.1](./asr-data-model-design.md#41-base-interfaces-and-patterns)) | **Medium** |

### Implementation Order

0. **Phase 0: Infrastructure** (can be done in parallel)
   - [ ] Configure Keycloak mapper to include organization ID (enable "Add organization id" in Organization Membership mapper)
   - [ ] Create Keycloak realm roles: `org-admin`, `org-member`, `platform-admin`
   - [ ] Verify Azure App Service HTTPS/HSTS settings
   - [ ] Configure `AllowedOrigins` in appsettings for CORS

1. **Phase 1: Foundation**
   - [ ] Create `IOrganizationResource` interface
   - [ ] Create `IAuditableEntity` interface (see [Data Model §4.1](./asr-data-model-design.md#41-base-interfaces-and-patterns))
   - [ ] Create `ITenantContext` interface and `TenantContext` implementation
   - [ ] Add security headers middleware
   - [ ] Add CORS policy for `/api` routes

2. **Phase 2: Authorization**
   - [ ] Create `SameOrganizationRequirement` and handler
   - [ ] Create `OrganizationRoleRequirement` and handler
   - [ ] Register `IOrganizationAuthorizationService` (see [Data Model §8.3](./asr-data-model-design.md#83-organization-authorization-service))
   - [ ] Configure route groups (`/bff` → Cookie, `/api` → Bearer)
   - [ ] Register handlers in DI (Scoped lifetime)

3. **Phase 3: Endpoints & Security**
   - [ ] Add CSRF middleware (see [§10 CSRF Protection](#csrf-protection))
   - [ ] Create `/bff/home` endpoint
   - [ ] Update `/bff/user` to include organization context
   - [ ] Add resource authorization to existing OR endpoints

4. **Phase 4: Testing**
   - [ ] Unit tests for `TenantContext` claim parsing (including realm_access JSON fallback)
   - [ ] Unit tests for authorization handlers
   - [ ] Integration tests for endpoint authorization
   - [ ] CSRF rejection tests (missing header, wrong origin)
   - [ ] Test matrix for all client types (SPA, Admin, M2M)

---

## 11. Security Considerations

### Defense in Depth

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Endpoint** | `Policies()` | Scope/role gate before handler runs |
| **Resource** | `IAuthorizationService` | Ownership check after data load |
| **Audit** | Structured logging | Traceable access decisions |

### Why No Query Filters for Tenant Isolation

1. **Conflicts with existing soft-delete filters** — EF Core 9 allows only one filter per entity
2. **Resource-based auth is explicit** — `AuthorizeAsync()` is self-documenting
3. **Admin bypass is cleaner** — Single handler check vs. scattered `IgnoreQueryFilters()`
4. **Simpler to audit** — Authorization logic in one place

### Cookie Security

The `__Host-session` cookie is the *only* artifact the browser holds (tokens stay server-side).

| Setting | Value | Rationale |
|---------|-------|----------|
| **Name** | `__Host-session` | `__Host-` prefix forbids subdomains and insecure transport |
| **HttpOnly** | `true` | JavaScript cannot read the session (mitigates XSS token theft) |
| **Secure** | `true` | Only sent over HTTPS |
| **SameSite** | `Strict` | Prevents CSRF; cookie not sent on cross-site requests |
| **Partitioned** | `true` | Future-proofing for Privacy Sandbox (CHIPS) |

> **SameSite Clarification:** `SameSite=Strict` applies to the session cookie *after* authentication completes. During the OIDC callback (`/signin-oidc`), ASP.NET Core's OpenIdConnect handler internally manages the correlation cookie with `SameSite=None` to allow the POST-based redirect from Keycloak. This is handled automatically—no manual configuration needed.

### CSRF Protection

We employ defense-in-depth for CSRF:

1. **SameSite=Strict Cookie** — Prevents browser from sending cookie on cross-site POSTs
2. **Custom Header (`X-CSRF: 1`)** — Forces CORS preflight, blocking simple cross-origin requests

#### Route-Based CSRF Enforcement

| Route | Auth Method | CSRF Required | Rationale |
|-------|-------------|---------------|----------|
| `/bff/*` | Cookie | ✅ Yes | Browser requests need CSRF protection |
| `/api/*` + Cookie | Cookie | ✅ Yes | SPA calling API via BFF |
| `/api/*` + Bearer | Bearer token | ❌ No | M2M clients; tokens not auto-attached |

```csharp
// CSRF Middleware - skip for Bearer token requests
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/bff") ||
        context.Request.Path.StartsWithSegments("/api"))
    {
        // Skip CSRF for safe methods
        var safeMethod = HttpMethods.IsGet(context.Request.Method) ||
                         HttpMethods.IsHead(context.Request.Method) ||
                         HttpMethods.IsOptions(context.Request.Method);
        if (safeMethod) { await next(); return; }
        
        // Skip CSRF if Bearer token present (M2M client)
        var hasBearer = context.Request.Headers.Authorization
            .ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase);
        
        if (!hasBearer && !context.Request.Headers.ContainsKey("X-CSRF"))
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsync("Missing X-CSRF header");
            return;
        }
    }
    await next();
});
```

#### Why `X-CSRF` (not `X-XSRF-TOKEN`)?

| Header | Purpose | Value | When to Use |
|--------|---------|-------|-------------|
| `X-CSRF` | CORS preflight trigger | Static (e.g., `1`) | BFF pattern with `SameSite=Strict` cookies |
| `X-XSRF-TOKEN` | Double-submit cookie | Dynamic token | When JS must read antiforgery cookie |

We use `X-CSRF` because:
- Session cookie is `HttpOnly` — JS cannot read it for double-submit
- `SameSite=Strict` already blocks cross-origin cookie transmission
- The header is purely a CORS enforcement mechanism (defense-in-depth)

### Security Headers

| Header | Handled By | Configuration |
|--------|------------|---------------|
| **HTTPS Redirect** | Azure App Service | "HTTPS Only" setting in portal |
| **HSTS** | Azure App Service | Automatic for custom domains with managed certs |
| **X-Frame-Options** | Application | `SAMEORIGIN` — prevents clickjacking |
| **X-Content-Type-Options** | Application | `nosniff` — prevents MIME sniffing |
| **Content-Security-Policy** | Application | See below |

```csharp
// Security headers middleware (add before UseAuthentication)
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "SAMEORIGIN");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});
```

> **CSP Note**: Content-Security-Policy is complex and SPA-dependent. Start with report-only mode (`Content-Security-Policy-Report-Only`) and adjust based on violations. See [Microsoft CSP guidance](https://learn.microsoft.com/en-us/aspnet/core/blazor/security/content-security-policy).

### CORS Policy

CORS is configured per route group to match authentication requirements:

```csharp
// CORS configuration
builder.Services.AddCors(options =>
{
    // API routes: allow configured origins for Admin Portal and external clients
    options.AddPolicy("ApiPolicy", policy => policy
        .WithOrigins(configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [])
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials());
});

// Apply policies
// Note: /bff/* routes don't need CORS - they're same-origin by design (SPA served from wwwroot)
// Only /api/* routes need CORS for cross-origin Admin Portal access
app.MapGroup("/api").RequireCors("ApiPolicy");
```

### Rate Limiting (Future)

Rate limiting for auth endpoints is documented in [User Portal BFF Authentication](./user-portal-h2m-authentication.md#phase-5-onboarding-integration):
- 5 requests per email per hour (onboarding)
- 10 requests per IP per minute
- Basic rate limiting via FastEndpoints in MVP

---

## 12. References

### Security Standards
- [IETF: OAuth 2.0 for Browser-Based Applications (BCP)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps) — Strongly recommends BFF pattern for business/sensitive applications
- [Microsoft: Backend for Frontends pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends)
- [Microsoft: Prevent CSRF attacks](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery)
- [Microsoft: SameSite cookies](https://learn.microsoft.com/en-us/aspnet/core/security/samesite)

### ASP.NET Core
- [Microsoft: Multi-tenancy in EF Core](https://learn.microsoft.com/en-us/ef/core/miscellaneous/multitenancy)
- [Microsoft: Resource-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased)
- [Microsoft: Policy-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies)

### Internal
- [User Portal BFF Authentication Design](./user-portal-h2m-authentication.md) — Detailed BFF implementation guide
- [Keycloak v26: Organizations](docs-internal/keycloak/keycloak-v26-docs.md#_mapping_organization_claims_)
- [Existing BFF Implementation](../Poort8.Dataspace.API/Bff/)
- [Existing Auth Constants](../Poort8.Dataspace.API/AuthConstants.cs)
