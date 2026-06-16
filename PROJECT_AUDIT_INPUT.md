# TrainIQ Project Audit Input

Laatste auditupdate: 2026-06-16

Aanvulling na externe audit: enkele veilige quick wins zijn verwerkt in de codebase:

- CORS is aangepast van wildcard naar een kleine origin-whitelist rond `APP_URL`, localhost en `127.0.0.1`.
- Er is een additive migration voor Strava webhook-deduplicatie toegevoegd.
- `profiles` is voorbereid met HYROX-divisie, leeftijdsgroep en unit-system.
- `activity_streams` is voorbereid als toekomstige tabel voor GPS/HR/pace/power streams.
- `workout_laps` heeft nu `exercise_type` en `lap_role`, zodat gemengde erg-workouts per ronde als SkiErg/RowErg/Bike/etc. gelabeld kunnen worden.
- `workout_laps` heeft nu ook `effort_goal`, zodat bijvoorbeeld Z2 SkiErg-rondes apart vergeleken worden van all-out HYROX-rondes.
- Strava-herimport merge't bestaande handmatige lapmetadata terug op basis van `lap_index`, zodat labels/doelen behouden blijven.
- `strava-sync-now` ondersteunt naast recente sync ook een begrensde historie-sync.
- Grote breaking changes uit de audit, zoals `workouts.id` migreren naar UUID en tokenencryptie, zijn bewust nog niet uitgevoerd.

Dit document vat de volledige huidige codebase samen voor een externe software architect. Het doel is beoordeling van architectuur, datamodel, security, schaalbaarheid, analytics-richting en technische schuld zonder directe toegang tot alle bronbestanden.

## 1. Volledige Mapstructuur

```text
trainiq-prototype/
├── index.html
├── app.js
├── styles.css
├── sw.js
├── icon.svg
├── manifest.webmanifest
├── package.json
├── package-lock.json
├── README.md
├── NEXT_STEPS.md
├── STRAVA_SETUP.md
├── PROJECT_AUDIT_INPUT.md
├── schema.sql
├── lib/
│   └── supabase.js
├── data/
│   ├── workoutModel.js
│   ├── workoutStore.js
│   ├── supabaseWorkoutMapper.js
│   └── supabaseWorkoutStore.js
└── supabase/
    ├── migrations/
    │   ├── 20260615_hyrox_segments.sql
    │   ├── 20260615_hyrox_goals_prs.sql
    │   ├── 20260615_strength_and_farmer_carry.sql
    │   └── 20260615_strava_sync.sql
    └── functions/
        ├── _shared/
        │   ├── cors.js
        │   ├── strava_client.js
        │   ├── strava_mapper.js
        │   └── supabase_clients.js
        ├── strava-auth-url/
        │   └── index.ts
        ├── strava-oauth-callback/
        │   └── index.ts
        ├── strava-webhook/
        │   └── index.ts
        ├── strava-import-activity/
        │   └── index.ts
        └── strava-sync-now/
            └── index.ts
```

Genegeerde lokale mappen/bestanden: `node_modules/`, `dist/`, `.tools/`, `supabase/.temp/`, `.env`, `.env.local`.

### Implementatiesamenvatting

De applicatie is momenteel een statische ES-module frontend met Supabase als cloud-backend en Supabase Edge Functions voor Strava OAuth/import. Er is geen framework zoals React/Vue; UI, state, rendering en event-binding staan grotendeels in `app.js`. De app kan lokaal via `python3 -m http.server` draaien en gebruikt `localStorage` als lokale cache.

## 2. Database Schema

Het hoofdscript `schema.sql` is bedoeld als reproduceerbare basis voor Supabase. Losse migraties in `supabase/migrations/` leggen incrementele wijzigingen vast. De database gebruikt `pgcrypto` voor UUID-generatie.

### Kernentiteiten

```text
auth.users
└── profiles
└── data_sources
└── workouts
    ├── workout_laps
    ├── workout_segments
    └── detected_intervals
└── personal_records
└── training_goals
└── oauth_states
└── strava_webhook_events
└── strava_import_logs
```

### Belangrijkste ontwerpkeuzes

