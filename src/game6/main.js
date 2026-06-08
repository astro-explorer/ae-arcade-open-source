import Phaser from "phaser";
import Game from "./scenes/game";
import GameOver from "./scenes/gameover";
/*
This is the main configuration file for the game.
*/
export function startGame6({ gameTrait, onFinishGame, challengeMode, seed, replayData }) {
  Game.gameTrait = gameTrait;
  Game.onFinishGame = onFinishGame;
  Game.challengeMode = challengeMode;
  Game.seed = seed;
  Game.replayData = replayData;

  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      activePointers: 3,
    },
    parent: "phaser-container",
    backgroundColor: "#808080",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        fps: 300,
        debug: false,
      },
    },
    scene: [Game, GameOver],
  };

  return new Phaser.Game(config);
}

export default startGame6;