# Crochet Companion

Full-stack MongoDB + Express API with an Angular client for sharing, parsing, and walking through crochet patterns. This repo is a single Git project; the Angular app under `frontend/client` is tracked from the root (no nested repos).

## Features

- Pattern sharing with row-by-row playback, images, follow/unfollow, and delete (owner only).
- Sample patterns (authored by `gavinvc`) baked into the client so the Patterns page always has demo content alongside API data.
- Community page placeholders for upcoming critiques, maker bridges, and groups (posts/chat coming soon).
- Maker space views for “my patterns” and “followed patterns”.
- Pattern Parser (LLM-assisted) with a local-first Ollama gateway and optional Hugging Face fallback.

## Project layout

```text
crochet-companion/
├── server.js              # Express bootstrap
├── api/                   # Vercel-style entrypoint (re-exports Express app)
├── src/                   # API code (controllers, models, routes, services)
├── frontend/client/       # Angular 17+ app
├── docker-compose.yml     # Optional MongoDB service
├── vercel.json            # Vercel routing/output config
└── crochet-env/           # Optional Python venv (ignored by Git)
```

## Prerequisites

- Node.js 20+ and npm 10+
- MongoDB 7+ (local Docker or Atlas)
- (Optional) Docker for one-command Mongo
- (Optional) Ollama CLI for local LLM parsing

## Quick start (local)

1) Install deps from the repo root:
```bash
npm install
npm run client:install
```

2) Configure `.env` (see below). Minimal local example:
```
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/crochet-companion
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:4200
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
LLM_GATEWAY_URL=http://localhost:5051
```

3) Run everything (API + Angular + Ollama gateway):
```bash
npm run dev
```
- API: http://localhost:3000
- Angular: http://localhost:4200
- LLM gateway: http://localhost:5051

For focused work: `npm run dev:server` (API only) or `npm run dev:client` (Angular only).

## Environment variables

```
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/crochet-companion
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:4200

# LLM (local-first)
LLM_PROVIDER=ollama             # ollama | huggingface
LLM_GATEWAY_URL=http://localhost:5051
LLM_GATEWAY_PORT=5051
LLM_GATEWAY_TIMEOUT_MS=45000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b

# Optional Hugging Face fallback (if LLM_PROVIDER=huggingface)
HF_TOKEN=<your-hf-token>
HF_MODEL=meta-llama/Llama-3.2-1B-Instruct
```

Multiple client origins are allowed by comma separating `CLIENT_ORIGIN`.

## Scripts (run from repo root)

| Script | What it does |
| --- | --- |
| `npm start` | Start Express once (prod-style) |
| `npm run dev` | Run API, Angular dev server, Ollama daemon, LLM gateway concurrently |
| `npm run dev:server` | API only (nodemon) |
| `npm run dev:client` | Angular dev server only |
| `npm run dev:ollama` | Start Ollama daemon (normally started by `dev`) |
| `npm run dev:llm` | LLM gateway only (http://localhost:5051) |
| `npm run build:client` | Production Angular build |
| `npm run client:test` | Angular/Vitest tests |

## MongoDB options

**Docker (local):**
```bash
docker compose up -d mongodb
# DSN: mongodb://127.0.0.1:27017/crochet-companion
```

**Atlas (cloud):** create a cluster, allow the needed IPs, and set `MONGODB_URI` to your SRV connection string.

## Frontend notes (Angular)

- Patterns page merges live API data with client-side sample patterns authored by `gavinvc`, so the grid never appears empty.
- Sample images:
  - Granny Square Coaster: https://www.craftpassion.com/wp-content/uploads/crochet-solid-granny-square-coaster-720x405.jpg
  - Textured Mug Rug: https://kickincrochet.com/wp-content/uploads/2022/07/IMG_20220612_073801625_BURST000_COVER_TOPms.jpg
  - Chunky Ribbed Beanie: https://www.crochet365knittoo.com/wp-content/uploads/2019/12/Ribbed-Wonder-Hat-to-the-side.jpg
- Community page currently shows program stubs, maker bridges, and groups (posts/chat “coming soon”).
- Maker space surfaces your published and followed patterns; delete is owner-only.

## LLM parser (local-first)

- The gateway (http://localhost:5051) proxies `/v1/chat/completions` to Ollama.
- Default model: `llama3.2:1b`. Pull it once with `ollama pull llama3.2:1b` if not present.
- Switch to Hugging Face by setting `LLM_PROVIDER=huggingface` and providing `HF_TOKEN`/`HF_MODEL`.

## Deploying on Vercel

1. Add env vars: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` (use your Vercel URL), and any LLM vars.
2. Build command: `npm run build` (uses Angular build).
3. Output dir: `frontend/client/dist/client/browser` (matches `vercel.json`).
4. API: `/api/*` routes forward to `api/index.js`, which boots the Express app.
5. Local parity: `vercel dev` simulates both the API and the built Angular output.

## Working with Git

- Work from the repo root; do **not** init Git inside `frontend/client`.
- Use feature branches, then `git add .` / `git commit` / push.
- `.gitignore` covers backend + frontend artifacts (node_modules, dist, cache, local envs).

Happy crocheting and coding!