- `workouts.id` is `text`, zodat externe IDs zoals `strava-123456` direct bruikbaar zijn.
- `workouts` bevat workout-level metrics: datum, sport, type, duur, afstand, pace, HR, load, elevation en intervalprofiel.
- `workout_laps` bevat lap/intervalblokken binnen een workout.
- `workout_segments` bevat HYROX-stations en krachtblokken binnen een workout.
- `raw_payload jsonb` wordt op meerdere tabellen gebruikt voor Strava payloads en toekomstige debugging.
- `data_sources` bewaart OAuth/provider-koppelingen per gebruiker.
- Strava access/refresh tokens worden in kolommen met naam `*_encrypted` opgeslagen, maar er is op dit moment geen zichtbare applicatielaag-encryptie; dit vertrouwt feitelijk op Supabase database security/service role.

## 3. Alle Tabellen En Relaties

### `profiles`

Doel: profielmetadata per Supabase Auth user.

Velden:

- `id uuid primary key references auth.users(id) on delete cascade`
- `display_name text`
- `created_at timestamptz`
- `updated_at timestamptz`

Relatie: 1-op-1 met `auth.users`.

### `data_sources`

Doel: externe data/provider accounts zoals Strava, Garmin, Google Sheets.

Velden:

- `id uuid primary key`
- `user_id uuid references auth.users(id) on delete cascade`
- `provider text check ('manual', 'google_sheets', 'strava', 'garmin')`
- `external_account_id text`
- `access_token_encrypted text`
- `refresh_token_encrypted text`
- `token_expires_at timestamptz`
- `last_sync_at timestamptz`
- `provider_scope text`
- `provider_profile jsonb`
- `sync_status text check ('idle', 'connected', 'syncing', 'error', 'revoked')`
- `last_error text`
- `raw_payload jsonb`
- timestamps
- `unique (user_id, provider)`

Relatie: veel data sources per user, maximaal 1 per provider per user.

Indexes:

- `(provider, external_account_id)` voor webhook owner-id lookup.

### `workouts`

Doel: hoofdentiteit voor trainingssessies.

Velden:

- `id text primary key`
- `user_id uuid references auth.users(id) on delete cascade`
- `source text check ('manual', 'google_sheets', 'strava', 'garmin')`
- `external_id text`
- `date date`
- `start_time time`
- `sport text check ('running', 'hyrox', 'strength', 'cycling')`
- `title text`
- `workout_type text`
- `duration_min numeric`
- `distance_km numeric`
- `avg_hr integer`
- `max_hr integer`
- `load numeric`
- `avg_pace text`
- `elevation_gain numeric`
- interval profile: `interval_family`, `rep_distance_meters`, `rep_duration_seconds`, `rep_count`, `quality_volume_meters`, `quality_duration_seconds`
- `notes text`
- `raw_payload jsonb`
- timestamps
- `unique (user_id, source, external_id)`

Relaties:

- 1 workout -> many `workout_laps`
- 1 workout -> many `workout_segments`
- 1 workout -> many `detected_intervals`
- optional 1 workout -> many `personal_records`

Indexes:

- `(user_id, date desc)`
- `(user_id, sport, workout_type, date desc)`
- `(user_id, sport, workout_type, interval_family, date desc)`
- `(source, external_id)`

### `workout_laps`

Doel: Strava laps en handmatige intervalblokken.

Velden:

- `id uuid primary key`
- `workout_id text references workouts(id) on delete cascade`
- `lap_index integer`
- `name text`
- `start_offset_seconds numeric`
- `duration_seconds numeric`
- `distance_meters numeric`
- `avg_hr integer`
- `max_hr integer`
- `avg_pace text`
- `raw_payload jsonb`
- `unique (workout_id, lap_index)`

Relatie: child van `workouts`.

### `workout_segments`

Doel: HYROX-stations, mixed workouts en krachtsets binnen dezelfde workout.

Velden:

