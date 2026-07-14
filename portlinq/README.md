# PortlinQ

PortlinQ maakt het mogelijk om in binnenhavens op een gecontroleerde, gestandaardiseerde manier digitale diensten aan te bieden en data te delen — tussen binnenhavens, havenbedrijven, havenmeesters, schippers en IT-bedrijven. Het doel is simpel: een gebruiker — bijvoorbeeld een schipper — kiest **één app** en neemt daarmee diensten af in **alle** deelnemende Nederlandse binnenhavens, zonder per haven een ander systeem, account of koppeling. Havenbedrijven en andere dienstaanbieders houden tegelijkertijd volledige regie over de diensten en data die zij aanbieden.

PortlinQ is gebouwd op Poort8's **NoodleBar** dataspace-technologie en past het federatieve datastelsel-principe toe op de binnenvaartsector.

> PortlinQ is een concrete toepassing van het bredere datastelsel voor het federatief delen van diensten en data.

## Waarom PortlinQ?

| Voor wie | Wat het oplevert |
|----------|------------------|
| **Schippers** | Eén app voor alle deelnemende havens; geen losse accounts of koppelingen per haven |
| **Havenbedrijven** | Volledige controle over eigen data en diensten; standaard koppeling i.p.v. maatwerk per partij |
| **Dienstaanbieders** | Toegang tot meerdere havens via één gestandaardiseerde integratie |
| **Rijkswaterstaat / sector** | Schaalbare, soevereine digitale havendiensten als basis voor verduurzaming (o.a. walstroom) |

## Hoe werkt het?

PortlinQ faciliteert digitale havendiensten via een federatief model met drie kerncomponenten:

- **PortlinQ-ASR** (Associatieregister): beheert participants (schepen, schippers, exploitanten) en hun onderlinge relaties
- **PortlinQ-AR** (Authorization Registry): beheert autorisatie-policies en evalueert toegangsbeslissingen
- **PortlinQ-IDP** (Identity Provider): identificeert schepen. Het voornemen is om in de toekomst meerdere Identity Providers te ondersteunen, waaronder een scheepsregister voor de identificatie van schepen.

Havenbedrijven behouden volledige controle over hun data, schippers kiezen hun eigen app, en platform-aanbieders krijgen via één gestandaardiseerde integratie toegang tot meerdere havens.

Zie [Architectuur](architectuur.md) voor de technische details.

## Deelnemers, personas en rollen

PortlinQ brengt verschillende stakeholders samen. In de technische gidsen gebruiken we de standaard dataspace-personas (Alice/Bob/Charlie/David); hieronder de vertaling naar de PortlinQ-rollen:

| Persona | PortlinQ-rol | Toelichting |
|---------|--------------|-------------|
| **Alice** | Eindgebruiker | Een gebruiker die met een app naar keuze diensten afneemt van dienstaanbieders; in dit voorbeeld een schipper |
| **Bob** | Data-rechthebbende | Heeft zeggenschap over de data of dienst en verleent toegang; in dit voorbeeld een havenbedrijf |
| **Charlie** | Dienstaanbieder (data service provider) | Levert diensten zoals walstroom, havengeld en geofence — door partijen als Connect4Shore en Easy2Pay |
| **David** | Applicatie (data service consumer) | De app die namens de eindgebruiker diensten aanvraagt |

## Identifiers

Organisaties worden geïdentificeerd via de NoodleBar-standaard EUID:

| Type | Formaat | Voorbeeld |
|------|---------|-----------|
| Organisatie | `NLNHR.{kvkNummer}` | `NLNHR.11223344` |

Schepen worden in de flows wel aangeduid, maar (nog) niet als zelfstandige identifier vastgelegd.

> 🔧 **Nog te verfijnen — schepen.** Voor nu geven we een **schip-token** uit op basis van de KvK (EUID) van de organisatie die het schip bezit. Hoe we schepen zelf als identifier gaan vastleggen, moet nog verder worden uitgewerkt.

## Use Cases

PortlinQ ondersteunt twee primaire flow-types. Beide bouwen voort op de generieke onboarding-, consumer- en provider-stappen (zie hieronder):

### 1. Walstroom

Schippers kunnen authenticeren via hun applicatie, zodat ze met hun schip straks diensten kunnen gebruiken in havens.

- [→ Walstroom Toegangsflow](walstroom-toegang.md)

### 2. Geofence Arrival en Departure Flow

Schippers kunnen via hun app, namens het schip, een haven binnenvaren en de haven toestemming geven om het arrival- en departure-event bij het binnenvaren en verlaten van de haven te ontvangen.

- [→ Geofence Arrival en Departure Flow](geofence-arrival.md)

## Toegang en omgeving

De PortlinQ-infrastructuur is bereikbaar via:

- **Preview:** https://portlinq-preview.poort8.nl/ (huidige living lab-fase)
- **Productie:** https://portlinq.poort8.nl/ _(TBD — beschikbaar na productie-deployment)_

## Aan de slag

| Wat je nodig hebt | Waar je het vindt |
|-------------------|-------------------|
| **Architectuur begrijpen** | [Architectuur](architectuur.md) |
| **Organisatie registreren** | [Organisatie Registratie](onboarding.md) |
| **Self-Service Portal gebruiken** | [Self-Service Portal](self-service-portal.md) |
| **API-toegang aanvragen (consumer)** | [API-toegang aanvragen](api-toegang-aanvragen.md) |
| **Diensten ontdekken op tag (consumer)** | [Tags bekijken en filteren](tags-bekijken-consumer.md) |
| **Tokens valideren (provider)** | [Tokens valideren](access-tokens-valideren.md) |
| **Autorisatie valideren (provider)** | [Autorisatie valideren](autorisatie.md) |
| **Walstroom implementeren** | [Walstroom Toegangsflow](walstroom-toegang.md) |
| **Geofence implementeren** | [Geofence Arrival Flow](geofence-arrival.md) |
| **API referentie** | [PortlinQ API docs ➚](https://portlinq-preview.poort8.nl/scalar/v1) |
| **Toegang goedkeuren (generiek)** | [Keyper ➚](../keyper/) |
| **Datastelsel-context** | [Poort8-overzicht](/) |
| **NoodleBar-concepten** | [NoodleBar documentatie](../noodlebar/) |

## Meer informatie

PortlinQ laat zien dat federatieve dataspace-architectuur praktisch toepasbaar is in de binnenvaart, met:

- **Sterke authenticatie**: OIDC-based schipper-authenticatie via PortlinQ-IDP
- **Participant management**: ASR beheert schepen, schippers, exploitanten en hun relaties
- **Fijnmazige autorisatie**: AR ondersteunt consent-policies, contracten en access grants
- **Data-soevereiniteit**: havenbedrijven behouden volledige controle
- **App-keuzevrijheid**: schippers kiezen hun eigen platform-aanbieder
- **Privacy**: consent-based automation zonder het delen van ruwe locatiedata

Voor technische details over de Authorization Registry en federatief datadelen, zie de [NoodleBar documentatie](../noodlebar/).

Vragen? Neem contact op met Poort8 via **hello@poort8.nl**.