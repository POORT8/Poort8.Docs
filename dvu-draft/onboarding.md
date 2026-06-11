# Onboarding & registratie

Voordat je met DVU kunt integreren, moet je organisatie als deelnemer zijn geregistreerd in het DVU Participantenregister en credentials hebben ontvangen voor het Keycloak-realm `dvu-preview`.

## Voorwaarden per rol

| Rol | Wat moet geregistreerd zijn |
|-----|------------------------------|
| Dataservice consumer | Organisatie + App in Participantenregister, Keycloak client credentials voor de datadienst-aanbieder API |
| Datadienst-aanbieder | Organisatie + App + API in Participantenregister, Keycloak client credentials voor het DVU AR |
| Data-rechthebbende (gebouweigenaar) | Organisatie in Participantenregister; gebruiker met geldige eHerkenning voor goedkeuring via Keyper |

## Wie regelt wat

| Wat | Wie |
|-----|-----|
| Toelating tot DVU | RVO (DVU-beheer) |
| Registratie in Participantenregister | Poort8, na akkoord van RVO |
| Uitgifte Keycloak client credentials | Poort8 |
| Aanmaken Keyper-aanvragen | Dataservice consumer |
| Aanmaken policies | Data-rechthebbende via Keyper-goedkeuringsflow |

## Aanvraagproces

1. Neem contact op met **BeheerDVU@rvo.nl** voor toelating tot DVU.
2. Lever de organisatiegegevens en gewenste rol (consumer / datadienst-aanbieder) aan bij Poort8 via **hello@poort8.nl**.
3. Poort8 registreert je organisatie en levert de Keycloak `client_id` + `client_secret`.
4. Test je credentials via de [token-endpoint](#testen-van-credentials).

## Testen van credentials

```http
POST https://auth.poort8.nl/realms/dvu-preview/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

client_id=<YOUR-CLIENT-ID>
&client_secret=<YOUR-CLIENT-SECRET>
&grant_type=client_credentials
&scope=noodlebar-api
```

Een geldig antwoord bevat een `access_token`. Je kunt dat token gebruiken om bijvoorbeeld het [DVU `explained-enforce`-endpoint](aansluiten-datadienst-aanbieder.md#stap-3-explained-enforce-request) of de [Keyper-API ➚](https://keyper-preview.poort8.nl/scalar/v1) aan te roepen.

## Volgende stappen

- Lees het [Toegangsmodel](toegangsmodel.md) om varianten 1 en 2 te begrijpen.
- Ga naar de implementatiegids voor jouw rol:
  - [Aansluiten als data-rechthebbende](aansluiten-data-rechthebbende.md)
  - [Aansluiten als dataservice consumer](aansluiten-dataservice-consumer.md)
  - [Aansluiten als datadienst-aanbieder](aansluiten-datadienst-aanbieder.md)