- `id uuid primary key`
- `workout_id text references workouts(id) on delete cascade`
- `segment_index integer`
- `segment_type text check ('run', 'ski_erg', 'row_erg', 'sled_push', 'sled_pull', 'burpee_broad_jump', 'sandbag_lunge', 'farmer_carry', 'wall_ball', 'strength', 'rest', 'transition', 'other')`
- `name text`
- `start_offset_seconds numeric`
- `duration_seconds numeric`
- `distance_meters numeric`
- `sets integer`
- `reps integer`
- `weight_kg numeric`
- `avg_hr integer`
- `max_hr integer`
- `avg_pace text`
- `avg_watts numeric`
- `rpe numeric check 0..10`
- `load numeric`
- `notes text`
- `raw_payload jsonb`
- `unique (workout_id, segment_index)`

Relatie: child van `workouts`.

### `detected_intervals`

Doel: later automatisch herkende intervals uit streams/laps.

Velden:

- `id uuid primary key`
- `workout_id text references workouts(id) on delete cascade`
- `interval_index integer`
- `source text check ('strava_laps', 'streams', 'trainiq')`
- `label text`
- start/end/duration/distance
- HR/pace/confidence/notes
- `unique (workout_id, interval_index)`

Status: voorbereid maar nog niet actief gebruikt door frontend.

### `personal_records`

Doel: PR's en benchmark-resultaten.

Velden:

- `id uuid primary key`
- `user_id uuid references auth.users(id)`
- `workout_id text references workouts(id) on delete set null`
- `segment_type text`
- `metric_name text`
- `metric_value numeric`
- `metric_unit text`
- `achieved_at date`
- `source text check ('manual', 'computed', 'strava', 'garmin')`
- `notes text`
- timestamps
- `unique (user_id, segment_type, metric_name, metric_unit)`

Status: schema is klaar; UI/business logic nog beperkt of afwezig.

### `training_goals`

Doel: trainingsdoelen per user.

Velden:

- `id uuid primary key`
- `user_id uuid references auth.users(id)`
- `title text`
- `sport text`
- `segment_type text`
- `metric_name text`
- `target_value numeric`
- `target_unit text`
- `baseline_value numeric`
- `due_date date`
- `status text check ('active', 'achieved', 'paused', 'archived')`
- `notes text`
- timestamps

Status: schema is klaar; UI/business logic nog beperkt of afwezig.

### `oauth_states`

Doel: CSRF/state management voor Strava OAuth.

Velden:

- `id uuid primary key`
- `user_id uuid references auth.users(id)`
- `provider text check ('strava')`
- `state text unique`
- `redirect_to text`
- `expires_at timestamptz`
- `consumed_at timestamptz`
- `created_at timestamptz`

Relatie: temporary OAuth state per user.

### `strava_webhook_events`

Doel: ontvangen Strava webhook-events loggen en koppelen aan user.

Velden:

- `id uuid primary key`
- `user_id uuid references auth.users(id) on delete set null`
- `owner_id text`
- `object_id text`
- `object_type text`
- `aspect_type text`
- `event_time timestamptz`
- `subscription_id text`
- `updates jsonb`
- `processed_at timestamptz`
- `processing_error text`
- `raw_payload jsonb`
- `created_at timestamptz`

Status: webhook endpoint bestaat en logt events. Subscription creation is niet geautomatiseerd in de codebase.

### `strava_import_logs`

Doel: import/sync feedback en debugging.

Velden:

- `id uuid primary key`
- `user_id uuid references auth.users(id)`
- `activity_id text`
- `status text check ('queued', 'imported', 'skipped', 'error')`
- `message text`
- `started_at timestamptz`
- `finished_at timestamptz`
- `created_at timestamptz`

## 4. RLS Policies

RLS is ingeschakeld voor:

- `profiles`
- `data_sources`
- `workouts`
- `workout_laps`
- `workout_segments`
- `detected_intervals`
- `personal_records`
- `training_goals`
- `oauth_states`
- `strava_webhook_events`
- `strava_import_logs`

### Policy-overzicht

