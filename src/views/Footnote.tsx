import React, { useEffect, useState, Fragment } from "react";
import { BONUS_ASSETS } from "../../functions/constants.json";
import {
  makeAssetTransferTxnWithSuggestedParamsFromObject,
  waitForConfirmation,
} from "algosdk";
import { signTransaction } from "../wallets";
import {
  getAlgoTransactionParams,
  submitAlgoTransaction,
} from "../transactions";
import { model } from "../model";
import { AdSecondary } from "./AdSecondary";

export const Footnote = () => {
  const [suggestedParams, setSuggestedParams] = useState(null as any);

  useEffect(() => {
    if (!!model.token) {
      getAlgoTransactionParams().then(setSuggestedParams);
    }
  }, [model.wallet]);

  async function onClickOptIn(assetIndex) {
    const optInTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: model.wallet,
      to: model.wallet,
      suggestedParams,
      assetIndex,
      amount: 0,
    });

    const signedTxns = await signTransaction(optInTxn);
    await submitAlgoTransaction(signedTxns[0]);
  }

  const Optin = ({ assetId }) => {
    if (!localStorage.allAssetIds || localStorage.allAssetIds.includes(assetId)) {
      return null;
    }
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onClickOptIn(assetId);
        }}
      >
        opt in
      </a>
    );
  };

  return (
    <div className="footnote font-size-small">
      <p>* For a chance to earn rewards, opt in to: *</p>
      {BONUS_ASSETS.map((asset) => (
        <Fragment key={asset.id}>
          <strong>{asset.name}</strong>
          {` (${asset.id}) `}
          <Optin assetId={asset.id} />
          <br />
        </Fragment>
      ))}
      <AdSecondary />
      <div className="footnote-callouts">
        <div className="footnote-callout-first">
          <p>Images courtesy of</p>
          <a href="https://explorer.perawallet.app/" target="_blank" rel="noopener noreferrer">
            <img className="h-9 mt-2" src="assets/images/pera-logo-white.png" />
          </a>
        </div>
        <div className="footnote-callout-second">
          <p>Powered by</p>
          <a href="https://algorand.co" target="_blank" rel="noopener noreferrer">
            <img className="h-8 mt-2" src="assets/images/algorand-logo-white.png" />
          </a>
        </div>
      </div>
    </div>
  );
};

