import { encodeByteArrayToBase64 } from "./transactions";
import { urlParams } from "./urlParams";

const FUNCTIONS_BASE_URL_LOCAL =
  //"http://127.0.0.1:5001/bork-bork-exploration/us-central1";
  // Adjust port to match your Firebase emulator (default 4200)
  "http://127.0.0.1:4200/bork-bork-exploration/us-central1";
const FUNCTIONS_BASE_URL_PRODUCTION =
  "https://us-central1-bork-bork-exploration.cloudfunctions.net";

export function getFunctionsBaseUrl() {
  if (urlParams.get("debugFunctions") !== null) {
    return FUNCTIONS_BASE_URL_LOCAL;
  }

  return FUNCTIONS_BASE_URL_PRODUCTION;
}

export async function describeAlgoAccount(address: string) {
  const url = `${getFunctionsBaseUrl()}/describeAlgoAccount?address=${address}`;
  return fetch(url).then((res) => res.json());
}

export async function getCooldowns(assetId: number[]) {
  const url = `${getFunctionsBaseUrl()}/getCooldownsAlgo?assetIds=${assetId}`;
  return fetch(url).then((res) => res.json());
}

export async function getHighscores(gameId?: string, address?: string) {
  var url = `${getFunctionsBaseUrl()}/getHighscores`;
  if (gameId) {
    url += `?gameId=${gameId}`;
  }
  if (address) {
    url += `?address=${address}`;
  }

  return await fetch(url).then((res) => res.json());
}

export async function saveHighscore(
  address: string,
  assetId: number,
  token: string,
  score: number,
  game: string,
  seed?: string,
  replayData?: string,
) {
  const url = `${getFunctionsBaseUrl()}/saveHighscore`;
  return fetch(url, {
    method: "POST",
    body: JSON.stringify({
      address,
      assetId,
      token,
      score,
      game,
      seed,
      replayData,
    }),
  });
}

export async function explore(address: string, assetId: number, token: string) {
  let url = `${getFunctionsBaseUrl()}/explore`;

  return fetch(url, {
    method: "POST",
    body: JSON.stringify({
      address,
      assetId,
      token,
    }),
  }).then((res) => res.json().then((json) => ({ status: res.status, json })));
}

export async function claim(
  address: string,
  assetId: number,
  token: string,
  outcome: string,
  outcomeToken: string,
  amount: number,
  gameId: number,
) {
  const url = `${getFunctionsBaseUrl()}/claim`;
  return fetch(url, {
    method: "POST",
    body: JSON.stringify({
      address,
      assetId,
      token,
      outcome,
      outcomeToken,
      amount,
      gameId,
    }),
  }).then((res) => res.json().then((json) => ({ status: res.status, json })));
}

export async function authenticate(
  address: string,
  firstRound: number,
  signedTxns: Uint8Array[]
) {
  const url = `${getFunctionsBaseUrl()}/authenticate`;
  return fetch(url, {
    method: "POST",
    body: JSON.stringify({
      address,
      firstRound,
      blob: signedTxns.map((signedTxn) =>
        encodeByteArrayToBase64(signedTxn)
      )[0],
      walletType: localStorage.getItem("wallet")
    }),
  }).then((res) => res.json());
}



