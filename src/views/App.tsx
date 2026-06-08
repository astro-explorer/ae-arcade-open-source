import React, { useState } from "react";
import { model } from "../model";
import { getPreviouslyConnectedWallet } from "../wallets";
import { Connect } from "./Connect";
import { Homepage } from "./Homepage";
import { updateRefreshMethod } from "./refresh";

export function App() {
  const [, setTimestamp] = useState(0);
  const [loaded, setLoaded] = useState(!!model.wallet);

  // Wire refresh method.
  updateRefreshMethod(setTimestamp);

  // Update wallet.
  React.useEffect(() => {
    getPreviouslyConnectedWallet().then((wallet) => {
      model.wallet = wallet;
      model.token = localStorage.token;

      setLoaded(true);
    });
  }, [model.wallet]);

  if (!loaded) {
    return null;
  }

  if (!model.wallet || !model.token) {
    return <Connect />;
  }

  return <Homepage />;
}
