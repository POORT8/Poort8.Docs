# 15: Dataset Access

The catalog describes datasets; a dataset grant authorizes access to their data.
Publishing metadata does not create a grant, and a grant does not confer catalog
browsing or management rights.

## Saving and Publishing Metadata

Register the dataset in the data plane first, then use its dataset identifier to save a
catalog draft. Complete the metadata and publish it when it is ready for discovery.
Every metadata request requires an API-authorized bearer token with an active
organisation, including service-account requests. Missing organisation claims return
`401`. Writes require API write authorization; reads require API read authorization.

| Operation | Behaviour |
| --- | --- |
| `PUT /v1/api/catalog/datasets/{datasetId}` | Creates a draft (`201`, with `Location`) or replaces the owning organisation's metadata (`200`). |
| `GET /v1/api/catalog/datasets/{datasetId}` | Reads a published dataset across organisations, or your organisation's own draft. |
| `POST /v1/api/catalog/datasets/{datasetId}/publish` | Publishes your organisation's draft (`200`). No request body. |

Use `Content-Type: application/ld+json` on PUT. Detail, PUT and publish responses use `application/ld+json`. Other request content
types return `415`, and an incompatible `Accept` header returns `406`.

The dataset ID is an opaque identifier, not necessarily a UUID. It contains 1 to
128 ASCII letters, digits or `._~-`; the dot path segments `.` and `..` are not
supported. Casing is preserved, so path values differing only by case identify
the same dataset. The public IRI keeps the casing used when the dataset was
created.

The server ignores input values for `@id`, `@type`, `identifier`,
`publisher.identifier` and `publicationStatus`. It sets the dataset IRI from the
instance's configured base plus the path ID, sets `identifier` to the path ID,
and sets `publisher.identifier` to the owning organisation. `publicationStatus`
is `draft` or `published`; PUT never changes it. Publisher metadata is optional on
an incomplete draft.

The organisation creating a draft becomes its immutable owner. Existing stored
ownership is checked before accepting a replacement, not inferred from the submitted
publisher. Administrator and trusted-client access do not bypass this check.
Another organisation receives `403` when reading, replacing or publishing a draft;
an unknown dataset returns `404`.

## Metadata Format and Validation

Supply the configured root `@context` IRI on every PUT. Contexts and SHACL
profiles are versioned instance configuration; the server resolves them locally,
never through network fetching. Inline or nested contexts, duplicate object members,
unknown terms and unsupported JSON-LD structures are rejected with `400`, including
on drafts. Text fields such as title and description use language maps:

```json
{
  "@context": "https://example.test/context.jsonld",
  "title": { "en": "Water quality measurements" },
  "description": { "en": "Example research measurements." },
  "publisher": { "name": "Example publisher" },
  "dataOwner": { "name": "Example owner", "email": "mailto:owner@example.test" },
  "dataSteward": [
    { "name": "Example steward", "email": "mailto:steward@example.test" }
  ],
  "accessRights": "https://example.test/classification/restricted"
}
```

