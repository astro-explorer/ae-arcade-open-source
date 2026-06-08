# Contributing

Thanks for considering a contribution to AE Arcade. This is a community-maintained reference fork — issues and PRs are welcome on a best-effort review basis.

## Setup

```bash
npm install
cd functions && npm install && cd ..
npm install -g firebase-tools
cp .env.example functions/.secret.local
# Edit functions/.secret.local with your test values
```

Run the emulator and dev server in separate terminals:

```bash
npm run emulate   # Firebase emulator (functions, firestore, hosting)
npm run dev       # Vite frontend at http://localhost:5173
```

Open `http://localhost:5173/?debugFunctions` to point the frontend at the local emulator. The full setup is documented in [README.md](README.md).

## Project conventions

- **Frontend** is TypeScript + React function components with hooks. No class components.
- **Mini-games** each live under their own directory (`src/game2/`, `src/game3/`, ..., `src/space-invaders/`). Phaser scenes are isolated per game.
- **Backend** logic is centralized in [functions/index.js](functions/index.js). Game and asset metadata lives in [functions/constants.json](functions/constants.json).
- **Firestore** is locked down by `firestore.rules` (deny all client access). All reads and writes flow through Cloud Functions, which authenticate via Algorand wallet-signed transactions — see the `authenticate` handler.
- **Secrets** are bound per Cloud Function via `functions.runWith({ secrets: [...] })`. If you add a new handler that needs an env var, remember to add it to that handler's `runWith` array, otherwise `process.env.X` will be undefined at runtime.

## Manual testing

There is **no automated test suite**. Testing is currently manual against the Firebase emulator.

Smoke-test flow:

1. Start the emulator (`npm run emulate`) and dev server (`npm run dev`).
2. Visit `http://localhost:5173/?debugFunctions`.
3. Connect a Pera or Defly wallet that holds a Bork Bork NFT (mainnet — the emulator still calls live algod for ownership checks).
4. Authenticate, then exercise:
   - **Explore** — should hit the cooldown check and return either `vikings` or `lost`.
   - **Claim** (after a `vikings` outcome) — verify the Aether transfer txn submits.
   - **Highscore submission** — play through Space Viking Invasion or Gravity Gauntlet and confirm the score lands in the local Firestore emulator.
5. Check the emulator log for clean Discord webhook posts (or, if `DISCORD_WEBHOOK_URL` is unset, expect a logged failure rather than a crash).

Forks adding automated tests (Jest, Vitest, Playwright, etc.) are very welcome — please document the runner in this file when you do.

## Version pin warning

The root [package.json](package.json) pins `algosdk@^2.7.0` for the frontend, while [functions/package.json](functions/package.json) pins `algosdk@^1.19.0` for the Cloud Functions runtime. **This split is intentional** — the backend uses v1 APIs (`Transaction` constructor signature, `mnemonicToSecretKey`, `signTransaction`, `decodeSignedTransaction`). Do not unify the versions without auditing every algosdk callsite in `functions/index.js`.

## Pull requests

- Branch off `main`. One logical change per PR.
- Don't commit `.env`, `functions/.secret.local`, or anything matching the patterns in [.gitignore](.gitignore). Run `git status` before pushing.
- Reference an open issue when applicable.
- Expect best-effort review — this is a community project with no SLA.

## Reporting security issues

Do **not** open a public issue for security bugs. See [SECURITY.md](SECURITY.md) for the private disclosure process.
