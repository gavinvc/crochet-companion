# Crochet Companion (MEAN Stack)

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
- MongoDB running locally or remotely
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
```

## NPM scripts (run from the repo root)

| Script | Purpose |
| --- | --- |
| `npm start` | Launch the Express API once (production-style) |
| `npm run dev` | Run backend (nodemon) and Angular dev server concurrently |
| `npm run dev:server` | Start only the backend with nodemon |
| `npm run dev:client` | Start only the Angular dev server |
| `npm run build:client` | Production build of the Angular app |
| `npm run client:test` | Execute Angular/Vitest unit tests |

## Running the stack

1. Ensure MongoDB is running and reachable by `MONGODB_URI`.
2. In one terminal, run `npm run dev` to boot both the API and Angular client.
3. Visit `http://localhost:4200` for the Angular app; API health check lives at `http://localhost:3000/api/health`.

## Working with Git

- All commits happen from the repository root (`crochet-companion/`).
- Do **not** initialize another Git repository inside `frontend/client`—that directory is already tracked by the root repo.
- Use feature branches: `git checkout -b feature/add-patterns`, make changes, `git add .`, `git commit`, then push.
- The included `.gitignore` keeps `node_modules`, `dist`, Angular cache folders, and the local Python environment out of Git history.

Happy crocheting and coding!
