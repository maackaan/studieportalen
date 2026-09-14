# Integritet i Studieportalen

Studieportalen är byggd enligt principen **lokalt som standard**. Appen kräver inget konto och innehåller ingen analys, reklam eller spårning.

## Det som stannar på datorn

Följande uppgifter lagras endast i användarens lokala app-profil:

- valda och manuellt skapade kurser
- anteckningar, uppgifter, datum och klarstatus
- länkar och uppladdade filer
- appens inställningar

I Windows-versionen ligger profilen under `%LOCALAPPDATA%\Studieportalen`. Den ligger skild från programfilen. Det betyder att en ny nedladdning alltid är tom och att en byggd eller delad `Studieportalen.exe` inte innehåller användarens data.

Den som väljer **Exportera säkerhetskopia** skapar själv en JSON-fil med profilen och eventuella uppladdade filer. Säkerhetskopian kan innehålla privat information och ska hanteras som en personlig fil.

## Nätverksanrop

När en användare söker efter en kurs skickas kurskoden till den valda högskolans eller universitetets offentliga kurskatalog via appens lokala server. Egna anteckningar, valda kurser, filer och planeringsposter skickas inte med.

En extern kurs- eller resurslänk öppnas bara när användaren själv väljer den. Appen använder inga externa typsnitt, analystjänster eller annonsnätverk.

Kalenderfiler som användaren väljer med **Importera kalender** läses lokalt. Händelserna skickas inte vidare till någon tjänst.

## Distribution och GitHub

GitHub-bygget utgår från en ren kopia av källkoden och paketerar endast programkoden och de tomma webbassets som finns i `dist`. Lokala profiler, loggar, cachefiler och exporterade säkerhetskopior ingår inte.

Innan en offentlig version publiceras ska bygget testas på en ren Windows-profil. På längre sikt ska samma lokala dataprincip gälla även när lagringen flyttas till SQLite eller frivillig synkronisering införs.