- `profiles_select_own`, `profiles_insert_own`, `profiles_update_own`: user mag eigen profiel lezen/schrijven.
- `data_sources_own_all`: user mag eigen provider-koppelingen lezen/schrijven.
- `workouts_own_all`: user mag eigen workouts lezen/schrijven.
- `workout_laps_own_all`: toegang via parent `workouts.user_id = auth.uid()`.
- `workout_segments_own_all`: toegang via parent `workouts.user_id = auth.uid()`.
- `detected_intervals_own_all`: toegang via parent `workouts.user_id = auth.uid()`.
- `personal_records_own_all`: user mag eigen PRs beheren.
- `training_goals_own_all`: user mag eigen doelen beheren.
- `oauth_states_own_all`: user mag eigen OAuth states beheren.
- `strava_webhook_events_select_own`: user mag eigen webhook events lezen. Duplicaten worden voorbereid met een unieke index op owner/object/aspect/event-time.
- `strava_import_logs_select_own`: user mag eigen import logs lezen.

### Security-samenvatting

Client-side toegang is owner-scoped via RLS. Edge Functions gebruiken `SUPABASE_SERVICE_ROLE_KEY`, waardoor RLS wordt omzeild voor server-side OAuth/import. Dat is correct voor trusted server code, maar vergroot het belang van strakke function-authenticatie.

### Security-risico's

- `access_token_encrypted` en `refresh_token_encrypted` zijn niet aantoonbaar applicatie-encrypted; kolomnamen suggereren encryptie, maar code slaat tokenstrings direct op.
- CORS is niet langer wildcard en gebruikt een origin-whitelist. Voor productie moet deze lijst naar alleen echte app-domeinen worden teruggebracht.
- `strava-import-activity` is publiek bereikbaar met JWT verificatie uit en vertrouwt op `STRAVA_INTERNAL_SECRET`.
- `strava-webhook` is publiek bereikbaar en valideert alleen GET-verificatie met verify token; POST vertrouwt op Strava payload + owner mapping.
- `strava-sync-now` vereist user JWT via `requireUser`, wat de juiste default is.

## 5. Edge Functions

### Shared modules

#### `_shared/cors.js`

Levert request-aware CORS headers, `jsonResponse` en `errorResponse`. CORS gebruikt nu een kleine allowlist in plaats van wildcard.

#### `_shared/supabase_clients.js`

Levert:

- `getEnv(name)`
- `createUserClient(req)` met request Authorization header
- `createServiceClient()` met service role
- `requireUser(req)` voor authenticated function calls

#### `_shared/strava_client.js`

Levert Strava API wrapper:

- `exchangeCodeForToken(code)`
- `refreshToken(refreshTokenValue)`
- `getValidStravaToken(supabase, dataSource)`
- `fetchStravaActivity(accessToken, activityId)`
- `fetchStravaActivities(accessToken, limit)`
- `fetchStravaActivityLaps(accessToken, activityId)`

Token refresh schrijft nieuwe access/refresh token terug naar `data_sources`.

#### `_shared/strava_mapper.js`

Mapt Strava naar database rows:

- `mapStravaWebhookEvent(payload, userId)`
- `mapStravaActivityToWorkoutRows(activity, laps, userId)`

Mapping:

- Strava activity -> `workouts`
- Strava laps -> `workout_laps`
- `sport_type/type` -> `running`, `cycling` of `strength`
- name heuristics -> `threshold`, `interval`, `tempo`, `hyrox`, fallback type
- lap distances/durations -> pace en interval profile

### `strava-auth-url`

Doel: aangemelde user start Strava OAuth.

Flow:

1. Require Supabase user JWT.
2. Maak `oauth_states` row met random `state`, user id, redirect target en expiry.
3. Bouw Strava authorize URL met `STRAVA_CLIENT_ID`, `STRAVA_REDIRECT_URI`, `STRAVA_SCOPE`.
4. Return `{ url }`.

JWT verificatie: aan.

### `strava-oauth-callback`

Doel: Strava redirect/callback verwerken.

Flow:

1. Lees `code`, `state`, `scope`, `error`.
2. Valideer `oauth_states.state`, provider, expiry en `consumed_at`.
3. Wissel code voor access/refresh token bij Strava.
4. Upsert `data_sources` voor provider `strava`.
5. Markeer state consumed.
6. Redirect naar `APP_URL` of originele `redirect_to` met `?strava=connected` of `?strava=error&message=...`.

JWT verificatie: uit, omdat Strava callback geen Supabase JWT meestuurt.

### `strava-webhook`

Doel: Strava webhook validatie en event handling.

Flow GET:

