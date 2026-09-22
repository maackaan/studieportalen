# Utvecklingsplan för Studieportalen

## Prioritering från september 2026

1. **Skydda och kunna korrigera data** – redigering av alla grundposter samt ångra borttagning.
2. **Gör planeringen användbar varje dag** – separat uppgiftsvy med status, prioritet, uppskattad tid och vyerna Idag/Den här veckan.
3. **Skapa studiestruktur** – termin, läsår, kursmoment/lektioner och koppling mellan uppgift och resurs.
4. **För in kalenderdata** – `.ics` först, därefter publika TimeEdit-länkar och lokala påminnelser.
5. **Stabilisera datalagret** – gemensamt lagringsgränssnitt, SQLite och testad migrering.
6. **Gör appen enkel att sprida** – den portabla Windows-byggnaden är förberedd; därefter licensbeslut, ren installationskontroll, signering och versionsmärkta GitHub-releaser.
7. **Samla hela studentvardagen** – allmänna datum och resurser utan kurskoppling, resurstypen Information och en gemensam kalendersida.
8. **Förbättra vardagsflödet** – valfri kursordning, fler än fyra kurser i snabbåtkomst och fungerande officiella schemalänkar.
9. **Utöka distributionen** – separat testad och senare signerad/notariserad macOS-app; mobil/PWA är ett senare arkitekturspår.

## Version 1.1 – genomförd

- Tom start för varje ny användare
- Kursuppslag från LiU, KTH och Chalmers
- Manuellt stöd för andra universitet
- Gamla tentor, bilder, länkar och anteckningar per kurs
- Deadlines och tentamensdatum
- Lokal lagring och filförhandsvisning
- Installerbar PWA och separat Edge-appfönster
- Responsiv layout för dator och mobil

## Version 1.2 – pågående stabilisering

1. **Säkerhetskopiering – genomförd**
   - Export och import av hela profilen inklusive uppladdade filer.
   - Versionsmärkt format, validering och bekräftelse före återställning.
   - Ska användas som säkerhetsnät före framtida datamigreringar.

2. **Fler kurskataloger – Lund genomförd**
   - LU:s gemensamma kurswebb via direkt kurskodsuppslag.
   - Separat reservväg för aktuella LTH-kurser via LTH:s officiella API.
   - Behåll manuell inmatning när en offentlig källa saknas eller ligger bakom inloggning.

3. **Redigering och arkivering – grundflödet genomfört**
   - Kurser, resurser och planeringsposter kan redigeras.
   - Kurser kan arkiveras, återaktiveras och filtreras utan att materialet tas bort.
   - Borttagning av kurs, resurs och planeringspost kan ångras innan den blir permanent.
   - Gruppera kurser per termin och läsår.
   - Senare: separat papperskorg för återställning efter att den korta ångratiden löpt ut.

4. **Uppgifter och studieplanering – grundstöd genomfört**
   - Lektionsuppgifter, läsning och laborationer kan skapas, visas bland kommande aktiviteter och markeras klara.
   - Poster kan redigeras i efterhand utan att klarstatus eller skapandedatum försvinner.
   - Nästa steg är full status: att göra, pågår och klar, samt en separat uppgiftsvy.
   - Koppla varje uppgift till kurs, lektion/vecka, resurser och valfri deadline. En lektion ska kunna ha instruktion, material, egna anteckningar och flera uppgifter.
   - Prioritet, uppskattad studietid och en enkel vy för "Idag" och "Den här veckan".
   - Därefter: deluppgifter, återkommande läsning och möjlighet att skjuta upp en uppgift utan att ändra den ursprungliga deadlinehistoriken.

5. **Kalender och påminnelser**
   - Lokal import via `.ics` är genomförd med förhandsgranskning, enkel klassning av tentamen/laboration och dubblettskydd.
   - Export via `.ics` återstår.
   - Lokala påminnelser före deadline och tentamen.
   - TimeEdit-import när lärosätet erbjuder en publik kalenderlänk.
   - LiU-kurser har en direkt genväg till den offentliga TimeEdit-sökningen. Nästa steg är hämtning från en uttryckligen angiven publik prenumerationslänk, utan generell webbproxy.

6. **GitHub och delbarhet – teknisk grund genomförd**
   - Lokala loggar, processfiler, cache och exporterade säkerhetskopior undantas från versionshantering.
   - GitHub Actions kör kursadaptertesterna vid push och pull request.
   - README beskriver start på Windows, macOS, Linux och WSL samt begränsningen med GitHub Pages.
   - En GitHub-byggprocess skapar `Studieportalen.exe` med inbyggd Python och ett eget WebView2-fönster; slutanvändaren behöver inga utvecklingsverktyg.
   - Den paketerade appens personliga WebView-profil ligger utanför programmappen och ingår aldrig i releasen.
   - En automatisk releasesäkerhetskontroll kräver en tom standardprofil och inga externa resurser på startsidan.
   - En separat integritetsbeskrivning följer med Windows-paketet.
   - En versionstagg skapar automatiskt ett GitHub Release-utkast; manuella byggen stannar som testpaket i GitHub Actions.
   - Den offentliga förhandsversionen `v0.1.0-beta.2` är publicerad med direktlänk till Windows-ZIP.
   - Återstår: välj licens, kontrollera en helt ren Windows-dator och inför kodsignering för smidigare start.

