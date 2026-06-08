/** Gets params for an Algo transaction. */
export async function getAlgoTransactionParams() {
  const params = await fetch(
    "https://mainnet-api.4160.nodely.dev/v2/transactions/params"
  ).then((res) => res.json());

  return {
    fee: 1000,
    flatFee: true,
    genesisHash: params["genesis-hash"],
    genesisID: params["genesis-id"],
    firstRound: params["last-round"],
    lastRound: params["last-round"] + 1000,
  };
}

/** Encodes buffer to base64. */
export function encodeByteArrayToBase64(buffer: Uint8Array) {
  return btoa(String.fromCharCode(...buffer));
}


export async function submitAlgoTransaction(signedTransactions) {
  const url = "https://mainnet-api.4160.nodely.dev/v2/transactions";
  return fetch(url, {
    method: "POST", // or 'PUT'
    headers: {
      "Content-Type": "application/x-binary",
    },
    body: signedTransactions,
  }).then((response) => response.json());
}