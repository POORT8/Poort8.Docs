# Authenticatie in een dataspace

In een dataspace haalt de gebruiker zelden zelf data op. Meestal doet een applicatie dat namens haar. Dat klinkt als een detail, maar het is een van de moeilijkste vragen in het hele ontwerp: **de partij die de data levert moet weten namens wíé de applicatie aanklopt — en moet dat kunnen controleren zonder de applicatie op haar woord te geloven.**

Deze pagina legt uit welke vormen daarvoor bestaan, wat elke vorm bewijst en wat hij kost. Er staat geen aanbeveling in: welke vorm het beste past, hangt af van het deelnemersveld, de gemaakte afspraken en het risico dat een dataspace bereid is te nemen.

## Wie er in het spel zijn

Zeven rollen, die we bij hun functie noemen:

- **de gebruiker** — een medewerker bij een deelnemende organisatie
- **de organisatie van de gebruiker** — haar werkgever, zelf ook deelnemer aan de dataspace
- **de applicatie** — het systeem dat de gebruiker daarvoor gebruikt
- **de applicatieleverancier** — het bedrijf achter die applicatie, zelf deelnemer aan de dataspace
- **de data-aanbieder** — de partij die data ontsluit via een API; elders ook dienstverlener of service provider genoemd
- **de rechthebbende** — de partij die zeggenschap heeft over die data
- **de dataspace-beheerder** — degene die de spelregels vaststelt

De kern van de situatie: de gebruiker logt in bij de applicatie, de applicatie haalt data op bij de aanbieder, en **de aanbieder ziet de applicatie, niet de gebruiker.** Dat is het hele probleem.

## Wat de data-aanbieder moet weten

Voordat de aanbieder data teruggeeft, moet hij vijf dingen zeker weten:

| | De vraag | Hoe we hem hierna noemen |
|---|---|---|
| 1 | Is dit echt de applicatie die zij zegt te zijn? | *wie is de applicatie?* |
| 2 | Is dit echt deze gebruiker, van deze organisatie? | *wie is de gebruiker?* |
| 3 | Mag déze gebruiker namens die organisatie iets toestaan? | *mag zij namens haar organisatie?* |
| 4 | Heeft die gebruiker de applicatie toestemming gegeven — en geldt die nog? | *heeft zij toestemming gegeven?* |
| 5 | Mag die organisatie überhaupt bij deze data? | *mag haar organisatie bij deze data?* |

De eerste twee gaan over authenticatie: is iedereen wie hij zegt te zijn. De laatste drie gaan over autorisatie: mag het.

Dit is geen stappenplan dat bij het aansluiten één keer wordt doorlopen. Het zijn vijf voorwaarden die bij élk verzoek opnieuw gelden — een antwoord dat vorige maand klopte, hoeft vandaag niet meer te kloppen.

*Wie is de applicatie?* en *mag haar organisatie bij deze data?* hebben een gevestigd antwoord — respectievelijk clientauthenticatie en een autorisatieregister — mits de dataspace die voorzieningen heeft en toetst wie zij toelaat. Deze pagina beschouwt ze als gegeven.

Bij *mag zij namens haar organisatie?* is een waarschuwing op zijn plaats. In vrijwel elke praktijkoplossing is het antwoord een aanname: wie kan inloggen namens een organisatie, mag ook namens die organisatie iets toestaan. Voor veel toepassingen is dat prima. Voor toepassingen met financiële of juridische gevolgen niet, en dan is er een bron nodig die bevoegdheid vastlegt in plaats van afleidt. Het is het verschil tussen "werkt bij" en "mag namens".

