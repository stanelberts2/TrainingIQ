# Strava koppeling

Deze versie gebruikt Supabase Edge Functions. Je Strava client secret komt dus niet in de browser of in GitHub terecht.

## 1. SQL uitvoeren

Run eerst `supabase/migrations/20260615_strava_sync.sql` in de Supabase SQL editor.

## 2. Strava app maken

Maak een app via Strava Developers. Zet bij de callback/authorization domain je Supabase projectdomein:

```text
izbhhunefxtygkswwsjl.supabase.co
```

Gebruik als OAuth redirect URL:

```text
https://izbhhunefxtygkswwsjl.supabase.co/functions/v1/strava-oauth-callback
```

## 3. Supabase secrets zetten

Zet deze secrets in Supabase voor de Edge Functions:

```text
SUPABASE_URL=https://izbhhunefxtygkswwsjl.supabase.co
SUPABASE_ANON_KEY=<jouw publishable/anon key>
SUPABASE_SERVICE_ROLE_KEY=<jouw Supabase service role secret>
STRAVA_CLIENT_ID=<jouw Strava client id>
STRAVA_CLIENT_SECRET=<jouw Strava client secret>
STRAVA_REDIRECT_URI=https://izbhhunefxtygkswwsjl.supabase.co/functions/v1/strava-oauth-callback
STRAVA_VERIFY_TOKEN=<zelf gekozen lange random tekst>
STRAVA_INTERNAL_SECRET=<zelf gekozen lange random tekst>
STRAVA_SCOPE=activity:read_all
APP_URL=http://127.0.0.1:5174/
```

Voor later, wanneer de app online staat, vervang je `APP_URL` door je echte app-url.

## 4. Edge Functions deployen

Deploy deze functies:

```text
strava-auth-url
strava-oauth-callback
strava-webhook
strava-import-activity
strava-sync-now
```

JWT-verificatie:

```text
strava-auth-url: JWT verificatie AAN
strava-oauth-callback: JWT verificatie UIT
strava-webhook: JWT verificatie UIT
strava-import-activity: JWT verificatie UIT
strava-sync-now: JWT verificatie AAN
```

De callback en webhook moeten publiek bereikbaar zijn voor Strava. De import-functie is alsnog beschermd met `STRAVA_INTERNAL_SECRET`.

## 5. Webhook subscription maken

Maak daarna in Strava een webhook subscription met:

```text
callback_url=https://izbhhunefxtygkswwsjl.supabase.co/functions/v1/strava-webhook
verify_token=<dezelfde STRAVA_VERIFY_TOKEN>
```

Strava valideert deze callback met een GET request. De functie geeft de vereiste `hub.challenge` terug.

## Wat werkt hiermee

- Je koppelt jouw Strava-account via OAuth.
- Tokens worden server-side in Supabase opgeslagen.
- Nieuwe of bijgewerkte Strava activiteiten komen via de webhook binnen.
- De importer haalt de activiteit en laps op en schrijft ze naar `workouts` en `workout_laps`.
- Via de Data-tab kan `Recente Strava activiteiten syncen` handmatig de laatste activiteiten ophalen zonder webhook.
- Via `Strava historie syncen` kan een grotere batch geschiedenis worden opgehaald. Deze run is bewust begrensd om timeouts/API-limieten te voorkomen.
- Geimporteerde laps kunnen in de analyse worden gelabeld als Run, SkiErg, RowErg of Bike voor betere vergelijkingen.
- Daarna kun je in TrainingIQ `Cloud workouts ophalen` gebruiken om de nieuwe activiteit lokaal zichtbaar te maken.

Strava geeft niet automatisch HYROX stations zoals sled push of wall balls als aparte stations mee. Die blijven voorlopig handmatig of via latere herkenning uit streams/notes.
