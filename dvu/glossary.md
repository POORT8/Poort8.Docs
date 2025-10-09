# Woordenlijst

Deze pagina definieert kernbegrippen en afkortingen die in de DVU-documentatie worden gebruikt.

## Kernconcepten

**DVU (Datastelsel Verduurzaming Utiliteit)**

Een datastelsel voor het beheren van gecontroleerde, transparante en herleidbare toegang tot energiedata van gebouwen. DVU standaardiseert toestemmingen, dataformaten en leveringsmechanismen voor toegang tot energiedata.

**Keyper**

Poort8's API-first goedkeuringssysteem. Keyper beheert toestemmings- en autorisatiestromen tussen aanvragers en goedkeurders, en regelt goedkeuringslinks, en authenticatie.

**SDS (Smart Data Solutions)**

Het platform dat daadwerkelijke energiedata levert. SDS is de dataprovider die integreert met DVU om meteropnames en verbruiksgegevens te leveren.

## Gebouw- & Energie-identificaties

**VBO (Verblijfsobject)**

Een gebouw- of wooneenheid-identificatie die in Nederland wordt gebruikt. VBO-codes identificeren uniek panden in het landelijk gebouwenregister (BAG - Basisregistratie Adressen en Gebouwen).

**EAN (European Article Number)**

In de energiecontext een 18-cijferige code die een energiemeteraansluiting uniek identificeert. Niet te verwarren met productbarcodes - energie-EAN-codes identificeren specifieke elektriciteits- of gasaansluitingen.

Voorbeeld: `0613010000206776`

**CAR (Centraal Aansluitingen Register)**

Centraal Aansluitingenregister beheerd door EDSN (Energie Data Services Nederland). Bevat informatie over energieaansluitingen, inclusief marktsegmentclassificatie en metergegevens.

## Dataformaten & Producten

**P4 Format**

Een gestandaardiseerd formaat voor meteropnamelevering gebruikt in de Nederlandse energiemarkt. P4 biedt gestructureerde meteropnames inclusief tijdstempels, verbruikswaarden en metadata.

**Dagstanden (Daily Readings)**

Dagelijkse meteropnames die het energieverbruik per dag tonen. Onderdeel van de dataproducten beschikbaar via DVU.

## Authenticatie & Autorisatie

**iSHARE**

Een Europees raamwerk voor het delen van data tussen organisaties. iSHARE biedt:
- Identiteitsverificatie
- Vertrouwenskader
- Autorisatieprotocollen
- Gestandaardiseerde data-uitwisselingsmechanismen

