# 15: Dataset Access

The `datasetaccess` authorization model checks whether a requesting organization has
a valid grant from a dataset's publisher for that specific dataset. Both usable stored
dataset facts and a matching grant are required.

> **Current availability:** `datasetaccess` authorization is available through the existing
> `GET /v1/api/authorization/explained-enforce` endpoint. The catalogue API supports
> creating and updating a publisher's Pending dataset draft, publishing it, and reading
> published metadata. Dataset search and listing, distribution management, editing a
> published dataset and withdrawal are not available.

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

## Creating and Publishing Datasets

Use the catalogue API to save a dataset draft as JSON-LD, publish it and read it:

| Method and path | Behavior |
| --- | --- |
| `PUT /v1/api/catalog/datasets/{datasetId}` | Creates a Pending draft (`201` with `Location`) or updates the caller's own Pending draft (`200`). |
| `POST /v1/api/catalog/datasets/{datasetId}/publish` | Publishes the caller's own Pending draft (`200`) and returns the published metadata. There is no request body. |
| `GET /v1/api/catalog/datasets/{datasetId}` | Returns a published dataset, or the caller's own Pending draft, as `application/ld+json`. |

### Drafts

Saving and publishing require the existing API write authorization and a strict
active-organisation match: the token's active organisation, the publisher's single identifier
and the stored draft issuer must agree. The publisher IRI uses the catalogue's organisation
namespace + `/` + that organisation's URI-escaped identifier.
Administrator, trusted-client and delegated authorization do not
bypass this ownership check. Another organisation cannot read, overwrite or publish the draft.

Supply a lowercase, hyphenated UUID in `datasetId`. The server sets `@id` using the catalogue's dataset namespace
+ `/` + that UUID, and sets `identifier` to a one-item array containing the UUID.
Submitting metadata cannot set publication state or grant `datasetaccess`. Saving a draft
performs structural validation only, so an incomplete draft can be saved and completed later.

Each catalogue accepts one JSON-LD context. Use the context and organisation/dataset
namespaces specified for the catalogue you integrate with, rather than assuming they are
shared across deployments.
A PUT may omit the root `@context`; the server adds the catalogue's context before storing
the draft. If supplied, it must exactly match that context.
Other values and nested `@context` properties are rejected with `400`. GET responses always
contain this root context. The API never fetches contexts.
Duplicate JSON object members are rejected with `400`.

### Publishing

Publishing validates the stored draft against the catalogue's publication profile. The
stored publisher identifier and IRI must also still match the stored issuer, even if the
metadata was changed through the generic ResourceGroup API; a mismatch returns `422`
with path `publisher`, leaving the draft unchanged.
Malformed JSON and non-object roots introduced through that API also return `422`,
with an empty path for the document-wide error. Repair the metadata with catalogue PUT
and retry publication.

The current profile is a minimal gate: supply `title` and `description` as plain strings or
arrays of plain strings. At least one value of each is required and every value must contain
non-whitespace text. Equivalent JSON-LD plain value objects also validate; language-tagged
values and IRIs do not satisfy the plain-text rule. Passing it does not mean
the metadata conforms to a complete DCAT-AP or domain profile.

| Situation | Response |
| --- | --- |
| No or invalid token | `401` |
| The caller's active organisation is not the dataset's publisher | `403` |
| The dataset does not exist or is not a catalogue dataset | `404` |
| The dataset is already published | `409` |
| The metadata does not pass the profile | `422` with an `errors` list; the draft stays Pending |
| Published | `200` with the published metadata |

A `422` response is `application/problem+json` and lists each problem as a `path`, the
JSON-LD term or keyword to correct (or an unmapped predicate IRI), and a `message`.
The path is not a JSON Pointer; an empty path indicates a document-wide error and `@id`
can indicate a node-level violation. The draft stays unchanged. Correct it with PUT and publish again.

A published dataset keeps its identifier, publisher and the metadata you supplied, including
governance fields and relations to projects, publications or upstream sources. The response
adds `lifecycleStatus` with the value `active` and `modificationDate` with the UTC date of
publication. Publication also stores the dataset facts described in
[Representing a Dataset](#representing-a-dataset): status `Active` and exactly one
`dataset-accessible=true` property.

Publishing does not grant access to the data. Access still requires a valid grant issued by
the publisher, as described in [Matching a Grant](#matching-a-grant). A published dataset
cannot currently be changed through the catalogue API: PUT and a second publish return `409`.

### Reading Datasets

An API-authorized token with an organisation, including service-account tokens, can read a
published dataset's metadata across organisations. Keycloak API tokens without an organisation
are rejected with `401`, even for published metadata. A data-access grant is not
required to read metadata. A Pending draft can be read only by its publisher's active
organisation; other organisations receive `403`. Requests without a token are rejected.

For request and response definitions, see the
[Catalog API (Scalar) ➚](https://noodlebar-preview.poort8.nl/scalar/#tag/catalog).

The existing `GET /v1/datasets` endpoint returns demonstration data, not saved or published
datasets. The ownership and state rules described here apply to the catalogue dataset routes.
Authorized ResourceGroup API clients can still manage the same records through that API.
