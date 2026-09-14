# Betachecklista för Studieportalen

## Klart i koden

- Tom standardprofil utan valda kurser eller personlig information.
- Lokal lagring av kurser, anteckningar, filer och planering.
- Säkerhetskopiering och återställning med bekräftelse.
- Kursuppslag för LiU, KTH, Chalmers och Lund.
- Separat LiU-kursinformation, offentlig IDA-kurshemsida och TimeEdit-länk.
- Lokal `.ics`-import med förhandsgranskning, tentamensklassning och dubblettskydd.
- Redigering, arkivering, återställning och ångra borttagning.
- Fristående Windows-bygge och automatiserat GitHub Release-utkast.
- Automatisk kontroll av Python, JavaScript, kalenderimport, tom profil och offline-cache.
- SHA-256-kontrollsumma bredvid varje Windows-paket.
- Exakt låsta byggberoenden, ren sårbarhetskontroll och tredjepartslicenser i ZIP-paketet.

## Måste göras före första vänbetan

Status 2026-09-14: 16 Python-tester, 5 kalendertester och isolerade gränssnittstester godkända lokalt. Den exakta Windows-byggmiljön är låst och granskningen rapporterar inga kända sårbarheter. Code Integrity-loggen bekräftar att Smart App Control i spärrläge blockerade den osignerade Windows-filen. Signaturen är `NotSigned`; inget Defender-utslag eller matchande AppLocker-händelse hittades. Appen är därför **inte verifierad för friktionsfri Windows-distribution ännu**. Inget har publicerats på GitHub och GitHub Actions har inte körts där.

Gränssnittstesterna omfattar tom profil, kursers hela livscykel, anteckning, fil, filstorleksgräns, kalenderurval, dubbletter, slutförd uppgift, borttagning/ångra, tre fönsterbredder, tangentbordsmeny, omladdning, export/återställning, skadad profil, återställningsfel vid full lagring, säkerhetshuvuden och offline-omstart. HTML-bilagor förhandsvisas i en isolerad ram utan skripträttigheter.

1. Skapa GitHub-förrådet och bestäm dess slutliga adress.
2. Bekräfta den förberedda nedladdningsadressen `maackaan/studieportalen` i README.
3. Bestäm om källkoden ska sakna återanvändningslicens under betan eller publiceras med exempelvis MIT/GPL.
4. Skicka koden och skapa taggen `v0.1.0-beta.1`.
5. Kontrollera att GitHub-bygget skapar både ZIP-filen och `.sha256`-filen.
6. Välj signeringslösning, signera programfilen och bygg sedan om ZIP och kontrollsumma. Privata signeringsnycklar får aldrig läggas i förrådet.
7. Ladda ned ZIP-filen på en ren Windows-profil och genomför acceptanstestet nedan utan att stänga av säkerhetsskydd.
8. Publicera Release-utkastet först efter godkänt acceptanstest.

Tredjepartslicenserna för komponenterna i Windows-paketet samlas automatiskt och följer med som `TREDJEPARTSLICENSER.txt`. Detta är separat från valet av licens för projektets egen kod.

Se [SIGNING.md](SIGNING.md) för signeringsalternativ och loggbevis. Liveuppslag mot LiU, KTH, Chalmers och Lund fungerar nu i både WSL och Windows-Python; motsvarande test inne i den paketerade appen återstår.

## Acceptanstest på ren Windows-profil

- Packa upp ZIP-filen och öppna `Studieportalen.exe` utan VS Code eller Python.
- Bekräfta att appen startar tom och att zoomning är avstängd i appfönstret.
- Lägg till en kurs från varje universitet och kontrollera manuell reservväg.
- För LiU: kontrollera separat kursinformation, eventuell IDA-hemsida och TimeEdit-länk.
- Lägg till, redigera, slutför och ta bort en uppgift.
- Lägg till anteckning, länk, bild och gammal tenta.
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
