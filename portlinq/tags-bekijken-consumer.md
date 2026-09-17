# Tags bekijken en filteren (Data Service Consumer)

Deze gids is voor **David** - een data service consumer die tags gebruikt om relevante API's en apps te vinden in de catalogus. Dat kan via het Self-Service Portal (app) en via de catalogus-API.

## Huidige tags

Op dit moment zijn de volgende tags beschikbaar:

| Tag | Betekenis |
| --- | --- |
| `port` | Haven - geeft aan welke diensten bij een specifieke haven horen |
| `shorepower` | Walstroom - dienst voor walstroomvoorziening |
| `visit` | Scheepsbezoek - dienst rond het bezoek van een schip aan de haven |
| `vessel` | Vaartuig - hiermee kun je filteren welke organisatie een vessel-dienst aanbiedt |

## Filteren in de app

1. Log in op het [Self-Service Portal](https://portlinq-preview.poort8.nl/portal)
2. Ga naar de **Catalogus**
3. Selecteer een of meer tags in het filter
4. De catalogus toont alleen systemen die alle geselecteerde tags hebben

## Filteren via de API

Voor tags en catalogusfiltering zijn API-endpoints beschikbaar. Gebruik een geldig access token en filter op een of meer tags, en/of op de organisatie die het systeem aanbiedt: `organizationName` en `organizationId` (EUID).

Voor exacte endpoint-paden, parameters en modellen, zie de [PortlinQ API documentatie (Scalar)](https://portlinq-preview.poort8.nl/scalar/v1).

Vragen? Neem contact op met Poort8 via **<hello@poort8.nl>**.
