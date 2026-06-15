# TrainIQ

Persoonlijke trainingshub voor workouts, basisanalyse en later Strava/Supabase-sync.

## Huidige MVP

- Dashboard met kerncijfers voor opgeslagen workouts.
- Workout-logboek met sportfilter.
- Handmatige workout-invoer met kalender/agenda en de V1-velden voor tijd, afstand, pace, hartslag, load en hoogtemeters.
- CSV-import als fallback voor Google Sheets.
- Eerste analyse: vergelijk trainingen met dezelfde sport en hetzelfde type.
- Intervalanalyse voor trainingen zoals 5 x 1 km: pace, tijd en hartslag per blok.
- HYROX segmentmodel voor run, SkiErg, RowErg, sled push/pull, burpees, lunges, wall balls en krachtblokken.
- Supabase-tabellen voor PR's en trainingsdoelen, zodat progressie later niet alleen uit losse workouts hoeft te worden afgeleid.
- Centrale workout-data-laag in `data/workoutModel.js` en `data/workoutStore.js`.
- Supabase-voorbereiding in `schema.sql`, `data/supabaseWorkoutMapper.js` en `data/supabaseWorkoutStore.js`.
- Handmatige Supabase-sync via de Data-tab: magic-link login, lokale workouts plus intervalblokken uploaden en cloud-workouts ophalen.

## Lokaal draaien

Omdat de app ES modules gebruikt, open je `index.html` niet direct als bestand. Start een lokale server:

```bash
python3 -m http.server 5173 --bind 127.0.0.1
```

Daarna staat de app op:

```text
http://127.0.0.1:5173/
```

## Workout Model

De app gebruikt intern camelCase:

```js
{
  id,
  source,
  externalId,
  date,
  startTime,
  sport,
  title,
  workoutType,
  durationMin,
  distanceKm,
  avgHr,
  maxHr,
  load,
  avgPace,
  elevationGain,
  intervals,
  segments,
  intervalFamily,
  repDistanceMeters,
  repDurationSeconds,
  repCount,
  qualityVolumeMeters,
  qualityDurationSeconds,
  notes,
  createdAt,
  updatedAt
}
```

CSV-import gebruikt dezelfde namen. Oude CSV's met `label` blijven werken; die worden omgezet naar `workoutType`.

`intervals` is een array met blokken:

```js
{
  intervalIndex,
  name,
  durationSeconds,
  distanceMeters,
  avgHr,
  maxHr,
  avgPace
}
```

`segments` is bedoeld voor HYROX-onderdelen en mixed workouts:

```js
{
  segmentIndex,
  segmentType,
  name,
  durationSeconds,
  distanceMeters,
  reps,
  weightKg,
  avgHr,
  maxHr,
  avgPace,
  avgWatts,
  rpe,
  load,
  notes
}
```

Voor progressieve overload leidt de app automatisch een intervalprofiel af. Een training met 6 blokken van 1 km krijgt bijvoorbeeld:

```js
{
  intervalFamily: "1km-reps",
  repDistanceMeters: 1000,
  repDurationSeconds: 0,
  repCount: 6,
  qualityVolumeMeters: 6000,
  qualityDurationSeconds: 1425
}
```

Tijdsblokken worden ook ondersteund. Een training met 3 blokken van 10 minuten krijgt bijvoorbeeld `intervalFamily: "10min-reps"`, `repDurationSeconds: 600` en `qualityDurationSeconds: 1800`. Als er afstand per blok beschikbaar is, wordt `qualityVolumeMeters` ook gevuld.

## Supabase

1. Maak een Supabase-project.
2. Kopieer `.env.example` naar `.env` en vul `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY`.
3. Draai `schema.sql` in de Supabase SQL editor.
4. Open de Data-tab in de app.
5. Vul je Supabase URL en anon key in.
6. Stuur een magic link naar je e-mailadres en open die link.
7. Gebruik daarna `Lokale workouts uploaden` of `Cloud workouts ophalen`.

De app blijft localStorage gebruiken als lokale cache. Supabase-sync is voorlopig handmatig, zodat de basis controleerbaar blijft. Workouts worden opgeslagen in `workouts`; intervalblokken worden opgeslagen in `workout_laps`; HYROX-stations en mixed-workout onderdelen worden opgeslagen in `workout_segments`; PR's en doelen staan klaar in `personal_records` en `training_goals`.

Nieuwe Supabase-wijzigingen staan ook als losse migraties in `supabase/migrations/`.

Voor de volgende werksessie staat een concreet stappenplan in `NEXT_STEPS.md`.

## Persoonlijke Deploy

Aanbevolen setup voor gebruik op MacBook en telefoon:

1. Maak een nieuwe persoonlijke GitHub repository.
2. Zet de `origin` remote naar die nieuwe repo.
3. Push deze code naar GitHub.
4. Maak een Vercel-project vanuit die GitHub repo.
5. Deploy de app.
6. Open de Vercel URL op je telefoon en voeg hem toe aan je beginscherm.
7. Log in via Supabase magic link.

GitHub is alleen voor code. Vercel host de app. Supabase bewaart je trainingsdata.

## Volgende Stap

De logische volgende stap is automatische sync:

1. Na login automatisch cloud-workouts laden.
2. Handmatige en CSV-workouts direct naar Supabase schrijven.
3. Daarna Strava OAuth en activity-import toevoegen.
