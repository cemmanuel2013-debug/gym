# Fitbyclin Fitness App

Web-App fürs iPhone. Läuft ohne Server-Backend, alle Daten bleiben auf dem Gerät
(Plan, Trainings, Notizen und Chat in `localStorage`, Videos in IndexedDB).

## Lokal starten

```bash
python -m http.server 5173 --directory app
```

Danach im Browser `http://localhost:5173` öffnen.

## Aufbau

- `index.html`, `css/style.css`: Grundgerüst und Design
- `js/store.js`: Datenmodell, Speichern, Videos
- `js/exercises.js`: Übungsdatenbank und eigene/ATG-Übungen
- `js/timers.js`: Pausentimer und Countdown für Zeitübungen
- `js/views/`: die einzelnen Seiten (Heute, Kalender, Plan, Training, Verlauf, Chat, Einstellungen)
- `data/exercises.json`: 876 Übungen aus free-exercise-db (The Unlicense), Bilder per jsDelivr
- `sw.js`: Offline-Cache. Bei jeder neuen Version `VERSION` hochzählen.