In Nederland is eHerkenning het middel dat hiervoor het vaakst wordt ingezet. De waarde ervan zit niet in het inloggen zelf maar in het machtigingenregister erachter: daarin staat vastgelegd wie namens een organisatie wat mag, onafhankelijk van wie er toevallig een account heeft. Dat is een ander soort uitspraak dan "deze persoon kon inloggen bij die organisatie". Wel met twee kanttekeningen: zo'n machtiging bestaat altijd ten aanzien van een specifieke, geregistreerde dienst — je kunt het register niet los bevragen als algemene bron van bevoegdheid — en een organisatie die geen machtigingen heeft ingericht, valt in de praktijk terug op het middel van haar wettelijke vertegenwoordiger.

Let op het woord *machtiging*: in afsprakenstelsels betekent het meestal precies dit, een vastgelegde bevoegdheid om namens een organisatie te handelen. Dat is dus vraag 3, niet vraag 4. De toestemming die een gebruiker aan een applicatie geeft, is iets anders.

Deze pagina gaat over de tweede vraag: *wie is de gebruiker?* Waar de toestemming van die gebruiker wordt vastgelegd, hoe zichtbaar zij is voor de aanbieder en wie haar kan intrekken, is een onderwerp op zichzelf — belangrijk, maar niet dit.

## Waarom dit niet in de registers past

Dataspaces zijn gebouwd op registers, en registers kennen organisaties. Een deelnemersregister zegt: "dit is organisatie X". Een autorisatieregister zegt: "organisatie X mag bij de data van organisatie Y". Beide uitspraken gaan over rechtspersonen.

Zulke registers kunnen best fijnmazig zijn: ketens van machtigingen, met een scope en een geldigheidsduur, zijn in verschillende afsprakenstelsels uitgewerkt. Wat ze niet kunnen, is vaststellen wie er op het moment van het verzoek achter de knop zit.

Hier zit de kern van het probleem: **in veel gevallen is de applicatie van een andere organisatie dan de gebruiker.** De applicatieleverancier is zelf deelnemer aan de dataspace en klopt met zijn eigen identiteit aan bij de aanbieder — maar hij haalt data op voor de organisatie van de gebruiker. Er zijn dus drie partijen in het spel: de leverancier, de organisatie van de gebruiker en de gebruiker die het feitelijk doet. De registers kunnen er twee benoemen.

Bouwt en beheert een organisatie de applicatie zelf, dan valt de leverancier als aparte partij weg en verdampt het probleem grotendeels. Haar eigen systeem klopt met haar eigen deelnemersidentiteit aan bij de aanbieder — een machine-inlog volstaat dan, en welke vorm daarvan precies hangt af van wat het stelsel eist — en wie er binnen die organisatie op de knop drukt, regelt de organisatie met haar eigen inlog. Voor de aanbieder is dat interne huishouding: de organisatie die om de data vraagt is dezelfde als de organisatie die er recht op heeft.

Daarmee is het onderliggende principe scherp te stellen: **de gebruiker wordt pas de zaak van de aanbieder zodra er een derde partij tussen zit.** De vraag naar de persoon verdwijnt niet, hij verhuist — de organisatie moet zelf nog kunnen zien wie wat deed, en een aanbieder of rechthebbende kan alsnog eisen dat het verzoek de persoon meedraagt, bijvoorbeeld omdat alleen medewerkers met een bepaalde rol bij die data mogen. Maar standaard is het de huishouding van de organisatie zelf.

En de gebruiker is geen rechtspersoon. Er is in de registers geen plek voor de uitspraak "dit is deze medewerker, zij werkt bij organisatie X, en zij heeft hier zojuist toestemming voor gegeven". De gebruikelijke oplossing is dan om het te regelen op het niveau dat de registers wél aankunnen: er wordt vastgelegd dat deze leverancier namens organisatie X data mag ophalen. Dat werkt, en het is de praktijk die wij in dataspaces het vaakst tegenkomen. Maar daarmee heeft iedereen die bij X met die applicatie werkt toegang, kan de aanbieder niet zien wie dat was, en kan de gebruiker zelf niets intrekken. Wat *wie is de gebruiker?* en *heeft zij toestemming gegeven?* zouden opleveren, valt dus weg.

