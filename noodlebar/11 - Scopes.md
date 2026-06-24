# API Endpoints and Authorization Scopes

## Organizations
- **POST /v1/api/organization-registry** - Protected by scope `write:or` or `write:or:delegated`
  - With `write:or` scope: User must be the owner of the requested organization Identifier
  - With `write:or:delegated` scope: No ownership check required
- **GET /v1/api/organization-registry** - Protected by scope `read:or` or `read:or:delegated`
  - With `read:or` scope: User can only view organizations they own
  - With `read:or:delegated` scope: All organizations are accessible
- **GET /v1/api/organization-registry/{id}** - Protected by scope `read:or` or `read:or:delegated`
  - With `read:or` scope: User must be the owner of the organization's Identifier
  - With `read:or:delegated` scope: No ownership check required
- **GET /v1/api/authorization-registry-organizations** - Protected by scope `read:ar` or `read:ar:delegated`
  - With `read:ar` scope: User can only view organizations they own
  - With `read:ar:delegated` scope: All organizations are accessible
- **GET /v1/api/authorization-registry-organizations/{id}** - Protected by scope `read:ar` or `read:ar:delegated`
  - With `read:ar` scope: User must be the owner of the organization's Identifier
  - With `read:ar:delegated` scope: No ownership check required
- **POST /v1/api/authorization-registry-organizations/{organizationId}/employees** - Protected by scope `write:ar` or `write:ar:delegated`
  - With `write:ar` scope: User must be the owner of the organization's Identifier
  - With `write:ar:delegated` scope: No ownership check required

## Policies
- **POST /v1/api/policies** - Protected by scope `write:ar` or `write:ar:delegated` (supports both OAuth and iShare tokens)
  - With `write:ar` scope: If specifying an IssuerId, user must be the owner of that IssuerId
  - With `write:ar:delegated` scope: No ownership check required
- **GET /v1/api/policies** - Protected by scope `read:ar` or `read:ar:delegated` (supports both OAuth and iShare tokens)
  - With `read:ar` scope: User can only view policies where they own the IssuerId, SubjectId, or ServiceProvider
  - With `read:ar:delegated` scope: All policies are accessible
- **GET /v1/api/policies/{id}** - Protected by scope `read:ar` or `read:ar:delegated` (supports both OAuth and iShare tokens)
  - With `read:ar` scope: User must own the policy's IssuerId, SubjectId, and ServiceProvider
  - With `read:ar:delegated` scope: No ownership check required
- **PUT /v1/api/policies** - Protected by scope `write:ar` or `write:ar:delegated` (supports both OAuth and iShare tokens)
  - With `write:ar` scope: User must be the owner of the policy's IssuerId
  - With `write:ar:delegated` scope: No ownership check required
- **DELETE /v1/api/policies/{id}** - Protected by scope `write:ar` or `write:ar:delegated` (supports both OAuth and iShare tokens)
  - With `write:ar` scope: User must be the owner of the policy's IssuerId
  - With `write:ar:delegated` scope: No ownership check required

## Authorization Endpoints
- **GET /v1/api/authorization/enforce** - Public
- **GET /v1/api/authorization/explained-enforce** - Public
- **POST /v1/api/authorization/unsigned-delegation** - Protected by OAuth token (any scope)

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

## iSHARE Endpoints
- **POST /api/ishare/connect/token** - Public, requires valid client assertion
- **POST /api/ishare/delegation** - Protected by iSHARE token

## GIR BasisdataMessage Endpoints
- **POST /v1/api/GIRBasisdataMessage** - Protected by DSGO bearer token
  - The GIRBasisdataMessage will be active only if there is a valid policy from the installation owner for the registrar to write to GIR 
- **GET /v1/api/GIRBasisdataMessage** - Protected by DSGO bearer token
  - Only active GIRBasisdataMessages will be returned, based on read/write policies for the token subject
- **GET /v1/api/GIRBasisdataMessage/{guid}** - Protected by DSGO bearer token
  - Only active GIRBasisdataMessages will be returned, based on read/write policies for the token subject
