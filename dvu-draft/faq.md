# Veelgestelde vragen

[TBD – deze pagina vullen met vragen die uit klantcontact en pilots naar voren komen voor de NoodleBar Keycloak-variant van DVU.]

## Algemeen

**Wat is DVU 2.0?**
De NoodleBar Keycloak-variant van DVU. Functioneel vergelijkbaar met de eerdere implementatie, maar gebaseerd op het standaard Poort8 NoodleBar-platform met Keycloak als identity provider, vergelijkbaar met PortlinQ en GIR.

**Blijft DVU 1.0 nog beschikbaar?**
Ja. De [DVU 1.0 documentatie](../dvu/) en de bijbehorende implementatie blijven voorlopig naast deze versie bestaan.

## Authenticatie

**Welk Keycloak-realm gebruikt DVU 2.0?**
Preview: `https://auth.poort8.nl/realms/dvu-preview`. De productie-realm is [TBD – beschikbaar na productie-deployment].

**Welk scope vraag ik aan op de token-endpoint?**
`noodlebar-api`.

## Toestemming en policies

**Wie geeft toestemming?**
De data-rechthebbende (gebouweigenaar) via Keyper, met eHerkenning-authenticatie.

**Hoe lang is een policy geldig?**
Dat bepaalt de data-rechthebbende bij goedkeuring. Het veld `expiration` in de policy bevat de einddatum als Unix timestamp.

## Implementatie

**Welke iSHARE-identifier moet ik gebruiken voor `serviceProvider`?**
[TBD – afhankelijk van de gekozen datadienst-aanbieder. Voor SDS is dit `did:ishare:EU.NL.NTRNL-55819206`; controleer voor andere aanbieders bij Poort8.]

**Waar vind ik de API-referentie?**
- [DVU API docs ➚](https://dvu-preview.poort8.nl/scalar/v1)
- [Keyper API docs ➚](https://keyper-preview.poort8.nl/scalar/v1)