This example uses placeholder contacts, classification and context. Code-list IRIs
and namespaces must be configured for the deployment.
Concepts can carry an `@id` and `prefLabel` language map. Distributions are
described under [Distributions](#distributions).
Optional governance fields (`license`, `accessConditions`, `purposeLimitation`,
`retentionPeriod`) are descriptive; they do not enforce data-plane restrictions.

Draft PUT checks the document structure but allows incomplete metadata. Publishing,
and replacing an already published record, runs the configured minimal SHACL profile.
The configured MVP profile requires nonblank title and description, one named publisher,
one named owner, at least one named steward, `mailto:` contact addresses, one
classification IRI, and access URLs for distributions that are present.
This is not full DCAT-AP conformance or code-list validation.

Only SHACL Violations block publication. A rejected published replacement or publish
returns `422 application/problem+json` with `errors[{path,message}]` and leaves the
stored document, status and authorization facts unchanged. Paths identify the source
fields; they are not a promise of JSON Pointer syntax. Correct the document with PUT
and retry. Publishing an already published dataset returns `409`.

For endpoint schemas and request/response definitions, see the
[Catalog API (Scalar) ➚](https://noodlebar-preview.poort8.nl/scalar/#tag/catalog).
The separate `/v1/datasets` routes remain a fixed read-only demo corpus, not saved
or published catalog data.

## Distributions

A distribution tells consumers where the data of a dataset can be retrieved. It is
embedded in the dataset document under `distribution`, as a single object or an
array, and is written and read with the dataset:

```json
"distribution": [
  {
    "@id": "https://example.test/distributions/water-quality-csv",
    "@type": "Distribution",
    "title": { "en": "Water quality measurements (CSV)" },
    "format": "http://publications.europa.eu/resource/authority/file-type/CSV",
    "accessURL": "https://data-plane.example.test/datasets/water-quality"
  }
]
```

- `accessURL` is the protected retrieval endpoint in the data plane. It must be an
  absolute IRI, and every distribution of a published dataset needs one. The
  catalog stores it as given and does not check where it points.
- Other accepted fields are `title`, `description`, `accessService`, `format`,
  `availability`, `status`, `license`, `language` and `temporalResolution`; see the
  Scalar schema for their types. `@id` is optional and chosen by you; the server does
  not manage it or check its uniqueness.
- There are no separate distribution endpoints. To add, change or remove a
  distribution, PUT the whole dataset document; distributions you leave out are
  removed. Ownership, draft visibility and publication rules are those of the dataset.
- `downloadURL` is not supported and returns `400`.

Reading a distribution grants no access to its data. The data plane authorizes each
retrieval against the dataset `@id` (see [Checking Data Access](#checking-data-access));
distributions have no policies or grants of their own.

## Searching Published Metadata

`GET /v1/api/catalog/datasets` lists published datasets across organisations with
the same token requirements as the detail read. Drafts are never listed, including
your own, and finding a dataset does not grant access to its data. The response is
`application/json`: `{ totalItems, page, pageSize, member, facets }`, where each
`member` is the document the detail GET returns.

```http
GET /v1/api/catalog/datasets?q=pfas%20rhine&classification=https%3A%2F%2Fexample.test%2Fclassification%2Frestricted
Authorization: Bearer <token>
Accept: application/json
```

- `q` matches any of its words, case-insensitively, in title, description and
  keyword (all languages) and in parameter labels. Datasets matching more
  different words rank first, then newer `issued` dates. `issued` is the date you
  supply on the dataset, not the moment it was published.
- `theme`, `parameter`, `location`, `organisation`, `project` and `classification`
  filter on exact values. Repeat a filter to match any of its values; different
  filters and `q` must all match.
- `facets` lists, per filter, the available values with their label and count.
  A facet ignores its own filter, so other values stay visible.
- `page` starts at 1; `pageSize` defaults to 20 and is at most 100. Unknown query
  parameters return `400`.

Facet values and labels come from the published records themselves, not from a
controlled vocabulary. See the
[Catalog API (Scalar) ➚](https://noodlebar-preview.poort8.nl/scalar/#tag/catalog)
for the field mapping of each filter.

## Checking Data Access

Use the returned dataset **`@id` IRI**, not its bare `identifier`, as the policy
`resourceId` and enforce `resource`. It has the form
`{configuredDatasetBase}/Dataset/{datasetId}`. Dataset resource matching is
case-insensitive, consistent with the authorization model.

The opt-in `datasetaccess` model requires both usable stored dataset facts and a
valid grant from its stored publisher. Dataset facts must be Active, have a usable
publisher and exactly one `dataset-accessible=true` property. The catalog stores
the public IRI separately from its lowercase registry key. Existing
non-catalog dataset facts continue to use their registry ID.

Send `subject`, concrete dataset `resource`, `action`, `serviceProvider`, `type`
and `attribute` to `GET /v1/api/authorization/explained-enforce`. Omit `issuer`;
a nonempty issuer or unsupported `context` returns `400`. A valid request returns
`200`, with `allowed=true` and matching `explainPolicies` only when the publisher's
grant and its validity period match. Without a matching grant the response is
`allowed=false` and an empty explanation.

Dataset facts and grants must share the same authorization domain. A dataset grant
can be reused by catalogs in that domain; it grants no catalog browsing or
management rights. Resource wildcard grants, identifier aliases and resource-group
membership do not expand dataset access to distributions or files.

See the [Authorization API (Scalar) ➚](https://noodlebar-preview.poort8.nl/scalar/#tag/authorization)
and [Use Case Authorization Models](12%20-%20Use%20Case%20Authorization%20Models.md).

## Current Limitations

There are no withdraw, archive, delete, vocabulary or harvest operations. Conditional
writes are not implemented: concurrent writes remain last-writer-wins. Existing grants
using bare IDs are not silently rewritten to dataset IRIs.
