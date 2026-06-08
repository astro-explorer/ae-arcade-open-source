import React, { useEffect, useState } from "react";
import { claim } from "../functions";
import { TRAITS } from "../../functions/constants.json";
import { model } from "../model";
import { startSpaceInvadersGame } from "../space-invaders/game";
// @ts-ignore: Game 2 is in JavaScript for now.
import { startGame2 } from "../game2/game2";
// @ts-ignore: Game 3 is in JavaScript for now.
import { startGame3 } from "../game3/main";
// @ts-ignore: Game 4 is in JavaScript for now.
import { startGame4 } from "../game4/main";
import { startGame5 } from "../game5/game";
// @ts-ignore: Game 6 is in JavaScript for now.
import { startGame6 } from "../game6/main";

export function getGameTraitForAssetId(assetId: any) {
  return (TRAITS as any)[assetId];
}

export function Vikings({
  assetId = 0,
  outcome = "",
  outcomeToken = "",
  closeFn = () => {},
} = {}) {
  const [phase, setPhase] = useState("intro");
  const [score, setScore] = useState(0);
  const [bonus, setBonus] = useState("");

  const gameTrait = getGameTraitForAssetId(assetId);
  const { bonusAsset, gameId } = JSON.parse(Buffer.from(outcomeToken, 'base64').toString('utf8'));

  async function onFinishGame(score: number) {
    const amount = Math.min(score, 3);
    claim(model.wallet, assetId, model.token, outcome, outcomeToken, amount, gameId);

    if (score >= 1 && gameTrait === "Junk Collector") {
      score += 1;
    }

    if (score == 4 && gameTrait === "Houdini") {
      score = 3;
    }

    if (bonusAsset) {
      const bonusString = `${bonusAsset.amount}\u00a0${bonusAsset.name}`;
      setBonus(bonusString);
    }

    setPhase("collect");
    setScore(score);
  }

  useEffect(() => {
    const games = [
      startSpaceInvadersGame,
      startGame2,
      startGame3,
      startGame4,
      startGame5,
      startGame6,
    ];
    const startGame = games[gameId] || games[Math.floor(Math.random() * games.length)];

    startGame({
      gameTrait,
      onFinishGame,
    });
  }, []);

  if (phase === "collect") {
    if (score >= 1) {
      return (
        <div key={phase} className="vikings-view zoomIn">
          <h2 className="response-view">Congrats</h2>

          <p>
            You collected <strong>{score}</strong> Aether{!!bonus ? ` and ${bonus}` : ""}!
          </p>

          <p>
            {Array.from({ length: score }).map((_, index) => (
              <img
                key={index}
                src="/missions/aether.png"
                alt="Aether"
                className="aether-image"
              />
            ))}
          </p>

          <button
            className="close"
            onClick={closeFn}
          >
            Close
          </button>
        </div>
      );
    } else {
      return (
        <div key={phase} className="vikings-view zoomIn">
          <h2 className="response-view">Nice Try</h2>

          <p>Better luck next time!</p>

          <button
            className="close"
            onClick={closeFn}
          >
            Close
          </button>
        </div>
      );
    }
  }

  return null;
}
