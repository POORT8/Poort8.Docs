# 15: Dataset Access

The `datasetaccess` authorization model checks whether a requesting organization has
a valid grant from a dataset's publisher for that specific dataset. Both usable stored
dataset facts and a matching grant are required.

> **Current availability:** `datasetaccess` authorization is available through the existing
> `GET /v1/api/authorization/explained-enforce` endpoint. The catalogue API supports
> creating, reading and updating a publisher's Pending dataset draft only; publication,
> dataset search and distribution management are not available.

## Checking Access

Send the requesting `subject`, concrete dataset `resource` and `action`, with the
`serviceProvider`, `type` and `attribute` appropriate to the grant. These iSHARE-shaped
fields are accepted for `datasetaccess`; `context` is not supported. Omit `issuer`
from the request; a non-empty `issuer` is not applicable and returns HTTP 400. The
stored dataset publisher determines issuer authority.

A valid request returns HTTP 200. A matching publisher grant produces `allowed=true`
and the matching grant in `explainPolicies`. Without a matching grant, including when
the grant issuer differs from the stored publisher, the response is `allowed=false`
with an empty `explainPolicies` list. Invalid requests, such as a missing required
field, a non-empty `issuer` or an unsupported `context`, return HTTP 400 instead.

For query parameters and response definitions, see the
[Authorization API (Scalar) ➚](https://noodlebar-preview.poort8.nl/scalar/#tag/authorization).

## Representing a Dataset

A dataset is represented as a ResourceGroup in the Authorization Registry:

| Field | Meaning for dataset access |
| --- | --- |
| `ResourceGroupId` | The concrete dataset ID requested by the consumer and targeted by the grant. |
| `Issuer` | The authoritative dataset publisher, not the organization submitting metadata. |
| `Status` | Must be `Active`. This alone does not make the dataset accessible. |
| `Properties` | Must contain exactly one property with key `dataset-accessible` and value exactly `true`. |
| `UseCase` | Identifies the authorization domain using its family root. |

An unknown dataset, missing publisher, inactive record or absent/false accessibility
property cannot authorize access. A blank publisher or the placeholder `unknown` is
not usable.

## Matching a Grant

The grant's issuer must match the publisher stored with the dataset, and its resource
ID must match that dataset's concrete ID. A publisher supplied by the requester is
not trusted for this decision.

The grant must also match the requesting subject, service provider, action, type,
attribute and validity period according to the existing iSHARE matching rules.
Dataset facts and the grant must belong to the same authorization domain.

Unlike resource-group scoping, this model does not expand a grant to group members.
Resource wildcard grants and identifier aliases do not grant dataset access, nor does
a dataset grant automatically authorize its distributions or files.

## Example

A stored dataset `dataset-1` has publisher A, status `Active` and exactly one
`dataset-accessible=true` property.

| Situation | Outcome |
| --- | --- |
| A issues a valid grant to the requester for `dataset-1` | Allowed when the other grant conditions match. |
| B issues an otherwise matching grant for `dataset-1` | Denied: B is not the stored publisher. |
| A issues a grant for another dataset or resource `*` | Denied: the grant does not target this concrete dataset ID. |
| The accessibility property becomes `false` | Denied even if A's grant remains valid. |

## Choosing the Model

The opt-in use case `datasetaccess` maps to the model of the same name. Existing use
cases are not switched to this model. See
[Use Case Authorization Models](12%20-%20Use%20Case%20Authorization%20Models.md)
for model selection and family-root matching.

This is dataset authorization, not catalogue browsing or management authorization.
Dataset-access grants do not grant catalogue browsing or draft-management rights.

## Creating Dataset Drafts

Use the catalogue API to save and retrieve a dataset draft as JSON-LD:

| Method and path | Behavior |
| --- | --- |
| `PUT /v1/api/catalog/datasets/{datasetId}` | Creates a Pending draft (`201` with `Location`) or updates the caller's own Pending draft (`200`). |
| `GET /v1/api/catalog/datasets/{datasetId}` | Returns that persisted draft as `application/ld+json`. |

Both routes require the existing API read/write authorization and a strict active-organisation
match: the token's active organisation, the publisher's single identifier and the stored draft
issuer must agree. The publisher IRI uses the catalogue's organisation namespace followed
by that organisation's EUID.
Administrator, trusted-client and delegated authorization do not
bypass this ownership check. Another organisation cannot read or overwrite the draft.

Supply a UUID in `datasetId`. The server sets `@id` using the catalogue's dataset namespace
followed by that UUID, and sets `identifier` to a one-item array containing the UUID.
The draft remains Pending; submitting metadata cannot set publication state or grant
`datasetaccess`. The API performs structural validation only, not SHACL validation.

Each catalogue accepts one JSON-LD context. Use the context and organisation/dataset
namespaces specified for the catalogue you integrate with, rather than assuming they are
shared across deployments.
A PUT may omit the root `@context`; the server adds the catalogue's context before storing
the draft. If supplied, it must exactly match that context.
Other values and nested `@context` properties are rejected with `400`. GET responses always
contain this root context. Contexts are treated as identifiers; the API does not fetch
them or perform JSON-LD expansion, RDF processing or SHACL validation.
Duplicate JSON object members are rejected with `400`.

For request and response definitions, see the
[Catalog API (Scalar) ➚](https://noodlebar-preview.poort8.nl/scalar/#tag/catalog).

The existing `GET /v1/datasets` endpoint returns demonstration data, not saved drafts.
The ownership and Pending-state rules described here apply to the catalogue draft routes.
Authorized ResourceGroup API clients can still manage the same records through that API.
