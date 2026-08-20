# Self-Service Portal

Via het BunkerConnect Self-Service Portal beheren bunker suppliers hun organisatie en registreren ze de applicatie waarmee ze de Authorization Registry aanroepen.

> 🔗 **URL:** [bunkerconnect-preview.poort8.nl/portal ➚](https://bunkerconnect-preview.poort8.nl/portal)

## Onboarding en goedkeuring

Een organisatie moet eerst onboarden en goedgekeurd zijn voordat alle dataspace-functies beschikbaar zijn.

1. De organisatie wordt via het Self-Service Portal geonboard
2. De onboarding-gebruiker wordt de eerste administrator van de organisatie
3. De BunkerConnect-beheerder beoordeelt en keurt de organisatie goed of af

Tot de BunkerConnect-beheerder de organisatie heeft goedgekeurd, kunnen gebruikers van die organisatie geen dataspace-systemen gebruiken. Voor de volledige flow (KvK-check, e-mailverificatie en goedkeuringsstatussen) zie [Organisatie Registratie](onboarding.md).

## Gebruikersrollen in een organisatie

Gebruikers hebben één van twee rollen:

| Rol | Mogelijkheden |
|-----|---------------|
| **Administrator** | Volledig organisatiebeheer, inclusief rollen wijzigen en gebruikers verwijderen |
| **Member** | Gebruikt de portalfuncties die voor de organisatie beschikbaar zijn en kan nieuwe gebruikers uitnodigen |

De gebruiker die de organisatie onboardt, wordt de eerste **administrator**.

## Applicatie registreren

Als bunker supplier registreer je een applicatie (OAuth-client) waarmee je namens je organisatie de BunkerConnect Authorization Registry aanroept — om policies te registreren en om autorisatie te controleren.

1. Log in op het Self-Service Portal
2. Ga naar **Systems** → **Register Application**
3. Vul de applicatiegegevens in (naam, beschrijving)
4. Dien de registratie in

Na registratie toont het portal je **client credentials**:

| Credential | Beschrijving |
|------------|--------------|
| `client_id` | Unieke identifier van je applicatie |
| `client_secret` | De secret van je applicatie |

> ⚠️ **Belangrijk:** de client secret wordt maar één keer getoond. Bewaar 'm veilig (bijv. in een secrets manager).

Zie [AR-toegang aanvragen](api-toegang-aanvragen.md) voor de vervolgstap: toegang tot de Authorization Registry krijgen en policies registreren.

Vragen? Neem contact op met Poort8 via **hello@poort8.nl**.