1. Controleer `hub.verify_token`.
2. Return `{ "hub.challenge": challenge }`.

Flow POST:

1. Parse event payload.
2. Zoek `data_sources` op `provider='strava'` en `external_account_id=owner_id`.
3. Insert `strava_webhook_events`.
4. Voor `activity` create/update: start background import via `strava-import-activity`.

JWT verificatie: uit, want Strava POST geen Supabase JWT.

Status: function werkt, maar webhook subscription creation is nog handmatig/niet geautomatiseerd.

### `strava-import-activity`

Doel: interne import van 1 Strava activity.

Auth:

- JWT uit
- vereist header `x-internal-secret == STRAVA_INTERNAL_SECRET`

Flow:

1. Body bevat `userId`, `activityId`.
2. Zoek Strava `data_source`.
3. Refresh token indien nodig.
4. Fetch activity detail + laps.
5. Map naar `workouts` en `workout_laps`.
6. Upsert workout, vervang laps.
7. Update `data_sources.last_sync_at`.
8. Log in `strava_import_logs`.

### `strava-sync-now`

Doel: handmatige/directe sync vanuit UI voor recente Strava activiteiten.

Auth:

- JWT aan via `requireUser`.

Flow:

1. Require Supabase user.
2. Zoek user `data_sources` voor Strava.
3. Zet `sync_status='syncing'`.
4. Refresh token indien nodig.
5. Fetch recente activities via `/athlete/activities`.
6. Per activity: fetch detail + laps.
7. Upsert `workouts`, vervang `workout_laps`, log import.
8. Zet `sync_status='connected'`, update `last_sync_at`.
9. Return `{ imported, laps, checked }`.

Dit is momenteel de belangrijkste werkende Strava-syncroute.

## 6. API Structuur

### Frontend -> Supabase Database

Via `data/supabaseWorkoutStore.js`:

- `getCurrentUser()`
- `signInWithEmail(email)`
- `signOut()`
- `getStravaDataSource()`
- `getStravaAuthUrl()`
- `syncStravaNow(limit)`
- `loadSupabaseWorkouts()`
- `saveSupabaseWorkout(workout)`
- `saveSupabaseWorkouts(workouts)`

### Frontend -> Edge Functions

Via Supabase JS `functions.invoke()`:

- `strava-auth-url`: returnt Strava OAuth URL.
- `strava-sync-now`: importeert recente Strava activiteiten.

### Edge Functions -> Strava API

Endpoints:

- `GET https://www.strava.com/oauth/authorize`
- `POST https://www.strava.com/api/v3/oauth/token`
- `GET https://www.strava.com/api/v3/athlete/activities`
- `GET https://www.strava.com/api/v3/activities/{id}`
- `GET https://www.strava.com/api/v3/activities/{id}/laps`

### Edge Functions -> Supabase DB

Server-side met service role:

- OAuth state insert/update
- `data_sources` upsert/update
- `workouts` upsert
- `workout_laps` delete/insert
- `strava_import_logs` insert
- `strava_webhook_events` insert/update

## 7. State Management

### Frontend state

`app.js` bevat een singleton `state`:

```js
{
  workouts,
  selectedWorkoutId,
  sportFilter,
  calendarOpen,
  calendarMonth,
  selectedDate,
  supabaseUser
}
```

### Persistentie

Lokale cache:

- `localStorage["trainiq-clean-workouts"]` voor workouts.
- `localStorage["trainiq-supabase-config"]` voor Supabase URL + anon key.

Cloud:

- Supabase `workouts`, `workout_laps`, `workout_segments`.
- Directe Strava sync schrijft eerst cloud, daarna laadt frontend cloud workouts terug en bewaart die lokaal.

### Rendering

Er is geen virtual DOM. `app.js` rendert direct met `innerHTML` en DOM updates:

- `renderDashboard()`
- `renderWorkoutList()`
- `renderCalendar()`
- `renderAgenda()`
- `renderAnalysisOptions()`
- `renderAnalysis()`
- `renderIntervalComparison()`
- `renderSegmentAnalysis()`

### Event binding

Alle event listeners staan in `bindEvents()`. Er is geen centrale action/reducer laag.

## 8. Belangrijkste Business Logic

### Workout normalization

