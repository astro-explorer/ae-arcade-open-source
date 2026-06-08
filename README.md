# Astro Explorer Arcade

A collection of Phaser-based mini-games tied to the [Astro Explorer](https://astroexplorer.co) NFT collection on Algorand. Players connect an Algorand wallet, prove ownership of a Bork Bork NFT and/or Zerker NFT, and play for on-chain Aether (ASA) prizes and weekly leaderboard rewards.

This repository is the **public reference fork**, MIT-licensed for community study and adaptation. The original AE Arcade continues to operate from a separate private repo — what's published here is the recipe, not the restaurant. Forks are welcome to deploy their own arcades; you'll need your own Firebase project, Algorand prize-pool account, and Discord/Nodely credentials.

## Tech stack

- **Frontend:** React 18 + Vite, with [Phaser 3](https://phaser.io/) for the mini-games
- **Backend:** Firebase Cloud Functions (Node 20), Firestore for leaderboards and auth sessions
- **Blockchain:** Algorand mainnet via [Pera](https://perawallet.app/) and [Defly](https://defly.app/) wallet connectors; algod + indexer access via [Nodely](https://nodely.io/)
- **Hosting:** Firebase Hosting

## Repo layout

```
src/                    React app + game code
  game2..game6/         Individual Phaser mini-games
  space-invaders/       Space Viking Invasion (game1)
  views/                React views (Connect, Homepage, Explore flow, etc.)
  functions.ts          Frontend client for Cloud Functions
  wallets.ts            Pera + Defly wallet connectors
functions/              Firebase Cloud Functions
  index.js              All HTTPS + scheduled handlers
  constants.json        Asset IDs, traits, scored games
public/                 Static assets (images, audio, fonts, sprite atlases)
firestore.rules         Firestore security rules (deny-all; backend-only access)
firebase.json           Firebase config (hosting, functions, emulator ports)
.firebaserc             Firebase project alias (replace before deploying)
```

## Quickstart

```bash
# Install frontend deps
npm install

# Install backend deps
cd functions && npm install && cd ..

# Install Firebase CLI globally if you don't have it
npm install -g firebase-tools

# Set up secrets for the local emulator
cp .env.example functions/.secret.local
# Then edit functions/.secret.local with your values
```

Run the emulator and the dev server in two terminals:

```bash
# Terminal 1 — Firebase emulator (functions + firestore + hosting)
npm run emulate

# Terminal 2 — Vite dev server
npm run dev
```

Open `http://localhost:5173/?debugFunctions` — the `?debugFunctions` query param routes the frontend to the local emulator instead of production.

## Configuration

All four environment variables are server-side (read by `functions/index.js`):

| Variable | Purpose |
|---|---|
| `ESCROW_ADDRESS` | 58-char Algorand address that holds the prize pool |
| `ESCROW_PASSPHRASE` | 25-word mnemonic for `ESCROW_ADDRESS` (signs payouts) |
| `DISCORD_WEBHOOK_URL` | Discord incoming webhook for game-event notifications |
| `NODELY_API_TOKEN` | API token for Nodely's Algorand algod + indexer endpoints |

See [.env.example](.env.example) for inline documentation and a security warning about not reusing real-value mainnet accounts during development.

## Local testing with the Firebase emulator

The emulator config in [firebase.json](firebase.json) maps:

| Service | Port |
|---|---|
| Functions | 4200 |
| Firestore | 4201 |
| Hosting | 5002 |

When the frontend sees `?debugFunctions` in the URL, [src/functions.ts](src/functions.ts) routes API calls to `http://127.0.0.1:4200/...` instead of the production Cloud Functions URL.

There is no automated test suite. See [CONTRIBUTING.md](CONTRIBUTING.md) for the manual smoke-test flow.

## Deploying your own fork

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com/) and enable Hosting, Functions, and Firestore.
2. **Replace the project ID** in [.firebaserc](.firebaserc). The current value `bork-bork-exploration` belongs to the original AE Arcade team — your fork must point at your own project.
3. **Provision your secrets** via the Firebase CLI:
   ```bash
   firebase functions:secrets:set ESCROW_ADDRESS
   firebase functions:secrets:set ESCROW_PASSPHRASE
   firebase functions:secrets:set DISCORD_WEBHOOK_URL
   firebase functions:secrets:set NODELY_API_TOKEN
   ```
4. **Deploy:**
   ```bash
   npm run deploy:hosting
   npm run deploy:functions
   ```

Note: deploying requires Editor access on the Firebase project.

## Adding a mini-game

1. Create `src/gameN/` following the pattern of the existing games (Phaser scene + main entry).
2. Register a new entry in `SCORED_GAMES` and `ALL_GAMES` in [functions/constants.json](functions/constants.json).
3. Add a corresponding view in `src/views/` and wire it into the routing in [src/views/App.tsx](src/views/App.tsx).
4. If the game produces a leaderboard score, the existing `saveHighscore` Cloud Function handles persistence — just call it from the frontend with the appropriate `game` name.

## Community

- [CONTRIBUTING.md](CONTRIBUTING.md) — setup, conventions, manual testing, PR guidelines
- [SECURITY.md](SECURITY.md) — vulnerability disclosure
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Contributor Covenant 2.1
- [LICENSE](LICENSE) — MIT
