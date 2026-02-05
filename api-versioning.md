# API Versioning Policy

This document describes how we version our APIs and what you can expect when changes are made.

> **Note:** If an API does not yet have versioning or a changelog, these will be introduced with the next breaking change to that API.

## Versioning Approach

- We use **major versions only** (v0, v1, v2, etc.)
- New APIs start in **v0** during initial development
- A new major version is created **only** when there is a breaking change
- At most **2 versions** are active at any time: the current version and one legacy version

## Deprecation Policy

When a new major version is released:

- The previous version is marked as **deprecated** (legacy)
- Both versions run in parallel for **90 days**
- After 90 days, the deprecated version is retired

This gives you sufficient time to migrate your integration to the new version.

## What Counts as a Breaking Change?

A breaking change is any modification that could cause your existing integration to stop working. Examples include:

- Removing or renaming endpoints
- Removing or renaming fields in request or response bodies
- Changing the data type of a field
- Adding new required fields to requests
- Changing authentication requirements

Non-breaking changes (such as adding new optional fields or new endpoints) do not result in a new major version.

## iSHARE Endpoints

Some of our APIs include endpoints that implement the [iSHARE](https://ishare.eu/) specification. These iSHARE endpoints follow their own versioning, separate from the general API version. This means iSHARE endpoint versions reflect the iSHARE specification version they implement, not changes to our API.

When a new iSHARE specification version is released and supported, a new versioned iSHARE endpoint will be added alongside existing ones.

## Communication

When a new API version is released, you will be notified with:

- A description of what has changed
- Links to the updated API documentation
- The timeline for deprecation (90 days)
- Migration guidance when applicable

## Changelog

When versioning is introduced for an API, a changelog will be maintained that documents breaking changes between versions. You can find the changelog in the documentation section for the relevant product (e.g., [NoodleBar](/noodlebar/), [Keyper](/keyper/)).

## Questions?

If you have questions about API versioning or need assistance with migration, please contact us at [hello@poort8.nl](mailto:hello@poort8.nl).