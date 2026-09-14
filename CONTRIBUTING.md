# Bidra till Studieportalen

Tack för att du vill förbättra Studieportalen. Projektet använder endast HTML, CSS, JavaScript och Pythons standardbibliotek.

## Lokal utveckling

1. Installera Python 3.
2. Kör `python server.py` från projektmappen.
3. Öppna `http://localhost:4173`.
4. Kör `python -m unittest discover -s tests -v` innan en ändring skickas in.

Personliga kurser, anteckningar och uppladdade filer lagras i webbläsaren och ska aldrig läggas till i kodförrådet eller testfixturer utan att vara helt syntetiska.

## Ändringar

- Håll universitetsadaptrar separata och komplettera varje ny adapter med tester.
- Behåll appen användbar med tangentbord och på smala skärmar.
- Ändra backupformatets versionsnummer när en inkompatibel förändring införs.
- Skicka aldrig personliga uppgifter till externa kurstjänster. Endast den kurskod användaren uttryckligen söker efter får användas.

Beskriv vad som ändrats, varför och hur det testades i varje pull request.

## Bygga Windows-programmet

GitHub Actions bygger Windows-paketet automatiskt med `requirements-build.txt`. En lokal Windows-byggmiljö kan använda samma fil och kommandot i `.github/workflows/build-windows.yml`. Byggresultat, profiler och användardata ska aldrig checkas in.
