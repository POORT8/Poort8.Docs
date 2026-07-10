# API Endpoints and Authorization Scopes

This page lists the endpoints currently documented for the NoodleBar API and the scopes they require. Organization management, unsigned delegation, GIR registration, and other routes that are not part of the current NoodleBar API reference are intentionally omitted.

## Policies
- **POST /v1/api/policies** - Protected by scope `write:ar` or `write:ar:delegated` (supports both OAuth and iSHARE tokens)
  - With `write:ar` scope: If specifying an IssuerId, user must be the owner of that IssuerId
  - With `write:ar:delegated` scope: No ownership check required
- **GET /v1/api/policies** - Protected by scope `read:ar` or `read:ar:delegated` (supports both OAuth and iSHARE tokens)
  - With `read:ar` scope: User can only view policies where they own the IssuerId, SubjectId, or ServiceProvider
  - With `read:ar:delegated` scope: All policies are accessible
- **GET /v1/api/policies/{id}** - Protected by scope `read:ar` or `read:ar:delegated` (supports both OAuth and iSHARE tokens)
  - With `read:ar` scope: User must own the policy's IssuerId, SubjectId, and ServiceProvider
  - With `read:ar:delegated` scope: No ownership check required
- **PUT /v1/api/policies** - Protected by scope `write:ar` or `write:ar:delegated` (supports both OAuth and iSHARE tokens)
  - With `write:ar` scope: User must be the owner of the policy's IssuerId
  - With `write:ar:delegated` scope: No ownership check required
- **DELETE /v1/api/policies/{id}** - Protected by scope `write:ar` or `write:ar:delegated` (supports both OAuth and iSHARE tokens)
  - With `write:ar` scope: User must be the owner of the policy's IssuerId
  - With `write:ar:delegated` scope: No ownership check required

## Authorization Endpoints
- **GET /v1/api/authorization/enforce** - Public
- **GET /v1/api/authorization/explained-enforce** - Currently accepts unauthenticated requests during the migration grace period, but API clients should start sending a bearer token now.

## Resource Groups
- **POST /v1/api/resourcegroups** - Protected by scope `write:ar` or `write:ar:delegated`
- **GET /v1/api/resourcegroups** - Protected by scope `read:ar` or `read:ar:delegated`
- **GET /v1/api/resourcegroups/{id}** - Protected by scope `read:ar` or `read:ar:delegated`
- **PUT /v1/api/resourcegroups** - Protected by scope `write:ar` or `write:ar:delegated`
- **DELETE /v1/api/resourcegroups/{id}** - Protected by scope `write:ar` or `write:ar:delegated`
- **POST /v1/api/resourcegroups/{resourceGroupId}/resources** - Protected by scope `write:ar` or `write:ar:delegated`
- **PUT /v1/api/resourcegroups/{resourceGroupId}/resources/{resourceId}** - Protected by scope `write:ar` or `write:ar:delegated`
- **DELETE /v1/api/resourcegroups/{resourceGroupId}/resources/{resourceId}** - Protected by scope `write:ar` or `write:ar:delegated`

## Resources
- **POST /v1/api/resources** - Protected by scope `write:ar` or `write:ar:delegated`
- **GET /v1/api/resources** - Protected by scope `read:ar` or `read:ar:delegated`
- **GET /v1/api/resources/{id}** - Protected by scope `read:ar` or `read:ar:delegated`
- **PUT /v1/api/resources** - Protected by scope `write:ar` or `write:ar:delegated`
- **DELETE /v1/api/resources/{id}** - Protected by scope `write:ar` or `write:ar:delegated`
