import { DeflyWalletConnect } from "@blockshake/defly-connect";
import { PeraWalletConnect } from "@perawallet/connect";
import { Transaction } from "algosdk";
import { model } from "./model";

const deflyWallet = new DeflyWalletConnect();
const peraWallet = new PeraWalletConnect();
/** Connects with Defly. */
export async function connectWithDefly() {
  return deflyWallet.connect().then(([address]) => {
    if (!address) {
      throw "Please select account.";
    }

    localStorage.address = address;
    localStorage.wallet = "defly";

    return address;
  });
}

/** Connects with Pera. */
export async function connectWithPera() {
  return peraWallet.connect().then(([address]) => {
    if (!address) {
      throw "Please select account.";
    }

    localStorage.address = address;
    localStorage.wallet = "pera";

    return address;
  });
}

/** Gets previously connected wallet. */
export async function getPreviouslyConnectedWallet() {
  const address = localStorage.address;

  if (!address) {
    // No address found.
    return "";
  }

  if (localStorage.wallet === "defly") {
    // Defly isn't easy.
    return deflyWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts[0] !== address) {
          throw "Account is missing.";
        }

        return address;
      })
      .catch(() => {
        delete localStorage.address;
        delete localStorage.wallet;

        return "";
      });
  }

  if (localStorage.wallet === "pera") {
    // Pera isn't easy.
    return peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts[0] !== address) {
          throw "Account is missing.";
        }

        return address;
      })
      .catch(() => {
        delete localStorage.address;
        delete localStorage.wallet;

        return "";
      });
  }

  // We shouldn't reach this, unless the localStorage is corrupt.
  return "";
}

/** Gets NFD or shortened address. */
const readableAddressPromises: { [key: string]: Promise<string> } = {};
export async function getReadableAddress(address: string) {
  if (address in readableAddressPromises) {
    return readableAddressPromises[address];
  }

  readableAddressPromises[address] = fetch(
    `https://api.nf.domains/nfd/address?address=${address}&view=brief`
  )
    .then((res) => res.json())
    .then((res) => res[0].name)
    .catch(() => shortenAddress(address));

  return readableAddressPromises[address];
}

/** Render cute address. */
export function shortenAddress(address: string) {
  const divider = "…";
  return (
    encodeURIComponent(address.slice(0, 5)) +
    divider +
    encodeURIComponent(address.slice(-5))
  );
}

/** Signs transaction. */
export async function signTransaction(txn: Transaction) {
  return localStorage.wallet === "defly"
    ? deflyWallet.signTransaction([[{ txn, signers: [model.wallet] }]])
    : peraWallet.signTransaction([[{ txn, signers: [model.wallet] }]]);
}

/** Signs out of wallet. */
export async function disconnectWallet() {
  delete localStorage.address;
  delete localStorage.wallet;
  delete localStorage.token;

  if (localStorage.wallet === "pera") {
    await peraWallet.disconnect();
  }
}
