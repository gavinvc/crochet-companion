# Crochet Companion

A single Git repository that hosts the MongoDB + Express backend and Angular client for the Crochet Companion app. The project root (`crochet-companion/`) is the only Git repository; everything underneath (including `frontend/client`) is tracked from here so you never end up with nested repos.

## Project layout

```text
crochet-companion/
├── server.js            # Express + Mongoose API
├── package.json         # Backend dependencies & orchestration scripts
├── frontend/client/     # Angular 17+ application
├── crochet-env/         # (Optional) local Python helpers, ignored by Git
└── .gitignore           # Covers backend + frontend artifacts
```

## Prerequisites

- Node.js 20+ and npm 10+
- MongoDB running locally or a MongoDB Atlas cluster
- Docker (optional, for the one-command MongoDB service)
- (Optional) Python 3.14 virtual env inside `crochet-env/`

## Installation

1. Clone the repo and move into it:
   ```bash
   git clone <your-remote-url> crochet-companion
   cd crochet-companion
   ```
2. Install backend tooling:
   ```bash
   npm install
   ```
3. Install Angular client dependencies from the repo root:
   ```bash
   npm run client:install
   ```

## Environment variables

Create a `.env` file (Git-ignored) or export the variables before running the server:

```
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/crochet-companion
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:4200
```

You can set multiple allowed origins by comma separating them (e.g. `CLIENT_ORIGIN=http://localhost:4200,https://crochet-companion.vercel.app`).

## NPM scripts (run from the repo root)

| Script | Purpose |
| --- | --- |
| `npm start` | Launch the Express API once (production-style) |
| `npm run dev` | Run backend (nodemon) and Angular dev server concurrently |
| `npm run dev:server` | Start only the backend with nodemon |
| `npm run dev:client` | Start only the Angular dev server |
| `npm run build:client` | Production build of the Angular app |
| `npm run client:test` | Execute Angular/Vitest unit tests |

## Quick MongoDB setup

### Option A – Docker (local development)

Use the provided `docker-compose.yml` to run MongoDB 7 locally:

```bash
docker compose up -d mongodb
# connection string: mongodb://127.0.0.1:27017/crochet-companion
```

Data persists in the named `mongo-data` volume. Stop the container with `docker compose down`.

### Option B – MongoDB Atlas (cloud)

1. Create a free Atlas project and a database user.
2. Allow the Vercel IP ranges or `0.0.0.0/0` while developing.
3. Copy the SRV connection string, replace `<password>` with your user password, and set it as `MONGODB_URI`.
4. (Optional) Add `retryWrites=true&w=majority` for better fault tolerance.

## Running the stack locally

1. Start MongoDB (Docker or Atlas connection).
2. Run `npm run dev` to boot both the API (http://localhost:3000) and Angular client (http://localhost:4200).
3. Use `npm run dev:server` or `npm run dev:client` for focused development on a single side.

## Deploying on Vercel

The repository is configured so a single Vercel project can host both the Angular static build and the Express API as a serverless function.

1. **Create project:** `vercel init` (or import the GitHub repo) and choose "Other".
2. **Environment variables:** add `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CLIENT_ORIGIN` (set to your Vercel domain, e.g. `https://crochet-companion.vercel.app`).
3. **Build command:** default `npm run build` (already mapped to the Angular build).
4. **Output directory:** `frontend/client/dist/client/browser` (defined in `vercel.json`).
5. **API routes:** requests to `/api/*` are forwarded to `api/index.js`, which boots the same Express app used locally and reuses the MongoDB connection.
6. **Local parity:** run `vercel dev` to simulate the Vercel platform, including the serverless API and Angular build output.

> **Note:** Make sure your MongoDB cluster allows connections from Vercel. Atlas makes this easy through the Network Access tab.

## Working with Git

- All commits happen from the repository root (`crochet-companion/`).
- Do **not** initialize another Git repository inside `frontend/client`—that directory is already tracked by the root repo.
- Use feature branches: `git checkout -b feature/add-patterns`, make changes, `git add .`, `git commit`, then push.
- The included `.gitignore` keeps `node_modules`, `dist`, Angular cache folders, and the local Python environment out of Git history.

Happy crocheting and coding!
