# Veelgestelde vragen

## Algemeen

**Wat is DVU?**
DVU is de NoodleBar Keycloak-variant van het Datastelsel Verduurzaming Utiliteit, gebaseerd op de standaard Poort8 NoodleBar-oplossing met Keycloak als identity provider.

## Authenticatie

**Welk Keycloak-realm gebruikt DVU?**
Preview: `https://auth.poort8.nl/realms/dvu-preview`.

**Welk scope vraag ik aan op de token-endpoint?**
Dat hangt af van de API die je wilt aanroepen. Gebruik `keyper-api` voor de Keyper API en de `client_id` van de betreffende API (zoals geregistreerd in de catalogus) voor de datadienst-aanbieder API. Zie [Onboarding – Stap 4](onboarding.md).

## Toestemming en policies

**Wie geeft toestemming?**
De data-rechthebbende (gebouweigenaar) via Keyper, met eHerkenning-authenticatie.

**Hoe lang is een policy geldig?**
Dat bepaalt de DVU registratie app bij het aanmaken van de policies en resource groups. Het veld `expiration` in de policy bevat de einddatum als Unix timestamp.

**Waar vind ik de API-referentie?**
- [DVU API docs ➚](https://dvu-preview.poort8.nl/scalar/v1)
- [Keyper API docs ➚](https://keyper-preview.poort8.nl/scalar/v1)
