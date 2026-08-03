# TrainIQ analysemodellen rapport

Datum: 29 juni 2026

## Wat er nu is toegevoegd

### 1. Training load model

Er is een eerste TrainIQ load score toegevoegd. Dit is bewust geen officiele TSS, maar een transparante proxy:

- duur x intensiteitsfactor
- Z2 krijgt een lagere factor
- threshold krijgt een hogere factor
- VO2max krijgt een hoge factor
- HYROX/race/all-out krijgt een hoge factor
- kracht krijgt voorlopig een aparte duur/RPE-achtige proxy

De app berekent hieruit:

- load per workout
- 7 dagen load
- 28 dagen load
- CTL / fitness, 42 dagen EWMA
- ATL / fatigue, 7 dagen EWMA
- TSB / vorm, CTL - ATL
- ramp-rate over 7 dagen

### 2. Analysekwaliteit per workout

Elke workout krijgt nu een analysekwaliteit:

- `bruikbaar`
- `mist_data`
- `bewust_onbekend`
- `excluded`

De app kijkt onder andere naar:

- duur aanwezig
- pace/afstand aanwezig
- HR aanwezig waar relevant
- laps/werkblokken aanwezig
- bewust onbekende splitdata
- of de workout wel in een analysefamilie hoort

HR blokkeert VO2max niet, omdat VO2max nu vooral op pace en repkwaliteit wordt beoordeeld. HR is bij Z2 wel belangrijker.

### 3. VO2 analyse

Voor VO2max berekent de app nu:

- aantal werkblokken
- totale werktijd
- totale afstand
- gemiddelde werkblok-pace
- snelste rep
- langzaamste rep
- verval tussen eerste en laatste rep
- aantal goede reps met genoeg data

VO2 wordt alleen gevuld met workouts die echt VO2/Norwegian/4x4/4x1km-achtig zijn.

Het VO2-scherm toont nu ook een rep-by-rep vergelijking van de nieuwste VO2-sessie:

- bloknaam en status
- tijd
- afstand
- pace
- optionele HR
- verschil ten opzichte van eerdere vergelijkbare VO2-sessies met hetzelfde profiel

De vergelijkbare VO2-workouts staan in een uitklapblok zodat het scherm rustiger blijft.

### 4. Threshold analyse

Voor threshold berekent de app nu:

- aantal werkblokken
- totale threshold werktijd
- totale afstand
- gemiddelde threshold pace
- pace-spreiding
- pace-variatie
- aantal goede blokken met genoeg data

Threshold blijft apart van Z2 over/unders en VO2max.

Het threshold-scherm gebruikt nu dezelfde opbouw als VO2, maar focust op:

- blokvergelijking
- gemiddelde threshold pace
- pace-stabiliteit
- variatie tussen blokken
- verval/signaal over de sessie
- vergelijkbare threshold-workouts in een uitklapblok

### 5. Datamodel voorbereid

Elke workout krijgt lokaal een snapshot in:

```js
rawPayload.analysis
```

Daarin staan onder andere:

- analyseversie
- analysefamilie
- load score
- intensiteitsfactor
- confidence
- quality status
- VO2 metrics
- threshold metrics
- handmatige sessie-RPE als die is ingevuld

Er zijn geen destructieve Supabase-wijzigingen gedaan en er is geen SQL-migratie nodig. Later kunnen we dit model pas naar echte kolommen of views migreren als het klopt.

### 6. RPE-input voor kracht en HYROX

Voor kracht- en HYROX-workouts staat in het workout-detail nu een sessie-RPE veld. Dit wordt lokaal opgeslagen in:

```js
rawPayload.reviewContext.sessionRpe
```

De training load gebruikt die RPE als eerste bron voor kracht/HYROX. Als er geen sessie-RPE staat, valt de app terug op bestaande segment-RPE of de standaard intensiteitsfactor.

## Bestanden aangepast

- `app.js`
- `index.html`
- `styles.css`
- `sw.js`

## Bronnen gebruikt

Gebruikte lokale bronnen:

- `sportanalyse_modellen_matrix.html`
- `sportanalyse_volledig_rapport.html`
- `Onderzoek naar geavanceerde analysemethoden voor sportdata.pdf`

Online bronnen:

- TrainingPeaks over TSS en Performance Management Chart
- Intervals.icu als referentie voor fitness/fatigue/form, intervalanalyse en custom analytics
- ACWR-literatuur als waarschuwing om load-ratio's alleen als signaal te gebruiken

## Wat bewust nog niet is toegevoegd

Nog niet toegevoegd:

- Critical Speed / Critical Power
- W-prime balance
- HRV baseline
- DFA-alpha1
- blessurerisico voorspelling
- HYROX state-machine analyse

Reden: deze modellen hebben meer betrouwbare input of validatie nodig. Eerst moet de basis voor Z2, VO2max en threshold kloppen.

## Correctie 30 juni 2026

Na controle met echte data zijn de intensiteitsfilters aangescherpt:

- VO2max gebruikt nu niet alleen de titel, maar ook `trainingGoal`, `bulkCategory` en `workoutType`. Daardoor komen VO2-workouts uit de bulkclassificatie ook mee in de analyse.
- Threshold is juist strenger geworden voor gegenereerde titels zoals `Training 123...`. Die worden alleen nog meegenomen als de titel zelf threshold/drempel/tempo/over-under bevat.
- In de intensiteitstabellen wordt bij hardlopen expliciet `Pace /km` getoond, zodat run-analyse niet als ERG `/500m` wordt gelezen.

Voor training load is de volgende aanbevolen databron Intervals.icu, omdat die al gecontroleerde velden zoals activity load, fitness/fatigue/form en intervals kan leveren. Garmin Activity API blijft interessant voor ruwe FIT-data, maar vraagt eerst Garmin-goedkeuring en is daardoor minder snel inzetbaar voor jouw persoonlijke MVP.

## Volgende stap

### Stap 1: Intervallen data check verfijnen

Toevoegen of aanscherpen:

- incomplete VO2- en threshold-blokken direct markeren in Datacheck
- sneller handmatig HR/afstand/pace aanvullen per blok
- automatische labels blijven conservatief zodat kracht/HYROX niet per ongeluk meetellen

### Stap 2: Load verder betrouwbaarder maken

Toevoegen:

- optionele handmatige intensiteit naast RPE
- weekoverzicht met volume, load en frequentie
- uitschieterdetectie voor onlogische load
- RPE betrouwbaarheid zichtbaar maken in de load-lijst

### Stap 3: Z2/VO2/threshold als blauwdruk gebruiken

Zodra Z2 visueel en inhoudelijk goed voelt, gebruiken we dezelfde opbouw voor:

- VO2max
- threshold
- HYROX compromised running
- HYROX stations
