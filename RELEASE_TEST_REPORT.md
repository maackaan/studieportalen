# Lokalt testprotokoll – 2026-10-12

## Store-identitet och nytt bygge – 2026-10-14

Store-identiteten från projektägarens Partner Center har lagts in i en ignorerad lokal konfiguration. Ett nytt rent onedir-bygge och `Studieportalen-Store-1.0.4.0-x64.msix` skapades med den identiteten.

- 27 Python-tester godkända i detta bygge.
- Byggd EXE klarade isolerat uppstartstest: `ok: true`, tillfällig profil och slumpad loopbackport.
- MakeAppx:s fullständiga manifest-/paketvalidering godkänd.
- Name, Publisher, PublisherDisplayName och version i MSIX verifierade mot den lokala Store-identiteten.
- Webbappens fem kärnfiler verifierade byte för byte mot arbetskopian.
- Paketet är cirka 15 MB, osignerat och har status `pending-store-certification`.
- SHA-256: `900105a27d909ceeeff65b7ba6c78b232a8d0bcae539817ee2d235b446fa9fef`.
- En identisk kopia skapad i Hämtade filer för projektägarens manuella uppladdning.

Projektägaren har därefter laddat upp paketet manuellt: Partner Center visar Packages Validated/Complete och Submission options Complete. Ingen certifieringsinlämning eller Store-publicering har genomförts. Installerad MSIX, WACK och uppdatering med paketidentitet återstår. Testresultaten från 2026-10-12 nedan gäller fortsatt samma UI-kod; endast Store-identiteten ändrades för detta bygge.

Kandidat: `0.1.0-beta.4-dev`, MSIX-preview `1.0.4.0`, x64. Den publicerade Beta 3 har inte ändrats. Källkod och integritetstext publiceras separat på GitHub; det skapar ingen ny release eller Store-publicering.

## Godkänt

- 27 Python-tester på Windows och Linux, inklusive oförändrad ZIP-dataplats, separat Store-dataplats, tom standardprofil, kursadaptrar, paketidentitet och avvisning av profil-/nyckelfiler.
- 6 JavaScript-kalendertester och syntaxkontroll av app, UI-test och skärmbildsverktyg.
- Full UI-smoke i isolerad Edge-profil vid 360, 520, 768, 821, 900, 1101, 1280 och 1440 px: kursordning, grundfunktioner, dialoger, resursåtgärder, kalender, redigering, backup/återställning och offline-omstart.
- Regression för långt kursnamn: kurskoden visas separat över tiden, händelsetypen under tiden och metadata överlappar inte knapparna. Deadline 23:59–00:59 visar att sluttiden avser följande dag.
- Desktopkalendern har inget inre sidleds-/höjdrullningsutrymme. Smal kalender har avsiktlig sidledsrullning för sju dagar, med bibehållen vanlig sidrullning.
- Exporterad backup återställd i en helt separat, tom webbläsarprofil. Kurser, 3 resurser, 10 kalenderposter och faktiska filbytes bevarades även efter omladdning.
- Riktigt WebView2-fönster visuellt granskat med datorkontroll, enbart tillfälliga testdata. Översiktslayout, händelseinformation, sidledsrullning och vanlig sidrullning kontrollerade. Testappen avslutades efter granskning.
- PyInstaller-onedir startade med `--self-test-report`: `ok: true`. Testet använde en tillfällig profil och slumpad loopbackport.
- Windows SDK MakeAppx skapade preview-MSIX med full manifest-/paketvalidering (ingen `/nv`). Fyra listingbilder med fiktiva kurser skapades och granskades.
- Slutpaketets `index.html`, `styles.css`, `app.js`, `sw.js` och `calendar-import.js` matchar arbetskopian byte för byte. Manifest, blockmap, EXE, ikoner, integritet och tredjepartslicenser ingår. Inga WebView-profiler, backupexporter eller privata nycklar finns i paketet.
- `git diff --check` utan fel. Byggpaket och lokal Store-identitetsfil ignoreras av Git.

Paket: `build-output/Studieportalen-Preview-1.0.4.0-x64.msix`, cirka 15 MB, 204 paketposter. SHA-256: `37cbda2bf2e3e91ec83e9639bf2925af52169e5a007e0f51fde07930be2011df`.

## Inte verifierat ännu

- Previewpaketet är osignerat och har lokal testidentitet; det är inte installationsklart för allmänheten.
- Native testmiljö: Windows 11 build 26200. Projektägaren har själv stängt av Smart App Control. Testerna bevisar inte SAC-kompatibilitet.
- Riktig Store-identitet och Partner Centers paketvalidering är klara. Installation med paketidentitet, WACK, certifiering, ren dator och faktisk uppdatering mellan installerade MSIX-versioner återstår.
- Backupövergång är testad mellan separata profiler; faktisk GitHub → installerad Store-app behöver fortfarande acceptanstestas.
- WebView2 behöver finnas på slutanvändarens dator. Ingen x86-/ARM64-/mobilversion har lagts till.

Nästa steg och inlämningsunderlag finns i [STORE_RELEASE.md](STORE_RELEASE.md). Publicering sker först efter slutgranskning.
