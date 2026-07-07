# Self-Service Portal

Via het PortlinQ Self-Service Portal beheren deelnemers hun organisatie, registreren ze systemen (apps en API's), doorzoeken ze de catalogus en beheren ze toegang.

> 🔗 **URL:** [portlinq-preview.poort8.nl/portal ➚](https://portlinq-preview.poort8.nl/portal)

## Onboarding en goedkeuring

Een organisatie moet eerst onboarden en goedgekeurd zijn voordat alle dataspace-functies beschikbaar zijn.

1. De organisatie wordt via het Self-Service Portal geonboard
2. De onboarding-gebruiker wordt de eerste administrator van de organisatie
3. De PortlinQ-beheerder beoordeelt en keurt de organisatie goed of af

Tot de PortlinQ-beheerder de organisatie heeft goedgekeurd, kunnen gebruikers van die organisatie geen dataspace-systemen gebruiken. Voor de volledige flow (KvK-check, e-mailverificatie en goedkeuringsstatussen) zie [Organisatie Registratie](onboarding.md).

## Gebruikersrollen in een organisatie

Gebruikers hebben één van twee rollen:

| Rol | Mogelijkheden |
|-----|---------------|
| **Administrator** | Volledig organisatiebeheer, inclusief rollen wijzigen en gebruikers verwijderen |
| **Member** | Gebruikt de portalfuncties die voor de organisatie beschikbaar zijn en kan nieuwe gebruikers uitnodigen |

De gebruiker die de organisatie onboardt, wordt de eerste **administrator**.

> ℹ️ Daarnaast bestaat de platformbrede rol **PortlinQ-beheerder** (Poort8), die de globale tag-lijst beheert. Zie [Tags beheren](tags-beheer.md).

## Portalmogelijkheden per rol

| Mogelijkheid | David (Consumer) | Charlie (Provider) |
|--------------|:----------------:|:------------------:|
| Organisatiegegevens bekijken | ✓ | ✓ |
| Applicatie registreren | ✓ | — |
| API registreren | — | ✓ |
| Catalogus doorzoeken | ✓ | ✓ |
| Catalogus filteren op tags | ✓ | ✓ |
| Tags toevoegen aan eigen API/App | — | ✓ |
| API-toegang aanvragen | ✓ | — |
| Toegangsaanvragen goedkeuren/afwijzen | — | ✓ |

## Applicatie registreren (David)

Data service consumers registreren applicaties die namens hen API's aanroepen.

1. Log in op het Self-Service Portal
2. Ga naar **Systems** → **Register Application**
3. Vul de applicatiegegevens in (naam, beschrijving)
4. Dien de registratie in

Na registratie toont het portal je **client credentials**:

| Credential | Beschrijving |
|------------|--------------|
| `client_id` | Unieke identifier van je applicatie |
| `client_secret` | De secret van je applicatie |

> ⚠️ **Belangrijk:** de client secret wordt maar één keer getoond. Bewaar 'm veilig (bijv. in een secrets manager). Ben je 'm kwijt, dan moet je een nieuwe genereren.

## API registreren (Charlie)

Data service providers registreren hun API's om ze vindbaar te maken in de catalogus.

1. Log in op het Self-Service Portal
2. Ga naar **Systems** → **Register API**
3. Vul de API-gegevens in (naam, beschrijving, base URL)
4. Upload je **OpenAPI-specificatie** — deze wordt in de catalogus weergegeven zodat consumers hem kunnen inzien
5. Dien de registratie in

Na registratie verschijnt je API in de **Catalogus**. Noteer de client ID van je API — consumers gebruiken die als `scope` bij het opvragen van een token; Keycloak zet hem in de `aud`-claim.

> 🏷️ **Tip:** voeg meteen ook tags toe aan je API, zodat die vindbaar is via de tag-filters in de catalogus. Zie [Tags toevoegen aan je diensten](tags-toevoegen-diensten.md).

## Catalogus doorzoeken

Alle deelnemers kunnen beschikbare API's doorzoeken:

1. Ga naar de **Catalogus**
2. Blader of zoek naar API's, of filter op **tags** om snel te vinden wat je zoekt
3. Bekijk de API-documentatie (gerenderd vanuit de OpenAPI-spec)
4. Als consumer: klik op **Request Access** om een toegangsaanvraag te starten

> Zie [Tags bekijken en filteren](tags-bekijken-consumer.md) voor de huidige tags en hoe je erop filtert via de app en de API.

## Toegangsaanvragen beheren (Charlie)

Wanneer een consumer toegang tot jouw API aanvraagt:

1. Je ontvangt een notificatie in het portal
2. Ga naar de detailpagina van je API om openstaande aanvragen te zien
3. Beoordeel de identiteit van de aanvragende organisatie
4. **Keur goed** of **wijs af**

Zodra je goedkeurt, kan de consumer tokens aanvragen die op jouw API gericht zijn. Je kunt toegang op elk moment **intrekken**.

Vragen? Neem contact op met Poort8 via **<hello@poort8.nl>**.