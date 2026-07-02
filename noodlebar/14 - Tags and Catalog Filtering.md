# Tags and Catalog Filtering

This page explains how tags work in NoodleBar for administrators, organizations, and catalog users.

Tags are used to keep APIs and apps discoverable and consistent across the catalog.

## What You Can Do Per Role

| Role | Capabilities |
|---|---|
| Administrator | Manage the global tag list (create, rename, delete), maintain naming consistency, and remove selected tags from a system |
| Organization | Assign existing tags to owned APIs and apps, and remove tags from owned APIs and apps |
| Catalog user | Filter APIs and apps by one or more tags in the catalog UI, and query the catalog API with tag filters |

## Administrator Workflow

Administrators manage the controlled tag vocabulary in the Admin Portal.

1. Open the Admin Portal and go to the tags management page.
2. Create new tags for consistent catalog labeling.
3. Rename or delete existing tags when taxonomy needs to change.
4. Open a system detail page and remove selected assigned tags when needed.

The global list is shared across the dataspace. Organizations can only assign tags that exist in this controlled list.

## Organization Workflow

Organizations can manage tags on their own APIs and apps through the self-service portal.

1. Open your API or app detail page.
2. Select one or more tags from the available controlled list.
3. Save assignments.
4. Remove tags later when the classification is no longer correct.

Tags are visible on API and app detail pages to make classification clear to consumers.

## Catalog Filtering

In catalog views, users can filter results by tags.

- Single-tag filter: show systems that contain that tag.
- Multi-tag filter: show systems that contain all selected tags.

This supports precise discovery when many APIs and apps are available.

## Systems API

For endpoint definitions, request/response models, and examples, use the Systems API reference in Scalar: [Systems API (Scalar) ➚](https://noodlebar-preview.poort8.nl/scalar/#tag/systems).

Catalog filtering supports one or more tag filters, including combinations with system type filtering.

## Notes

- Use short, stable, reusable tag names.
- Prefer one controlled naming convention (for example singular nouns and lowercase IDs).
- Review tag quality regularly to prevent duplicates with different wording.