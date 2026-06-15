# TrainIQ Next Steps

Dit is het startpunt voor de volgende sessie.

## Status

- GitHub staat goed en is schoon gepusht naar `stanelberts2/TrainingIQ`.
- De app draait lokaal als statische ES-module app.
- Workouts worden nu lokaal bewaard in `localStorage`.
- De handmatige invoer bevat nu de V1-velden: datum, starttijd, sport, titel, type, duur, afstand, gemiddelde HR, max HR, load, pace, hoogtemeters en notities.
- Intervalblokken zijn toegevoegd voor trainingen zoals 5 x 1 km, inclusief afstand, tijd, pace, gemiddelde HR en max HR per blok.
- Intervalprofielen worden automatisch afgeleid voor overload-analyse: bijvoorbeeld `1km-reps` of `10min-reps`, rep-afstand/repduur, aantal reps en kwaliteitsvolume.
- Supabase is voorbereid met:
  - `schema.sql`
  - `lib/supabase.js`
  - `data/supabaseWorkoutMapper.js`
  - `data/supabaseWorkoutStore.js`
  - Data-tab in de app voor URL, anon key, magic link, upload en download.

## Morgen Eerst Doen

1. Maak een nieuw Supabase-project aan.
2. Open Supabase SQL Editor.
3. Plak de volledige inhoud van `schema.sql`.
4. Run het schema.
5. Ga naar Authentication > URL Configuration.
6. Zet voorlopig Site URL op:

```text
http://127.0.0.1:5173
```

7. Start TrainIQ lokaal:

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

8. Open:

```text
http://127.0.0.1:5173/
```

9. Vul in de Data-tab de Supabase URL en anon key in.
10. Stuur een magic link naar je e-mail.
11. Upload lokale workouts.
12. Haal cloud-workouts op als controle.

## Verwacht Resultaat

Na deze stap staat de basis-sync:

- workouts blijven lokaal bruikbaar;
- workouts kunnen naar Supabase;
- intervalblokken worden opgeslagen in `workout_laps`;
- dezelfde data kan later op telefoon geladen worden;
- Strava-import kan daarna bovenop deze basis gebouwd worden.

## Niet Nu Doen

- Nog geen Strava OAuth.
- Nog geen automatische Garmin-flow.
- Nog geen uitgebreide analyseblokken.

Eerst moet de cloud-opslag betrouwbaar werken met een paar workouts.