Dat registers alleen organisaties kennen is overigens niet louter een tekortkoming. Eén vast kenmerk waarmee een persoon door het hele stelsel heen te herkennen is, maakt het mogelijk om haar gedrag over alle diensten te volgen; er is een reden dat stelsels daar terughoudend in zijn.

Dat is oplosbaar zonder de vraag op te geven, want de aanbieder hoeft niet te weten hoe de gebruiker heet. Hij heeft nodig: dat het steeds dezelfde persoon is, bij welke organisatie zij hoort, hoe zij zich heeft aangemeld en wanneer. Dat kan met een verwijzing die voor die ene aanbieder stabiel is maar voor elke andere aanbieder anders luidt — dan kunnen twee aanbieders hun waarnemingen niet aan elkaar koppelen, en blijft precies genoeg over om de vraag te beantwoorden.

De rest van deze pagina gaat over het geval dat er wél een partij tussen zit.

## Wat er tussen de gebruiker en de data-aanbieder in moet

De aanbieder ziet de gebruiker niet. Hij ziet een verzoek binnenkomen van een applicatie. Om te weten wie er achter dat verzoek zit, moet een partij die dat wél weet het vastleggen in een verklaring die met het verzoek meereist — ondertekend, zodat de aanbieder kan vaststellen dat er onderweg niets aan veranderd is, en met een houdbaarheidsdatum, zodat hij weet dat het geen bewijsstuk van vorig jaar is.

Zo'n verklaring bevat doorgaans: om wie het gaat, bij welke organisatie zij hoort, hoe zij zich heeft aangemeld, wanneer dat was en voor wie de verklaring bedoeld is.

Eén ding dat deze pagina laat liggen: veel dataverkeer gebeurt zonder dat er iemand is ingelogd — nachtelijke synchronisaties, batchverwerking, een applicatie die op de achtergrond bijwerkt. Dan moet een verklaring langer meelopen dan één sessie, en dat is bij elke vorm een aparte ontwerpvraag met eigen risico's. Hieronder gaat het over het moment dat er wél iemand achter het verzoek zit.

Daarmee komt alles neer op één vraag:

> **Wie geeft die verklaring af, en waarom zou de data-aanbieder die partij geloven?**

Daar bestaan vijf antwoorden op. Alle vijf komen in de praktijk voor en alle vijf werken — ze verschillen in wie het werk doet, wat er te controleren valt en wat er gebeurt als er iets misgaat.

## De vijf vormen

### 1. De applicatie staat ervoor in

De applicatie weet wie er bij haar is ingelogd en zegt dat tegen de aanbieder: "dit verzoek is voor organisatie X." De aanbieder gelooft dat, omdat de leverancier is toegelaten tot de dataspace en zich contractueel heeft verbonden aan de afspraken die daarbij horen.

Dit is het model dat wij in de praktijk het vaakst tegenkomen, en het werkt: het is goedkoop, het vraagt niets van de gebruiker en niets van haar werkgever. Alleen: wat de aanbieder hier vertrouwt is geen controleerbare uitspraak maar een afspraak. Blijkt achteraf dat er data is opgehaald voor een klant die daar niet om had gevraagd, dan is dat een kwestie van aansprakelijkheid, niet iets wat de aanbieder op het moment zelf had kunnen zien.

Een variant die veel voorkomt, gaat nog een stap verder. Daarbij is vooraf vastgelegd namens wélke organisaties de applicatie mag optreden, en zegt de applicatie bij een verzoek helemaal niets meer over de gebruiker. De aanbieder controleert dan dat het echt die applicatie is en dat de opgegeven organisatie op de lijst staat. In de praktijk heet dat whitelisting, en het verklaart waarom het aansluiten van een nieuwe klant vaak een beheerhandeling bij de aanbieder is in plaats van iets wat die klant zelf regelt.

