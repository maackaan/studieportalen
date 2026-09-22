# Betachecklista för Studieportalen

## Klart i koden

- Tom standardprofil utan valda kurser eller personlig information.
- Lokal lagring av kurser, anteckningar, filer och planering.
- Säkerhetskopiering och återställning med bekräftelse.
- Kursuppslag för LiU, KTH, Chalmers och Lund.
- Separat LiU-kursinformation, offentlig IDA-kurshemsida och TimeEdit-länk.
- Genvägar till Canvas och officiell schemasökning för KTH, Chalmers och Lund.
- Lokal `.ics`-import med förhandsgranskning, tentamensklassning och dubblettskydd.
- Samlad veckokalender måndag–söndag från 08:00 med tidsblock, veckonavigering, dagens markering, aktuell tidslinje, snabb information vid tryck och `.ics`-import till valfri kurs eller `Allmänt`.
- Fristående datum och resurser, resurstypen Information och sparad kursordning.
- Redigering, arkivering, återställning och ångra borttagning.
- Fristående Windows-bygge och automatiserat GitHub Release-utkast.
- Manuellt `py2app`-baserat macOS-testbygge för Apple Silicon och Intel; riktig Mac-acceptans återstår före en Mac-release.
- Automatisk kontroll av Python, JavaScript, kalenderimport, tom profil och offline-cache.
- SHA-256-kontrollsumma bredvid varje Windows-paket.
- Exakt låsta byggberoenden, ren sårbarhetskontroll och tredjepartslicenser i ZIP-paketet.

## Måste göras före första vänbetan

Status 2026-09-22: 19 Python-tester, 6 kalendertester och isolerade gränssnittstester är godkända lokalt för `0.1.0-beta.3-dev`. Testerna omfattar även allmänna poster, Information, fem kurser, sparad kursordning, typanpassade längder, informationsrutan och veckokalendern vid 360, 768 och 1280 pixlar. GitHub Actions har tidigare godkänt testmatrisen i både Linux och Windows samt byggt och självtestat Windows-paketet i en ren byggmiljö. Källkoden och `v0.1.0-beta.2` är offentliga på `maackaan/studieportalen`. Både användaren och en testare har laddat ned beta 2 och bekräftat att appen går att öppna.

Paketet är fortfarande osignerat (`NotSigned`). Testaren fick en Windows-varning men kunde välja att köra appen; andra datorer kan blockera den hårdare. Betan är därför inte verifierad för friktionsfri offentlig Windows-distribution.

Gränssnittstesterna omfattar tom profil, kursers hela livscykel, anteckning, fil, filstorleksgräns, kalenderurval, dubbletter, slutförd uppgift, borttagning/ångra, tre fönsterbredder, tangentbordsmeny, omladdning, export/återställning, skadad profil, återställningsfel vid full lagring, säkerhetshuvuden och offline-omstart. HTML-bilagor förhandsvisas i en isolerad ram utan skripträttigheter.

1. ~~Skapa GitHub-förrådet och bestäm dess slutliga adress.~~ Klart: offentligt `maackaan/studieportalen`.
2. ~~Bekräfta den förberedda nedladdningsadressen `maackaan/studieportalen` i README.~~ Klart.
3. Bestäm om källkoden ska sakna återanvändningslicens under betan eller publiceras med exempelvis MIT/GPL.
4. ~~Ladda upp koden och skapa taggen `v0.1.0-beta.1`.~~ Klart.
5. ~~Kontrollera ZIP- och `.sha256`-filerna från GitHub-bygget.~~ Klart.
6. Välj signeringslösning, signera programfilen och bygg sedan om ZIP och kontrollsumma. Privata signeringsnycklar får aldrig läggas i förrådet.
7. Start från nedladdad ZIP är godkänd på användarens dator. Genomför resten av acceptanstestet utan att stänga av säkerhetsskydd.
8. ~~Publicera den första förhandsversionen.~~ Klart; fortsätt samla testresultat före nästa version.

Tredjepartslicenserna för komponenterna i Windows-paketet samlas automatiskt och följer med som `TREDJEPARTSLICENSER.txt`. Detta är separat från valet av licens för projektets egen kod.

Se [SIGNING.md](SIGNING.md) för signeringsalternativ och loggbevis. Liveuppslag mot LiU, KTH, Chalmers och Lund fungerar nu i både WSL och Windows-Python; motsvarande test inne i den paketerade appen återstår.

## Acceptanstest på ren Windows-profil

- Packa upp ZIP-filen och öppna `Studieportalen.exe` utan VS Code eller Python.
- Bekräfta att appen startar tom och att zoomning är avstängd i appfönstret.
- Lägg till en kurs från varje universitet och kontrollera manuell reservväg.
- För LiU: kontrollera separat kursinformation, eventuell IDA-hemsida och TimeEdit-länk.
- Lägg till, redigera, slutför och ta bort en uppgift.
- Lägg till anteckning, länk, bild och gammal tenta.
- Lägg till ett allmänt datum och en allmän Information-resurs med fil eller länk.
- Lägg till minst fem kurser, flytta en kurs och bekräfta samma ordning på kurssidan och översikten.
- Öppna kalendersidan, bläddra mellan veckor och kontrollera dagens markering, 08:00-start samt tidsblockens start och längd.
- Skapa en deadline, undervisning och tentamen och kontrollera standardlängderna 1, 2 respektive 4 timmar samt alternativet 5 timmar.
- Tryck på ett kalenderblock och kontrollera information, status och genvägen till redigering.
- Importera en `.ics`-fil med start-/sluttider både till en kurs och till `Allmänt`.
- Importera en `.ics`-fil två gånger och bekräfta att den andra importen inte skapar dubbletter.
- Exportera en säkerhetskopia, stäng appen, öppna igen och kontrollera att allt finns kvar.
- Återställ säkerhetskopian och kontrollera filer samt planering.
- Kontrollera layout vid litet och stort fönster samt med tangentbord.

## Kända begränsningar i första betan

- Programmet är inte kodsignerat och Windows kan därför blockera starten helt.
- Uppdateringar laddas ned manuellt från GitHub Releases.
- TimeEdit-kalendern laddas först ned som `.ics` och importeras sedan i kursen.
- Kalenderimport är en ögonblicksbild, inte en synkronisering. Inställda tillfällen hoppas över; återkommande regler avvisas tydligt tills fullständigt stöd finns. Ändringar i en tidigare importerad händelse uppdateras inte automatiskt.
- Automatisk upptäckt av separat LiU-kurshemsida täcker inledningsvis offentliga IDA-sidor.
- Ingen synkronisering mellan datorer; säkerhetskopian flyttas manuellt av användaren.

Betan kan publiceras när hela acceptanstestet går igenom utan dataförlust eller blockerande fel.
