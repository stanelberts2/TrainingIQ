# TrainIQ Next Steps

Dit is het startpunt voor de volgende sessie.

## Status

- GitHub staat goed en is schoon gepusht naar `stanelberts2/TrainingIQ`.
- De app draait lokaal als statische ES-module app.
- Workouts worden lokaal gecachet in `localStorage` en kunnen naar Supabase worden gesynchroniseerd.
- De handmatige invoer bevat nu de V1-velden: datum, starttijd, sport, titel, type, duur, afstand, gemiddelde HR, max HR, load, pace, hoogtemeters en notities.
- Intervalblokken zijn toegevoegd voor trainingen zoals 5 x 1 km, inclusief afstand, tijd, pace, gemiddelde HR en max HR per blok.
- Intervalprofielen worden automatisch afgeleid voor overload-analyse: bijvoorbeeld `1km-reps` of `10min-reps`, rep-afstand/repduur, aantal reps, kwaliteitsvolume en kwaliteitstijd.
- HYROX-stations zijn invoerbaar in de app en worden opgeslagen als `workout_segments`, zodat run, SkiErg, RowErg, sled push/pull, burpees, lunges, farmer's carry, wall balls en krachtblokken analyseerbaar blijven binnen dezelfde workout.
- PR's en doelen zijn voorbereid als `personal_records` en `training_goals`.
- Supabase is ingericht met:
  - `schema.sql`
  - `lib/supabase.js`
  - `data/supabaseWorkoutMapper.js`
  - `data/supabaseWorkoutStore.js`
  - Data-tab in de app voor URL, anon key, magic link, upload en download.
- Strava OAuth is gekoppeld via Supabase Edge Functions.
- Directe Strava-sync werkt via `strava-sync-now`: recente activities en laps worden naar `workouts` en `workout_laps` geschreven.
- Strava historie-sync kan tot 500 activiteiten per run ophalen.
- Laps kunnen in de analyse handmatig worden gelabeld met `exercise_type`, zodat SkiErg/Row/Bike rondes apart vergelijkbaar worden.
- Laps kunnen met `effort_goal` worden gelabeld, bijvoorbeeld Z2 of all-out. Re-sync vanuit Strava behoudt deze handmatige labels.
- Audit quick wins zijn voorbereid: CORS-whitelist, webhook-deduplicatie, profielcontextvelden en `activity_streams`.

## Eerstvolgende Werk

1. Run nieuwe migraties in Supabase als ze nog niet toegepast zijn.
2. Start TrainIQ lokaal:

```bash
python3 -m http.server 5174 --bind 127.0.0.1
```

3. Open:

```text
http://127.0.0.1:5174/
```

4. Ga naar Data.
5. Klik `Strava historie syncen` als er meer vergelijkingsmateriaal nodig is.
6. Open een gemengde erg-workout in Analyse en label de rondes als SkiErg, RowErg of Bike.
7. Zet bij Z2-blokken het doel op `Z2`, zodat vergelijkingen alleen met vergelijkbare Z2-blokken gebeuren.
8. Controleer in Workouts/Analyse of laps, pace, HR en intervalprofielen kloppen.

## Verwacht Resultaat

Na deze stap is de Strava-datakwaliteit gecontroleerd:

- workouts blijven lokaal bruikbaar en cloud-backed;
- intervalblokken worden opgeslagen in `workout_laps`;
- HYROX-stations worden opgeslagen in `workout_segments`;
- Strava-activiteiten worden via directe sync geïmporteerd;
- dezelfde data kan later op telefoon geladen worden.

## Niet Nu Blind Doen

- Geen grote `workouts.id` -> UUID migratie zonder ontwerp en testplan.
- Geen tokenencryptie-refactor zonder gecontroleerde secrets/key-strategie.
- Geen AI/readiness features voordat streams, zones en load-model betrouwbaar zijn.
