import Player from "../gameobjects/player";
import Game from "./game";

export default class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: "gameover" });
  }

  create() {
    this.width = this.sys.game.config.width;
    this.height = this.sys.game.config.height;
    this.center_width = this.width / 2;
    this.center_height = this.height / 2;
    this.cameras.main.setBackgroundColor(0x000000);
    this.player = new Player(this, this.center_width, this.height / 8 * 3);

    this.add
      .bitmapText(
        this.center_width,
        this.height / 4,
        "arcade",
        "Score: " + this.registry.get("score"),
        25
      )
      .setOrigin(0.5);

    if (this.registry.get("lives") > 0) {
      this.player.animate();
      this.add
        .bitmapText(
          this.center_width,
          this.center_height,
          "arcade",
          "YOU WIN",
          45
        )
        .setOrigin(0.5);
    } else {
      this.player.spin();
      this.add
        .bitmapText(
          this.center_width,
          this.center_height,
          "arcade",
          "GAME OVER",
          45
        )
        .setOrigin(0.5);
    }

    const score = this.registry.get("score");
    const aether = Math.min(Math.floor(score / 10), 3);
    const replayData = this.registry.get("replay");

    setTimeout(() => {
      this.game.destroy(true);
      document.body.style.height = "";
      window.oncontextmenu = null;
      document.body.style.userSelect = "";
      Game.onFinishGame(aether, score, replayData);
    }, 3000);
  }

  startGame() {
    this.player.destroy();
    this.scene.start("game");
  }

  showRestart() {
    const restartText = this.add
      .bitmapText(
        this.center_width,
        this.height / 4 * 3,
        "arcade",
        "Press SPACE or Click to restart!",
        15
      )
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: restartText,
      duration: 500,
      delay: 0,
      alpha: 1,
      repeat: -1,
      yoyo: true,
    });

    this.input.keyboard.on("keydown-SPACE", this.startGame, this);
    this.input.on("pointerdown", (pointer) => this.startGame(), this);
  }
}
