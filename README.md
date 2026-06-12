# TrainIQ

Persoonlijke trainingshub voor workouts, basisanalyse en later Strava/Supabase-sync.

## Huidige MVP

- Dashboard met kerncijfers voor opgeslagen workouts.
- Workout-logboek met sportfilter.
- Handmatige workout-invoer met kalender/agenda.
- CSV-import als fallback voor Google Sheets.
- Eerste analyse: vergelijk trainingen met dezelfde sport en hetzelfde type.
- Centrale workout-data-laag in `data/workoutModel.js` en `data/workoutStore.js`.
- Supabase-voorbereiding in `schema.sql`, `data/supabaseWorkoutMapper.js` en `data/supabaseWorkoutStore.js`.
- Handmatige Supabase-sync via de Data-tab: magic-link login, lokale workouts uploaden en cloud-workouts ophalen.

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
  notes,
  createdAt,
  updatedAt
}
```

CSV-import gebruikt dezelfde namen. Oude CSV's met `label` blijven werken; die worden omgezet naar `workoutType`.

## Supabase

1. Maak een Supabase-project.
2. Kopieer `.env.example` naar `.env` en vul `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY`.
3. Draai `schema.sql` in de Supabase SQL editor.
4. Open de Data-tab in de app.
5. Vul je Supabase URL en anon key in.
6. Stuur een magic link naar je e-mailadres en open die link.
7. Gebruik daarna `Lokale workouts uploaden` of `Cloud workouts ophalen`.

De app blijft localStorage gebruiken als lokale cache. Supabase-sync is voorlopig handmatig, zodat de basis controleerbaar blijft.

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