### 2. De aanbieder laat de gebruiker bij zichzelf inloggen

De aanbieder geeft de gebruiker een eigen account en laat haar daar aangeven dat de applicatie namens haar mag optreden. Nu hoeft de aanbieder niemand te geloven: hij heeft het zelf vastgesteld.

Tussen twee partijen is dit uitstekend. Het probleem ontstaat zodra er een derde bijkomt: neemt zij ook data af bij een tweede aanbieder, dan krijgt zij daar weer een account en moet de applicatie daar opnieuw worden aangemeld. Elke combinatie van applicatie en aanbieder kost apart werk. Dat is geen stelsel, dat zijn losse afspraken die naast elkaar bestaan.

### 3. De aanbieder vertrouwt de identiteitssystemen van de deelnemers rechtstreeks

Vrijwel elke organisatie heeft al een systeem waarmee haar medewerkers inloggen — hetzelfde systeem waarmee ze bij hun mail komen. In deze vorm gebruikt zij dat gewone werkaccount; haar eigen organisatie geeft de verklaring af die de aanbieder controleert.

Dat is aantrekkelijk: geen nieuw account, geen nieuw wachtwoord, en gaat zij uit dienst, dan verliest zij haar toegang zodra haar werkaccount wordt uitgezet. Let op het woord "zodra": een al afgegeven verklaring en een lopende sessie werken door tot hun houdbaarheidsdatum, dus vanzelf is niet onmiddellijk.

De prijs zit in de bedrading, en die ligt bij de aanbieder. Hij moet elk van die systemen kennen, hun sleutels blijven volgen wanneer die vernieuwd worden en per systeem afspreken hoe hij de inhoud van hun verklaringen leest. Bovendien moet elk systeem verklaringen kunnen afgeven die specifiek voor die ene aanbieder bedoeld zijn. Bij twee deelnemers en één aanbieder valt dat mee. Bij dertig deelnemers en vijf aanbieders niet.

### 4. Er komt één punt tussen

Dezelfde gedachte, maar met een tussenstation. De gebruiker logt nog steeds in met haar eigen werkaccount, alleen loopt dat via één voorziening van de dataspace. Die voorziening kent de identiteitssystemen van alle deelnemers en geeft zelf de verklaring af die de aanbieder ontvangt.

De aanbieder hoeft er nu nog maar één te vertrouwen, en een deelnemer die zich aansluit doet dat één keer in plaats van per aanbieder. Daar staat tegenover dat die voorziening verklaringen kan afgeven over iedereen in de dataspace — wat haar waardevol maakt voor wie haar zou willen misbruiken — en dat zij continu moet draaien. Iemand moet haar beheren en betalen.

### 5. Je leunt op een ander stelsel

Soms is de organisatie al aangesloten bij een ander verband: een branchevereniging, een samenwerkingsverband, een sectorstelsel met een eigen identiteitsvoorziening. Dan kan die bestaande identiteit worden hergebruikt in plaats van er een nieuwe naast te zetten.

Voor de gebruiker en haar werkgever is dit de goedkoopste variant die er is — er verandert niets. Het echte werk zit ergens anders: twee stelsels moeten elkaar erkennen, en dat is een bestuurlijk traject. Bovendien neem je over wat het andere stelsel doet: zijn eisen aan deelnemers, zijn beveiliging, zijn zwakste schakel.

## Wat je hierin ziet terugkomen

Wie deze vijf naast elkaar legt, ziet dat ze op twee punten van elkaar afwijken. Die twee staan los van elkaar, en ze door elkaar halen is de belangrijkste bron van verwarring in dit onderwerp.

### Verschil 1: wie de verklaring ondertekent

Vorm 3 en 4 laten de gebruiker allebei inloggen met haar eigen werkaccount. Voor haar voelen ze identiek. Toch zijn het heel verschillende stelsels, en het verschil zit in wie er ondertekent en hoeveel vertrouwensrelaties daardoor moeten bestaan.

