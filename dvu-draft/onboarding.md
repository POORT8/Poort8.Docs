# Onboarding & registratie

Registratie bij DVU verloopt via de self-service portal op [dvu-preview.poort8.nl/portal](https://dvu-preview.poort8.nl/portal). Je registreert je organisatie en je applicatie(s) en/of API('s) zelf. Een DVU-beheerder keurt je organisatie daarna goed in de beheerportal. Verdere tussenkomst van Poort8 of RVO is niet nodig.

## Stap 1 — Organisatie registreren

1. Ga naar [dvu-preview.poort8.nl/portal](https://dvu-preview.poort8.nl/portal).
2. Vul de gevraagde gegevens in. De portal verifieert het KVK nummer automatisch en haalt de organisatiegegevens op.
3. Na registratie staat je organisatie in de status **In afwachting van goedkeuring**.

Een DVU-beheerder (RVO) keurt de organisatie goed in de beheerportal. Let op, je krijgt hier geen bericht van. Hou zelf de portal in de gaten of je al bent goedgekeurd.

## Stap 2 — Applicatie registreren

Na goedkeuring registreer je je applicatie in de portal. Zowel dataservice consumers als datadienst-aanbieders registreren minimaal één applicatie.

1. Log in op de portal en ga naar **Systems** → **Applicatie registreren**.
2. Vul de naam en omschrijving van je applicatie in en sla op.
3. De portal toont je `client_id` en `client_secret`.

> **Belangrijk:** De `client_secret` wordt slechts één keer getoond. Sla hem direct veilig op, bijvoorbeeld in een secrets manager. Bij verlies moet je een nieuwe aanmaken.

## Stap 3 — API registreren *(alleen datadienst-aanbieders)*

Datadienst-aanbieders registreren hun API zodat die vindbaar is in de catalogus en consumers er toegang toe kunnen aanvragen.

1. Ga naar **Systems** → **API registreren**.
2. Vul de naam en omschrijving van je API in.
3. Upload je **OpenAPI-specificatie** — die wordt in de catalogus getoond zodat consumers de documentatie kunnen inzien.
4. Na registratie verschijnt je API in de catalogus. Noteer de `client_id` van je API — die gebruiken consumers als `scope` bij het ophalen van een token.

## Stap 4 — API-toegang aanvragen

Zowel dataservice consumers als datadienst-aanbieders vragen toegang aan tot de API's die ze nodig hebben:

- **Dataservice consumers** vragen toegang tot de API van de datadienst-aanbieder en de Keyper API (`keyper-api`).
- **Datadienst-aanbieders** vragen toegang tot het DVU Autorisatieregister (`noodlebar-api`), zodat ze autorisaties kunnen registreren.

1. Ga naar **Catalogus** in de portal.
2. Zoek de gewenste API op (bijv. de energiedata-API van de datadienst-aanbieder, `keyper-api` of `noodlebar-api`).
3. Klik op **Toegang aanvragen**.

Je aanvraag krijgt de status **In afwachting**. De API-eigenaar kent de toegang toe. Daarna kun je tokens ophalen met je client credentials. Let op, ook hier krijg je geen bericht van. Hou zelf de portal in de gaten of je al bent toegelaten tot de API.

## Stap 5 — Credentials testen

Gebruik de OAuth 2.0 Client Credentials-flow om een access token op te halen:

```http
POST https://auth.poort8.nl/realms/dvu-preview/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=<YOUR-CLIENT-ID>
&client_secret=<YOUR-CLIENT-SECRET>
&scope=<API-CLIENT-ID>
```

Een geldig antwoord bevat een `access_token`. Gebruik `noodlebar-api` als scope voor het DVU Autorisatieregister en `keyper-api` voor Keyper.

## Wat moet geregistreerd zijn per rol

| Rol | Organisatie | Applicatie | API registreren | API-toegang aanvragen |
|-----|-------------|------------|-----------------|-----------------------|
| Dataservice consumer | ✓ | ✓ | — | Datadienst-aanbieder API + Keyper |
| Datadienst-aanbieder | ✓ | ✓ | ✓ | DVU AR |
| Data-rechthebbende | ✓ | — | — | — |

Data-rechthebbenden hebben geen applicatieregistratie nodig: zij authenticeren via eHerkenning in de Keyper-goedkeuringsflow.

## Volgende stappen

- Lees het [Toegangsmodel](toegangsmodel.md) om de toegangsvarianten te begrijpen.
- Ga naar de implementatiegids voor jouw rol:
  - [Aansluiten als data-rechthebbende](aansluiten-data-rechthebbende.md)
  - [Aansluiten als dataservice consumer](aansluiten-dataservice-consumer.md)
  - [Aansluiten als datadienst-aanbieder](aansluiten-datadienst-aanbieder.md)