7. **Allmänna datum och resurser – genomförd lokalt**
   - Planeringsposter och resurser kan sparas utan kurskoppling och visas under `Allmänt`.
   - Resurstypen `Information` stödjer bland annat labbkompendier och kursinstruktioner, med titel, beskrivning och valfri fil eller länk.
   - Allmänna poster stöds av redigering, sökning, backup och återställning. Nästa större datamigrering ska också bevara dem.

8. **Kursordning och snabbåtkomst – genomförd lokalt**
   - Översikten visar nu alla aktiva kurser, även den femte och efterföljande kurser.
   - En sparad manuell kursordning används både på kurssidan och i översikten.
   - Tillgängliga flytta upp/ned-kontroller fungerar med mus och tangentbord; drag-and-drop är inte nödvändigt.

9. **Samlad kalendersida – veckovy genomförd lokalt**
   - `Kalender` visar måndag–söndag i sju kolumner med veckonavigering, veckonummer, dagens markering och aktuell tidslinje.
   - Deadlines, föreläsningar, seminarier, lektioner, läsning, laborationer och tentamina placeras som tidsblock i ett kompakt schema från 08:00. Användaren väljer start och längd i stället för att räkna fram en sluttid.
   - Deadline föreslås bli en timme, undervisning två timmar och tentamen fyra timmar; fem timmar och andra vanliga längder finns som direkta val. Importerade avvikande längder bevaras.
   - Ett tryck på ett block öppnar en snabb informationsruta med datum, tid, kurs, anteckning, status och genväg till redigering. Smala skärmar har en egen horisontell schemarullning utan att hela sidan blir bred.
   - `.ics`-importen finns på kalendersidan med val av kurs eller `Allmänt`, förhandsgranskning, start-/sluttid och dubblettskydd.
   - Senare: sida-vid-sida-layout för samtidiga block, månadsvy samt uttryckligen angivna publika TimeEdit-prenumerationslänkar med dubblett-, ändrings- och avbokningshantering. Ingen generell proxy eller inloggningsskrapning.

10. **Schemalänkar – rättade lokalt**
   - LiU-, KTH- och Chalmers-länkarna använder lärosätenas aktuella officiella schemavägar.
   - Lund behåller den centrala TimeEdit-ingången eftersom universitetet använder flera fakultetsspecifika vyer.
   - URL-konstruktionen täcks av adaptertester. Förifylld kurskod kan läggas till senare om respektive tjänst erbjuder stabila offentliga parametrar.
   - De granskade TimeEdit-ingångarna kräver sökning eller ett sparat schemas interna länk-ID; appen gissar därför inte instabila direktadresser. Kurskoden kan kopieras med en knapp bredvid schemalänken.

11. **macOS-version – byggspår förberett lokalt**
   - Separat macOS-paketering med pywebviews rekommenderade `py2app` och ett manuellt GitHub Actions-bygge för Apple Silicon och Intel är förberedda. De skapar testartefakter men ingen automatisk release.
   - Återstår: kör byggena och verifiera dataplats, fönster, filer, backup, kursuppslag och uppdatering på riktig Mac före publik release.
   - Kodsignering och Apple-notarisation hanteras som ett separat beslut och får inte kringgås eller antas vara kostnadsfritt.

## Version 1.3 – lokal datagrund

1. **Lokal SQLite-databas**
   - Inför först ett gemensamt datalager så gränssnittet inte blir beroende av lagringsteknik.
   - Flytta kurser, resurser, uppgifter och datum från webbläsarlagring till lokal databas.
   - Behåll uppladdade filer i separat lokal datamapp och lagra endast referenser i databasen.
   - Automatisk, testad migrering av befintlig data samt möjlighet att återgå via säkerhetskopia.

2. **Skrivbordsupplevelse**
   - Paketerad installation med start/stopp, uppdatering och tydlig plats för användardata.
   - Offlineindikator, lagringsstatus och kontrollerad återhämtning om en fil saknas.
   - Automatisk kontroll av databas och backupformat vid versionsbyte.
   - En enkel integritetsvy där användaren kan se lagringsplats och radera all lokal data efter dubbel bekräftelse.

## Version 1.4 – kursinnehåll och integrationer

- Läs in offentlig kursplan, poäng, litteraturlista och relevanta kurslänkar när källan tillåter det.
- För IDA-kurser vid LiU: upptäck den separata offentliga kurshemsidan. Importera aldrig löst formulerade deadlines automatiskt utan att först visa källa, år och en förhandsgranskning.
- Förhandsvisa importerade uppgifter, moment och datum innan användaren väljer vad som ska sparas.
- Valfri, skrivskyddad Canvas/Moodle-integration för användare som uttryckligen ansluter sitt konto; ingen automatisk inloggningsskrapning.
- TimeEdit-schema, föreläsningar, seminarier och lokaler via publik länk eller `.ics`.
- Identifiera ändringar i officiell kursinformation och visa dem utan att skriva över egna anteckningar.