Bij drie deelnemers en drie aanbieders is dat negen verbindingen tegenover zes. Bij dertig deelnemers en vijf aanbieders is het honderdvijftig tegenover vijfendertig. Elke verbinding is iets dat iemand inricht, test en onderhoudt — en dat stukloopt als er aan één kant iets verandert.

Dat verschil bepaalt wie het werk doet, wat er misgaat als er iets uitvalt, en welke partij verklaringen kan afgeven die zij eigenlijk niet zou moeten kunnen afgeven.

Beide vormen leunen op een lijst die de dataspace-beheerder bijhoudt, en dat roept de vraag op of dit dan niet gewoon whitelisting is. Het verschil zit in wát erop staat. Bij whitelisting staan de partijen die toegang krijgen, en daarmee is de vraag beantwoord. Hier staan de partijen wier verklaringen je gelooft, en elke verklaring is per verzoek nog te toetsen: over wie gaat het, wanneer is zij ingelogd, geldt haar toestemming nog. De eerste lijst vervangt de controle, de tweede maakt hem mogelijk.

### Verschil 2: waarmee je bewijst waar iemand werkt

Dit verschil komt pas in beeld bij vorm 3, 4 en 5, en het wordt vaak overgeslagen: waaróm gelooft die identiteitsbron dat de gebruiker bij die organisatie hoort?

Dat kan op verschillende manieren, met verschillende zekerheid. Beheer van een mailbox op het domein van de organisatie is een breed beschikbaar bewijs: vrijwel elke organisatie heeft het. Het is ook een zwak bewijs, want gedeelde postbussen, aliassen en accounts van ingehuurde externen zitten op datzelfde domein, en bij vertrek wordt een mailbox vaak overgezet naar een collega in plaats van opgeheven — dan verdwijnt het bewijs niet, het verhuist. Inloggen via het identiteitssysteem van de organisatie zelf is sterker. Een middel met een machtigingenregister erachter is het sterkst, en het enige dat ook *mag zij namens haar organisatie?* beantwoordt.

Twee dingen die vaak op één hoop gaan en die je uit elkaar moet houden: hoe zeker de *binding* met de organisatie is, en hoe sterk het *inlogmiddel* is. Een organisatie kan een uitstekend inlogmiddel hebben en tegelijk nauwelijks controleren aan wie zij een account geeft. Delegeer je die binding aan de organisatie, dan weet je niet hoe zij dat doet. Dat is geen bezwaar, maar het moet een bewuste keuze zijn en terug te vinden zijn in wat de aanbieder ontvangt.

Een bron die in Nederland snel in beeld komt is een register. Zulke registers zijn gezaghebbend over precies wat zij registreren, en niet meer: het handelsregister over rechtspersonen, hun wettelijke vertegenwoordigers en ingeschreven volmachten; een schepen- of voertuigregister over eigendom of houderschap. Dat is niet hetzelfde als dagelijkse bevoegdheid, en het zegt niets over wie er nú aanklopt. Wie een register als bewijs wil gebruiken, moet dus apart oplossen hoe de ingelogde persoon aan de registratie wordt gekoppeld.

Hetzelfde stelsel kan meerdere van deze bewijzen naast elkaar accepteren, met per dataproduct een ondergrens. In de praktijk is dat vaak waar het op uitdraait: één structuur, meerdere bindingen.

## Op één rij

