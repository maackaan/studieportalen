# Kodvalidering och signering

## Läget 2026-09-14

Funktionstester och gränssnittstester går igenom, och Windows-programmet kan byggas. Den lokala programfilen är osignerad (`NotSigned`). Händelserna 3033 och 3077 i Code Integrity-loggen visar att Smart App Controls aktiva policy `VerifiedAndReputableDesktop` (`{0283ac0f-fff1-49ae-ada1-8a933130cad6}`) blockerade just Studieportalen.exe eftersom den inte uppfyllde Enterprise signing level. AppLocker hade ingen matchande händelse och inget Defender-utslag hittades. Registret visade spärrläge (`VerifiedAndReputablePolicyState = 1`). Skyddet har inte ändrats eller kringgåtts.

Kursuppslag mot alla fyra universitet fungerade i WSL. Ett tidigare HTTPS-certifikatfel i Windows-Python gick inte att återskapa 2026-09-14: HTTPS-anrop och fullständiga uppslag för LiU, KTH, Chalmers och Lund lyckades. Certifikatkontrollen har aldrig stängts av. Nätverket ska ändå sluttestas i den signerade Windows-appen eftersom externa webbplatser och certifikatkedjor kan ändras.

## Tre olika kontroller

- **Kodtester:** hittar vissa fel i funktioner och gränssnitt. De är inte en fullständig säkerhetsrevision.
- **SHA-256:** kontrollerar att nedladdningen matchar den avsedda filen. Bevisar inte utgivarens identitet.
- **Digital signatur:** knyter filen till en verifierad utgivare och avslöjar ändringar efter signering. Nya signerade filer kan fortfarande få SmartScreen-varningar. [Microsoft om SmartScreen](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation).

## Alternativ att välja mellan

- **Betrodd certifikatutfärdare:** utred en leverantör som accepterar svenska enskilda utvecklare. Identitetskontroll, kostnad och säker nyckellagring måste godkännas av projektägaren.
- **SignPath Foundation:** möjlig kostnadsfri väg för kvalificerade öppna projekt, men kräver bland annat godkänd öppen licens, redan publicerat projekt och verifierbar trovärdighet. Det är inte en garanterad omedelbar lösning för en första beta. [Villkor](https://signpath.org/terms).
- **Microsoft Store med MSIX:** alternativt distributionsspår där Microsoft hanterar signeringen efter certifiering. Registrering för enskilda utvecklare är numera kostnadsfri i nästan 200 marknader och kräver identitetskontroll. Det kräver annan paketering och ersätter inte automatiskt GitHub-paketet. [Microsofts information om kostnadsfri registrering](https://learn.microsoft.com/en-us/windows/apps/publish/whats-new-individual-developer), [Store-frågor och svar](https://learn.microsoft.com/en-us/windows/apps/publish/faq/get-started-with-the-microsoft-store).

Microsofts Azure Artifact Signing har enligt aktuell dokumentation publik signering för organisationer i bland annat EU, men för privatpersoner endast USA/Kanada. Vi ska därför inte börja med en betald Azure-prenumeration som antas fungera för en svensk privatperson. [Aktuella förutsättningar](https://learn.microsoft.com/en-us/azure/artifact-signing/quickstart), [signeringsalternativ](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options).

Det praktiska beslutet är därför antingen Store-först för enklast möjlig installation utan certifikatköp, eller direkt GitHub-nedladdning med en betrodd certifikattjänst. SignPath kan bli ett senare kostnadsfritt GitHub-spår om projektet först publiceras med en godkänd öppen licens och antas till programmet.

## När lösningen är vald

1. Verifiera utgivaridentitet och konfigurera skyddad signering. Lägg aldrig nycklar i GitHub-förrådet.
2. Bygg och signera Windows-filen, inklusive nödvändiga medföljande binärer enligt vald tjänsts krav.
3. Skapa ZIP och kontrollsumma **efter** signering och bifoga tredjepartslicenser.
4. Testa start, lokal lagring, nedladdning av säkerhetskopior, kursuppslag och zoom på ren Windows-profil med säkerhetsskydd påslagna.
5. Publicera GitHub Release-utkastet och aktivera nedladdningslänken.