## Publik distribution

### Valbart alternativ: privat beta

- Skapa ett privat förråd i en GitHub-organisation och ge testare rollen **Read**.
- Publicera den första versionstaggen som en privat GitHub Release; åtkomst kräver GitHub-inloggning och godkänd inbjudan.
- Samla felrapporter utan att be användarna skicka sin lokala profil eller säkerhetskopia. Lägg till en separat, frivillig diagnostikexport som uttryckligen utesluter anteckningar och filer.
- En länk som fungerar utan inloggning är inte privat GitHub-åtkomst och ska behandlas som vidarebefordringsbar distribution.

### Första publika versionen

- Huvudspåret är nu ett offentligt GitHub-förråd med en enkel nedladdningslänk till en paketerad Windows-app. Vänner ska inte behöva Python, VS Code eller tillägg.
- Lägg till en vald open-source-licens. MIT ger bred återanvändning, medan GPL kräver att distribuerade vidareutvecklingar också förblir öppna.
- Lägg till skärmbilder, en kort integritetsförklaring och en felsökningssektion.
- Skapa en GitHub Release med versionsnummer, ändringslista och kontrollerad ZIP-fil.

### Senare distributionsspår

- **GitHub Pages:** gränssnitt och lokal data fungerar, men kursuppslag behöver flyttas från Python till en liten serverfunktion med begränsad CORS och hastighetsbegränsning.
- **Portabel skrivbordsapp – förberedd:** byggprocessen paketerar server, webbgränssnitt och Python i samma `.exe`; nästa kontroll ska göras på en ren Windows-dator.
- **Windows-installation:** bygg ett signerat installationsprogram med Start-meny, avinstallation och automatiska uppdateringar. Den portabla `.exe`-versionen ska finnas kvar som alternativ.
- **macOS-app:** bygg och testa en separat `.app`; lägg till signering och notarisation innan den beskrivs som en friktionsfri publik nedladdning.
- **Telefon/PWA:** gränssnittet är responsivt, men en full mobilversion kräver att kursuppslaget får en säker serverlösning eller annan arkitektur. Detta är större än att lägga till en GitHub-fil.
- **Självhostning:** behåll `server.py` som enkel referensserver och dokumentera port, dataplats och uppdatering.

## Version 1.5 – kunskapsverktyg

- Fler svenska universitet via separata, testbara kurskatalog-adaptrar.
- Snabbsökning i PDF-filer och anteckningar
- Taggar, favoriter, materialstatus och kopplingar mellan uppgift, lektion och resurs.
- Repetitionsplanering, egna instuderingsfrågor och markering av vad som behöver repeteras.
- Statistik som hjälper användaren planera, utan prestationsranking eller datadelning.
- Frivillig krypterad synkronisering mellan användarens egna enheter.

## Kvalitetskrav före varje större version

- Automatiserade tester för varje universitetsadapter är införda; komplettera med test för datamigrering och säkerhetskopiering.
- Tillgänglighetskontroll med tangentbord och skärmläsarvänliga etiketter.
- Kontroll av dator- och mobilläge, offlinefunktion samt gammal service-worker-cache.
- Personlig data ska aldrig skickas till en extern kurskälla; endast den kurskod användaren söker efter får användas i uppslaget.

## Arkitekturprincip

Appens programkod versionshanteras som vanliga filer. Offentlig kursinformation kan senare cachas i en gemensam katalogdatabas. Personliga kurser, anteckningar, filer och datum ska som standard endast ligga lokalt och aldrig blandas med den gemensamma informationen.

## Nästa steg efter genomgången 2026-09-14

1. **Distributionsblockerare:** välj betrodd kodsignering och verifiera det färdiga Windows-fönstret, filnedladdningar, zoom och återstart på en ren profil. Ett lokalt bygge är klart men Windows har blockerat dess osignerade start. Publicera inte som färdig beta innan detta är löst.
2. **GitHub:** bekräfta förrådsnamn och återanvändningslicens, kör kontrollerna på GitHub, granska Release-utkastet och publicera först efter acceptans. Inga användarprofiler eller säkerhetskopior får följa med.
3. **Datatålighet:** utöka tester med uppgradering från äldre profilversioner och simulera avbrott mellan fillagring och metadata. De två lagringssystemen är inte en gemensam kraschatomisk databas; regelbundna externa säkerhetskopior behövs.
4. **Första återkopplingen:** felrapportmall utan anteckningar/filer, fler tangentbordstester och hjälp för WebView2/startproblem.
5. **Nästa funktionssteg:** knyt lektionsuppgifter till resurser och inför deluppgifter, full status, prioritet, uppskattad tid och egen deadline.
6. **Nästa kalendersteg:** bygg månadsvy, export och därefter säker import från uttryckliga offentliga TimeEdit-prenumerationslänkar.
7. **Nästa distributionsspår:** kör och acceptanstesta de separata macOS-byggena. Telefon/PWA planeras först när kursuppslagets serverarkitektur har valts.