| Vorm | De aanbieder vertrouwt | Wat de applicatieleverancier bouwt | Wat de organisatie van de gebruiker doet | Waar het schuurt |
|---|---|---|---|---|
| **1. De applicatie staat ervoor in** | de applicatie, en de afspraken daarachter | een eigen inlog en een administratie van welke gebruiker bij welke klant hoort | aanleveren van gegevens voor de aanmelding bij elke aanbieder | de aanbieder kan de uitspraak niet controleren; zicht en intrekken hangen af van wat de applicatie bijhoudt |
| **2. De aanbieder authenticeert zelf** | zichzelf | per aanbieder een aparte inlogkoppeling en aanmelding | haar mensen laten registreren bij elke aanbieder afzonderlijk | schaalt niet over aanbieders; de gebruiker krijgt overal een apart account |
| **3. Directe federatie** | elke goedgekeurde identiteitsbron afzonderlijk | een inlogkoppeling per identiteitsbron, plus bijhouden welke bron bij welke klant hoort | haar identiteitssysteem koppelen aan elke aanbieder waar haar mensen data afnemen, en die koppelingen onderhouden | elke nieuwe bron of aanbieder raakt alle andere; sleutelbeheer per bron |
| **4. Federatiehub** | één uitgever | één inlogkoppeling, ongeacht het aantal deelnemers en aanbieders | eenmalig haar identiteitssysteem aan het centrale punt koppelen, en dat blijven onderhouden | dat punt kan verklaringen afgeven over iedereen en is een aantrekkelijk doelwit; het moet continu draaien en beheerd worden |
| **5. Federatie tussen stelsels** | het eigen stelsel plus de erkenning van het andere | één koppeling naar dat stelsel, plus wat dat stelsel van aangesloten applicaties eist | niets extra, mits zij al deelnemer van dat stelsel is | je erft het beleid en de zwakste schakel van dat stelsel; de erkenning zelf is bestuurlijk werk |

## Waar dit heen beweegt

Er is een richting waarin de verklaring niet meer van een centrale partij komt maar van de gebruiker zelf: zij bewaart verklaringen over zichzelf en toont die aan wie erom vraagt. Europese wetgeving rond digitale identiteitswallets duwt daar hard op.

Eén ding verandert daarbij niet: het vertrouwensprobleem verhuist, het verdwijnt niet. In plaats van "vertrouw ik deze identiteitsbron op het moment van inloggen" wordt het "vertrouw ik de partij die deze verklaring heeft uitgegeven, en mag deze aanbieder ernaar vragen". Er blijven registers van erkende uitgevers en erkende afnemers nodig; ze zitten alleen op een ander punt in de tijd.

En er blijft een vraag over die een dataspace zelf moet beantwoorden: een wallet gaat over een persoon, terwijl een aanbieder ook wil weten bij welke organisatie zij hoort en wat zij namens die organisatie mag. Daarvoor zijn aanvullende verklaringen nodig van een partij die dat kan weten. Zodra dat beeld is uitgekristalliseerd, past deze aanpak als een extra vorm naast de bestaande — de vijf hierboven verdwijnen er niet door.

## Waar dit op aansluit

De vormen op deze pagina zijn geen uitvinding van ons. Vorm 3 en 4 zijn beide standaardpatronen in de OAuth- en OpenID Connect-familie en hebben in de SAML-wereld hun eigen equivalenten. Wie verder wil schalen dan een handmatig beheerde lijst, komt terecht bij federatiestandaarden: sommige verspreiden gezamenlijk beheerde metadata over alle deelnemers, andere leiden vertrouwen af uit een gedeeld vertrouwensanker. Het onderwijs- en onderzoeksveld werkt al decennia met dit soort constructies.

Eén nuance bij de Europese betrouwbaarheidsniveaus, omdat die vaak als antwoord op alles worden genoemd: zij geven een maat voor de sterkte van de identiteitsvaststelling en van het inlogmiddel, niet voor bevoegdheid. Die laatste komt uit een register of een machtiging. De nationale middelen die op die niveaus gebaseerd zijn, combineren beide — en dat is precies waarom ze in Verschil 2 bovenaan staan.

Wat wij toevoegen is geen nieuw protocol, maar de vergelijking: wat elke vorm oplevert, wat hij kost en wat er misgaat als één schakel het laat afweten.
