import "phaser";
import { Game as MainGame } from './scenes/Game';
import { TitleScreen } from './scenes/TitleScreen';

const config: Phaser.Types.Core.GameConfig = {
  title: "Lunar Labyrinth",
  backgroundColor: "#000",
  scale: {
    width: 608,
    height: 530,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
      TitleScreen,
      MainGame
  ],
  physics: {
    default: "arcade",
  },
  parent: "phaser-container",
};

class Game5 extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

export function startGame5(customConfig: any) {
  document.body.style.userSelect = "none";
  window.oncontextmenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  const game = new Game5(config);

  // Add custom config.
  // Is there a better way to do this?
  (game as any).customConfig = customConfig;
}
