import "phaser";
import { MainScene } from "./scenes/main";

const config: Phaser.Types.Core.GameConfig = {
  title: "Space Invaders",
  backgroundColor: "rgb(47, 52, 55)",
  scale: {
    width: 800,
    height: 700,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: MainScene,
  physics: {
    default: "arcade",
  },
  input: {
    gamepad: true,
    activePointers: 3,
  },
  parent: "phaser-container",
};

class SpaceInvadersGame extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

export function startSpaceInvadersGame(customConfig: any) {
  document.body.style.userSelect = "none";
  window.oncontextmenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    return false;
  };

  const game = new SpaceInvadersGame(config);

  // Add custom config.
  // Is there a better way to do this?
  (game as any).customConfig = customConfig;
}
