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

Status 2026-09-15: 16 Python-tester, 5 kalendertester och isolerade gränssnittstester är godkända lokalt. GitHub Actions har dessutom godkänt testmatrisen i både Linux och Windows samt byggt och självtestat Windows-paketet i en ren byggmiljö. Källkoden finns i det privata förrådet `maackaan/studieportalen`. Användaren har laddat ned Actions-paketet och bekräftat att appen går att öppna på den egna datorn.

Paketet är fortfarande osignerat (`NotSigned`). Det är därför lämpligt som privat vänbeta, men kan blockeras av Smart App Control på andra datorer och är inte verifierat för friktionsfri offentlig Windows-distribution. Ingen GitHub Release är publicerad ännu.

Gränssnittstesterna omfattar tom profil, kursers hela livscykel, anteckning, fil, filstorleksgräns, kalenderurval, dubbletter, slutförd uppgift, borttagning/ångra, tre fönsterbredder, tangentbordsmeny, omladdning, export/återställning, skadad profil, återställningsfel vid full lagring, säkerhetshuvuden och offline-omstart. HTML-bilagor förhandsvisas i en isolerad ram utan skripträttigheter.

1. ~~Skapa GitHub-förrådet och bestäm dess slutliga adress.~~ Klart: privat `maackaan/studieportalen`.
2. ~~Bekräfta den förberedda nedladdningsadressen `maackaan/studieportalen` i README.~~ Klart.
3. Bestäm om källkoden ska sakna återanvändningslicens under betan eller publiceras med exempelvis MIT/GPL.
4. Koden är uppladdad. Skapa taggen `v0.1.0-beta.1` och kontrollera Release-utkastet.
5. GitHub-bygget är godkänt och Actions-paketet har provstartats. Kontrollera även ZIP- och `.sha256`-filerna i Release-utkastet.
6. Välj signeringslösning, signera programfilen och bygg sedan om ZIP och kontrollsumma. Privata signeringsnycklar får aldrig läggas i förrådet.
7. Start från nedladdad ZIP är godkänd på användarens dator. Genomför resten av acceptanstestet utan att stänga av säkerhetsskydd.
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
