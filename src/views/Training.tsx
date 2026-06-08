import React, { useState } from "react";
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
import { loadLastExplorer } from "../assetIds";

export function Training({
  closeFn = () => {},
} = {}) {
  const lastExplorer = loadLastExplorer();
  const [playing, setPlaying] = useState(false);
  const games = [
    {
      start: startSpaceInvadersGame,
      name: "Space Viking Invasion",
    },
    {
      start: startGame2,
      name: "Cross the Chasm",
    },
    {
      start: startGame3,
      name: "Memory Match",
    },
    {
      start: startGame4,
      name: "Holy Ships",
    },
    {
      start: startGame5,
      name: "Lunar Labyrinth",
    },
    {
      start: startGame6,
      name: "Gravity Gauntlet",
    },
  ];

  if (playing) {
    return null;
  }

  return (
    <div className="training-view zoomIn">
      <h2>Training</h2>
      <div className="inner-wrapper">
        {games.map((game, index) => (
          <button
            key={index}
            className="start"
            onClick={() => {
              setPlaying(true);
              game.start({
                onFinishGame: async (aether: number, score: number) => {
                  setPlaying(false);
                },
              });
            }}
          >
            {game.name}
          </button>
        ))}

        <button className="back" onClick={closeFn}>
          Back
        </button>
      </div>
      <br />
    </div>
  );
}
