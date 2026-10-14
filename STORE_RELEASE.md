# Microsoft Store – förberedd inlämning

## Uppdatering 2026-10-14

Projektägaren har skapat utvecklarkontot, reserverat Studieportalen och lämnat de tre produktidentitetsvärdena. De sparas i den Git-ignorerade `packaging/store-identity.local.json`.

`Studieportalen-Store-1.0.4.0-x64.msix` har byggts med den riktiga identiteten. 27 kodtester, isolerat EXE-uppstartstest och MakeAppx-validering är godkända. Manifestets Name, Publisher och PublisherDisplayName matchar produktidentiteten exakt; webbappsfilerna matchar arbetskopian. Paketet finns i `build-output/` och en identisk kopia ligger i projektägarens Hämtade filer för manuell uppladdning i Partner Center.

Projektägaren har laddat upp paketet i Partner Center. Packages visar Validated/Complete och Submission options är Complete, inklusive motivering för runFullTrust. Kontoverifiering, återstående formulär, slutlig installation, WACK och Microsofts certifiering återstår före publicering. Inlämningen är fortfarande ett utkast. Paketet är osignerat tills det hanteras genom rätt signerings-/Store-flöde.

## Nuläge 2026-10-12

Arbetskopian är en lokal utvecklingsversion efter den publicerade Beta 3. Store-paketeringen är ett separat, manuellt arbetsflöde och publicerar ingenting automatiskt. Den befintliga GitHub-releasen ändras inte av ett MSIX-bygge.

- `tools/build_store.py` bygger en ren x64-`onedir`-app, starttestar ett riktigt WebView2-fönster med tillfällig profil, samlar licenser och skapar MSIX.
- `tools/package_store.py` skapar manifest, ikoner, paket, SHA-256 och en granskningsrapport. Windows SDK validerar paketet utan avstängd validering (`/nv` används inte).
- Paketet innehåller programfiler och tomma standarddata. Profiler, säkerhetskopior och signeringsnycklar avvisas.
- Manifestet använder `Windows.Desktop`, Windows 10 build 19041 eller senare, x64 och `runFullTrust`. Appen körs som vanlig användare och lyssnar bara på loopback. Ingen administratörsbehörighet eller bakgrundstjänst krävs.
- Store-profilen ligger under `%LOCALAPPDATA%\Packages\<PackageFamilyName>\LocalState\Studieportalen\WebView`. Samma paketidentitet ger samma dataplats vid uppdatering.

Ett lokalt previewpaket är **osignerat och inte installationsklart för testvänner**. Ett lyckat bygg-/uppstartstest är inte ett godkänt Store-installationstest. Microsoft signerar MSIX efter certifiering; att lägga samma osignerade MSIX på GitHub löser inte Smart App Control.

Verifierade resultat från detta arbetspass finns i [RELEASE_TEST_REPORT.md](RELEASE_TEST_REPORT.md), inklusive paketets kontrollsumma och tydlig avgränsning av de Store-tester som återstår.

## Det projektägaren behöver göra

1. Registrera eller logga in på Microsofts utvecklarkonto och genomför identitetskontrollen själv.
2. Reservera appnamnet **Studieportalen** i Partner Center, om namnet är ledigt.
3. Öppna appens produktidentitet och kopiera **Package/Identity/Name**, **Package/Identity/Publisher** och **Package/Properties/PublisherDisplayName** exakt.
4. Kopiera `packaging/store-identity.example.json` till `packaging/store-identity.local.json` och ersätt platshållarna. Den lokala filen ignoreras av Git. Identitetsuppgifterna är inte lösenord; inga inloggningsuppgifter eller certifikat behövs i källkoden.

Preview använder ett separat namn och en separat utgivare. Det ska aldrig ersätta den riktiga Store-identiteten. MSIX-versionen `1.0.4.0` är förslag till första kandidaturen, inte en redan publicerad Store-version. Den fjärde delen ska vara 0; använd en högre version vid framtida uppdateringar och behåll Name/Publisher/App ID.

## Bygg lokalt

På byggdatorn behövs Windows, Python med projektets låsta byggberoenden och Windows SDK (MakeAppx). Slutanvändaren behöver inga utvecklingsverktyg.

```text
python -m pip install --requirement requirements-build-lock.txt
python tools/build_store.py --preview
python tools/build_store.py --identity packaging/store-identity.local.json
```

Om Python finns i projektets virtuella miljö används dess `Scripts/python.exe`. Byggskriptet använder en ny, lokal temporär byggmapp även när källkoden finns i WSL. Mappens exakta sökväg skrivs ut för fortsatt granskning. `build-output/` får:

- `Studieportalen-Preview-1.0.4.0-x64.msix` eller `Studieportalen-Store-1.0.4.0-x64.msix`
- motsvarande `.sha256` och `.json` med identitet, status och kontrollsumma

På GitHub är **Förbered Microsoft Store (MSIX)** manuellt. Preview är standard; avmarkera det och fyll i identiteten för ett riktigt Store-underlag. Paketen laddas bara upp som byggartefakter. Inga Azure-nycklar, signeringscertifikat eller publiceringsrättigheter behövs.

## Befintliga användares data

Övergången från GitHub-appen till Store sker genom appens säkerhetskopiering:

1. I gamla appen: **Exportera säkerhetskopia**. Behåll den gamla appen och profilen tills övergången har kontrollerats.
2. Installera Store-versionen efter godkännande. Den har en egen profil och börjar tom.
3. Välj **Importera säkerhetskopia**, läs sammanställningen och bekräfta.
4. Kontrollera kurser, anteckningar, bilagor och kalender innan gamla programfilen tas bort.

Råa Chromium/WebView-filer kopieras inte automatiskt mellan profiler. Export/import är den testade övergången. Vanliga Store-uppdateringar ska bevara Store-profilen. **Avinstallation eller Windows-kommandot Återställ kan ta bort Store-data**: exportera först. Den gamla ZIP-profilen ligger fortsatt under `%LOCALAPPDATA%\Studieportalen`.

## Underlag till Store-formuläret

**Beskrivning:** Studieportalen samlar kurser, anteckningar, kursmaterial och studieplanering på din egen dator. Organisera tentor och andra filer, skapa uppgifter och deadlines och se veckan i en kalender. Importera scheman som kalenderfiler från exempelvis TimeEdit. Offentlig kursinformation kan hämtas från LiU, KTH, Chalmers och Lund. Appen kräver inget användarkonto och innehåller ingen reklam eller analys.

**Integritet:** använd den offentliga [integritetsbeskrivningen](https://github.com/maackaan/studieportalen/blob/main/PRIVACY.md), efter att Store-tillägget har publicerats där.

**Support:** [GitHub Issues](https://github.com/maackaan/studieportalen/issues). Be användare beskriva felet utan att bifoga personliga säkerhetskopior.

**Motivering till runFullTrust:** befintlig Python/pywebview-skrivbordsapp med lokal HTTP-server på loopback, WebView2, lokala kursuppslag och användarvalda bilagor/säkerhetskopior. Körs utan elevation och utan Windows-tjänst.

**Systemkrav:** Windows 10 build 19041 eller senare/Windows 11, x64. Evergreen WebView2 Runtime krävs; det finns normalt redan på uppdaterade Windows-datorer. ARM64/x86 har inte egna Store-byggen och ska inte utlovas som testade. macOS distribueras separat via GitHub. Appen är inte en mobilapp.

Store-skärmbilder kan skapas med `python tools/test_ui.py --store-screenshots` efter att Playwright har installerats. Fyra bilder i 1440×900 sparas i `build/store-listing/`. De visar en tillfällig profil med tydligt fiktiva kurskoder och påverkar inte egna kurser eller anteckningar. Granska bilderna före inlämning; de är underlag, inte uppladdade Store-bilder.

Projektägaren väljer marknader, kategori, åldersklassning, pris (förslagsvis gratis) och tidpunkt för publicering. Dessa uppgifter lämnas inte in automatiskt.

## Återstår före Store-publicering

- Riktig Partner Center-identitet och slutbygge är klara; paketet är validerat i Partner Center. Kontoverifiering och återstående inlämningsformulär måste slutföras.
- Installera och starta paketet via ett godkänt test-/Store-flöde. Ändra inte Windows säkerhetspolicy eller installera generellt betrodda testcertifikat för användare.
- Kör Windows App Certification Kit (WACK) på det slutliga paketet. SDK-paketeringens validering ersätter inte WACK eller Microsofts certifiering.
- Testa installation på ren Windows x64-profil med Smart App Control påslaget, WebView2, externa kurslänkar och kursuppslag.
- Testa backupövergång från GitHub till Store samt uppdatering mellan två MSIX-versioner med samma identitet, inklusive bilagor och kalender. Den nya identitetsdetektionen är enhetstestad; verklig paketerad lagring och uppdatering måste fortfarande verifieras.
- Godkända skärmbilder med enbart exempeldata, Store-listning och publicerad integritetstext.
- Slutlig projektägargranskning och därefter Microsofts godkännande.

Referenser: [MSIX-komponenter och identitet](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-manual-conversion), [Store-signering](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options), [paketerad app och lagring](https://learn.microsoft.com/en-us/windows/msix/desktop/desktop-to-uwp-behind-the-scenes), [Store-paketkrav](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/app-package-requirements).
