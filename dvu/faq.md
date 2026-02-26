# Veelgestelde Vragen (FAQ)

## Algemene Vragen

### Wat is DVU en hoe werkt het?

DVU (Datastelsel Verduurzaming Utiliteit) is een datastelsel waarmee gebouweigenaren toegang tot energiedata op een gecontroleerde en herleidbare manier kunnen beheren. Het verbindt drie hoofdcomponenten:

- **DVU**: De governancelaag die toestemmingen en metadata beheert
- **Keyper**: Het goedkeuringssysteem dat toestemmingsworkflows afhandelt
- **SDS (Smart Data Solutions)**: Het platform dat daadwerkelijke energiedata levert

Denk eraan als: DVU = het regelboek, Keyper = het toestemmingssysteem, SDS = het datawarehouse.

### Moet ik met alle drie de systemen integreren?

Ja, voor een volledige integratie communiceert u met alle drie:

1. **Keyper API**: Om goedkeuringsverzoeken aan te maken
2. **DVU API**: Om VBO- en EAN-identificaties op te halen
3. **SDS API**: Om de daadwerkelijke energieverbruiksgegevens te verkrijgen

Elk systeem heeft zijn eigen authenticatievereisten (zie sectie "Authenticatie" hieronder).

### Welke integratieflow moet ik gebruiken?

DVU biedt drie hoofdflows, afhankelijk van uw use case:

| Flow | Use Case | Wanneer te Gebruiken |
|------|----------|----------------------|
| [Single Building](single-building.md) | Eén gebouw tegelijk | Gebruiker levert één adres |
| [Bulk Buildings](bulk-buildings.md) | Meerdere gebouwen | Gebruiker heeft een lijst met adressen |
| [Direct EAN](direct-ean.md) | Directe metertoegang | U heeft al VBO- en EAN-codes |

**Aanbeveling:** Begin met de Single Building flow voor de eenvoudigste implementatie.

### Is er een testomgeving?

Ja, DVU biedt een testomgeving voor ontwikkeling:

- **Keyper API**: `https://keyper-preview.poort8.nl`
- **DVU API**: `https://dvu-test.azurewebsites.net`
- **SDS API**: `https://dvu-test.smartdatasolutions.nl`

**Let op:** Testomgevingen voeren niet alle validaties uit. Gebruik ze alleen voor functioneel testen.

---

## Authenticatie & credentials

### Hoe verkrijg ik API-credentials?
Je hebt verschillende credentials nodig voor verschillende systemen:

**Voor Keyper API:**
1. Neem contact op met Poort8
2. Verstrek je organisatiegegevens en use case
3. Ontvang credentials (`client_id` en `client_secret`)

**Voor DVU/SDS APIs:**
1. Registreer als iSHARE Adhering Party
2. Verkrijg een EORI-nummer
3. Verkrijg een X.509-certificaat
4. Gebruik deze om client assertion JWTs te genereren

