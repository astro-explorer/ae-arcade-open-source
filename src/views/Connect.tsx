import { makeAssetTransferTxnWithSuggestedParamsFromObject } from "algosdk";
import React, { useEffect, useState } from "react";
import { ASSET_IDS } from "../../functions/constants.json";
import { authenticate } from "../functions";
import { model } from "../model";
import { getAlgoTransactionParams } from "../transactions";
import {
  connectWithDefly,
  connectWithPera,
  signTransaction,
} from "../wallets";
import { refresh } from "./refresh";
import { AdPrimary } from "./AdPrimary";
import { Footnote } from "./Footnote";

export function Connect() {
  const [walletChosen, setWalletChosen] = useState(!!model.wallet);
  const [suggestedParams, setSuggestedParams] = useState(null as any);

  useEffect(() => {
    getAlgoTransactionParams().then(setSuggestedParams);
  }, [model.wallet]);

  function onClickConnect(fn: () => Promise<any>) {
    return async (e: any) => {
      e.preventDefault();
      model.wallet = await fn();
      setWalletChosen(true);
    };
  }

  if (!walletChosen) {
    return (
      <div className="connect-view text-align-center padding-20">

        <img className="logo" src="/ae-hero.png" alt="Astro Explorer" />

        {/* <AdPrimary /> */}

        <h1>Web3’s P2E Retro&nbsp;Arcade</h1>

        <p className="connect-intro font-size-large">
          <img
            src="/ae-characters.png"
            alt="Astro Explorer Arcade Characters"
            className="arcade-characters"
          />
          Dive into the Astro Explorer retro arcade games and rack up Algorand NFTs and native assets like $USDC, $goBTC and&nbsp;more!
        </p>

        <p className="font-size-large">Connect your wallet to get started!</p>

        <button
          onClick={onClickConnect(connectWithPera)}
          className="connect-view--button pera"
        >
          <img className="wallet-icon" src="assets/images/pera-logo.png" /> Pera
        </button>
        <button
          onClick={onClickConnect(connectWithDefly)}
          className="connect-view--button defly"
        >
          <img className="wallet-icon" src="assets/images/defly-logo.png" /> Defly
        </button>

        <Footnote />

      </div>
    );
  }

  async function onClickSignIdentifyProof() {
      const txn = makeAssetTransferTxnWithSuggestedParamsFromObject({
        suggestedParams,
        assetIndex: ASSET_IDS.AETHER,
        amount: 0,
        from: model.wallet,
        to: model.wallet,
        note: Uint8Array.from(
          `Authenticate with Bork Borks. ${suggestedParams.firstRound}`,
          (c) => c.charCodeAt(0)
        ),
      });

      const signedTxns = await signTransaction(txn);

      const responsePromise = authenticate(
        // @ts-ignore
        localStorage.getItem("address"),
        suggestedParams.firstRound,
        signedTxns
      );

      // Save token.
      const { token } = await responsePromise;
      localStorage.token = token;
      model.token = token;
      refresh();
  }

  if (!suggestedParams) {
    <div className="text-align-center font-size-large padding-16">
      Requesting fresh transaction parameters
    </div>;
  }

  return (
    <div className="connect-view text-align-center padding-20">

      <img className="logo" src="/ae-hero.png" alt="Astro Explorer" />
      
      {/* <AdPrimary /> */}
      
      <h1>Web3’s P2E Retro&nbsp;Arcade</h1>

      <p className="font-size-large">Confirm your wallet</p>

      <button
        onClick={onClickSignIdentifyProof}
        className="connect-view--button authenticate"
      >
        Authenticate
      </button>

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();

          localStorage.wallet = "";
          model.wallet = "";

          setWalletChosen(false);
        }}
      >
        Cancel
      </a>

      <Footnote />

    </div>
  );
}