`data/workoutModel.js` is de centrale domainlaag.

Taken:

- Valideert/normaliseert sports naar `running`, `hyrox`, `strength`, `cycling`.
- Normaliseert dates, durations, numbers en optional fields.
- Parseert handmatige formdata.
- Parseert CSV records.
- Normaliseert intervals/laps.
- Normaliseert HYROX/kracht segments.
- Leidt intervalprofiel af.

### Intervalprofielen

`inferIntervalProfile(intervals)` herkent rep families:

- afstandsgebaseerd: `400m-reps`, `1km-reps`, `1200m-reps`
- tijdsgebaseerd: `10min-reps`

Afleiding:

- rondt afstanden af op 50m
- rondt durations af op 5s
- kiest meest voorkomende afstand of tijd
- telt matching reps met tolerantie
- vult `qualityVolumeMeters` en `qualityDurationSeconds`

### HYROX segmenten

Ondersteunde `segmentType` waarden:

- `run`
- `ski_erg`
- `row_erg`
- `sled_push`
- `sled_pull`
- `burpee_broad_jump`
- `sandbag_lunge`
- `farmer_carry`
- `wall_ball`
- `strength`
- `rest`
- `transition`
- `other`

Segmenten kunnen tijd, afstand, sets, reps, gewicht, wattage, HR, RPE, load en notes opslaan.

### Strava mapping

Strava activity wordt workout:

- `id = "strava-" + activity.id`
- `source = "strava"`
- `external_id = activity.id`
- duration/distance/HR/elevation/pace worden overgenomen.
- Strava laps worden `workout_laps`.
- Strava activity `name` wordt gebruikt voor heuristiek van `workout_type`.

### Manual/CSV sync

Manual workouts worden eerst lokaal opgeslagen. Via Data-tab kunnen lokale workouts naar Supabase worden geupload. CSV-import blijft lokaal totdat upload wordt gebruikt.

## 9. Analytics Architectuur

### Huidige dashboard analytics

Dashboard toont:

- aantal workouts
- totale duur
- gemiddelde load
- focus sport
- laatste training details
- sportverdeling op basis van duur

Berekening gebeurt client-side over `state.workouts`.

### Huidige vergelijkingsanalyse

`renderAnalysis()` kiest een selected workout en vergelijkt met maximaal 8 vergelijkbare workouts:

Criteria:

- zelfde `sport`
- zelfde `workoutType` lowercased

Metrics:

- gemiddelde HR delta
- load delta
- tabel met date/title/pace/HR/load

### Intervalanalyse

`renderIntervalComparison()` toont per interval:

- bloknaam
- afstand
- tijd
- pace
- HR avg/max
- vorige gemiddelde op dezelfde interval-index

Beperking: vergelijking matcht interval op index, niet op afstand/duur/family/context. Een 6x1km en 5x1km kunnen deels vergelijkbaar zijn, maar de semantiek is nog simpel.

### HYROX segmentanalyse

`renderSegmentAnalysis()` splitst:

- run segments
- station segments
- total run seconds/meters
- total station seconds
- gemiddelde station RPE

Per segment toont de UI:

- onderdeel
- tijd
- afstand/reps/sets/pace
- watts/gewicht
- HR/RPE
- vorige gemiddelde per `segmentType`

Beperking: vergelijking per `segmentType` is globaal en houdt nog geen rekening met stationvolgorde, race sim context, gewichten, fatigue-state of voorgeschiedenis.

### Toekomstige analytics-ready data

Het schema ondersteunt:

- training load trends
- interval family trends
- quality volume/duration
- HYROX station progression
- PRs
- goals
- imports/webhook logs

Maar veel hiervan is nog niet server-side geaggregeerd of visueel uitgewerkt.

## 10. Bekende Technische Schulden

### Architectuur/frontend

- `app.js` is groot en bevat state, rendering, business flow en event-binding in één bestand.
- Geen frontend framework/component-isolatie.
- Rendering via `innerHTML` kan onderhoud lastiger maken en vraagt voorzichtigheid met user-generated content.
- Geen centrale error boundary of notification system.
- Geen routelaag; views worden via classes getoggled.
- Geen typed domain model of generated Supabase types.