**Contact:** Voor Keyper-credentials, neem contact op met Poort8. Voor iSHARE-registratie, bezoek [ishare.eu](https://ishare.eu/)

### Wat is een EORI-nummer en hoe verkrijg ik er een?
EORI (Economic Operators Registration and Identification) is een unieke identificatie voor bedrijven in de EU.

**Formaat:** `EU.EORI.NL` + 9 cijfers (bijv. `EU.EORI.NL860730499`)

**Hoe te verkrijgen:**
- Via het iSHARE-registratieproces
- Of van nationale douaneautoriteiten

### Heb ik verschillende tokens nodig voor elke API?
Ja:

| API | Authenticatie | Token Bron |
|-----|---------------|------------|
| Keyper | Bearer token | Auth0 OAuth2 (`https://poort8.eu.auth0.com/oauth/token`) |
| DVU | iSHARE token | DVU token endpoint met uw certificaat |
| SDS | iSHARE token | SDS token endpoint met uw certificaat |

### Hoe lang zijn tokens geldig?
- **Keyper token**: Controleer `expires_in` in response (meestal 24 uur)
- **iSHARE tokens**: 1 uur (3600 seconden)

>**Best practice:** Cache tokens en hergebruik tot ze verlopen. Vraag niet bij elke API-aanroep een nieuwe token aan.

### Moet ik tokens opslaan?
Ja, maar veilig:
- Cache tokens in geheugen of beveiligde opslag
- Log nooit tokens
- Ververs voor expiratie
- Commit nooit tokens naar version control

## Implementatie

### Wat zijn de vereiste velden voor een goedkeuringsverzoek?
**Minimaal vereiste data:**

**Aanvrager:**
- Naam
- E-mailadres
- Organisatienaam
- Organisatie ID (EORI-formaat)

**Goedkeurder (energiecontractant):**
- E-mailadres
- Organisatienaam
- Organisatie ID (EORI-formaat)

**Gebouw:**
- Adres (minimaal postcode + huisnummer)

**Je applicatie:**
- Referentie-ID (voor tracking)
- Je organisatie-EORI

Alle velden moeten geldig en correct geformatteerd zijn.

### Wat gebeurt er nadat ik een approval link heb aangemaakt?

1. **Keyper maakt de link aan**
2. **Goedkeuringsmail wordt verzonden** naar de goedkeurder (energiecontractant).
3. **Goedkeurder klikt op de link** en wordt doorgestuurd naar de DVU metadata-app (voor single/bulk) of direct naar Keyper Approve (voor direct EAN).
4. **Goedkeurder vult metadata in** (indien nodig) en beoordeelt het verzoek.
5. **Goedkeurder authenticeert** via email en keurt goed/af.
6. **Bij goedkeuring:** Policy wordt geregistreerd in DVU.
7. **Je kunt daarna:** VBO/EAN-data ophalen en energiedata benaderen via SDS.

### Wat als de goedkeurder mijn verzoek afwijst?
Bij afwijzing:
- De approval link-status verandert naar `Rejected`.
- Er wordt geen policy geregistreerd in DVU.
- Je krijgt geen toegang tot de energiedata.
- Je moet een nieuw goedkeuringsverzoek aanmaken als je het opnieuw wilt proberen, of contact opnemen met de goedkeurende partij als je denkt dat er iets mis is.

>**Let op:** Momenteel is er geen webhook-notificatie voor statuswijzigingen. Je moet mogelijk de approval link-status pollen of wachten tot de goedkeurder u informeert.

### Hoe weet ik wanneer een goedkeuring is voltooid?
Momenteel heb je deze opties:

1. **Redirect URL**: Configureer een redirect URL in je goedkeuringsverzoek waar de goedkeurder naartoe wordt gestuurd na voltooiing.
2. **E-mailnotificatie**: De aanvrager ontvangt een e-mail wanneer de goedkeuring is verwerkt.
3. **Status polling**: Bevraag de Keyper API en check de status van de approval link.

### Kan ik testen zonder echte credentials?
Voor Keyper API-testen:
- Ja, neem contact op met Poort8 voor testcredentials.
- Testomgeving heeft versoepelde validatie.

Voor DVU/SDS-testen:
- Je hebt geldige iSHARE-testcredentials nodig.
- Neem contact op met iSHARE voor testcertificaten.
- Test EORI-nummers zijn beschikbaar voor geregistreerde testpartijen.

## Data Toegang
### Welke data kan ik ophalen van SDS?

**Momenteel operationeel:**
- Meterdata in P4-formaat (jaarverbruik of volledige dataset)
- RVO-benchmarkdata

**In voorbereiding:**
- 24 maanden dagstanden
- Standaard jaarverbruik (uitbreiding van P4)

>**Let op:** Beschikbare producten hangen af van het marktsegment (kleinverbruik vs grootverbruik) en de goedkeuringscope.

### In welk formaat is de energiedata?

SDS retourneert energiedata in gestructureerd JSON-formaat. Het exacte schema hangt af van het gevraagde dataproduct.

**Let op:** Volledige SDS API-documentatie wordt gefinaliseerd. Controleer [sds-data-retrieval.md](sds-data-retrieval.md) voor updates.

### Hoe ver terug is historische data beschikbaar?
Dit hangt af van:
- Het dataproduct
- Marktsegment (kleinverbruik/grootverbruik)
- Meterinstallatiedatum
- Dataretentiebeleid

**Typische bereiken:**
- Dagstanden: 24 maanden
- Jaarverbruik: Meerdere jaren
- P4-formaat: Varieert per implementatie

## Probleemoplossing

### Ik krijg een 401-error bij het aanroepen van de API
**Mogelijke oorzaken:**
1. Token is verlopen.
2. Token is ongeldig.
3. Verkeerde authenticatiemethode gebruikt (moet `Bearer` zijn).

**Oplossingen:**
- Verifieer dat de token niet is verlopen.
- Controleer dat je de juiste token gebruikt voor de juiste API (Keyper vs DVU/SDS).
- Zorg ervoor dat de Bearer token correct is geformatteerd: `Authorization: Bearer <token>`.
- Genereer een nieuwe token.

### Mijn approval link retourneert 404
**Mogelijke oorzaken:**
1. Verkeerde approval link ID.
2. Link is verlopen.
3. Verkeerde omgeving (test vs productie).
4. Link is nooit succesvol aangemaakt.

**Oplossingen:**
- Verifieer dat de approval link  ID correct is.
- Controleer dat de link creation response succesvol was.
- Zorg ervoor dat je de juiste base URL voor de omgeving gebruikt.
- Controleer de expiratie-tijd van de approval link.

### Het gebouwadres wordt niet gevonden
**Scenario:** DVU metadata-app kan het gebouw niet vinden.

**Mogelijke oorzaken:**
1. Incorrect postcode-formaat.
2. Huisnummer komt niet overeen.
3. Gebouw niet in BAG-register.
4. Onvolledig adres.

**Oplossingen:**
1. Verifieer postcode-formaat (spaties, hoofdletters).
2. Probeer verschillende adrescombinaties.
3. Gebruik de Direct EAN flow als alternatief als je VBO/EAN-codes hebt.
4. Verifieer dat het adres bestaat in het [BAG-register](https://bagviewer.kadaster.nl/).

### Ik kan geen energiedata ophalen van SDS
**Scenario:** SDS retourneert 403 Forbidden.

**Diagnostische stappen:**
1. Verifieer dat de goedkeuring succesvol is voltooid.
2. Controleer of de policy is geregistreerd in DVU (bevraag DVU API).
3. Bevestig dat je de juiste EAN-code gebruikt.
4. Verifieer dat het iSHARE-token geldig is.

**Veel voorkomende oorzaken:**
- Goedkeuring nog niet verwerkt.
- Verkeerde EAN-code.
- Policy nog niet gesynchroniseerd.
- Token verlopen of ongeldig.

### Mijn client assertion JWT wordt afgewezen
**Veel voorkomende problemen:**
1. Certificaatketen niet opgenomen in `x5c` header.
2. Verkeerde audience (`aud`) - moet overeenkomen met EORI van doelsysteem.
3. Token verlopen (`exp` moet toekomstige timestamp zijn).
4. Verkeerde handtekening (private key komt niet overeen met certificaat).
5. Certificaat niet vertrouwd door iSHARE.

**Oplossingen:**
- Verifieer dat het certificaat geldig is en niet verlopen.
- Controleer dat `aud`-veld overeenkomt met doel-EORI (DVU of SDS).
- Zorg ervoor dat `exp` 30 seconden in de toekomst ligt vanaf `iat`.
- Verifieer dat u ondertekent met de juiste private key.
- Bevestig dat het certificaat iSHARE-compliant is.

## Productie & deployment

### Hoe ga ik van test naar productie?
**Stappen:**
1. Voltooi testen in testomgeving.
2. Verkrijg productie iSHARE-certificaat (niet testcertificaat).
3. Registreer als productie iSHARE Adhering Party.
4. Update uw code om productie-endpoints te gebruiken:
   - Productie Keyper-endpoint (neem contact op met Poort8)
   - Productie DVU-endpoint
   - Productie SDS-endpoint
5. Update EORI-referenties indien verschillend van test.
6. Voer productievalidatietesten uit.

### Wat verandert er tussen test en productie?
**Endpoints:**
- Base URLs veranderen van test naar productie

**Authenticatie:**
- Productiecertificaten vereist
- Productie EORI-nummers
- Volledige validatie ingeschakeld

**Data:**
- Echte energiedata
- Echte goedkeurders
- Volledig audittrail

**Validatie:**
- Volledige organisatieverificatie
- Volledige iSHARE-compliance checks
- Strengere rate limits

### Welke monitoring moet ik implementeren?
**Aanbevolen monitoring:**

**API-gezondheid:**
- Token refresh-successpercentage
- API-responstijden
- Errorpercentages per endpoint

**Goedkeuringsworkflow:**
- Approval link creation-succes

**Data ophalen:**
- SDS data-ophaalsucces
- Data-versheid
- Ontbrekende datapunten

**Beveiliging:**
- Certificaatvervaldatums
- Mislukte authenticatiepogingen
- Ongebruikelijke toegangspatronen

## Ondersteuning

### Waar kan ik hulp krijgen?

**Voor technische vragen:**
- Raadpleeg deze FAQ en documentatie
- Voor overige vragen, [contact op met Poort8](#contact)

**Voor API-credentials:**
- **Keyper:** Neem [contact op met Poort8](#contact)
- **iSHARE:** Bezoek [ishare.eu](https://ishare.eu/)

**Voor DVU-deelnemersregistratie:**
- E-mail: BeheerDVU@rvo.nl

**Voor bugs of documentatieproblemen:**
- [Rapporteer aan Poort8](#contact)

### Hoe rapporteer ik een documentatiefout?
Als je fouten, typefouten of ontbrekende informatie vindt:
1. Noteer de specifieke pagina en sectie
2. Beschrijf het probleem of wat ontbreekt
3. Neem [contact op met Poort8](#contact)

#### Contact
Om in contact te komen met Poort8, stuur je een email naar **hello@poort8.nl**.

## Aanvullende bronnen

### Waar kan ik meer informatie vinden?

**DVU:**
- [Business context](https://www.rvo.nl/onderwerpen/verduurzaming-utiliteitsbouw/dvu)

**Gerelateerde systemen:**
- [Keyper documentatie](../keyper/README.md)
- [iSHARE developer portal](https://dev.ishare.eu/)

### Zijn er codevoorbeelden?
Codevoorbeelden zijn beschikbaar in de implementatiegidsen:
- [Single Building Access](single-building.md)
- [Bulk Building Access](bulk-buildings.md)
- [Direct EAN Access](direct-ean.md)
- [VBO/EAN Data Retrieval](vbo-ean-data-retrieval.md)
- [SDS Data Retrieval](sds-data-retrieval.md)

>**Note**: Het is aanbevolen om eerst [Geting Started](getting-started.md) door te lezen.

### Kan ik helper libraries gebruiken?
Ja, voor iSHARE-integratie:
**.NET:**
- [Poort8.iSHARE.Core NuGet package](https://github.com/POORT8/Poort8.Ishare.Core)

**Python:**
- [iSHARE Python snippets](https://github.com/iSHAREScheme/code-snippets/blob/master/Python/access_token.py)

**Andere programmeertalen:**
- Volg de [iSHARE Client Assertion spec](https://dev.ishare.eu/reference/ishare-jwt/client-assertion)

## Feedback

**Was deze FAQ behulpzaam?** Laat ons weten welke vragen we moeten toevoegen!

---

*Laatst bijgewerkt: 2025*