Website: [ishare.eu](https://ishare.eu/)  
Developer Portal: [dev.ishare.eu](https://dev.ishare.eu/)

**EORI (Economic Operators Registration and Identification)**

Een unieke identificatie voor bedrijven in de EU, gebruikt door iSHARE voor organisatie-identificatie. 

Formaat: `EU.EORI.NL` gevolgd door 9 cijfers  
Voorbeeld: `EU.EORI.NL860730499`

Hoe te verkrijgen: Via het iSHARE-registratieproces of nationale douaneautoriteiten.

**eHerkenning**

Het authenticatiesysteem van de Nederlandse overheid voor bedrijven. DVU gebruikt eHerkenning Level 3 (hoge betrouwbaarheid) voor het goedkeuren van toegangsverzoeken tot energiedata.

**eSeal**

Een elektronisch zegel onder eIDAS (European electronic identification and trust services). Wordt gebruikt voor machine-to-machine (M2M) authenticatie en biedt digitale identiteit voor geautomatiseerde systemen.

**X.509 Certificate**

Een standaard voor digitale certificaten gebruikt voor cryptografische authenticatie. In DVU/iSHARE-context bevatten X.509-certificaten:
- De publieke sleutel van uw organisatie
- Organisatie-identificatie (EORI)
- Digitale handtekening van een vertrouwde autoriteit

## Rollen & Partijen

**Rechthebbende (Rights Holder)**

De organisatie of persoon met wettelijke rechten op de data. In DVU-context doorgaans de energiecontractant of gebouweigenaar die toegang tot energieverbruiksgegevens beheert.

**Dataservice Consumer**

Een applicatie of organisatie die toegang tot data aanvraagt. De consumer initieert goedkeuringsverzoeken en haalt data op zodra toestemming is verleend.

**Dataservice Provider (Datadienstaanbieder)**

Een organisatie die datadiensten levert, doorgaans het platform waarop data wordt benaderd (bijv. SDS).

**Energiecontractant (Energy Contractor)**

De juridische partij die een contract heeft met de energieleverancier. Deze partij beheert de toegang tot energieverbruiksgegevens voor hun gebouwen.

**Gebouwbeheerder (Building Manager)**

Persoon of organisatie verantwoordelijk voor het beheren van gebouwen en hun operaties, vaak de eindgebruiker van energiedata-inzichten.

## Technische Termen

**Approval Link**

Een unieke URL gegenereerd door Keyper die leidt naar een goedkeuringsworkflow. De goedkeurder gebruikt deze link om gevraagde transacties te beoordelen en autoriseren.

**Policy**

Een autorisatieregel die definieert wie toegang heeft tot welke resources onder welke voorwaarden. In DVU verlenen policies dataservice consumers toegang tot specifieke EAN-codes.

**Resource Group**

Een logische groepering van resources (bijv. een VBO met meerdere EAN-codes). Wordt gebruikt om gerelateerde energieaansluitingen te organiseren.

**Client Assertion JWT**

Een JSON Web Token met organisatiecredentials, ondertekend met een private key. Wordt gebruikt om iSHARE access tokens te verkrijgen voor API-authenticatie.

## Markttermen

**Kleinverbruik (Small-scale Consumption)**

Energieaansluitingen met lagere verbruiksniveaus, doorgaans woningen en kleine commerciële gebouwen. Er gelden andere dataproducten en processen dan voor grootverbruik.

**Grootverbruik (Large-scale Consumption)**

Energieaansluitingen met hogere verbruiksniveaus, doorgaans industriële en grote commerciële panden. Vereist aanvullende contractantinformatie en kan verschillende meetbedrijven betreffen.

**Meetbedrijf (Metering Company)**

Bedrijf verantwoordelijk voor het onderhouden en uitlezen van energiemeters, met name voor grootverbruiksaansluitingen.

## Afkortingen Snelle Referentie

| Afkorting | Volledige Naam | Context |
|---------|-----------|---------|
| AR | Autorisatieregister | Autorisatieregister |
| BAG | Basisregistratie Adressen en Gebouwen | Landelijk gebouwenregister |
| CAR | Centraal Aansluitingen Register | Centraal Aansluitingenregister |
| DVU | Datastelsel Verduurzaming Utiliteit | Datastelsel voor verduurzaming |
| EAN | European Article Number | Energiemeter-identificatie |
| EDSN | Energie Data Services Nederland | Energie Data Services Nederland |
| EORI | Economic Operators Registration ID | EU bedrijfsidentificatie |
| H2M | Human-to-Machine | Persoon interactie met systeem |
| M2M | Machine-to-Machine | Geautomatiseerd systeem-naar-systeem |
| RVO | Rijksdienst voor Ondernemend Nederland | Rijksdienst voor Ondernemend Nederland |
| SDS | Smart Data Solutions | Energiedataprovider |
| VBO | Verblijfsobject | Gebouw-identificatie |

## Gerelateerde Documentatie

- **iSHARE Documentatie**: [dev.ishare.eu](https://dev.ishare.eu/)
- **eHerkenning**: [eherkenning.nl](https://www.eherkenning.nl/)
- **EDSN CAR**: Neem contact op met EDSN voor CAR-documentatie
- **Keyper Overzicht**: [../keyper/README.md](../keyper/README.md)

## Feedback

Mist u een term? Fout gevonden? Laat het ons weten zodat we deze woordenlijst kunnen verbeteren.

---

*Laatst bijgewerkt: 2025*