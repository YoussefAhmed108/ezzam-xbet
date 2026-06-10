# World Cup 2026 Predictions

A predictions game for the FIFA World Cup 2026. Predict the winner and exact score of
each match, compete with friends in private groups, and climb the leaderboard.

- **Frontend** — React + TypeScript + Vite, built heavily on the TanStack ecosystem
  (Router, Query, Form, Table).
- **Backend** — FastAPI + MongoDB (async via Motor), JWT auth, APScheduler for
  automatic score updates, and a pluggable football data API client.

## Scoring

| Outcome                                   | Points |
| ----------------------------------------- | ------ |
| Correct winner/draw **and** exact result  | 3      |
| Correct winner/draw only                  | 1      |
| Wrong                                      | 0      |

## Rules

- A prediction for a match can only be submitted/edited up to **2 hours before kickoff**.
- Scores update automatically. By default the scheduler polls the football API on an
  interval (configurable) so results can update during the day or near-live.

## Project layout

```
.
├── server/   # FastAPI + MongoDB API
└── client/   # React + TanStack frontend
```

## Quick start

### 1. Backend

Requires **Python 3.10+**.

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then fill in your values
uvicorn app.main:app --reload
```

API docs will be available at http://localhost:8000/docs

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env          # then fill in your values (defaults work locally)
npm run dev
```

App will be available at http://localhost:5173

## Environment variables

### Backend (`server/.env`)

| Variable                     | Description                                                              |
| ---------------------------- | ----------------------------------------------------------------------- |
| `MONGODB_URI`                | MongoDB connection string                                               |
| `MONGODB_DB`                 | Database name                                                            |
| `JWT_SECRET`                 | Secret used to sign JWTs                                                 |
| `JWT_EXPIRE_MINUTES`         | Access token lifetime (minutes)                                         |
| `CORS_ORIGINS`               | Comma-separated list of allowed frontend origins                        |
| `FOOTBALL_API_PROVIDER`      | `football-data` (default) or `api-football`                             |
| `FOOTBALL_API_KEY`           | API key for the chosen provider                                         |
| `FOOTBALL_API_COMPETITION`   | Competition/league identifier (provider-specific, defaults set for WC)  |
| `FOOTBALL_API_SEASON`        | Season year (e.g. `2026`)                                               |
| `SCORE_SYNC_INTERVAL_MINUTES`| How often the scheduler polls for results                              |
| `PREDICTION_LOCK_HOURS`      | Hours before kickoff that predictions lock (default `2`)                |

### Frontend (`client/.env`)

| Variable        | Description                       |
| --------------- | --------------------------------- |
| `VITE_API_URL`  | Base URL of the backend API       |

## Troubleshooting

- **`vite build` fails with a rollup/native `.node` "different Team IDs" error** —
  this happens when `node` on your `PATH` is an app-bundled binary with a hardened
  runtime (e.g. an editor's embedded Node). Use a standard install instead
  (Homebrew `/opt/homebrew/bin/node` or `nvm`). The dev server (`npm run dev`) is
  unaffected since it uses esbuild.
- **Backend wheels fail to build on a brand-new Python** — use Python 3.11/3.12 if
  your interpreter is too new to have prebuilt wheels for some dependencies.

## Football data provider

The app ships with a pluggable client. Two providers are supported out of the box:

- [`football-data.org`](https://www.football-data.org/) — competition code `WC`.
- [`api-football`](https://www.api-football.com/) — World Cup league id `1`.

Pick one via `FOOTBALL_API_PROVIDER` and drop your key in `FOOTBALL_API_KEY`. If no
key is configured the app still runs and you can seed matches manually through the
admin sync endpoint for testing.
