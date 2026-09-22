# Studieportalen

En lokal portal för kurser, gamla tentor, kursbilder, länkar, anteckningar och studieplanering.

- [⬇ Ladda ner Beta 3 för Windows](https://github.com/maackaan/studieportalen/releases/download/v0.1.0-beta.3/Studieportalen-Windows-x64.zip)
- [⬇ Ladda ner Beta 3 för Mac – Apple Silicon](https://github.com/maackaan/studieportalen/releases/download/v0.1.0-beta.3/Studieportalen-macOS-arm64.zip)
- [⬇ Ladda ner Beta 3 för Mac – Intel](https://github.com/maackaan/studieportalen/releases/download/v0.1.0-beta.3/Studieportalen-macOS-x64.zip)

**Offentlig förhandsversion.** På [versionssidan](https://github.com/maackaan/studieportalen/releases) väljer du paketet för din dator, inte GitHubs automatiska “Source code”-filer. Betan är osignerad och kan därför ge en säkerhetsvarning eller blockeras på vissa datorer; se [betachecklistan](BETA_CHECKLIST.md).

## För vanliga användare

Den färdiga Windows-versionen är tänkt att fungera som ett vanligt program:

1. Ladda ned `Studieportalen-Windows-x64.zip` från projektets GitHub Release.
2. Packa upp filen.
3. Dubbelklicka på `Studieportalen.exe`.

VS Code, Python och webbläsartillägg behövs inte. Programmet innehåller sin egen Python-miljö och öppnas i ett eget skrivbordsfönster. Windows använder WebView2 för fönstret; det finns redan på Windows 11 och på den stora majoriteten av uppdaterade Windows 10-datorer.

På en Mac väljer du `arm64` om datorn har Apple Silicon (M1 eller senare) och `x64` om den har en Intel-processor. Packa upp ZIP-filen och öppna `Studieportalen.app`. Mac-versionen är ännu inte signerad eller notariserad och kan därför kräva att användaren uttryckligen väljer att öppna den i macOS säkerhetsinställningar.

Den nedladdade appen startar helt tom. Kurser, planering, anteckningar och filer skapas först av användaren och sparas lokalt under `%LOCALAPPDATA%\Studieportalen` på Windows eller `~/Library/Application Support/Studieportalen` på Mac. De byggs aldrig in i det nedladdningsbara programmet och skickas inte till GitHub.

Läs den korta [integritetsbeskrivningen](PRIVACY.md) för exakt vad som lagras lokalt och vilka nätverksanrop som kan göras.

## För utvecklare

### Krav

- Python 3.10 eller senare
- En modern webbläsare
- Inga externa Python-paket behövs

### Starta appen

Dubbelklicka på genvägen **Studieportalen** på Windows-skrivbordet eller kör följande i WSL:

```bash
cd studieportalen
./start.sh
```

Appen öppnas på `http://localhost:4173`.

På Windows, macOS eller vanlig Linux kan appen startas direkt från projektmappen:

```bash
python server.py
```

Använd `python3 server.py` om kommandot `python` inte finns. Öppna därefter `http://localhost:4173` i webbläsaren och avsluta servern med `Ctrl+C`.

### Stoppa appen

```bash
cd studieportalen
./stop.sh
```

### Kör kontroller

Kursadaptrarnas lokala tester kräver inga extra paket:

```bash
cd studieportalen
python3 -m unittest discover -s tests -v
```

## Data och filer

Kurser, uppgifter, datum och metadata sparas lokalt för appen. Uppladdade filer sparas i webbläsarens lokala databas på samma dator. Inget personligt kursmaterial skickas till en extern tjänst.

Servern lyssnar som standard endast på den egna datorn. Den som medvetet vill nå appen från det lokala nätverket kan ange miljövariabeln `STUDIEPORTALEN_HOST`, men bör då själv skydda nätverket och förstå att varje webbläsare får en separat lokal profil.

Planeringen stöder deadlines, tentor, lektionsuppgifter, läsning och laborationer. Poster kan markeras som klara och syns både i kursen och bland kommande aktiviteter.

Kurser kan redigeras och arkiveras. Resurser och planeringsposter kan också redigeras utan att deras ursprungliga skapandedatum, klarstatus eller uppladdade fil försvinner. Arkiveringen är reversibel och behåller kursens resurser och planering; på kurssidan går det att växla mellan aktiva, arkiverade och alla kurser.

Appen startar tom. Sök på kurskod för att hämta offentlig kursinformation från LiU, KTH, Chalmers eller Lunds universitet, eller välj **Annat universitet** och fyll i uppgifterna själv. Lund-sökningen täcker både universitetets gemensamma kurswebb och aktuella LTH-kurser. För LiU skiljer appen på den officiella kursinformationen och IDA:s separata offentliga kurshemsidor. KTH-, Chalmers- och Lundkurser får i stället genvägar till lärosätets Canvas och officiella schemaingång. Canvas kräver studentinloggning och visar bara kursytor som användaren själv har tillgång till; appen försöker inte läsa innehåll eller inlämningsuppgifter därifrån. Schemalänkarna öppnar respektive lärosätes TimeEdit-sökning, där kurskoden kan användas.

## Säkerhetskopiering

I sidomenyn kan du välja **Exportera säkerhetskopia**. Då skapas en versionsmärkt JSON-fil med kurser, resurser, datum, anteckningar och uppladdade filer. **Importera säkerhetskopia** kontrollerar filen och visar vad som kommer att återställas innan den nuvarande profilen ersätts.

En uppladdad fil får vara högst 25 MB. En säkerhetskopia får vara högst 100 MB och innehålla högst 70 MB okomprimerade filer. Om profilinformationen inte kan läsas spärras vanliga ändringar så att rådata inte skrivs över; en giltig säkerhetskopia kan användas för kontrollerad återställning.

## Kalenderimport

På en kurssida kan du välja **Importera kalender** och öppna en `.ics`-fil från exempelvis TimeEdit. Appen visar en förhandsgranskning innan något sparas, känner igen vanliga benämningar för tentamen och laboration samt hoppar över redan importerade händelser. Kalenderfilen behandlas lokalt i appen.

## Struktur

- `dist/index.html` – appens gränssnitt
- `dist/styles.css` – utseende och mobilanpassning
- `dist/app.js` – sökning, kurser, resurser och lokal lagring
- `dist/calendar-import.js` – lokal och testbar tolkning av `.ics`-kalendrar
- `desktop.py` – startar servern och appens egna skrivbordsfönster
- `server.py` – lokal server och uppslag mot officiella kurskataloger
- `requirements-build.txt` – endast verktyg för att bygga den fristående Windows-filen
- `requirements-build-lock.txt` – exakt låsta versioner för reproducerbara Windows-byggen
- `tests/test_server.py` – automatiska tester för kursadaptrarna
- `tests/test_release_safety.py` – kontrollerar tom standardprofil och ren Windows-paketering
- `tests/calendar_import.test.cjs` – kontrollerar kalenderdatum, tentamensklassning och radbrytningar
- `PRIVACY.md` – beskriver lokal lagring och nätverksanrop
- `.github/workflows/tests.yml` – kör tester automatiskt på GitHub
- `.github/workflows/build-windows.yml` – bygger den nedladdningsbara Windows-appen
- `start.sh` – startar appen och öppnar webbläsaren
- `stop.sh` – stoppar den lokala servern

Genvägen öppnar portalen i ett eget appfönster via Microsoft Edge. Portalen kan också installeras som PWA från appens meny när webbläsaren erbjuder det.

Själva webbgränssnittet är medvetet byggt utan ramverk eller paketinstallationer. Paketeringsverktygen används endast av utvecklare och GitHub; de följer med inuti den färdiga Windows-filen.

## Publicera på GitHub

Projektet är offentligt på `maackaan/studieportalen`. Lokala loggar, processfiler, Python-cache och exporterade säkerhetskopior ignoreras, och tester körs automatiskt för varje push och pull request. Arbetsflödet **Bygg Windows-app** verifierar dessutom att standardprofilen är tom innan det skapar den fristående ZIP-filen på en Windows-server. En manuell körning ger ett testpaket i GitHub Actions. En versionstagg skapar ett Release-utkast som projektägaren granskar före publicering.

### Privat betatest

GitHub har ingen publik men olistad Release där en hemlig länk ensam ger åtkomst. Börja i stället med ett privat förråd och bjud in testarna. De behöver acceptera inbjudan och vara inloggade för att öppna Release-länken. För read-only-testare är ett privat förråd i en GitHub-organisation bäst, eftersom de kan få rollen **Read**; ett privat förråd på ett personligt konto ger vanliga collaborators skrivrättigheter. En tagg som `v0.1.0-beta.1` markeras automatiskt som en förhandsversion.

Förrådet och den första förhandsversionen är nu offentliga. Den som laddar ned en ny version behåller sin lokala profil; programfiler och användardata lagras separat.

Andra kan ladda ned eller klona projektet och köra det lokalt med Python. En ren publicering via GitHub Pages visar gränssnittet, men den automatiska sökningen i universitetens kurskataloger kräver Python-servern. För en helt webbaserad publik version behöver kursuppslaget senare flyttas till en liten serverfunktion.

Ingen projektlicens har lagts till automatiskt. Källkoden är synlig, men projektägaren har ännu inte gett någon generell återanvändningslicens.

### Kontroller och kodsignering

Automatiska tester är **kodvalidering**: de kontrollerar funktioner, datum, tom profil och säkerhetskopior. **Kodsignering** visar vem som har publicerat Windows-filen och att den inte har ändrats. En SHA-256-kontrollsumma är inte en digital signatur. Dessa kontroller kompletterar varandra men garanterar inte att en app är helt felfri.

Nu körs funktionstester på både Windows och Linux samt isolerade gränssnittstester vid 360, 520, 768 och 1280 pixlar. Gränssnittstestet använder en egen tom webbläsarprofil och påverkar inte användarens uppgifter. För utvecklare:

```text
npm install
npx playwright install chromium
python tools/test_ui.py
```

Windows-bygget skapar numera ett **utkast** till Release vid en versionstagg. Kontrollera paketet och signeringen innan utkastet publiceras. En osignerad fil kan blockeras helt, inte bara visa en varning. Stäng inte av Windows-skyddet för att testa paketet. Se [Microsofts signeringsalternativ](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options).

Efter att en körbar fil har signerats kan dess uppstart kontrolleras med `Studieportalen.exe --self-test-report resultat.json`. Testläget använder en tillfällig profil och en separat lokal port. Det ersätter inte det manuella acceptanstestet.

Se [BETA_CHECKLIST.md](BETA_CHECKLIST.md) för den sista kontrollen på en ren Windows-dator och [ROADMAP.md](ROADMAP.md) för kommande funktioner.