### Data/API

- Supabase config wordt in localStorage gezet via UI. Voor productie/deploy hoort dit build/runtime config te zijn.
- `localStorage` blijft primaire cache en kan out-of-sync raken met Supabase.
- Manual upload vervangt laps/segments per workout, maar er is geen conflictstrategie tussen apparaten.
- CSV parser is simpel en ondersteunt geen quoted CSV/commas in velden.
- `raw_payload` kan groot worden; retentie/size-limieten ontbreken.
- `workouts.id` als text is praktisch, maar vraagt consistente ID discipline.

### Security

- Tokenkolommen heten `*_encrypted`, maar applicatielaag-encryptie ontbreekt zichtbaar.
- CORS is verbeterd naar een origin-whitelist, maar bevat nog localhost voor lokale ontwikkeling.
- `strava-import-activity` vertrouwt op een shared internal secret.
- Geen rate limiting op Edge Functions.
- Geen audit op token rotation failures behalve `last_error` en logs.
- Geen secrets in repo, maar lokale setup documentatie bevat voorbeeldwaarden die in productie vervangen moeten worden.

### Supabase/database

- `schema.sql` en losse migraties overlappen deels; migratievolgorde en schema-reproductie moeten worden opgeschoond.
- Sommige tabellen zijn voorbereid maar nog niet gebruikt (`detected_intervals`, `personal_records`, `training_goals`).
- RLS voor `strava_import_logs` staat op select-only voor users; writes gebeuren via service role. Dat is logisch, maar expliciet documenteren.
- Er is nog geen database-level view/materialized view voor analytics.
- Geen server-side dedupe buiten unique constraints/upsert.

### Strava integratie

- Webhook endpoint bestaat en is getest op verification, maar webhook subscription creation is nog handmatig/niet geautomatiseerd.
- Directe sync (`strava-sync-now`) is werkend en belangrijker voor MVP.
- Strava laps zijn afhankelijk van wat Strava teruggeeft; HYROX stations worden niet automatisch uit Strava herkend.
- Strava streams worden nog niet opgehaald; daardoor geen automatische intervaldetectie op basis van GPS/HR/time series.
- Geen backoff/rate-limit handling bij Strava API calls.
- `strava-sync-now` haalt sequentieel maximaal 30 recente activities op; dat is simpel en veilig, maar geen volledige historische backfill.

### Analytics

- Vergelijking is client-side en basic.
- Similarity matching is alleen sport + workoutType.
- Intervalvergelijking matcht op index, niet op semantische rep-class + context.
- HYROX stationvergelijking matcht op type, niet op race-order, gewicht, stationvariant of fatigue.
- Training load is handmatig/0 voor Strava imports; geen TRIMP/sRPE/model.
- Geen HR zones, pace zones, power zones of periodisering.
- Geen charting library.

### DevOps/testing

- Geen unit tests.
- Geen integration tests voor mappers/functions.
- Geen CI/CD pipeline.
- Supabase functions zijn handmatig gedeployed via lokale CLI.
- README/NEXT_STEPS bevatten deels verouderde poortinformatie en moeten worden bijgewerkt naar actuele Strava-sync status.
- `sw.js` bestaat maar er is geen zichtbare service worker registratie in de huidige app.

## Samenvattende Architectuurbeoordeling

TrainIQ is nu een pragmatische MVP met een goede richting voor persoonlijke HYROX/running analytics:

- Het domeinmodel is al rijker dan een simpel workout log.
- Supabase schema bevat de juiste basisrelaties voor workouts, laps en HYROX-stations.
- RLS is in grote lijnen owner-scoped.
- Strava OAuth en directe sync werken via server-side Edge Functions.
- De app kan nu realistisch eigen trainingsdata verzamelen.

De belangrijkste architectuurkeuze voor de volgende fase is modulariseren:

1. Scheid frontend rendering, state en domain logic.
2. Maak Supabase schema/migrations consistenter.
3. Voeg echte tests toe voor Strava mappers en intervalprofielen.
4. Bouw analytics op semantische workout/segment families in plaats van simpele string/index matching.
5. Harden token storage, CORS en Edge Function auth voordat dit breder dan persoonlijk gebruik wordt.
