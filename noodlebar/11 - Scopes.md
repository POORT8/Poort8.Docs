# API Endpoints and Authorization Scopes

## Organizations
- **POST /api/organization-registry** - Protected by scope `write:or` or `write:or:delegated`
  - With `write:or` scope: User must be the owner of the requested organization Identifier
  - With `write:or:delegated` scope: No ownership check required
- **GET /api/organization-registry** - Protected by scope `read:or` or `read:or:delegated`
  - With `read:or` scope: User can only view organizations they own
  - With `read:or:delegated` scope: All organizations are accessible
- **GET /api/organization-registry/{id}** - Protected by scope `read:or` or `read:or:delegated`
  - With `read:or` scope: User must be the owner of the organization's Identifier
  - With `read:or:delegated` scope: No ownership check required
- **GET /api/authorization-registry-organizations/{id}** - Protected by scope `read:ar` or `read:ar:delegated`
  - With `read:ar` scope: User must be the owner of the organization's Identifier
  - With `read:ar:delegated` scope: No ownership check required
- **POST /api/authorization-registry-organizations/{organizationId}/employees** - Protected by scope `write:ar` or `write:ar:delegated`
  - With `write:ar` scope: User must be the owner of the organization's Identifier
  - With `write:ar:delegated` scope: No ownership check required

## Policies
- **POST /api/policies** - Protected by scope `write:ar` or `write:ar:delegated`
  - With `write:ar` scope: If specifying an IssuerId, user must be the owner of that IssuerId
  - With `write:ar:delegated` scope: No ownership check required
- **GET /api/policies** - Protected by scope `read:ar` or `read:ar:delegated`
  - With `read:ar` scope: User can only view policies where they own the IssuerId, SubjectId, or ServiceProvider
  - With `read:ar:delegated` scope: All policies are accessible
- **GET /api/policies/{id}** - Protected by scope `read:ar` or `read:ar:delegated`
  - With `read:ar` scope: User must own the policy's IssuerId, SubjectId, and ServiceProvider
  - With `read:ar:delegated` scope: No ownership check required
- **PUT /api/policies** - Protected by scope `write:ar` or `write:ar:delegated`
  - With `write:ar` scope: User must be the owner of the policy's IssuerId
  - With `write:ar:delegated` scope: No ownership check required
- **DELETE /api/policies/{id}** - Protected by scope `write:ar` or `write:ar:delegated`
  - With `write:ar` scope: User must be the owner of the policy's IssuerId
  - With `write:ar:delegated` scope: No ownership check required

## Authorization Endpoints
- **GET /api/authorization/enforce** - Public
- **GET /api/authorization/explained-enforce** - Public
- **POST /api/authorization/unsigned-delegation** - Protected by OAuth token (any scope)

## Resource Groups
- **POST /api/resourcegroups** - Protected by scope `write:ar` or `write:ar:delegated`
- **GET /api/resourcegroups** - Protected by scope `read:ar` or `read:ar:delegated`
- **GET /api/resourcegroups/{id}** - Protected by scope `read:ar` or `read:ar:delegated`
- **PUT /api/resourcegroups** - Protected by scope `write:ar` or `write:ar:delegated`
- **DELETE /api/resourcegroups/{id}** - Protected by scope `write:ar` or `write:ar:delegated`
- **POST /api/resourcegroups/{resourceGroupId}/resources** - Protected by scope `write:ar` or `write:ar:delegated`
- **PUT /api/resourcegroups/{resourceGroupId}/resources/{resourceId}** - Protected by scope `write:ar` or `write:ar:delegated`
- **DELETE /api/resourcegroups/{resourceGroupId}/resources/{resourceId}** - Protected by scope `write:ar` or `write:ar:delegated`

## Resources
- **POST /api/resources** - Protected by scope `write:ar` or `write:ar:delegated`
- **GET /api/resources** - Protected by scope `read:ar` or `read:ar:delegated`
- **GET /api/resources/{id}** - Protected by scope `read:ar` or `read:ar:delegated`
- **PUT /api/resources** - Protected by scope `write:ar` or `write:ar:delegated`
- **DELETE /api/resources/{id}** - Protected by scope `write:ar` or `write:ar:delegated`

## iSHARE Endpoints
- **POST /api/ishare/connect/token** - Public, requires valid client assertion
- **POST /api/ishare/delegation** - Protected by iSHARE token

## GIR BasisdataMessage Endpoints
- **POST /api/GIRBasisdataMessage** - Protected by OAuth token (any scope), will be changed to an iSHARE token
  - The GIRBasisdataMessage will be active only if there is a valid policy from the installation owner for the registrar to write to GIR 
- **GET /api/GIRBasisdataMessage** - Protected by OAuth token (any scope), will be changed to an iSHARE token
  - Only active GIRBasisdataMessages will be returned, based on read/write policies for the token subject
- **GET /api/GIRBasisdataMessage/{girBasisdataMessageGUID}** - Protected by OAuth token (any scope), will be changed to an iSHARE token
  - Only active GIRBasisdataMessages will be returned, based on read/write policies for the token subject
